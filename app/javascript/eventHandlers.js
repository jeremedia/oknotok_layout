// app/javascript/eventHandlers.js
import * as THREE from 'three';
import {getMode, setMode} from './modeManager.js';
import {selectObject, getSelectedObject, clearSelectionState} from './selectionManager.js';
import {
    placeUpright,
    placeCrossbeam,
    deleteBracket,
    deleteBeam,
    updateLayoutMetadata,
    clearLayoutContents
} from './apiClient.js';
import {addBracketMesh, addBeamMesh, removeMesh, renderPlotBoundary, addShadeClothMesh} from './meshFactory.js';
import {CROSSBEAM_LENGTH, UPRIGHT_HEIGHT, DEFAULT_PLOT_SIZE, CAMERA_STORAGE_KEY} from './constants.js'; // Assuming CAMERA_STORAGE_KEY is defined here or elsewhere
import {pushUndoAction, undoLastAction} from './undoManager.js';
import {addGroundBeamAndPanelVisuals, removeGroundBeamAndPanelVisuals} from './meshFactory.js'; // Import new mesh functions
import {updateBeamFlag} from './apiClient.js'; // Import new API function

// --- State ---
let sceneRef, cameraRef, rendererRef, groundPlaneMeshRef, currentLayoutData, clockRef, controlsRef;
let isSpacebarDown = false;
let modeBeforeSpacebar = null;

// --- UI Handlers ---
async function handleUpdateMetadata() {
    if (!currentLayoutData) return;
    const nameInput = document.getElementById('layout-name-input');
    const widthInput = document.getElementById('plot-width-input');
    const depthInput = document.getElementById('plot-depth-input');
    const newName = nameInput.value;
    const newWidth = parseInt(widthInput.value, 10);
    const newDepth = parseInt(depthInput.value, 10);

    if (isNaN(newWidth) || isNaN(newDepth) || newWidth < 50 || newDepth < 50 || newWidth % 50 !== 0 || newDepth % 50 !== 0) {
        alert("Plot dimensions must be multiples of 50 and at least 50.");
        widthInput.value = currentLayoutData.plot_width || '';
        depthInput.value = currentLayoutData.plot_depth || '';
        return;
    }
    if (!newName.trim()) {
        alert("Layout name cannot be empty.");
        nameInput.value = currentLayoutData.name || '';
        return;
    }
    const metadata = {name: newName, plot_width: newWidth, plot_depth: newDepth};
    const updateButton = document.getElementById('btn-update-metadata');
    if (updateButton) updateButton.disabled = true;
    try {
        const updatedLayout = await updateLayoutMetadata(currentLayoutData.id, metadata);
        currentLayoutData.name = updatedLayout.name;
        currentLayoutData.plot_width = updatedLayout.plot_width;
        currentLayoutData.plot_depth = updatedLayout.plot_depth;
        renderPlotBoundary(currentLayoutData.plot_width, currentLayoutData.plot_depth, sceneRef);
        alert("Layout info updated successfully!");
    } catch (error) {
        console.error("Failed to update layout metadata:", error);
        alert(`Error updating layout: ${error.message}`);
        nameInput.value = currentLayoutData.name || '';
        widthInput.value = currentLayoutData.plot_width || '';
        depthInput.value = currentLayoutData.plot_depth || '';
    } finally {
        if (updateButton) updateButton.disabled = false;
    }
}

