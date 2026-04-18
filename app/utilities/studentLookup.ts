import type { Level } from "~/types/level.interface";
import type { StudentLookupApiRecord, StudentLookupRecord } from "~/types/auth.interface";

type SchoolLookupRecord = {
  _id?: string | null;
  name?: string | null;
  registration_number?: string | null;
  registrationNumber?: string | null;
  school_registration_number?: string | null;
  schoolRegistrationNumber?: string | null;
  regNo?: string | null;
  schoolRegNo?: string | null;
};

const normalizeLevelLabel = (value: string | null | undefined) =>
  (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\b(class|darasa|la|form|kidato|cha)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const levelAliasDictionary: Record<string, string[]> = {
  "1": ["1", "i", "one", "first", "kwanza"],
  "2": ["2", "ii", "two", "second", "pili"],
  "3": ["3", "iii", "three", "third", "tatu"],
  "4": ["4", "iv", "four", "fourth", "nne"],
  "5": ["5", "v", "five", "fifth", "tano"],
  "6": ["6", "vi", "six", "sixth", "sita"],
  "7": ["7", "vii", "seven", "seventh", "saba"],
};

const findLevelAliasKey = (value: string | null | undefined) => {
  const normalizedValue = normalizeLevelLabel(value);
  if (!normalizedValue) return "";

  return Object.entries(levelAliasDictionary).find(([, aliases]) =>
    aliases.some((alias) => normalizedValue === alias || normalizedValue.includes(alias)),
  )?.[0] || "";
};

export const normalizeStudentLookupRecord = (
  student: StudentLookupApiRecord | null | undefined,
): StudentLookupRecord => ({
  premNumber: String(student?.premNumber ?? "").trim(),
  firstName: String(student?.firstName ?? "").trim(),
  lastName: String(student?.lastName ?? "").trim(),
  dob: String(student?.dob ?? "").trim(),
  sex: String(student?.sex ?? "").trim(),
  classLevel: String(student?.classLevel ?? "").trim(),
  schoolName: String(student?.schoolName ?? "").trim(),
  schoolRegNo: String(student?.schoolRegNo ?? "").trim(),
});

export const normalizeLookupGender = (sex: string | null | undefined) => {
  const normalizedSex = (sex || "").trim().toUpperCase();
  if (normalizedSex === "M") return "male";
  if (normalizedSex === "F") return "female";
  return "";
};

export const inferStudentAgeGroupFromDob = (dob: string | null | undefined) => {
  if (!dob) return "";

  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  if (age <= 12) return "Child";
  if (age <= 19) return "Teen";
  return "YoungAdult";
};

export const resolveLevelValueFromLookup = (
  levelName: string | null | undefined,
  levels: Level[],
) => {
  const normalizedLevelName = (levelName || "").trim().toLowerCase();
  if (!normalizedLevelName) return "";

  const idMatch = levels.find(
    (level) => level._id?.trim().toLowerCase() === normalizedLevelName,
  );

  if (idMatch?._id) {
    return idMatch._id;
  }

  const directMatch = levels.find(
    (level) => level.name?.trim().toLowerCase() === normalizedLevelName,
  );

  if (directMatch?._id) {
    return directMatch._id;
  }

  const normalizedLookupLabel = normalizeLevelLabel(levelName);
  const lookupAliasKey = findLevelAliasKey(levelName);

  const matchedLevel = levels.find((level) => {
    const normalizedCandidate = normalizeLevelLabel(level.name);
    const candidateAliasKey = findLevelAliasKey(level.name);

    if (normalizedCandidate === normalizedLookupLabel) {
      return true;
    }

    if (lookupAliasKey && candidateAliasKey && lookupAliasKey === candidateAliasKey) {
      return true;
    }

    return Boolean(
      normalizedCandidate &&
      normalizedLookupLabel &&
      (normalizedCandidate.includes(normalizedLookupLabel) ||
        normalizedLookupLabel.includes(normalizedCandidate)),
    );
  });

  return matchedLevel?._id || "";
};

export const resolveLookupClassLevelValue = (
  selectedLevelValue: string | null | undefined,
  levels: Level[],
) => {
  const rawValue = (selectedLevelValue || "").trim();
  if (!rawValue) return "";

  const matchedLevel = levels.find(
    (level) => level._id === rawValue || level.name?.trim().toLowerCase() === rawValue.toLowerCase(),
  );

  const lookupSource = matchedLevel?.name || rawValue;
  return findLevelAliasKey(lookupSource) || rawValue;
};

export const extractSchoolRegistrationNumber = (
  school: SchoolLookupRecord | null | undefined,
) =>
  String(
    school?.registration_number ||
      school?.registrationNumber ||
      school?.school_registration_number ||
      school?.schoolRegistrationNumber ||
      school?.regNo ||
      school?.schoolRegNo ||
      "",
  ).trim();
