import { activityPopupId, experimrntUrl } from "../controlls";

const activityParser = (query: string): string => {
  const source = String(query || "");
  const regex = /activity(?:Id)?="([^"]+)"((?:,[a-zA-Z]+="[^"]*")*)/g;

  return source.replace(regex, (match, identifier, rawAttributes) => {
    const safeIdentifier = String(identifier || "").trim();
    const attributes = Object.fromEntries(
      Array.from(String(rawAttributes || "").matchAll(/,([a-zA-Z]+)="([^"]*)"/g)).map(
        ([, key, value]) => [key.toLowerCase(), value]
      )
    );

    const buttonLabel = String(
      attributes.buttontext || attributes.label || attributes.title || "Open Activity"
    ).trim() || "Open Activity";

    return `<button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-oceanBlue text-white hover:bg-deepBlue transition-colors"
        onclick="openInteractiveActivity('${safeIdentifier}')"
        data-activity-id="${safeIdentifier}"
        aria-label="${buttonLabel}"
      >
        ${buttonLabel}
      </button>`;
  });
};

declare global {
  interface Window {
    openInteractiveActivity: (activityId: string) => void;
  }
}

if (typeof window !== "undefined") {
  window.openInteractiveActivity = (activityId: string) => {
    const safeActivityId = String(activityId || "").trim();
    experimrntUrl.value = null;
    activityPopupId.value = safeActivityId || "";
  };
}

export default activityParser;