async function handleClearLayout() {
    if (!currentLayoutData) return;
    if (!window.confirm("Are you sure you want to remove ALL brackets and beams from this layout? This cannot be undone easily.")) return;
    const clearButton = document.getElementById('btn-clear-layout');
    if (clearButton) clearButton.disabled = true;
    try {
        await clearLayoutContents(currentLayoutData.id);
        currentLayoutData.brackets = [];
        currentLayoutData.beams = [];
        const objectsToRemove = [];
        sceneRef.children.forEach(child => { // Also remove shade cloths and footers visually
            if (child.isGroup && (child.userData.type === 'bracket' || child.userData.type === 'beam_group' || child.userData.type === 'footer')) {
                objectsToRemove.push(child);
            } else if (child.isMesh && child.userData.type === 'shade_cloth') {
                objectsToRemove.push(child);
            }
        });
        objectsToRemove.forEach(obj => removeMesh(obj, sceneRef));
        clearSelectionState();
        // TODO: Clear undo stack
        // pushUndoAction({ type: 'clear_layout', previousData: { brackets: [...], beams: [...] } }); // For undo if needed
        alert("Layout cleared successfully!");
    } catch (error) {
        console.error("Failed to clear layout:", error);
        alert(`Error clearing layout: ${error.message}`);
    } finally {
        if (clearButton) clearButton.disabled = false;
    }
}

function handleNewLayout() {
    if (window.confirm("Leave this page and create a new layout?")) {
        window.location.href = '/layouts'; // Adjust as needed
    }
}

// --- Helper Functions ---
function isSocketAvailable(bracketId, socketName) {
    if (!currentLayoutData || !currentLayoutData.beams) return true;
    return !currentLayoutData.beams.some(beam =>
        (beam.start_bracket_id === bracketId && beam.start_socket === socketName) ||
        (beam.end_bracket_id === bracketId && beam.end_socket === socketName)
    );
}

function getOppositeSocket(socketName) {
    switch (socketName) {
        case '+x':
            return '-x';
        case '-x':
            return '+x';
        case '+y':
            return '-y';
        case '-y':
            return '+y';
        case '+z':
            return '-z';
        case '-z':
            return '+z';
        default:
            return null;
    }
}

function calculateNewBracketPosition(startBracketGroup, socketName) {
    const startPos = startBracketGroup.position.clone();
    const offset = new THREE.Vector3();
    const distance = CROSSBEAM_LENGTH;
    switch (socketName) {
        case '+x':
            offset.x = distance;
            break;
        case '-x':
            offset.x = -distance;
            break;
        case '+z':
            offset.z = distance;
            break;
        case '-z':
            offset.z = -distance;
            break;
        default:
            return null;
    }
    return startPos.add(offset);
}

function findExistingBracketNear(targetPosition, tolerance = 0.1) {
    if (!currentLayoutData || !currentLayoutData.brackets) return null;
    for (const bracket of currentLayoutData.brackets) {
        const distance = targetPosition.distanceTo(new THREE.Vector3(bracket.x, bracket.y, bracket.z));
        if (distance < tolerance && Math.abs(targetPosition.y - bracket.y) < tolerance) {
            console.log(`Found existing bracket ${bracket.id} near target position.`);
            return bracket;
        }
    }
    return null;
}

// Inside app/javascript/eventHandlers.js

// Inside app/javascript/eventHandlers.js

