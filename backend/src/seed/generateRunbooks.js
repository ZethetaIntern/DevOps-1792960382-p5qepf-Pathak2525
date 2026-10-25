import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RUNBOOKS } from "./runbookData.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const RUNBOOK_DIR = path.resolve(here, "../../../runbooks");

export const pad = (n) => String(n).padStart(2, "0");
export const fileNameFor = (rb) => `${pad(rb.number)}-${rb.slug}.md`;

const list = (items, ordered = false) => items.map((item, i) => (ordered ? `${i + 1}. ${item}` : `- ${item}`)).join("\n");

export function renderRunbook(rb) {
  return `# Runbook ${pad(rb.number)}: ${rb.title}

| Field | Value |
|---|---|
| Severity | ${rb.severity.toUpperCase()} |
| Owner | ${rb.owner} |
| Incident Commander | On-call SRE Lead (rotates weekly) |
| Last tested | _Record in DR Drills page_ |
| RTO / RPO target | 5 minutes / 60 seconds |

## Purpose
${rb.summary}

## Trigger
${rb.trigger}

## Prerequisites
${list(rb.prerequisites)}

## Procedure
${list(rb.steps, true)}

## Validation
${list(rb.validation)}

## Measurable success criteria
${list(rb.successCriteria)}

## Abort condition
${rb.abortCondition}

## Rollback
${list(rb.rollback)}

## Escalation
${list(rb.escalation)}

## Evidence to capture
${list(rb.evidence)}

> Do not execute destructive recovery actions against real payment infrastructure without formal authorization. This runbook is a design artifact; validate in a non-production environment first.
`;
}

export function writeAll() {
  fs.mkdirSync(RUNBOOK_DIR, { recursive: true });
  for (const rb of RUNBOOKS) fs.writeFileSync(path.join(RUNBOOK_DIR, fileNameFor(rb)), renderRunbook(rb));
  return RUNBOOKS.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(`Generated ${writeAll()} runbooks in ${RUNBOOK_DIR}`);
}
