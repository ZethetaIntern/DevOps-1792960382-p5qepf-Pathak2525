import Runbook from "../models/Runbook.js";
import { asyncHandler, HttpError } from "../utils/asyncHandler.js";

export const listRunbooks = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await Runbook.find().select("-content").sort({ number: 1 }).lean() });
});

export const getRunbook = asyncHandler(async (req, res) => {
  const number = parseInt(req.params.id, 10);
  const query = Number.isInteger(number) && String(number) === req.params.id ? { number } : { slug: req.params.id };
  const runbook = await Runbook.findOne(query).lean();
  if (!runbook) throw new HttpError(404, "Runbook not found");
  res.json({ success: true, data: runbook });
});
