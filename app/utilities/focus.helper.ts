/**
 * Moves keyboard focus to an element with the given ID.
 *
 * This is useful for accessibility, e.g., skipping to main content.
 * 
 * ⚠️ Tip: The target element should have `tabindex="-1"` if it is not naturally focusable
 * (like a <div> or <section>), so that `.focus()` works correctly.
 *
 * @param {string} id - The ID of the target element to focus.
 *
 * @example
 * // HTML: <main id="main-container" tabindex="-1">...</main>
 * // JavaScript:
 * moveFocus('main-container');
 */
const moveFocus = (id: string) => {
  const target = document.getElementById(id);
  if (target) {
    target.focus();
  }
}

export {
  moveFocus
}
