// app/javascript/sceneSetup.js

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
    COLOR_BACKGROUND,
    INITIAL_SCALE,
    FINAL_SCALE,
    CAMERA_FOV,
    CAMERA_NEAR_CLIP,
    CAMERA_FAR_CLIP,
    CAMERA_START_X,
    CAMERA_START_Y,
    CAMERA_START_Z,
    AMBIENT_LIGHT_INTENSITY,
    DIRECTIONAL_LIGHT_INTENSITY
} from './constants.js';

let scene, camera, renderer, controls, groundPlaneMesh;
const clock = new THREE.Clock(); // Instantiate clock globally or near animate

// Rendering optimization state
let needsRender = true; // Start with true to render initial frame
let animationFrameId = null;

function setupScene(container) {
    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(COLOR_BACKGROUND);

    // 2. Camera
    camera = new THREE.PerspectiveCamera(
        CAMERA_FOV, // Field of View (degrees)
        container.clientWidth / container.clientHeight, // Aspect Ratio
        CAMERA_NEAR_CLIP, // Near clipping plane
        CAMERA_FAR_CLIP // Far clipping plane (increased)
    );
    camera.position.set(CAMERA_START_X, CAMERA_START_Y, CAMERA_START_Z); // Start position

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement); // Add canvas to the container div

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, AMBIENT_LIGHT_INTENSITY); // Soft white light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, DIRECTIONAL_LIGHT_INTENSITY);
    directionalLight.position.set(50, 100, 75); // Adjust light position
    directionalLight.castShadow = false; // Optional: shadows add performance cost
    scene.add(directionalLight);

    // 5. Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 2;
    controls.maxDistance = 500; // Allow zooming out further

    // Request render when controls change
    controls.addEventListener('change', () => {
        needsRender = true;
    });

    // 6. Basic Helpers
    // const _axesHelper = new THREE.AxesHelper(10); // Shows X(red), Y(green), Z(blue) axes
    // scene.add(_axesHelper);

    // 7. Ground Plane (for raycasting)
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000); // Make it very large
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        side: THREE.DoubleSide,
        visible: false // Make it invisible
    });
    groundPlaneMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundPlaneMesh.rotation.x = -Math.PI / 2; // Rotate to lie flat on XZ plane
    groundPlaneMesh.position.y = 0;
    groundPlaneMesh.name = 'groundPlane';
    scene.add(groundPlaneMesh);

    console.log('Scene setup complete.');
    // Return the core components needed by other modules
    return { scene, camera, renderer, controls, groundPlaneMesh };
}

// --- Easing function (optional, makes animation smoother) ---
function easeOutCubic(t) {
    return (--t) * t * t + 1;
}

/**
 * Requests a render on the next animation frame.
 * Call this when you add/remove objects or change the scene.
 */
function requestRender() {
    needsRender = true;
}

/**
 * Checks if there are any active animations in the scene.
 * @returns {boolean} True if animations are running
 */
function _hasActiveAnimations() {
    if (!scene) {return false;}

    let hasAnimation = false;
    scene.children.forEach(child => {
        if ((child.isGroup || child.isMesh) && child.userData.isAnimatingScale) {
            hasAnimation = true;
        }
    });
    return hasAnimation;
}

// Animation loop needs access to renderer, scene, camera
// --- Optimized Animation loop ---
function animate() {
    animationFrameId = requestAnimationFrame(animate); // Keep the loop going

    const elapsedTime = clock.getElapsedTime(); // Get total time elapsed
    let sceneChanged = false;

    // --- Scale Animation Logic ---
    if (scene) {
        scene.children.forEach(child => {
            // *** Modify condition to include Meshes ***
            if ((child.isGroup || child.isMesh) && child.userData.isAnimatingScale) {
                const startTime = child.userData.animationStartTime;
                const duration = child.userData.animationDuration;
                const targetScale = child.userData.targetScale;

                const timeInAnimation = elapsedTime - startTime;
                const progress = Math.min(timeInAnimation / duration, 1.0);
                const easedProgress = easeOutCubic(progress);

                // Interpolate scale
                const currentScale = INITIAL_SCALE + (targetScale - INITIAL_SCALE) * easedProgress;

                // Apply scale - handle Plane differently if needed (e.g., only X/Z)
                // For simplicity, scale uniformly first. Adjust if Plane looks weird.
                child.scale.set(currentScale, currentScale, currentScale);

                sceneChanged = true; // Animation is active, need to render

                // Check completion
                if (progress >= FINAL_SCALE) {
                    child.scale.set(targetScale, targetScale, targetScale); // Ensure final scale
                    child.userData.isAnimatingScale = false;
                }
            }
        });
    }

    // --- End Scale Animation Logic ---

    // Update controls if enabled (damping requires continuous updates)
    if (controls && controls.enabled) {
        const controlsChanged = controls.update();
        if (controlsChanged) {sceneChanged = true;}
    }

    // Only render if something changed
    if (needsRender || sceneChanged) {
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
        needsRender = false;
    }
}

/**
 * Stops the animation loop to save resources.
 * Useful for cleanup or when the viewer is hidden.
 */
function stopAnimation() {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}


// Resize handler needs access to container, camera, renderer
function onWindowResize(container, camera, renderer) {
    if (container && camera && renderer) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
}

export { setupScene, animate, onWindowResize, requestRender, stopAnimation };
