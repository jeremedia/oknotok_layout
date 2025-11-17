// app/javascript/rateLimiter.js
//
// Client-side rate limiting to prevent API abuse and improve UX.
// Uses a token bucket algorithm with per-endpoint limits.
//

import toast from './toast.js';
import { rateLimitLog } from './environment.js';

/**
 * Rate limiter configuration per endpoint pattern.
 * maxRequests: Maximum number of requests allowed in the time window
 * windowMs: Time window in milliseconds
 */
const RATE_LIMITS = {
    // Read operations (GET requests)
    'GET /layouts/:id': { maxRequests: 20, windowMs: 1000 },            // 20 layout fetches per second

    // High-frequency operations (user interactions)
    'POST /layouts/:id/brackets': { maxRequests: 10, windowMs: 1000 }, // 10 brackets per second
    'POST /layouts/:id/beams': { maxRequests: 10, windowMs: 1000 },    // 10 beams per second
    'DELETE /brackets/:id': { maxRequests: 5, windowMs: 1000 },         // 5 deletes per second
    'DELETE /beams/:id': { maxRequests: 5, windowMs: 1000 },            // 5 deletes per second

    // Moderate-frequency operations
    'PATCH /layouts/:id': { maxRequests: 2, windowMs: 1000 },           // 2 metadata updates per second
    'PATCH /beams/:id': { maxRequests: 5, windowMs: 1000 },             // 5 beam updates per second

    // Low-frequency operations (heavy/destructive)
    'DELETE /layouts/:id/clear': { maxRequests: 1, windowMs: 2000 },    // 1 clear every 2 seconds
    'POST /layouts': { maxRequests: 3, windowMs: 5000 },                // 3 new layouts per 5 seconds

    // Default fallback for any endpoint not specifically configured
    'default': { maxRequests: 10, windowMs: 1000 }                      // 10 requests per second
};

/**
 * Stores request timestamps for each endpoint.
 * Structure: Map<endpointKey, Array<timestamp>>
 */
const requestTimestamps = new Map();

/**
 * Normalizes endpoint paths to match rate limit keys.
 * Replaces IDs with :id placeholder for consistent matching.
 *
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} url - Request URL
 * @returns {string} Normalized endpoint key
 */
function normalizeEndpoint(method, url) {
    // Extract path from URL (remove query params and domain)
    const urlObj = new URL(url, window.location.origin);
    let path = urlObj.pathname;

    // Replace numeric IDs with :id placeholder
    // /layouts/123 -> /layouts/:id
    // /brackets/456 -> /brackets/:id
    path = path.replace(/\/\d+/g, '/:id');

    // Special case for clear endpoint
    if (path.endsWith('/clear')) {
        return `${method} ${path}`;
    }

    return `${method} ${path}`;
}

/**
 * Cleans up old timestamps outside the current window.
 * Prevents memory leaks from accumulating timestamps.
 *
 * @param {string} endpointKey - The endpoint key
 * @param {number} windowMs - Time window in milliseconds
 */
function cleanupOldTimestamps(endpointKey, windowMs) {
    const timestamps = requestTimestamps.get(endpointKey);
    if (!timestamps) {return;}

    const now = Date.now();
    const cutoff = now - windowMs;

    // Remove timestamps older than the window
    const recentTimestamps = timestamps.filter(ts => ts > cutoff);

    if (recentTimestamps.length === 0) {
        requestTimestamps.delete(endpointKey);
    } else {
        requestTimestamps.set(endpointKey, recentTimestamps);
    }
}

/**
 * Checks if a request should be allowed based on rate limits.
 *
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @returns {Object} { allowed: boolean, retryAfterMs: number|null, reason: string|null }
 */
export function checkRateLimit(method, url) {
    const endpointKey = normalizeEndpoint(method, url);
    const config = RATE_LIMITS[endpointKey] || RATE_LIMITS['default'];
    const { maxRequests, windowMs } = config;

    const now = Date.now();

    // Get or initialize timestamps for this endpoint
    if (!requestTimestamps.has(endpointKey)) {
        requestTimestamps.set(endpointKey, []);
    }

    // Clean up old timestamps
    cleanupOldTimestamps(endpointKey, windowMs);

    const timestamps = requestTimestamps.get(endpointKey);
    const requestsInWindow = timestamps.length;

    // Check if limit exceeded
    if (requestsInWindow >= maxRequests) {
        // Calculate when the oldest request will expire
        const oldestTimestamp = timestamps[0];
        const retryAfterMs = (oldestTimestamp + windowMs) - now;

        return {
            allowed: false,
            retryAfterMs: Math.max(0, retryAfterMs),
            reason: `Rate limit exceeded for ${endpointKey}. Please wait ${Math.ceil(retryAfterMs / 1000)}s.`
        };
    }

    // Allow the request and record timestamp
    timestamps.push(now);

    return {
        allowed: true,
        retryAfterMs: null,
        reason: null
    };
}

/**
 * Records a successful request for rate limiting purposes.
 * This should be called after successful API responses.
 *
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 */
export function recordRequest(method, url) {
    // Already recorded in checkRateLimit, but this function
    // is provided for explicit recording if needed
    const endpointKey = normalizeEndpoint(method, url);
    const config = RATE_LIMITS[endpointKey] || RATE_LIMITS['default'];

    // Cleanup old timestamps periodically
    cleanupOldTimestamps(endpointKey, config.windowMs);
}

/**
 * Resets rate limiting for a specific endpoint.
 * Useful for testing or after authentication changes.
 *
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 */
export function resetRateLimit(method, url) {
    const endpointKey = normalizeEndpoint(method, url);
    requestTimestamps.delete(endpointKey);
    rateLimitLog(`Rate limit reset for ${endpointKey}`);
}

/**
 * Resets all rate limiting data.
 * Useful for testing or session resets.
 */
export function resetAllRateLimits() {
    requestTimestamps.clear();
    rateLimitLog('All rate limits reset');
}

/**
 * Gets current rate limit status for debugging.
 *
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @returns {Object} Status information
 */
export function getRateLimitStatus(method, url) {
    const endpointKey = normalizeEndpoint(method, url);
    const config = RATE_LIMITS[endpointKey] || RATE_LIMITS['default'];
    const timestamps = requestTimestamps.get(endpointKey) || [];

    cleanupOldTimestamps(endpointKey, config.windowMs);

    return {
        endpointKey,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        currentRequests: timestamps.length,
        remaining: Math.max(0, config.maxRequests - timestamps.length)
    };
}

/**
 * Wrapper for async functions that automatically handles rate limiting.
 * Shows toast notification if rate limit is exceeded.
 *
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {Function} asyncFn - The async function to call if allowed
 * @returns {Promise<any>} Result of asyncFn or null if rate limited
 */
export async function withRateLimit(method, url, asyncFn) {
    const result = checkRateLimit(method, url);

    if (!result.allowed) {
        toast.warning(result.reason, 3000);
        rateLimitLog(`Rate limit exceeded: ${result.reason}`);
        return null;
    }

    // Note: Even if the request fails, the rate limit still applies
    return await asyncFn();
}
