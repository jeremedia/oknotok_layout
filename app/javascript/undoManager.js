// app/javascript/undoManager.js

// --- Imports ---
// We need access to API functions, mesh functions, scene, data, clock etc.
// These will be passed during initialization.
import { placeUpright, placeCrossbeam, deleteBracket, deleteBeam } from './apiClient.js';
import { addBracketMesh, addBeamMesh, removeMesh } from './meshFactory.js';
import { MAX_UNDO_STEPS } from './constants.js';
import toast from './toast.js';

// --- State ---
const undoStack = [];
const redoStack = [];
let sceneRef, currentLayoutDataRef, clockRef; // References to shared objects

// --- Initialization ---
function initUndoManager(scene, layoutData, clock) {
    sceneRef = scene;
    currentLayoutDataRef = layoutData; // Reference to the mutable layout data object
    clockRef = clock;
    console.log('Undo Manager Initialized.');
}

// --- Action Recording ---
function pushUndoAction(action) {
    if (!action || !action.type) {
        console.error('Invalid action pushed to undo stack:', action);
        return;
    }
    undoStack.push(action);
    // Limit stack size
    if (undoStack.length > MAX_UNDO_STEPS) {
        undoStack.shift(); // Remove the oldest action
    }
    // Clear redo stack when new action is performed
    redoStack.length = 0;
    console.log('Action pushed to undo stack:', action.type, action);
    updateUndoRedoButtons();
}

// --- Undo Logic ---
async function undoLastAction() {
    if (undoStack.length === 0) {
        console.log('Undo stack empty.');
        // TODO: Update UI to disable Undo button
        return;
    }

    const actionToUndo = undoStack.pop();
    console.log('Undoing action:', actionToUndo.type, actionToUndo);
    // TODO: Update UI (disable undo if stack becomes empty)

    try {
        switch (actionToUndo.type) {
            case 'create_upright': {
                // Undo: Delete the created bracket and beam
                if (actionToUndo.created?.beamId) {await deleteBeam(actionToUndo.created.beamId);}
                if (actionToUndo.created?.bracketId) {await deleteBracket(actionToUndo.created.bracketId);}
                // Remove meshes (cascade should be handled by deleteBracket)
                const bracketGroup = sceneRef.getObjectByName(`bracket_group_${actionToUndo.created?.bracketId}`);
                if (bracketGroup) {removeMesh(bracketGroup, sceneRef);} // removeMesh handles cascade visuals
                // Footer is removed by beam cascade visual removal
                break;
            }

            case 'create_crossbeam': {
                // Undo: Delete the created crossbeam
                if (actionToUndo.created?.beamId) {await deleteBeam(actionToUndo.created.beamId);}
                const beamGroup = sceneRef.getObjectByName(`beam_group_${actionToUndo.created?.beamId}`);
                if (beamGroup) {removeMesh(beamGroup, sceneRef);}
                break;
            }

            case 'create_structure_from_socket': {
                // Undo: Delete the crossbeam, the new upright, and the new bracket
                if (actionToUndo.created?.crossbeamId) {await deleteBeam(actionToUndo.created.crossbeamId);}
                if (actionToUndo.created?.uprightBeamId) {await deleteBeam(actionToUndo.created.uprightBeamId);}
                if (actionToUndo.created?.newBracketId) {await deleteBracket(actionToUndo.created.newBracketId);}
                // Remove meshes
                const crossbeamGroup = sceneRef.getObjectByName(`beam_group_${actionToUndo.created?.crossbeamId}`);
                if (crossbeamGroup) {removeMesh(crossbeamGroup, sceneRef);}
                const newBracketGroup = sceneRef.getObjectByName(`bracket_group_${actionToUndo.created?.newBracketId}`);
                if (newBracketGroup) {removeMesh(newBracketGroup, sceneRef);} // Handles cascade visuals
                break;
            }

            case 'delete_beam': {
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
                    if (!currentLayoutDataRef.beams) {currentLayoutDataRef.beams = [];}
                    currentLayoutDataRef.beams.push(newBeam);
                    addBeamMesh(newBeam, sceneRef, clockRef);
                }
                break;
            }

            case 'delete_upright': { // Specific type for upright deletion
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
                    if (!currentLayoutDataRef.brackets) {currentLayoutDataRef.brackets = [];}
                    if (!currentLayoutDataRef.beams) {currentLayoutDataRef.beams = [];}
                    currentLayoutDataRef.brackets.push(newBracket);
                    currentLayoutDataRef.beams.push(newBeam);
                    addBracketMesh(newBracket, sceneRef, clockRef);
                    addBeamMesh(newBeam, sceneRef, clockRef);
                }
                break;
            }

            case 'delete_bracket_with_cascade': {
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
                        if (!currentLayoutDataRef.brackets) {currentLayoutDataRef.brackets = [];}
                        if (!currentLayoutDataRef.beams) {currentLayoutDataRef.beams = [];}
                        currentLayoutDataRef.brackets.push(newBracket);
                        currentLayoutDataRef.beams.push(newBeam);
                        addBracketMesh(newBracket, sceneRef, clockRef);
                        addBeamMesh(newBeam, sceneRef, clockRef);
                    } else {
                        // If bracket had no upright (e.g., floating connection - less likely),
                        // we might need a way to just create a bracket via API?
                        // For now, assume brackets are always created via placeUpright for undo simplicity.
                        console.warn('Undo for bracket without upright not fully implemented.');
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
                                    if (!currentLayoutDataRef.beams) {currentLayoutDataRef.beams = [];}
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
            }

            default:
                console.warn('Unknown action type in undo stack:', actionToUndo.type);
        }
        console.log('Undo operation completed.');
        // Push undone action to redo stack
        redoStack.push(actionToUndo);
        updateUndoRedoButtons();
    } catch (error) {
        console.error('Error during undo operation:', error);
        toast.error(`Undo failed: ${error.message}. Layout state might be inconsistent.`, 6000);
        // Consider fetching fresh data to resync on error
    }
}

