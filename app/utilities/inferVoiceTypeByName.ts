const MALE_NAME_HINTS = new Set([
  "kipeto",
  "anande",
  "mfwimi",
  "balongage",
  "jontwa",
  "shedanga",
  "gulila",
  "hakeem",
  "hakim",
  "john",
  "james",
  "peter",
  "paul",
  "david",
  "michael",
  "joseph",
  "daniel",
  "samuel",
  "elias",
  "ibrahim",
  "mohamed",
  "mohammed",
  "yusuf",
  "emmanuel",
  "frank",
  "brian",
  "george",
  "jamal",
  "manjana",
]);

const FEMALE_NAME_HINTS = new Set([
  "anna",
  "amina",
  "fatma",
  "fatuma",
  "maria",
  "sarah",
  "grace",
  "joyce",
  "rehema",
  "neema",
  "zainab",
  "zaina",
  "jane",
  "janet",
  "rachel",
  "esther",
  "diana",
  "sophia",
  "mary",
  "rose",
  "libe",
  "shamimu",
  "sesi",
  "fati",
  "nyenza",
]);

// Hints are compared against a lowercased name, so they must be lowercase.
export const inferVoiceTypeByName = (name: string): "male" | "female" => {
  const normalized = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s-]/g, "");
  if (!normalized) return "female";

  const first = normalized.split(/[\s-]+/)[0] || normalized;
  if (MALE_NAME_HINTS.has(first)) return "male";
  if (FEMALE_NAME_HINTS.has(first)) return "female";

  if (/(son|man|boy)$/.test(first)) return "male";
  if (/(a|ah|ia|na)$/.test(first)) return "female";

  return "female";
};
