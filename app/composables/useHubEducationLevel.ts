import type { EducationBucket } from "~/utilities/educationRoute";

const COOKIE_NAME = "tie-hub-education-level";

export function useHubEducationLevel() {
  return useCookie<EducationBucket>(COOKIE_NAME, {
    default: () => "secondary",
    maxAge: 60 * 60 * 24 * 180,
    path: "/",
    sameSite: "strict",
    secure: import.meta.env.PROD,
  });
}