function checkForCompletedSquares(triggerBeamData) {
    console.log(`Checking for squares triggered by beam: ${triggerBeamData?.id}`);
    if (!currentLayoutData || !currentLayoutData.brackets || !currentLayoutData.beams || triggerBeamData.beam_type !== 'crossbeam') {
        console.log(" -> Check aborted: Invalid data or not a crossbeam.");
        return;
    }

    const tolerance = 0.1; // Position tolerance
    const lengthTolerance = 0.5; // Length tolerance (feet) - adjust if needed
    const targetLength = CROSSBEAM_LENGTH; // Use constant
    const targetLengthSqMin = Math.pow(targetLength - lengthTolerance, 2);
    const targetLengthSqMax = Math.pow(targetLength + lengthTolerance, 2);

    const bA_id = triggerBeamData.start_bracket_id;
    const bB_id = triggerBeamData.end_bracket_id;
    const bA = currentLayoutData.brackets.find(b => b.id === bA_id);
    const bB = currentLayoutData.brackets.find(b => b.id === bB_id);

    if (!bA || !bB || Math.abs(bA.y - bB.y) > tolerance) { /* ... log abort ... */
        return;
    }

    const posA = new THREE.Vector3(bA.x, bA.y, bA.z);
    const posB = new THREE.Vector3(bB.x, bB.y, bB.z);

    const beamsFromA = currentLayoutData.beams.filter(b => b.id !== triggerBeamData.id && b.beam_type === 'crossbeam' && (b.start_bracket_id === bA_id || b.end_bracket_id === bA_id));
    const beamsFromB = currentLayoutData.beams.filter(b => b.id !== triggerBeamData.id && b.beam_type === 'crossbeam' && (b.start_bracket_id === bB_id || b.end_bracket_id === bB_id));
    // console.log(` -> Found ${beamsFromA.length} other beams from A, ${beamsFromB.length} other beams from B.`);

    for (const beamAD of beamsFromA) {
        const bD_id = (beamAD.start_bracket_id === bA_id) ? beamAD.end_bracket_id : beamAD.start_bracket_id;
        const bD = currentLayoutData.brackets.find(b => b.id === bD_id);
        // console.log(`  -> Checking path A->D via beam ${beamAD.id}. Potential D: ${bD_id}`);
        if (!bD || Math.abs(bD.y - bA.y) > tolerance) {
            // console.log(`     -> D ${bD_id} invalid (missing or wrong height).`);
            continue;
        }
        const posD = new THREE.Vector3(bD.x, bD.y, bD.z);
        const distSqAD = posA.distanceToSquared(posD);
        if (distSqAD < targetLengthSqMin || distSqAD > targetLengthSqMax) {
            // console.log(`     -> Dist AD (${Math.sqrt(distSqAD).toFixed(1)}) invalid.`);
            continue;
        }
        // console.log(`     -> D ${bD_id} is valid.`);

        for (const beamBC of beamsFromB) {
            const bC_id = (beamBC.start_bracket_id === bB_id) ? beamBC.end_bracket_id : beamBC.start_bracket_id;
            const bC = currentLayoutData.brackets.find(b => b.id === bC_id);
            // console.log(`    -> Checking path B->C via beam ${beamBC.id}. Potential C: ${bC_id}`);
            if (!bC || Math.abs(bC.y - bA.y) > tolerance) {
                // console.log(`       -> C ${bC_id} invalid (missing or wrong height).`);
                continue;
            }
            const posC = new THREE.Vector3(bC.x, bC.y, bC.z);
            const distSqBC = posB.distanceToSquared(posC);
            if (distSqBC < targetLengthSqMin || distSqBC > targetLengthSqMax) {
                // console.log(`       -> Dist BC (${Math.sqrt(distSqBC).toFixed(1)}) invalid.`);
                continue;
            }
            // console.log(`       -> C ${bC_id} is valid.`);

            // --- Corrected Logic ---
            // Now that we have valid A, B, C, D candidates, check if C and D are connected by the 4th beam.
            // Also ensure C and D are NOT the same as A or B, and C is not the same as D.
            if (bC_id === bA_id || bC_id === bB_id || bD_id === bA_id || bD_id === bB_id || bC_id === bD_id) {
                // console.log(`        -> Invalid square corners (IDs overlap: A=${bA_id}, B=${bB_id}, C=${bC_id}, D=${bD_id})`);
                continue; // Skip if corners aren't distinct
            }

            // Check distance between C and D (should be ~12ft)
            const distSqCD = posC.distanceToSquared(posD);
            // console.log(`        -> Distance squared C (${bC_id}) to D (${bD_id}): ${distSqCD.toFixed(2)}`);
            if (distSqCD < targetLengthSqMin || distSqCD > targetLengthSqMax) {
                // console.log(`        -> Dist CD invalid.`);
                continue; // C and D are not the right distance apart
            }

            // Check if the closing beam (CD or DC) exists in the data
            const beamCD = currentLayoutData.beams.find(b =>
                b.beam_type === 'crossbeam' &&
                ((b.start_bracket_id === bC_id && b.end_bracket_id === bD_id) || (b.start_bracket_id === bD_id && b.end_bracket_id === bC_id))
            );

            if (beamCD) {
                // Found a completed square!
                // console.log(`          -> SUCCESS! Found closing beam ${beamCD.id}. Adding shade cloth.`);
                addShadeClothMesh([bA_id, bB_id, bC_id, bD_id], sceneRef, clockRef);
                // collect the four bracket positions and return them as an array
                const bracketPositions = [bA, bB, bC, bD].map(b => new THREE.Vector3(b.x, b.y, b.z));
                console.log("          -> Completed square found with brackets:", bracketPositions);
                return bracketPositions; // Stop searching
            } else {
                // console.log(`          -> Closing beam between ${bC_id} and ${bD_id} not found.`);
            }
            // --- End Corrected Logic ---
        }
    }
    // console.log(` -> No completed squares found involving beam ${triggerBeamData.id}.`);
}// --- Main Click Handler ---
async function onMouseClick(event) {
    if (isSpacebarDown) return; // Ignore clicks when orbiting temporarily
    const currentAppMode = getMode();
    if (currentAppMode === 'view' || !sceneRef || !cameraRef || !rendererRef || !groundPlaneMeshRef || !currentLayoutData) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const canvasBounds = rendererRef.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    mouse.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;
    raycaster.setFromCamera(mouse, cameraRef);

    const clickableGroups = sceneRef.children.filter(obj => obj.isGroup && (obj.userData.type === 'bracket' || obj.userData.type === 'beam_group'));
    const intersects = raycaster.intersectObjects(clickableGroups, true);

    let clickedObjectGroup = null;
    let clickedSocketName = null;
    if (intersects.length > 0) {
        let intersectedMesh = intersects[0].object;
        clickedObjectGroup = intersectedMesh;
        while (clickedObjectGroup.parent && clickedObjectGroup.parent !== sceneRef) {
            clickedObjectGroup = clickedObjectGroup.parent;
        }
        if (!clickedObjectGroup.isGroup || !clickedObjectGroup.userData.type) {
            clickedObjectGroup = null;
        } else if (intersectedMesh.userData?.type === 'socket') {
            clickedSocketName = intersectedMesh.userData.socketName;
        }
    }

    if (clickedObjectGroup) {
        const clickedGroupData = clickedObjectGroup.userData;
        console.log(`Clicked Group: ${clickedGroupData.type} ${clickedGroupData.id}, Socket: ${clickedSocketName}, Mode: ${currentAppMode}`);

        if (currentAppMode === 'create') {
            if (clickedSocketName && ['+x', '-x', '+z', '-z'].includes(clickedSocketName)) {
                const startBracketGroup = clickedObjectGroup;
                const startBracketId = clickedGroupData.id;
                if (!isSocketAvailable(startBracketId, clickedSocketName)) {
                    alert(`Socket ${clickedSocketName} occupied.`);
                    return;
                }
                const targetPos = calculateNewBracketPosition(startBracketGroup, clickedSocketName);
                if (!targetPos) {
                    alert("Invalid socket direction.");
                    return;
                }
                const existingBracketData = findExistingBracketNear(targetPos);
                clearSelectionState();
                if (existingBracketData) {
                    const endBracketId = existingBracketData.id;
                    const endSocketName = getOppositeSocket(clickedSocketName);
                    console.log(`Connecting to existing bracket ${endBracketId}.`);
                    if (!isSocketAvailable(endBracketId, endSocketName)) {
                        alert(`Opposite socket ${endSocketName} on bracket ${endBracketId} occupied.`);
                        return;
                    }
                    try {
                        const {newBeam: newCrossbeam} = await placeCrossbeam(currentLayoutData.id, {id: startBracketId}, {id: endBracketId}, clickedSocketName, endSocketName);
                        if (!currentLayoutData.beams) currentLayoutData.beams = [];
                        currentLayoutData.beams.push(newCrossbeam);
                        addBeamMesh(newCrossbeam, sceneRef, clockRef);
                        pushUndoAction({type: 'create_crossbeam', created: {beamId: newCrossbeam.id}});
                        checkForCompletedSquares(newCrossbeam);
                    } catch (error) {
                        console.error("Failed connection:", error);
                        alert(`Error: ${error.message}`);
                    }
                } else {
                    console.log(`Creating new structure from socket.`);
                    const plotW = currentLayoutData?.plot_width || DEFAULT_PLOT_SIZE;
                    const plotD = currentLayoutData?.plot_depth || DEFAULT_PLOT_SIZE;
                    const halfW = plotW / 2;
                    const halfD = plotD / 2;
                    if (targetPos.x < -halfW || targetPos.x > halfW || targetPos.z < -halfD || targetPos.z > halfD) {
                        alert("New bracket outside boundary.");
                        return;
                    }
                    try {
                        const {
                            newBracket,
                            newBeam: newUprightBeam
                        } = await placeUpright(currentLayoutData.id, targetPos.x, targetPos.z);
                        const endSocketName = getOppositeSocket(clickedSocketName);
                        const {newBeam: newCrossbeam} = await placeCrossbeam(currentLayoutData.id, {id: startBracketId}, {id: newBracket.id}, clickedSocketName, endSocketName);
                        if (!currentLayoutData.brackets) currentLayoutData.brackets = [];
                        if (!currentLayoutData.beams) currentLayoutData.beams = [];
                        currentLayoutData.brackets.push(newBracket);
                        currentLayoutData.beams.push(newUprightBeam);
                        currentLayoutData.beams.push(newCrossbeam);
                        addBracketMesh(newBracket, sceneRef, clockRef);
                        addBeamMesh(newUprightBeam, sceneRef, clockRef);
                        addBeamMesh(newCrossbeam, sceneRef, clockRef);
                        pushUndoAction({
                            type: 'create_structure_from_socket',
                            created: {
                                newBracketId: newBracket.id,
                                uprightBeamId: newUprightBeam.id,
                                crossbeamId: newCrossbeam.id
                            }
                        });
                        checkForCompletedSquares(newCrossbeam);
                    } catch (error) {
                        console.error("Auto-creation failed:", error);
                        alert(`Error: ${error.message}`);
                    }
                }
            } else if (clickedGroupData.type === 'beam_group' && clickedGroupData.beamType === 'crossbeam' && !clickedGroupData.isPositioned) {
                // --- Clicked a Crossbeam (connected to brackets) ---
                console.log(`Clicked crossbeam ${clickedGroupData.id}. Checking for panel creation.`);
                const topBeamGroup = clickedObjectGroup;
                const topBeamId = clickedGroupData.id;
                const topBeamData = currentLayoutData.beams.find(b => b.id === topBeamId);

                if (!topBeamData) {
                    console.error("Cannot find data for clicked beam.");
                    return;
                }
                if (topBeamData.has_side_panel) {
                    alert("Panel already exists for this beam.");
                    return;
                }

                // --- Simplified Checks (Needs Improvement) ---
                // 1. Is it part of a square? (Assume yes for now if clickable)
                // 2. Are outward sockets available? (Assume yes for now)
                // TODO: Add more robust checks here based on square completion and socket availability


                console.warn("Panel creation checks are simplified.");

                // --- Update Flag via API ---
                clearSelectionState();
                try {
                    const updatedBeam = await updateBeamFlag(topBeamId, {has_side_panel: true});
                    // Update client data
                    const beamIndex = currentLayoutData.beams.findIndex(b => b.id === topBeamId);
                    if (beamIndex > -1) currentLayoutData.beams[beamIndex].has_side_panel = true;
                    // Add visuals
                    const squareBracketPositions = checkForCompletedSquares(topBeamData);
                    addGroundBeamAndPanelVisuals(topBeamGroup, sceneRef, clockRef, squareBracketPositions);
                    // TODO: Add Undo Action
                    // pushUndoAction({ type: 'add_panel', beamId: topBeamId });
                } catch (error) {
                    console.error("Failed to add panel:", error);
                    alert(`Error adding panel: ${error.message}`);
                }

            } else { /* Clicked bracket center or upright */
                clearSelectionState();
            }
        } else if (currentAppMode === 'delete') {
            selectObject(clickedObjectGroup, currentAppMode); // Select group for deletion
        }
    } else { // Clicked empty space or ground
        if (currentAppMode === 'create') {
            const groundIntersects = raycaster.intersectObjects([groundPlaneMeshRef]);
            if (groundIntersects.length > 0) {
                const intersectionPoint = groundIntersects[0].point;
                const plotW = currentLayoutData?.plot_width || DEFAULT_PLOT_SIZE;
                const plotD = currentLayoutData?.plot_depth || DEFAULT_PLOT_SIZE;
                const halfW = plotW / 2;
                const halfD = plotD / 2;
                if (intersectionPoint.x >= -halfW && intersectionPoint.x <= halfW && intersectionPoint.z >= -halfD && intersectionPoint.z <= halfD) {
                    const targetX = Math.round(intersectionPoint.x);
                    const targetZ = Math.round(intersectionPoint.z);
                    clearSelectionState();
                    try {
                        const {newBracket, newBeam} = await placeUpright(currentLayoutData.id, targetX, targetZ);
                        if (!currentLayoutData.brackets) currentLayoutData.brackets = [];
                        if (!currentLayoutData.beams) currentLayoutData.beams = [];
                        currentLayoutData.brackets.push(newBracket);
                        currentLayoutData.beams.push(newBeam);
                        addBracketMesh(newBracket, sceneRef, clockRef);
                        addBeamMesh(newBeam, sceneRef, clockRef);
                        pushUndoAction({
                            type: 'create_upright',
                            created: {bracketId: newBracket.id, beamId: newBeam.id}
                        });
                    } catch (error) {
                        console.error("Failed upright:", error);
                        alert(`Error: ${error.message}`);
                    }
                } else {
                    console.log("Ground click outside boundary.");
                    clearSelectionState();
                }
            } else {
                clearSelectionState();
            }
        } else {
            clearSelectionState();
        }
    }
} // --- End of onMouseClick ---


