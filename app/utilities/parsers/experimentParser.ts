import { activityPopupId, experimrntUrl } from "../controlls";
import { resolveUploadUrl } from "../resolveUploadUrl";

const experimentParser = (query: string, uploadsBaseUrl: string = ""): string => {
    // Regular expression to match expPackage and associated <img>
    const regex = /expPackage="([^"]+)",&lt;img src="([^"]+)" alt="([^"]+)"&gt;/g;

    return query.replace(regex, (match, expSrc, imgSrc, altText) => {
        const resolvedExpSrc = resolveUploadUrl(expSrc, uploadsBaseUrl);
        const resolvedImgSrc = resolveUploadUrl(imgSrc, uploadsBaseUrl);
        return `<div
              id="experimentPackage"
              class="w-full rounded-md overflow-hidden cursor-pointer md:min-h-[400px]"
              src="${resolvedExpSrc}"
              alt="${altText}"
              onclick="openActivity('${resolvedExpSrc}')"
              >
              <img class="w-full h-full object-center object-cover" src="${resolvedImgSrc}" alt="${altText}" />
            </div>`;
    });
}

// Extend the Window interface to include openActivity
declare global {
    interface Window {
        openActivity: (expSrc: string) => void;
    }
}

// Define the global function to handle clicks (client-only)
if (typeof window !== "undefined") {
    window.openActivity = (expSrc: string) => {
        // You can add custom logic here (e.g., open modal, navigate, etc.)
        activityPopupId.value = "";
        experimrntUrl.value = expSrc;
    };
}
export default experimentParser;
