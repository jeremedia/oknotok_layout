// app/javascript/main.js

import { setupScene, animate as runAnimationLoop, onWindowResize } from './sceneSetup.js';
import { fetchLayoutData } from './apiClient.js';
import { renderPlotBoundary, renderBrackets, renderBeams } from './meshFactory.js';
// Import the single initializer function
import { initInteractionHandler, checkAllExistingBeamsForSquares } from './interactionInitializer.js';
import { DEFAULT_PLOT_SIZE, CAMERA_STORAGE_KEY } from './constants.js';
import * as THREE from "three";
import { addGroundBeamAndPanelVisuals } from './meshFactory.js'; // Import new function

// --- Main Initialization ---
async function main() {
    const container = document.getElementById('threejs-container');
    const layoutId = window.currentLayoutId;

    if (!layoutId || !container) { /* ... error handling ... */ return; }
    console.log(`Initializing 3D view for Layout ID: ${layoutId}`);

    // --- Instantiate Clock ---
    const clock = new THREE.Clock();

    // 1. Setup Core Scene Components
    const { scene, camera, renderer, controls, groundPlaneMesh } = setupScene(container);

    const savedStateJSON = localStorage.getItem(CAMERA_STORAGE_KEY);
    if (savedStateJSON) {
        try {
            const savedState = JSON.parse(savedStateJSON);
            if (savedState && savedState.position && savedState.target) {
                console.log("Restoring camera state:", savedState);
                camera.position.set(savedState.position.x, savedState.position.y, savedState.position.z);
                controls.target.set(savedState.target.x, savedState.target.y, savedState.target.z);
                // if (savedState.zoom) { camera.zoom = savedState.zoom; } // Restore zoom if saved
                camera.updateProjectionMatrix(); // Needed after zoom change
                controls.update(); // IMPORTANT: Update controls after changing target/position
            } else {
                console.warn("Invalid camera state found in Local Storage.");
            }
        } catch (error) {
            console.error("Error parsing saved camera state:", error);
            localStorage.removeItem(CAMERA_STORAGE_KEY); // Clear invalid data
        }
    } else {
        console.log("No saved camera state found.");
    }


    // 2. Fetch Layout Data
    let layoutData = null;
    try {
        layoutData = await fetchLayoutData(layoutId);
    } catch (error) { /* ... error handling ... */ }

    // --- NEW: Populate Metadata Inputs ---
    if (layoutData) {
        const nameInput = document.getElementById('layout-name-input');
        const widthInput = document.getElementById('plot-width-input');
        const depthInput = document.getElementById('plot-depth-input');
        if (nameInput) nameInput.value = layoutData.name || '';
        if (widthInput) widthInput.value = layoutData.plot_width || '';
        if (depthInput) depthInput.value = layoutData.plot_depth || '';
    }
    // --- End Populate ---


    // 3. Render Initial State
    if (layoutData) {
        renderPlotBoundary(layoutData.plot_width, layoutData.plot_depth, scene);
        renderBrackets(layoutData.brackets, scene, clock);
        renderBeams(layoutData.beams, scene, clock);

    } else {
        renderPlotBoundary(DEFAULT_PLOT_SIZE, DEFAULT_PLOT_SIZE, scene);
    }

    // 4. Initialize ALL Interaction Handlers & Listeners
    // Pass all necessary references
    initInteractionHandler(scene, camera, renderer, groundPlaneMesh, layoutData, controls, clock); // Pass clock

    if(layoutData) {
        checkAllExistingBeamsForSquares();
        // --- NEW: Render initial panels ---
        console.log("Checking for initial panels...");
        layoutData.beams.forEach(beamData => {
            if (beamData.has_side_panel) {
                const topBeamGroup = scene.getObjectByName(`beam_group_${beamData.id}`);
                if (topBeamGroup) {
                    addGroundBeamAndPanelVisuals(topBeamGroup, scene, clock);
                } else {
                    console.warn(`Could not find top beam group ${beamData.id} to add initial panel visuals.`);
                }
            }
        });

    }
    // 5. Start Animation Loop
    runAnimationLoop(clock); // Start the loop, passing the clock

    // 6. Setup Resize Listener
    window.addEventListener('resize', () => onWindowResize(container, camera, renderer), false);

    console.log("OKNOTOK Layout Viewer Initialized.");
}

// --- Run Main Function ---
document.addEventListener('DOMContentLoaded', main);