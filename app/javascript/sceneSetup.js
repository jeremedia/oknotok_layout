// app/javascript/sceneSetup.js

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { COLOR_BACKGROUND, INITIAL_SCALE } from './constants.js';

let scene, camera, renderer, controls, groundPlaneMesh;
const clock = new THREE.Clock(); // Instantiate clock globally or near animate

function setupScene(container) {
    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(COLOR_BACKGROUND);

    // 2. Camera
    camera = new THREE.PerspectiveCamera(
        75, // Field of View (degrees)
        container.clientWidth / container.clientHeight, // Aspect Ratio
        0.1, // Near clipping plane
        2000 // Far clipping plane (increased)
    );
    camera.position.set(15, 15, 25); // Start position

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement); // Add canvas to the container div

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft white light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
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

    // 6. Basic Helpers
    const axesHelper = new THREE.AxesHelper(10); // Shows X(red), Y(green), Z(blue) axes
    // scene.add(axesHelper);

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
    groundPlaneMesh.name = "groundPlane";
    scene.add(groundPlaneMesh);

    console.log("Scene setup complete.");
    // Return the core components needed by other modules
    return { scene, camera, renderer, controls, groundPlaneMesh };
}

// --- Easing function (optional, makes animation smoother) ---
function easeOutCubic(t) {
    return (--t) * t * t + 1;
}

// Animation loop needs access to renderer, scene, camera
// --- Animation loop ---
function animate() {
    requestAnimationFrame(animate); // Keep the loop going

    const elapsedTime = clock.getElapsedTime(); // Get total time elapsed

    // --- Scale Animation Logic ---
    if (scene) {
        scene.children.forEach(child => {
            // *** Modify condition to include Meshes ***
            if ((child.isGroup || child.isMesh) && child.userData.isAnimatingScale) {
                const startTime = child.userData.animationStartTime;
                const duration = child.userData.animationDuration;
                const targetScale = child.userData.targetScale;

                const timeInAnimation = elapsedTime - startTime;
                let progress = Math.min(timeInAnimation / duration, 1.0);
                const easedProgress = easeOutCubic(progress);

                // Interpolate scale
                const currentScale = INITIAL_SCALE + (targetScale - INITIAL_SCALE) * easedProgress;

                // Apply scale - handle Plane differently if needed (e.g., only X/Z)
                // For simplicity, scale uniformly first. Adjust if Plane looks weird.
                child.scale.set(currentScale, currentScale, currentScale);

                // Check completion
                if (progress >= 1.0) {
                    child.scale.set(targetScale, targetScale, targetScale); // Ensure final scale
                    child.userData.isAnimatingScale = false;
                }
            }
        });
    }

    // --- End Scale Animation Logic ---


    if (controls) controls.update(); // Update orbit controls if damping enabled

    if (renderer && scene && camera) renderer.render(scene, camera); // Render the scene
}


// Resize handler needs access to container, camera, renderer
function onWindowResize(container, camera, renderer) {
    if (container && camera && renderer) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
}

export { setupScene, animate, onWindowResize };