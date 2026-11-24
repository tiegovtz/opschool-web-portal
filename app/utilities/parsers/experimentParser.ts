import { activityPopupId, experimrntUrl } from "../controlls";
import { resolveMediaUrl } from "./mediaUrl";

const experimentParser = (query: string): string => {
    // Regular expression to match expPackage and associated <img>
    const regex = /expPackage="([^"]+)",&lt;img src="([^"]+)" alt="([^"]+)"&gt;/g;

    return query.replace(regex, (match, expSrc, imgSrc, altText) => {
        const experimentUrl = resolveMediaUrl(expSrc);
        return `<div
              id="experimentPackage"  
              class="w-full rounded-md overflow-hidden cursor-pointer md:min-h-[400px]"
              src="${experimentUrl}"
              alt="${altText}"
              onclick="openActivity('${experimentUrl}')"
              >
              <img class="w-full h-full object-center object-cover" src="${resolveMediaUrl(imgSrc)}" alt="${altText}" />
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
