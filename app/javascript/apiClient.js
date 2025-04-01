// app/javascript/apiClient.js
import { UPRIGHT_HEIGHT, CROSSBEAM_LENGTH } from './constants.js';

// Helper for POST/PUT/PATCH/DELETE requests
async function sendRequest(url = '', method = 'POST', data = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    };

    const config = {
        method: method.toUpperCase(),
        headers: headers,
    };

    // Only include body for relevant methods
    if (method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD') {
        config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { error: response.statusText }; // Fallback if no JSON body
        }
        console.error(`API Error Response (${response.status}):`, errorData);
        throw new Error(`API Error (${response.status}): ${JSON.stringify(errorData.errors || errorData.error || errorData)}`);
    }

    // Handle 204 No Content response (for DELETE)
    if (response.status === 204) {
        return null; // Or return a success indicator if preferred
    }

    return response.json(); // Parses JSON response
}


// Specific API functions
async function fetchLayoutData(layoutId) {
    console.log(`Fetching data for layout ${layoutId}`);
    // Assuming GET request doesn't need CSRF token usually
    const response = await fetch(`/api/v1/layouts/${layoutId}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Fetched Layout Data:", data);
    return data;
}

async function placeUpright(layoutId, x, z) {
    console.log(`API: Placing upright at (${x}, ${z}) for layout ${layoutId}`);
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

    console.log("API: Upright placed successfully.", { newBracket, newBeam });
    // Return data for scene update
    return { newBracket, newBeam };
}

async function placeCrossbeam(layoutId, bracket1Data, bracket2Data, startSocket, endSocket) {
    console.log(`API: Placing crossbeam between ${bracket1Data.id} and ${bracket2Data.id}`);
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

    console.log("API: Crossbeam placed successfully.", { newBeam });
    // Return data for scene update
    return { newBeam };
}


async function deleteBracket(bracketId) {
    console.log(`API: Deleting bracket ${bracketId}`);
    // sendRequest handles 204 No Content automatically
    await sendRequest(`/api/v1/brackets/${bracketId}`, 'DELETE');
    console.log(`API: Bracket ${bracketId} deleted.`);
}

async function deleteBeam(beamId) {
    console.log(`API: Deleting beam ${beamId}`);
    await sendRequest(`/api/v1/beams/${beamId}`, 'DELETE');
    console.log(`API: Beam ${beamId} deleted.`);
}

async function updateLayoutMetadata(layoutId, metadata) {
    console.log(`API: Updating metadata for layout ${layoutId}`, metadata);
    // Use PATCH for partial update
    const updatedLayout = await sendRequest(`/api/v1/layouts/${layoutId}`, 'PATCH', { layout: metadata });
    console.log("API: Layout metadata updated.", updatedLayout);
    return updatedLayout; // Return updated layout data
}

async function clearLayoutContents(layoutId) {
    console.log(`API: Clearing contents for layout ${layoutId}`);
    // Use a custom DELETE route
    await sendRequest(`/api/v1/layouts/${layoutId}/clear`, 'DELETE');
    console.log(`API: Layout ${layoutId} contents cleared.`);
}

async function updateBeamFlag(beamId, flags) {
    console.log(`API: Updating flags for beam ${beamId}`, flags);
    // flags should be like { has_side_panel: true } or { has_side_panel: false }
    const updatedBeam = await sendRequest(`/api/v1/beams/${beamId}`, 'PATCH', { beam: flags });
    console.log("API: Beam flags updated.", updatedBeam);
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