// --- Keyboard Handler ---
async function onActionKeysDown(event) {
    // --- Undo ---
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        console.log("Undo triggered.");
        await undoLastAction();
        return;
    }
    // --- Escape ---
    if (event.key === 'Escape') {
        event.preventDefault();
        console.log("Escape pressed, clearing selection state.");
        clearSelectionState();
        return;
    }

    // --- Delete ---
    const currentAppMode = getMode();
    const objectToDelete = getSelectedObject();
    if (currentAppMode !== 'delete' || !objectToDelete || !(event.key === 'Delete' || event.key === 'Backspace')) {
        return;
    }
    event.preventDefault();

    console.log(`Delete key pressed. Object to delete: ${objectToDelete.name}...`);
    const objectType = objectToDelete.userData.type; // 'bracket' or 'beam_group'
    const objectId = objectToDelete.userData.id;

    // --- Gather Data & Find Associated Items for Removal/Undo ---
    let undoAction = {type: `delete_${objectType === 'bracket' ? 'bracket_with_cascade' : 'beam'}`};
    let itemsToRemove = { // Store groups/meshes to remove visually
        beams: [], footers: [], shadeCloths: []
    };
    let beamIdsToRemoveFromData = []; // Store IDs for client data update

    if (objectType === 'bracket') {
        const bracketData = currentLayoutData.brackets.find(b => b.id === objectId);
        if (!bracketData) {
            console.error("Cannot find bracket data for undo.");
            return;
        }
        undoAction.deleted = {bracketData: {...bracketData}, beamsData: []};

        sceneRef.children.forEach(childGroup => {
            if (childGroup.isGroup && childGroup.userData.type === 'beam_group') {
                const beamMesh = childGroup.children.find(c => c.userData.type === 'beam');
                if (beamMesh && (beamMesh.userData.start_bracket_id === objectId || beamMesh.userData.end_bracket_id === objectId)) {
                    itemsToRemove.beams.push(childGroup);
                    beamIdsToRemoveFromData.push(childGroup.userData.id);
                    const beamData = currentLayoutData.beams.find(b => b.id === childGroup.userData.id);
                    if (beamData) undoAction.deleted.beamsData.push({...beamData});
                    if (childGroup.userData.isGrounded) {
                        const footer = sceneRef.getObjectByName(`footer_group_${childGroup.userData.id}`);
                        if (footer) itemsToRemove.footers.push(footer);
                    }
                }
            }
        });
        sceneRef.children.forEach(child => { // Find associated shade cloths
            if (child.isMesh && child.userData.type === 'shade_cloth' && child.userData.bracketIds?.includes(objectId)) {
                itemsToRemove.shadeCloths.push(child);
                // TODO: Add shade cloth info to undoAction if needed
            }
        });

    } else if (objectType === 'beam_group') {
        const beamData = currentLayoutData.beams.find(b => b.id === objectId);
        if (!beamData) {
            console.error("Cannot find beam data for undo.");
            return;
        }
        beamIdsToRemoveFromData.push(objectId);
        if (objectToDelete.userData.isGrounded) {
            undoAction.type = 'delete_upright';
            const bracketData = currentLayoutData.brackets.find(b => b.id === beamData.start_bracket_id);
            if (!bracketData) {
                console.error("Cannot find bracket data for upright undo.");
                return;
            }
            undoAction.deleted = {beamData: {...beamData}, bracketData: {...bracketData}};
            const footer = sceneRef.getObjectByName(`footer_group_${objectId}`);
            if (footer) itemsToRemove.footers.push(footer);
        } else { // It's a crossbeam
            undoAction.deleted = {beamData: {...beamData}};
            // Find associated shade cloths
            const beamMesh = objectToDelete.children.find(c => c.userData.type === 'beam');
            if (beamMesh) {
                const startBracketId = beamMesh.userData.start_bracket_id;
                const endBracketId = beamMesh.userData.end_bracket_id;
                sceneRef.children.forEach(child => {
                    if (child.isMesh && child.userData.type === 'shade_cloth') {
                        if (child.userData.bracketIds?.includes(startBracketId) && child.userData.bracketIds?.includes(endBracketId)) {
                            itemsToRemove.shadeCloths.push(child);
                            // TODO: Add shade cloth info to undoAction if needed
                        }
                    }
                });
            }
        }
    }
    // --- End Data Gathering ---

    const groupToRemove = objectToDelete;
    clearSelectionState(); // Clear state *before* async call

    try {
        // --- Call API ---
        if (objectType === 'bracket') {
            await deleteBracket(objectId);
        } else if (objectType === 'beam_group') {
            await deleteBeam(objectId);
        }

        // --- Push Undo Action AFTER successful API call ---
        pushUndoAction(undoAction);

        // --- Update Client-Side Data State ---
        if (currentLayoutData && currentLayoutData.beams) {
            currentLayoutData.beams = currentLayoutData.beams.filter(beam => !beamIdsToRemoveFromData.includes(beam.id));
        }
        if (objectType === 'bracket' && currentLayoutData && currentLayoutData.brackets) {
            currentLayoutData.brackets = currentLayoutData.brackets.filter(bracket => bracket.id !== objectId);
        }

        // --- Remove Meshes from Scene ---
        itemsToRemove.beams.forEach(group => removeMesh(group, sceneRef));
        itemsToRemove.footers.forEach(group => removeMesh(group, sceneRef));
        itemsToRemove.shadeCloths.forEach(mesh => removeMesh(mesh, sceneRef)); // Remove shade cloths
        removeMesh(groupToRemove, sceneRef); // Remove the main selected group

        console.log(`${objectType} ${objectId} deleted successfully.`);

    } catch (error) {
        console.error(`Failed to delete ${objectType} ${objectId}:`, error);
        alert(`Error deleting ${objectType}: ${error.message}`);
    }
} // --- End of onActionKeysDown ---


