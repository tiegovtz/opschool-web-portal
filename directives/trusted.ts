import type { Directive } from 'vue';

// This directive adds a 'data-origin' attribute to all elements within the bound element
const trusted: Directive = {

    mounted(el: HTMLElement) {
        const TRUSTED_ATTR = 'data-origin';
        const TRUSTED_VAL = 'app';

        // Function to add 'data-origin' to the element if it does not already have it
        const tagElement = (node: Element) => {
            if (!node.hasAttribute(TRUSTED_ATTR)) {
                // console.log('Adding data-origin="app" to', node);  // Debug log
                node.setAttribute(TRUSTED_ATTR, TRUSTED_VAL);
            }
        };

        // Function to tag all child elements
        const deepTag = (root: Element) => {
            tagElement(root);  // Tag the root element itself
            root.querySelectorAll('*').forEach(tagElement);  // Tag all child elements recursively
        };

        // Tag the element and all of its children right away
        deepTag(el);
        // Set up a MutationObserver to tag any dynamically added elements
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        tagElement(node as Element);  // Tag the added node
                        deepTag(node as Element);  // Tag any child elements of the added node
                    }
                });
            }
        });

        // Start observing changes to the element and its children
        observer.observe(el, {
            childList: true,
            subtree: true,
        });

        // Store the observer for later cleanup
        (el as any).__trustedObserver = observer;
    },

    unmounted(el: HTMLElement) {
        // Disconnect the observer when the element is unmounted
        const observer = (el as any).__trustedObserver;
        if (observer) {
            observer.disconnect();
        }
    },
};

export default trusted;
