// app/javascript/apiClient.js
import { UPRIGHT_HEIGHT, CROSSBEAM_LENGTH } from './constants.js';
import { checkRateLimit } from './rateLimiter.js';
import toast from './toast.js';
import { apiLog, getConfig } from './environment.js';
import { recordAPICall } from './performanceMonitor.js';

// Helper for POST/PUT/PATCH/DELETE requests
async function sendRequest(url = '', method = 'POST', data = {}) {
    // Check rate limit before making request
    const rateLimitCheck = checkRateLimit(method, url);

    if (!rateLimitCheck.allowed) {
        console.warn(`Rate limit exceeded: ${rateLimitCheck.reason}`);
        toast.warning(rateLimitCheck.reason, 3000);

        // Throw error to prevent request
        const error = new Error('Rate limit exceeded');
        error.rateLimitExceeded = true;
        error.retryAfterMs = rateLimitCheck.retryAfterMs;
        throw error;
    }
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    };

    const config = {
        method: method.toUpperCase(),
        headers: headers
    };

    // Only include body for relevant methods
    if (method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD') {
        config.body = JSON.stringify(data);
    }

    // Time the API call
    const startTime = performance.now();
    let success = true;

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            success = false;
            let errorData;
            try {
                errorData = await response.json();
            } catch (_e) {
                errorData = { error: response.statusText }; // Fallback if no JSON body
            }
            console.error(`API Error Response (${response.status}):`, errorData);

            // Record failed API call
            const duration = performance.now() - startTime;
            if (getConfig('enablePerformanceLogging')) {
                recordAPICall(method.toUpperCase(), url, duration, false);
            }

            throw new Error(`API Error (${response.status}): ${JSON.stringify(errorData.errors || errorData.error || errorData)}`);
        }

        // Handle 204 No Content response (for DELETE)
        const duration = performance.now() - startTime;
        if (response.status === 204) {
            // Record successful API call
            if (getConfig('enablePerformanceLogging')) {
                recordAPICall(method.toUpperCase(), url, duration, true);
            }
            return null; // Or return a success indicator if preferred
        }

        const result = await response.json(); // Parses JSON response

        // Record successful API call
        if (getConfig('enablePerformanceLogging')) {
            recordAPICall(method.toUpperCase(), url, duration, true);
        }

        return result;
    } catch (error) {
        // Record error if not already recorded
        if (success) {
            const duration = performance.now() - startTime;
            if (getConfig('enablePerformanceLogging')) {
                recordAPICall(method.toUpperCase(), url, duration, false);
            }
        }
        throw error;
    }
}


// Specific API functions
async function fetchLayoutData(layoutId) {
    apiLog(`Fetching data for layout ${layoutId}`);

    const url = `/api/v1/layouts/${layoutId}`;

    // Check rate limit for GET request
    const rateLimitCheck = checkRateLimit('GET', url);
    if (!rateLimitCheck.allowed) {
        console.warn(`Rate limit exceeded: ${rateLimitCheck.reason}`);
        toast.warning(rateLimitCheck.reason, 3000);

        const error = new Error('Rate limit exceeded');
        error.rateLimitExceeded = true;
        error.retryAfterMs = rateLimitCheck.retryAfterMs;
        throw error;
    }

    // Time the API call
    const startTime = performance.now();
    let success = true;

    try {
        // Assuming GET request doesn't need CSRF token usually
        const response = await fetch(url);
        if (!response.ok) {
            success = false;
            const duration = performance.now() - startTime;
            if (getConfig('enablePerformanceLogging')) {
                recordAPICall('GET', url, duration, false);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const duration = performance.now() - startTime;
        if (getConfig('enablePerformanceLogging')) {
            recordAPICall('GET', url, duration, true);
        }

        apiLog('Fetched Layout Data:', data);
        return data;
    } catch (error) {
        if (success) {
            const duration = performance.now() - startTime;
            if (getConfig('enablePerformanceLogging')) {
                recordAPICall('GET', url, duration, false);
            }
        }
        throw error;
    }
}

async function placeUpright(layoutId, x, z) {
    apiLog(`API: Placing upright at (${x}, ${z}) for layout ${layoutId}`);
    // 1. Create Bracket
    const bracketPayload = { bracket: { x: x, y: UPRIGHT_HEIGHT, z: z } };
    const newBracket = await sendRequest(`/api/v1/layouts/${layoutId}/brackets`, 'POST', bracketPayload);

    // 2. Create Beam
    const beamPayload = {
        beam: {
            beam_type: 'upright',
            length: UPRIGHT_HEIGHT,
            start_bracket_id: newBracket.id,
            end_bracket_id: null,
            start_socket: '-y', // Convention: Beam enters bottom socket of bracket
            end_socket: null
        }
    };
    const newBeam = await sendRequest(`/api/v1/layouts/${layoutId}/beams`, 'POST', beamPayload);

    apiLog('API: Upright placed successfully.', { newBracket, newBeam });
    // Return data for scene update
    return { newBracket, newBeam };
}

async function placeCrossbeam(layoutId, bracket1Data, bracket2Data, startSocket, endSocket) {
    apiLog(`API: Placing crossbeam between ${bracket1Data.id} and ${bracket2Data.id}`);
    const beamPayload = {
        beam: {
            beam_type: 'crossbeam',
            length: CROSSBEAM_LENGTH,
            start_bracket_id: bracket1Data.id,
            end_bracket_id: bracket2Data.id,
            start_socket: startSocket,
            end_socket: endSocket
        }
    };
    const newBeam = await sendRequest(`/api/v1/layouts/${layoutId}/beams`, 'POST', beamPayload);

    apiLog('API: Crossbeam placed successfully.', { newBeam });
    // Return data for scene update
    return { newBeam };
}


async function deleteBracket(bracketId) {
    apiLog(`API: Deleting bracket ${bracketId}`);
    // sendRequest handles 204 No Content automatically
    await sendRequest(`/api/v1/brackets/${bracketId}`, 'DELETE');
    apiLog(`API: Bracket ${bracketId} deleted.`);
}

async function deleteBeam(beamId) {
    apiLog(`API: Deleting beam ${beamId}`);
    await sendRequest(`/api/v1/beams/${beamId}`, 'DELETE');
    apiLog(`API: Beam ${beamId} deleted.`);
}

async function updateLayoutMetadata(layoutId, metadata) {
    apiLog(`API: Updating metadata for layout ${layoutId}`, metadata);
    // Use PATCH for partial update
    const updatedLayout = await sendRequest(`/api/v1/layouts/${layoutId}`, 'PATCH', { layout: metadata });
    apiLog('API: Layout metadata updated.', updatedLayout);
    return updatedLayout; // Return updated layout data
}

async function clearLayoutContents(layoutId) {
    apiLog(`API: Clearing contents for layout ${layoutId}`);
    // Use a custom DELETE route
    await sendRequest(`/api/v1/layouts/${layoutId}/clear`, 'DELETE');
    apiLog(`API: Layout ${layoutId} contents cleared.`);
}

async function updateBeamFlag(beamId, flags) {
    apiLog(`API: Updating flags for beam ${beamId}`, flags);
    // flags should be like { has_side_panel: true } or { has_side_panel: false }
    const updatedBeam = await sendRequest(`/api/v1/beams/${beamId}`, 'PATCH', { beam: flags });
    apiLog('API: Beam flags updated.', updatedBeam);
    return updatedBeam;
}

export {
    fetchLayoutData,
    placeUpright,
    placeCrossbeam,
    deleteBracket,
    deleteBeam,
    updateBeamFlag,
    updateLayoutMetadata,
    clearLayoutContents
};
