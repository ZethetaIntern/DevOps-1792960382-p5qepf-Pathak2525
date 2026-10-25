import Region from "../models/Region.js";
import ServiceHealth from "../models/ServiceHealth.js";
import { asyncHandler, HttpError } from "../utils/asyncHandler.js";
import { getRegionOverview } from "../services/healthService.js";
import { recordAudit } from "../services/auditService.js";

export const listRegions = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await getRegionOverview() });
});

export const listServices = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.region) filter.regionCode = String(req.query.region);
  if (req.query.service) filter.service = String(req.query.service);
  res.json({ success: true, data: await ServiceHealth.find(filter).sort({ regionCode: 1, service: 1 }).lean() });
});

/** Fault injection for drills (simulation only). */
export const injectFault = asyncHandler(async (req, res) => {
  const { regionCode, status } = req.body;
  const region = await Region.findOne({ regionCode });
  if (!region) throw new HttpError(404, "Region not found");
  region.status = status;
  await region.save();
  await ServiceHealth.updateMany(
    { regionCode },
    status === "healthy"
      ? { $set: { status: "healthy", detail: "" } }
      : { $set: { status, detail: `INJECTED ${status} (simulation)`, errorRatePercent: status === "down" ? 100 : 3 } }
  );
  await recordAudit({ user: req.user, action: "region.fault.inject", resource: "region", resourceId: regionCode, ip: req.ip, metadata: { status } });
  res.json({ success: true, data: region });
});
