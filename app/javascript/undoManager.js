// app/javascript/undoManager.js

// --- Imports ---
// We need access to API functions, mesh functions, scene, data, clock etc.
// These will be passed during initialization.
import { placeUpright, placeCrossbeam, deleteBracket, deleteBeam } from './apiClient.js';
import { addBracketMesh, addBeamMesh, removeMesh } from './meshFactory.js';

// --- State ---
const undoStack = [];
const MAX_UNDO_STEPS = 50; // Limit history size
let sceneRef, currentLayoutDataRef, clockRef; // References to shared objects

// --- Initialization ---
function initUndoManager(scene, layoutData, clock) {
    sceneRef = scene;
    currentLayoutDataRef = layoutData; // Reference to the mutable layout data object
    clockRef = clock;
    console.log("Undo Manager Initialized.");
}

// --- Action Recording ---
function pushUndoAction(action) {
    if (!action || !action.type) {
        console.error("Invalid action pushed to undo stack:", action);
        return;
    }
    undoStack.push(action);
    // Limit stack size
    if (undoStack.length > MAX_UNDO_STEPS) {
        undoStack.shift(); // Remove the oldest action
    }
    console.log("Action pushed to undo stack:", action.type, action);
    // TODO: Update UI to enable Undo button
}

// --- Undo Logic ---
async function undoLastAction() {
    if (undoStack.length === 0) {
        console.log("Undo stack empty.");
        // TODO: Update UI to disable Undo button
        return;
    }

    const actionToUndo = undoStack.pop();
    console.log("Undoing action:", actionToUndo.type, actionToUndo);
    // TODO: Update UI (disable undo if stack becomes empty)

    try {
        switch (actionToUndo.type) {
            case 'create_upright':
                // Undo: Delete the created bracket and beam
                if (actionToUndo.created?.beamId) await deleteBeam(actionToUndo.created.beamId);
                if (actionToUndo.created?.bracketId) await deleteBracket(actionToUndo.created.bracketId);
                // Remove meshes (cascade should be handled by deleteBracket)
                const bracketGroup = sceneRef.getObjectByName(`bracket_group_${actionToUndo.created?.bracketId}`);
                if (bracketGroup) removeMesh(bracketGroup, sceneRef); // removeMesh handles cascade visuals
                // Footer is removed by beam cascade visual removal
                break;

            case 'create_crossbeam':
                // Undo: Delete the created crossbeam
                if (actionToUndo.created?.beamId) await deleteBeam(actionToUndo.created.beamId);
                const beamGroup = sceneRef.getObjectByName(`beam_group_${actionToUndo.created?.beamId}`);
                if (beamGroup) removeMesh(beamGroup, sceneRef);
                break;

            case 'create_structure_from_socket':
                // Undo: Delete the crossbeam, the new upright, and the new bracket
                if (actionToUndo.created?.crossbeamId) await deleteBeam(actionToUndo.created.crossbeamId);
                if (actionToUndo.created?.uprightBeamId) await deleteBeam(actionToUndo.created.uprightBeamId);
                if (actionToUndo.created?.newBracketId) await deleteBracket(actionToUndo.created.newBracketId);
                // Remove meshes
                const crossbeamGroup = sceneRef.getObjectByName(`beam_group_${actionToUndo.created?.crossbeamId}`);
                if (crossbeamGroup) removeMesh(crossbeamGroup, sceneRef);
                const newBracketGroup = sceneRef.getObjectByName(`bracket_group_${actionToUndo.created?.newBracketId}`);
                if (newBracketGroup) removeMesh(newBracketGroup, sceneRef); // Handles cascade visuals
                break;

            case 'delete_beam':
                // Undo: Recreate the beam using stored data
                const beamData = actionToUndo.deleted?.beamData;
                if (beamData) {
                    // Note: This recreates with potentially NEW ID, but restores structure
                    const { newBeam } = await placeCrossbeam( // Use placeCrossbeam for simplicity
                        currentLayoutDataRef.id,
                        { id: beamData.start_bracket_id },
                        { id: beamData.end_bracket_id },
                        beamData.start_socket,
                        beamData.end_socket
                    );
                    // Update client data and add mesh
                    if (!currentLayoutDataRef.beams) currentLayoutDataRef.beams = [];
                    currentLayoutDataRef.beams.push(newBeam);
                    addBeamMesh(newBeam, sceneRef, clockRef);
                }
                break;

            case 'delete_upright': // Specific type for upright deletion
                // Undo: Recreate the upright (bracket + beam)
                const uprightData = actionToUndo.deleted;
                if (uprightData?.bracketData && uprightData?.beamData) {
                    // Recreate using placeUpright logic with stored position
                    const { newBracket, newBeam } = await placeUpright(
                        currentLayoutDataRef.id,
                        uprightData.bracketData.x,
                        uprightData.bracketData.z // Use original X/Z for placement
                    );
                    // Update client data and add meshes
                    if (!currentLayoutDataRef.brackets) currentLayoutDataRef.brackets = [];
                    if (!currentLayoutDataRef.beams) currentLayoutDataRef.beams = [];
                    currentLayoutDataRef.brackets.push(newBracket);
                    currentLayoutDataRef.beams.push(newBeam);
                    addBracketMesh(newBracket, sceneRef, clockRef);
                    addBeamMesh(newBeam, sceneRef, clockRef);
                }
                break;

            case 'delete_bracket_with_cascade':
                // Undo: Recreate bracket, its upright (if applicable), and connected crossbeams
                const deletedBracketData = actionToUndo.deleted?.bracketData;
                const deletedBeamsData = actionToUndo.deleted?.beamsData || [];

                if (deletedBracketData) {
                    // 1. Recreate the bracket's upright first (if it had one)
                    const originalUpright = deletedBeamsData.find(b => b.beam_type === 'upright' && b.start_bracket_id === deletedBracketData.id);
                    let recreatedBracket; // Store the recreated bracket data
                    if (originalUpright) {
                        const { newBracket, newBeam } = await placeUpright(currentLayoutDataRef.id, deletedBracketData.x, deletedBracketData.z);
                        recreatedBracket = newBracket; // Get the ID of the recreated bracket
                        // Update client data & add meshes for upright
                        if (!currentLayoutDataRef.brackets) currentLayoutDataRef.brackets = [];
                        if (!currentLayoutDataRef.beams) currentLayoutDataRef.beams = [];
                        currentLayoutDataRef.brackets.push(newBracket);
                        currentLayoutDataRef.beams.push(newBeam);
                        addBracketMesh(newBracket, sceneRef, clockRef);
                        addBeamMesh(newBeam, sceneRef, clockRef);
                    } else {
                        // If bracket had no upright (e.g., floating connection - less likely),
                        // we might need a way to just create a bracket via API?
                        // For now, assume brackets are always created via placeUpright for undo simplicity.
                        console.warn("Undo for bracket without upright not fully implemented.");
                        // As a fallback, maybe just recreate the crossbeams below?
                    }

                    // 2. Recreate the crossbeams connected to the original bracket ID
                    if (recreatedBracket) { // Only if bracket was successfully recreated
                        for (const beamData of deletedBeamsData) {
                            if (beamData.beam_type === 'crossbeam') {
                                // Determine which end connected to the deleted bracket
                                const otherBracketId = beamData.start_bracket_id === deletedBracketData.id ? beamData.end_bracket_id : beamData.start_bracket_id;
                                const startId = beamData.start_bracket_id === deletedBracketData.id ? recreatedBracket.id : otherBracketId;
                                const endId = beamData.end_bracket_id === deletedBracketData.id ? recreatedBracket.id : otherBracketId;

                                // Check if the other bracket still exists (it should)
                                if (currentLayoutDataRef.brackets.some(b => b.id === otherBracketId)) {
                                    const { newBeam } = await placeCrossbeam(
                                        currentLayoutDataRef.id,
                                        { id: startId }, { id: endId },
                                        beamData.start_socket, beamData.end_socket
                                    );
                                    // Update client data & add mesh
                                    if (!currentLayoutDataRef.beams) currentLayoutDataRef.beams = [];
                                    currentLayoutDataRef.beams.push(newBeam);
                                    addBeamMesh(newBeam, sceneRef, clockRef);
                                } else {
                                    console.warn(`Undo: Could not recreate crossbeam ${beamData.id}, other bracket ${otherBracketId} missing.`);
                                }
                            }
                        }
                    }
                }
                break;

            default:
                console.warn("Unknown action type in undo stack:", actionToUndo.type);
        }
        console.log("Undo operation completed.");
    } catch (error) {
        console.error("Error during undo operation:", error);
        alert(`Undo failed: ${error.message}. Layout state might be inconsistent.`);
        // Consider fetching fresh data to resync on error
    }
}

export { initUndoManager, pushUndoAction, undoLastAction };