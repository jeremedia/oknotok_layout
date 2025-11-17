// app/javascript/toast.js
//
// Simple, dependency-free toast notification system.
// Provides non-blocking user feedback for actions and errors.
//

/**
 * Toast notification types
 */
const ToastType = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

/**
 * Default configuration for toast notifications
 */
const DEFAULT_CONFIG = {
    duration: 4000, // milliseconds
    position: 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
    maxToasts: 5 // Maximum number of toasts to display at once
};

let toastContainer = null;
let activeToasts = [];

/**
 * Initializes the toast container and adds it to the DOM
 */
function initToastContainer() {
    if (toastContainer) {return;}

    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = `toast-container toast-${DEFAULT_CONFIG.position}`;
    document.body.appendChild(toastContainer);
}

/**
 * Shows a toast notification
 *
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 * @param {number} duration - How long to show the toast (ms), 0 for persistent
 * @returns {HTMLElement} - The toast element
 */
function showToast(message, type = ToastType.INFO, duration = DEFAULT_CONFIG.duration) {
    initToastContainer();

    // Remove oldest toast if at max capacity
    if (activeToasts.length >= DEFAULT_CONFIG.maxToasts) {
        const oldestToast = activeToasts.shift();
        removeToast(oldestToast);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Add icon based on type
    const icon = getIconForType(type);
    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-icon';
    iconSpan.textContent = icon;

    // Add message
    const messageSpan = document.createElement('span');
    messageSpan.className = 'toast-message';
    messageSpan.textContent = message;

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => removeToast(toast);

    toast.appendChild(iconSpan);
    toast.appendChild(messageSpan);
    toast.appendChild(closeButton);

    toastContainer.appendChild(toast);
    activeToasts.push(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('toast-show'), 10);

    // Auto-remove after duration (if not persistent)
    if (duration > 0) {
        setTimeout(() => removeToast(toast), duration);
    }

    return toast;
}

/**
 * Removes a toast from the DOM
 *
 * @param {HTMLElement} toast - The toast element to remove
 */
function removeToast(toast) {
    if (!toast || !toast.parentNode) {return;}

    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');

    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
        const index = activeToasts.indexOf(toast);
        if (index > -1) {
            activeToasts.splice(index, 1);
        }
    }, 300); // Match CSS transition duration
}

/**
 * Gets the icon for a toast type
 *
 * @param {string} type - The toast type
 * @returns {string} - The icon character
 */
function getIconForType(type) {
    switch (type) {
        case ToastType.SUCCESS:
            return '✓';
        case ToastType.ERROR:
            return '✕';
        case ToastType.WARNING:
            return '⚠';
        case ToastType.INFO:
        default:
            return 'ℹ';
    }
}

/**
 * Convenience methods for different toast types
 */
const toast = {
    success: (message, duration) => showToast(message, ToastType.SUCCESS, duration),
    error: (message, duration) => showToast(message, ToastType.ERROR, duration),
    warning: (message, duration) => showToast(message, ToastType.WARNING, duration),
    info: (message, duration) => showToast(message, ToastType.INFO, duration),
    show: showToast,
    remove: removeToast,
    clear: () => {
        activeToasts.forEach(t => removeToast(t));
        activeToasts = [];
    }
};

export { toast, ToastType };
export default toast;