// --- Redo Logic ---
async function redoLastAction() {
    if (redoStack.length === 0) {
        console.log('Redo stack empty.');
        return;
    }

    const actionToRedo = redoStack.pop();
    console.log('Redoing action:', actionToRedo.type, actionToRedo);

    try {
        switch (actionToRedo.type) {
            case 'create_upright':
                // Redo: Recreate the upright at the same position
                if (actionToRedo.created?.position) {
                    const { newBracket, newBeam } = await placeUpright(
                        currentLayoutDataRef.id,
                        actionToRedo.created.position.x,
                        actionToRedo.created.position.z
                    );
                    // Update client data and add meshes
                    if (!currentLayoutDataRef.brackets) {currentLayoutDataRef.brackets = [];}
                    if (!currentLayoutDataRef.beams) {currentLayoutDataRef.beams = [];}
                    currentLayoutDataRef.brackets.push(newBracket);
                    currentLayoutDataRef.beams.push(newBeam);
                    addBracketMesh(newBracket, sceneRef, clockRef);
                    addBeamMesh(newBeam, sceneRef, clockRef);
                    // Push to undo stack with new IDs
                    undoStack.push({
                        type: 'create_upright',
                        created: { bracketId: newBracket.id, beamId: newBeam.id, position: actionToRedo.created.position }
                    });
                }
                break;

            case 'create_crossbeam':
                // Redo: Recreate the crossbeam between the same brackets
                if (actionToRedo.created) {
                    const { newBeam } = await placeCrossbeam(
                        currentLayoutDataRef.id,
                        { id: actionToRedo.created.startBracketId },
                        { id: actionToRedo.created.endBracketId },
                        actionToRedo.created.startSocket,
                        actionToRedo.created.endSocket
                    );
                    // Update client data and add mesh
                    if (!currentLayoutDataRef.beams) {currentLayoutDataRef.beams = [];}
                    currentLayoutDataRef.beams.push(newBeam);
                    addBeamMesh(newBeam, sceneRef, clockRef);
                    // Push to undo stack with new ID
                    undoStack.push({
                        type: 'create_crossbeam',
                        created: {
                            beamId: newBeam.id,
                            startBracketId: actionToRedo.created.startBracketId,
                            endBracketId: actionToRedo.created.endBracketId,
                            startSocket: actionToRedo.created.startSocket,
                            endSocket: actionToRedo.created.endSocket
                        }
                    });
                }
                break;

            case 'create_structure_from_socket':
                // Redo: Recreate the entire structure
                if (actionToRedo.created) {
                    // First create the new bracket/upright
                    const { newBracket, newBeam: newUpright } = await placeUpright(
                        currentLayoutDataRef.id,
                        actionToRedo.created.position.x,
                        actionToRedo.created.position.z
                    );
                    // Then create the crossbeam
                    const { newBeam: newCrossbeam } = await placeCrossbeam(
                        currentLayoutDataRef.id,
                        { id: actionToRedo.created.startBracketId },
                        { id: newBracket.id },
                        actionToRedo.created.startSocket,
                        actionToRedo.created.endSocket
                    );
                    // Update client data and add meshes
                    if (!currentLayoutDataRef.brackets) {currentLayoutDataRef.brackets = [];}
                    if (!currentLayoutDataRef.beams) {currentLayoutDataRef.beams = [];}
                    currentLayoutDataRef.brackets.push(newBracket);
                    currentLayoutDataRef.beams.push(newUpright);
                    currentLayoutDataRef.beams.push(newCrossbeam);
                    addBracketMesh(newBracket, sceneRef, clockRef);
                    addBeamMesh(newUpright, sceneRef, clockRef);
                    addBeamMesh(newCrossbeam, sceneRef, clockRef);
                    // Push to undo stack with new IDs
                    undoStack.push({
                        type: 'create_structure_from_socket',
                        created: {
                            newBracketId: newBracket.id,
                            uprightBeamId: newUpright.id,
                            crossbeamId: newCrossbeam.id,
                            startBracketId: actionToRedo.created.startBracketId,
                            startSocket: actionToRedo.created.startSocket,
                            endSocket: actionToRedo.created.endSocket,
                            position: actionToRedo.created.position
                        }
                    });
                }
                break;

            case 'delete_beam':
            case 'delete_upright':
            case 'delete_bracket_with_cascade':
                // Redo deletion: Delete the recreated items
                if (actionToRedo.type === 'delete_beam' && actionToRedo.deleted?.beamData) {
                    // Find and delete the recreated beam
                    const beamToDelete = currentLayoutDataRef.beams.find(b =>
                        b.start_bracket_id === actionToRedo.deleted.beamData.start_bracket_id &&
                        b.end_bracket_id === actionToRedo.deleted.beamData.end_bracket_id
                    );
                    if (beamToDelete) {
                        await deleteBeam(beamToDelete.id);
                        const beamGroup = sceneRef.getObjectByName(`beam_group_${beamToDelete.id}`);
                        if (beamGroup) {removeMesh(beamGroup, sceneRef);}
                        undoStack.push({ type: 'delete_beam', deleted: { beamData: actionToRedo.deleted.beamData } });
                    }
                }
                // Similar logic for other delete types - simplified for now
                break;

            default:
                console.warn('Unknown action type in redo stack:', actionToRedo.type);
        }
        console.log('Redo operation completed.');
        updateUndoRedoButtons();
    } catch (error) {
        console.error('Error during redo operation:', error);
        toast.error(`Redo failed: ${error.message}. Layout state might be inconsistent.`, 6000);
    }
}

// --- UI Update Helper ---
function updateUndoRedoButtons() {
    const undoButton = document.getElementById('btn-undo');
    const redoButton = document.getElementById('btn-redo');

    if (undoButton) {
        undoButton.disabled = undoStack.length === 0;
    }
    if (redoButton) {
        redoButton.disabled = redoStack.length === 0;
    }
}

export { initUndoManager, pushUndoAction, undoLastAction, redoLastAction };
