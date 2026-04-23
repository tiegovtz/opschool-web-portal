import { activityPopupId, experimrntUrl } from "../controlls";

const activityParser = (query: string): string => {
  const source = String(query || "");
  const regex = /activity(?:Id)?="([^"]+)"((?:,\s*[a-zA-Z]+="[^"]*")*)/g;

  return source.replace(regex, (match, identifier, rawAttributes) => {
    const safeIdentifier = String(identifier || "").trim();
    const attributes = Object.fromEntries(
      Array.from(String(rawAttributes || "").matchAll(/,\s*([a-zA-Z]+)="([^"]*)"/g)).map(
        ([, key, value]) => [key.toLowerCase(), value]
      )
    );

    const title = String(attributes.title || "Untitled Activity").trim();
    const thumbnail = attributes.thumbnail && attributes.thumbnail !== "null"
      ? attributes.thumbnail
      : "";

    return `<button
        class="flex flex-col items-center w-full gap-2 p-4 rounded-md border border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors relative"
        onclick="openInteractiveActivity('${safeIdentifier}')"
        data-activity-id="${safeIdentifier}"
        aria-label="click to open ${title}" 
      >
      <p class="z-10 mt-2 font-semibold text-black bg-white rounded-md !p-2  text-wrap">${title}</p>
      <img src="${thumbnail || '/images/activites-placeholder-converted.webp'}" alt="${title}" class="absolute z-0 inset-0 w-full h-auto object-cover rounded-md" />
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
