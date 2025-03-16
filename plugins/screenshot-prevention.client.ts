// plugins/screenshot-prevention.client.ts
import { isPopUp, popMessage } from "~/utilities/controlls";

export default defineNuxtPlugin(() => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Show a popup message and auto-hide it after a timeout.
   * @param {string} message - The message to display.
   * @author MinjaBaraka (https://github.com/MinjaBaraka)
   * @description This function displays a popup with a given message and hides it after 3 seconds.
   * @version 1.0.0
   * @since 1.0.0
   * @example
   * showPopup("Sorry, right-clicking is disabled.");
   */
  const showPopup = (message: string): void => {
    isPopUp.value = true;
    popMessage.value = message;

    // Clear existing timeout to prevent stacking popups
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      isPopUp.value = false;
      // popMessage.value = "";
    }, 5000); // Auto-hide after 5 seconds
  };

  if (import.meta.client) {
    // Disable right-click
    document.addEventListener("contextmenu", (e: Event) => {
      e.preventDefault();
      showPopup("Sorry, right-clicking is disabled.");
    });

    // Disable keyboard shortcuts
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      e.preventDefault();

      if (key === "PRINTSCREEN") {
        showPopup("Sorry, taking screenshots is not allowed due to privacy policies.");
      } else if (e.metaKey && key === "P") {
        showPopup("Sorry, printing is disabled due to privacy policies.");
      } else if (e.metaKey && key === "S") {
        showPopup("Sorry, saving is restricted due to privacy policies.");
      } else if (e.ctrlKey && e.shiftKey && key === "I") {
        showPopup("Sorry, accessing Developer Tools is not allowed.");
      } else if (e.ctrlKey && e.shiftKey && key === "C") {
        showPopup("Sorry, inspecting elements is disabled.");
      } else if (e.ctrlKey && key === "S") {
        showPopup("Sorry, saving is not permitted.");
      } else if (e.ctrlKey && key === "P") {
        showPopup("Sorry, printing is restricted.");
      } else if (key === "F12") {
        showPopup("Sorry, Developer Tools access is blocked.");
      } else if (e.metaKey && e.altKey && key === "I") {
        showPopup("Sorry, inspecting elements is disabled on Mac.");
      }
    });

    // Disable drag and selection
    document.addEventListener("dragstart", (e: Event) => {
      e.preventDefault();
      showPopup("Sorry, dragging content is not allowed.");
    });
  }
});
