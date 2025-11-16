// app/javascript/errorHandler.js
//
// Centralized error handling utilities for the application.
// Provides wrapper functions for event handlers and async operations
// to ensure errors are properly caught and logged.
//

/**
 * Wraps an async event handler function with error handling.
 * Prevents event handler errors from crashing the application.
 *
 * @param {Function} handler - The async event handler function
 * @param {string} handlerName - Name of the handler for logging purposes
 * @returns {Function} - Wrapped handler with error handling
 */
export function wrapEventHandler(handler, handlerName = 'EventHandler') {
    return async function(...args) {
        try {
            return await handler.apply(this, args);
        } catch (error) {
            console.error(`Error in ${handlerName}:`, error);
            // Show user-friendly error message
            alert(`An error occurred: ${error.message}. Please try again.`);
            // You could send this to an error tracking service here
        }
    };
}

/**
 * Wraps a sync event handler function with error handling.
 *
 * @param {Function} handler - The sync event handler function
 * @param {string} handlerName - Name of the handler for logging purposes
 * @returns {Function} - Wrapped handler with error handling
 */
export function wrapSyncEventHandler(handler, handlerName = 'EventHandler') {
    return function(...args) {
        try {
            return handler.apply(this, args);
        } catch (error) {
            console.error(`Error in ${handlerName}:`, error);
            // Show user-friendly error message
            alert(`An error occurred: ${error.message}. Please try again.`);
            // You could send this to an error tracking service here
        }
    };
}

/**
 * Validates that required parameters are provided.
 * Throws an error if validation fails.
 *
 * @param {Object} params - Object containing parameters to validate
 * @param {Array<string>} requiredParams - Array of required parameter names
 * @param {string} functionName - Name of the function for error messages
 * @throws {Error} - If required parameters are missing
 */
export function validateParams(params, requiredParams, functionName = 'function') {
    for (const param of requiredParams) {
        if (params[param] === undefined || params[param] === null) {
            throw new Error(`${functionName}: Required parameter '${param}' is missing`);
        }
    }
}

/**
 * Logs an error with consistent formatting.
 *
 * @param {string} context - Context where the error occurred
 * @param {Error} error - The error object
 * @param {Object} additionalInfo - Additional information to log
 */
export function logError(context, error, additionalInfo = {}) {
    console.error(`[ERROR] ${context}:`, {
        message: error.message,
        stack: error.stack,
        ...additionalInfo
    });
    // You could send this to an error tracking service here
}
