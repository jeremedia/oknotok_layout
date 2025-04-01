// app/javascript/selectionManager.js
import * as THREE from 'three';
import { COLOR_SELECTION } from './constants.js';

let selectedObjectGroup = null;
let firstBracketForConnection = null; // Still needed for create mode logic
let originalChildMaterials = new Map(); // Store original material UUID -> Material for children

const selectionMaterial = new THREE.MeshStandardMaterial({ color: COLOR_SELECTION });

function clearSelectionState() {
    if (selectedObjectGroup) {
        console.log(`Clearing selection for ${selectedObjectGroup.name}`);
        selectedObjectGroup.traverse((child) => {
            if (child.isMesh) {
                const originalMat = originalChildMaterials.get(child.uuid);
                if (originalMat) {
                    child.material = originalMat;
                    // console.log(`Restored material for ${child.name}`);
                } else {
                    // Attempt fallback using userData if map failed (shouldn't happen often)
                    if (child.userData.originalMaterialRef) {
                        child.material = child.userData.originalMaterialRef;
                        console.warn(`Restored material using userData ref for ${child.name}`);
                    } else {
                        console.error(`Cannot find original material to restore for mesh: ${child.name}`);
                    }
                }
            }
        });
        originalChildMaterials.clear(); // Clear the map
    } else {
        // console.log("Clear selection called but nothing was selected.");
    }
    selectedObjectGroup = null;
    firstBracketForConnection = null;
    // console.log("Selection state cleared."); // Reduce noise maybe
}

function selectObject(objectGroup, currentAppMode) {
    if (!objectGroup || !objectGroup.isGroup) return false;

    // If clicking the already selected object, deselect it and return
    if (selectedObjectGroup === objectGroup) {
        console.log(`Deselecting ${objectGroup.userData.type} ${objectGroup.userData.id}`);
        clearSelectionState();
        return false; // Indicate deselection occurred
    }

    // Clear previous selection *before* selecting new
    if (selectedObjectGroup) {
        clearSelectionState();
    }

    console.log(`Attempting to select ${objectGroup.userData.type} ${objectGroup.userData.id}`);
    selectedObjectGroup = objectGroup; // Set the new selection *now*

    // Apply selection material and store originals
    let highlightApplied = false;
    selectedObjectGroup.traverse((child) => {
        if (child.isMesh) {
            // Store original before changing
            originalChildMaterials.set(child.uuid, child.material);
            child.material = selectionMaterial;
            highlightApplied = true;
            // console.log(`Applied selection material to ${child.name}`);
        }
    });

    if (!highlightApplied) {
        console.warn("Selected group had no child meshes to highlight:", selectedObjectGroup.name);
    }

    console.log(`Selected ${objectGroup.userData.type} ${objectGroup.userData.id}`);

    // Update connection state if needed
    if (currentAppMode === 'create' && objectGroup.userData.type === 'bracket') {
        firstBracketForConnection = objectGroup;
        console.log("Ready to connect from this bracket.");
    } else {
        firstBracketForConnection = null; // Ensure this is cleared if selecting a beam or in delete mode
    }
    return true; // Indicate successful selection
}

function getSelectedObject() {
    return selectedObjectGroup;
}

function getFirstBracketForConnection() {
    return firstBracketForConnection;
}

export {
    clearSelectionState,
    selectObject,
    getSelectedObject,
    getFirstBracketForConnection
};