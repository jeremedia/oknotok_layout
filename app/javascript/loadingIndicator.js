// app/javascript/loadingIndicator.js
//
// Loading indicator utilities for providing visual feedback during async operations.
// Shows loading state on buttons and provides global loading overlay.
//

/**
 * Shows a loading state on a button element
 *
 * @param {HTMLElement} button - The button element
 * @param {string} loadingText - Optional loading text (default: "Loading...")
 * @returns {Function} - Function to call to restore button state
 */
export function showButtonLoading(button, loadingText = 'Loading...') {
    if (!button) {return () => {};}

    // Store original state
    const originalText = button.textContent;
    const originalDisabled = button.disabled;

    // Set loading state
    button.disabled = true;
    button.classList.add('loading');
    button.textContent = loadingText;

    // Return function to restore original state
    return () => {
        button.disabled = originalDisabled;
        button.classList.remove('loading');
        button.textContent = originalText;
    };
}

/**
 * Wraps an async function to show loading indicator on a button
 *
 * @param {HTMLElement} button - The button element
 * @param {Function} asyncFn - The async function to wrap
 * @param {string} loadingText - Optional loading text
 * @returns {Function} - Wrapped function that shows loading state
 */
export function withButtonLoading(button, asyncFn, loadingText) {
    return async function(...args) {
        const hideLoading = showButtonLoading(button, loadingText);
        try {
            return await asyncFn.apply(this, args);
        } finally {
            hideLoading();
        }
    };
}

let globalLoadingOverlay = null;
let loadingCounter = 0;

/**
 * Shows a global loading overlay
 *
 * @param {string} message - Optional loading message
 */
export function showGlobalLoading(message = 'Loading...') {
    loadingCounter++;

    if (!globalLoadingOverlay) {
        globalLoadingOverlay = document.createElement('div');
        globalLoadingOverlay.id = 'global-loading-overlay';
        globalLoadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
        `;
        document.body.appendChild(globalLoadingOverlay);
    } else {
        // Update message if overlay already exists
        const messageEl = globalLoadingOverlay.querySelector('.loading-message');
        if (messageEl) {messageEl.textContent = message;}
    }

    // Trigger animation
    setTimeout(() => globalLoadingOverlay.classList.add('show'), 10);
}

/**
 * Hides the global loading overlay
 */
export function hideGlobalLoading() {
    loadingCounter--;

    if (loadingCounter <= 0 && globalLoadingOverlay) {
        loadingCounter = 0;
        globalLoadingOverlay.classList.remove('show');
        setTimeout(() => {
            if (globalLoadingOverlay && loadingCounter === 0) {
                globalLoadingOverlay.remove();
                globalLoadingOverlay = null;
            }
        }, 300); // Match CSS transition duration
    }
}

/**
 * Wraps an async function to show global loading indicator
 *
 * @param {Function} asyncFn - The async function to wrap
 * @param {string} message - Optional loading message
 * @returns {Function} - Wrapped function that shows loading state
 */
export function withGlobalLoading(asyncFn, message) {
    return async function(...args) {
        showGlobalLoading(message);
        try {
            return await asyncFn.apply(this, args);
        } finally {
            hideGlobalLoading();
        }
    };
}

export default {
    showButtonLoading,
    withButtonLoading,
    showGlobalLoading,
    hideGlobalLoading,
    withGlobalLoading
};
