import { activityPopupId, experimrntUrl } from "../controlls";
import { resolveMediaUrl } from "./mediaUrl";
import { escapeHtmlAttribute, type MediaUrlOptions } from '../mediaUrls';
import { resolveExperimentEntryUrl } from "../resolveUploadUrl";

const experimentParser = (query: string, options: MediaUrlOptions = {}): string => {
    // Regular expression to match expPackage and associated <img>
    const regex = /expPackage="([^"]+)",&lt;img src="([^"]+)" alt="([^"]+)"&gt;/g;

    return query.replace(regex, (match, expSrc, imgSrc, altText) => {
        const experimentUrl = resolveMediaUrl(expSrc, options);
        const openAction = escapeHtmlAttribute(`openActivity(${JSON.stringify(experimentUrl)})`);
        return `<div
              id="experimentPackage"
              class="w-full rounded-md overflow-hidden cursor-pointer md:min-h-[400px]"
              src="${escapeHtmlAttribute(experimentUrl)}"
              alt="${escapeHtmlAttribute(altText)}"
              onclick="${openAction}"
              >
              <img class="w-full h-full object-center object-cover" src="${escapeHtmlAttribute(resolveMediaUrl(imgSrc, options))}" alt="${escapeHtmlAttribute(altText)}" />
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
        // expSrc is the package's folder; resolve which entry page it actually has
        // (index.html or find.html -- see resolveExperimentEntryUrl) before opening it.
        resolveExperimentEntryUrl(expSrc).then((resolved) => {
            experimrntUrl.value = resolved;
        });
    };
}
export default experimentParser;