// --- Spacebar Handlers ---
function onSpacebarDown(event) {
    if (event.code !== 'Space' || isSpacebarDown || getMode() === 'view') return;
    event.preventDefault();
    isSpacebarDown = true;
    modeBeforeSpacebar = getMode();
    if (controlsRef) controlsRef.enabled = true;
    const container = document.getElementById('threejs-container');
    if (container) container.style.cursor = 'grab';
    console.log("Spacebar down: Orbit enabled temporarily.");
}

function onSpacebarUp(event) {
    if (event.code !== 'Space' || !isSpacebarDown) return;
    event.preventDefault();
    isSpacebarDown = false;
    if (controlsRef && modeBeforeSpacebar && modeBeforeSpacebar !== 'view') {
        controlsRef.enabled = false;
    } else if (controlsRef) {
        controlsRef.enabled = true;
    } // Ensure enabled if in view mode
    const currentAppMode = getMode();
    const container = document.getElementById('threejs-container');
    if (container) { /* ... restore cursor ... */
    }
    modeBeforeSpacebar = null;
    console.log("Spacebar up: Orbit controls reverted.");
}

function resetSpacebarOverride() {
    isSpacebarDown = false;
    modeBeforeSpacebar = null;
    console.log("Spacebar override state reset.");
}

// --- Save Camera State ---
function saveCameraState() {
    if (!cameraRef || !controlsRef) return;
    try {
        const cameraState = {position: cameraRef.position.clone(), target: controlsRef.target.clone()};
        localStorage.setItem(CAMERA_STORAGE_KEY, JSON.stringify(cameraState));
    } catch (error) {
        console.error("Error saving camera state:", error);
    }
}

