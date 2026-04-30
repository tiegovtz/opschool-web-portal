/**
 * Maps GET /education-levels `name` values to query params used by:
 * - GET /v1/levels?educationLevel=<slug>  (lowercase, e.g. primary, lower secondary)
 * - GET /v1/schools?education=<category>    (e.g. primary, secondary)
 */
export function educationLevelNameToLevelsApiQuery(name: string): string {
  const normalized = (name || "").trim().toLowerCase().replace(/\s+/g, " ");
  if (normalized === "pre-primary") return "elimu ya awali";
  if (normalized === "primary") return "elimu ya msingi";
  return normalized;
}

export function educationLevelNameToSchoolEducationQuery(name: string): string {
  const normalized = (name || "").trim().toLowerCase().replace(/\s+/g, " ");

  if (
    normalized === "elimu ya awali" ||
    normalized === "elimu ya msingi" ||
    normalized === "pre-primary" ||
    normalized === "primary"
  ) {
    return "primary";
  }

  if (
    normalized === "lower secondary" ||
    normalized === "upper secondary" ||
    normalized === "teacher education" ||
    normalized === "secondary"
  ) {
    return "secondary";
  }

  return normalized;
}
