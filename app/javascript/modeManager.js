// app/javascript/modeManager.js

let appMode = 'view';
let controlsRef = null;
let selectionManager = null;
// Add reference to eventHandlers state if needed, or handle reset directly
let eventHandlersRef = null; // We'll set this

function setMode(newMode) {
    if (appMode === newMode || !['view', 'create', 'delete'].includes(newMode)) return;

    console.log(`Changing mode from ${appMode} to ${newMode}`);

    // --- Reset temporary states ---
    if (selectionManager) {
        selectionManager.clearSelectionState();
    }
    // Reset spacebar override state if eventHandlersRef is set
    if (eventHandlersRef && eventHandlersRef.resetSpacebarOverride) {
        eventHandlersRef.resetSpacebarOverride();
    }
    // --- End reset ---

    appMode = newMode;

    // ... (Update button visuals - keep as before) ...
    document.querySelectorAll('.mode-button').forEach(btn => btn.classList.remove('active'));
    const activeButton = document.getElementById(`btn-mode-${newMode}`);
    if (activeButton) activeButton.classList.add('active');


    // Enable/Disable OrbitControls based on the *explicitly set* mode
    if (controlsRef) {
        controlsRef.enabled = (appMode === 'view');
        console.log(`OrbitControls explicitly set to: ${controlsRef.enabled} for mode ${appMode}`);
    }

    // Update cursor style
    const container = document.getElementById('threejs-container');
    if (container) {
        if (appMode === 'create') container.style.cursor = 'crosshair';
        else if (appMode === 'delete') container.style.cursor = 'not-allowed';
        else container.style.cursor = 'grab'; // Default for view/orbiting
    }
}

function getMode() {
    return appMode;
}

// Accept eventHandlers module reference
function initModeManager(initialMode = 'view', orbitControls, selManager, evtHandlers) {
    controlsRef = orbitControls;
    selectionManager = selManager;
    eventHandlersRef = evtHandlers; // Store reference
    // ... (Add button listeners - keep as before) ...
    document.getElementById('btn-mode-view')?.addEventListener('click', () => setMode('view'));
    document.getElementById('btn-mode-create')?.addEventListener('click', () => setMode('create'));
    document.getElementById('btn-mode-delete')?.addEventListener('click', () => setMode('delete'));

    setMode(initialMode); // Set initial mode
    console.log("Mode Manager Initialized.");
}

// Export the module reference object if needed by setMode
export { initModeManager, setMode, getMode };