// --- Set References ---
function setHandlerReferences(scene, camera, renderer, groundPlane, layoutData, clock, orbitControls) {
    sceneRef = scene;
    cameraRef = camera;
    rendererRef = renderer;
    groundPlaneMeshRef = groundPlane;
    currentLayoutData = layoutData;
    clockRef = clock;
    controlsRef = orbitControls;
}

function checkAllExistingBeamsForSquares() {
    console.log("Checking all initially loaded beams for completed squares...");
    if (!currentLayoutData || !currentLayoutData.beams) {
        console.log(" -> No beams data available for initial check.");
        return;
    }
    // Avoid duplicate checks by checking if cloth exists before adding
    // The addShadeClothMesh function already does this with getObjectByName

    let squaresFound = 0;
    currentLayoutData.beams.forEach(beam => {
        if (beam.beam_type === 'crossbeam') {
            // Call the existing check function for each crossbeam
            // It returns early if a square is found involving that beam,
            // preventing redundant checks for the same square from different trigger beams.
            // We rely on addShadeClothMesh checking existence internally.
            checkForCompletedSquares(beam);
            // Note: A more optimized approach might store found squares, but this works.
        }
    });
    console.log("Initial square check complete."); // Log completion
}

// --- Exports ---
export {
    onMouseClick, onActionKeysDown, onSpacebarDown, onSpacebarUp,
    setHandlerReferences, resetSpacebarOverride, saveCameraState,
    handleUpdateMetadata, handleClearLayout, handleNewLayout,
    checkAllExistingBeamsForSquares, checkForCompletedSquares
};