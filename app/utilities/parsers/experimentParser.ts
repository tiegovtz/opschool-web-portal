import { activityPopupId, experimrntUrl } from "../controlls";

const experimentParser = (query: string): string => {
    // Regular expression to match expPackage and associated <img>
    const regex = /expPackage="([^"]+)",&lt;img src="([^"]+)" alt="([^"]+)"&gt;/g;

    return query.replace(regex, (match, expSrc, imgSrc, altText) => {
        return `<div
              id="experimentPackage"  
              class="w-full rounded-md overflow-hidden cursor-pointer md:min-h-[400px]"
              src="${expSrc}"
              alt="${altText}"
              onclick="openActivity('${expSrc}')"
              >
              <img class="w-full h-full object-center object-cover" src="${imgSrc}" alt="${altText}" />
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
