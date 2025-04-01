// app/javascript/interactionInitializer.js

// Import initializers and handlers
import { initModeManager } from './modeManager.js';
import * as selectionManager from './selectionManager.js';
import { initDebugCursor } from './debugCursor.js';
import { initUndoManager, undoLastAction } from './undoManager.js'; // Import undo manager
import {
    onMouseClick,
    onActionKeysDown, // Use renamed handler
    onSpacebarDown,
    onSpacebarUp,
    setHandlerReferences,
    resetSpacebarOverride,
    saveCameraState
} from './eventHandlers.js';
import { handleUpdateMetadata, handleClearLayout, handleNewLayout, checkAllExistingBeamsForSquares } from './eventHandlers.js';

// Create an object to pass event handler functions/state if needed by modeManager
const eventHandlersModuleRef = {
    resetSpacebarOverride: resetSpacebarOverride
};


function initInteractionHandler(scene, camera, renderer, groundPlane, layoutDataObj, orbitControls, clock) { // Added clock back if needed by other parts
    console.log("Initializing all interaction modules.");

    // 1. Initialize Mode Manager (pass controls, selection manager, AND event handler ref)
    initModeManager('view', orbitControls, selectionManager, eventHandlersModuleRef);

    // 2. Initialize Debug Cursor
    initDebugCursor(scene, camera, renderer, groundPlane);

    // 3. Set References for Event Handlers (pass controls ref now)
    setHandlerReferences(scene, camera, renderer, groundPlane, layoutDataObj, clock, orbitControls);

    initUndoManager(scene, layoutDataObj, clock); // Pass mutable layoutDataObj


    // 4. Add Core Event Listeners
    renderer.domElement.addEventListener('click', onMouseClick, false);
    // Use separate listeners for different key purposes
    window.addEventListener('keydown', onSpacebarDown, false); // Handles spacebar press
    window.addEventListener('keyup', onSpacebarUp, false);     // Handles spacebar release
    window.addEventListener('keydown', onActionKeysDown, false); // Handles Delete, Backspace, Escape

    window.addEventListener('beforeunload', saveCameraState, false);

    // --- NEW: Add listeners for UI buttons ---
    document.getElementById('btn-update-metadata')?.addEventListener('click', handleUpdateMetadata);
    document.getElementById('btn-clear-layout')?.addEventListener('click', handleClearLayout);
    document.getElementById('btn-new-layout')?.addEventListener('click', handleNewLayout);
    document.getElementById('btn-undo')?.addEventListener('click', undoLastAction); // Attach undo handler
    // --- End NEW ---


    console.log("Interaction handler initialization complete.");
}

export { initInteractionHandler, checkAllExistingBeamsForSquares };
