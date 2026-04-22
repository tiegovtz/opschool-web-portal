/**
 * Maps GET /education-levels `name` values to query params used by:
 * - GET /v1/levels?educationLevel=<slug>  (lowercase, e.g. primary, lower secondary)
 * - GET /v1/schools?education=<UPPER>       (e.g. PRIMARY, LOWER SECONDARY)
 */
export function educationLevelNameToLevelsApiQuery(name: string): string {
  const normalized = (name || "").trim().toLowerCase().replace(/\s+/g, " ");
  if (normalized === "pre-primary") return "elimu ya awali";
  if (normalized === "primary") return "elimu ya msingi";
  return normalized;
}

export function educationLevelNameToSchoolEducationQuery(name: string): string {
  return (name || "").trim().toUpperCase().replace(/\s+/g, " ");
}
