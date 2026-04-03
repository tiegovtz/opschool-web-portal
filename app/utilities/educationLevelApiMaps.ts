/**
 * Maps GET /education-levels `name` values to query params used by:
 * - GET /v1/levels?educationLevel=<slug>  (lowercase, e.g. primary, lower secondary)
 * - GET /v1/schools?education=<UPPER>       (e.g. PRIMARY, LOWER SECONDARY)
 */
export function educationLevelNameToLevelsApiQuery(name: string): string {
  return (name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function educationLevelNameToSchoolEducationQuery(name: string): string {
  return (name || "").trim().toUpperCase().replace(/\s+/g, " ");
}
