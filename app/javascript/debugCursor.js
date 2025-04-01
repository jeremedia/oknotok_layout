// app/javascript/debugCursor.js
import * as THREE from 'three';
import { DEBUG_LINE_LENGTH } from './constants.js';

let isDebugCursorActive = false;
let debugCursorLines = null;
let sceneRef, cameraRef, rendererRef, groundPlaneMeshRef;

const debugLineMaterial = new THREE.LineBasicMaterial({
    color: 0xff0000,
    linewidth: 1,
    depthTest: false,
    transparent: true,
    opacity: 0.7
});

function createDebugCursorLines() {
    if (!sceneRef) {
        console.error("Scene reference not set for debug cursor.");
        return;
    }
    const pointsH = [new THREE.Vector3(-DEBUG_LINE_LENGTH / 2, 0, 0), new THREE.Vector3(DEBUG_LINE_LENGTH / 2, 0, 0)];
    const pointsV = [new THREE.Vector3(0, 0, -DEBUG_LINE_LENGTH / 2), new THREE.Vector3(0, 0, DEBUG_LINE_LENGTH / 2)];
    const geometryH = new THREE.BufferGeometry().setFromPoints(pointsH);
    const geometryV = new THREE.BufferGeometry().setFromPoints(pointsV);
    const lineH = new THREE.Line(geometryH, debugLineMaterial);
    const lineV = new THREE.Line(geometryV, debugLineMaterial);

    debugCursorLines = new THREE.Group();
    debugCursorLines.add(lineH);
    debugCursorLines.add(lineV);
    debugCursorLines.name = "debugCursor";
    debugCursorLines.visible = false;
    debugCursorLines.renderOrder = 999;
    sceneRef.add(debugCursorLines);
    console.log("Debug cursor created.");
}

function updateDebugCursorPosition(event) {
    if (!isDebugCursorActive || !debugCursorLines || !rendererRef || !cameraRef || !groundPlaneMeshRef) {
        if (debugCursorLines) debugCursorLines.visible = false;
        return;
    }
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const canvasBounds = rendererRef.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    mouse.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef);
    const intersects = raycaster.intersectObjects([groundPlaneMeshRef]);

    if (intersects.length > 0) {
        const intersectionPoint = intersects[0].point;
        debugCursorLines.position.set(intersectionPoint.x, 0.02, intersectionPoint.z);
        debugCursorLines.visible = true;
    } else {
        debugCursorLines.visible = false;
    }
}

function toggleDebugCursor(isActive) {
    isDebugCursorActive = isActive;
    if (debugCursorLines) {
        debugCursorLines.visible = isDebugCursorActive;
        if (!isActive) debugCursorLines.position.set(0, 0.02, 0);
    }
    console.log(`Debug cursor active: ${isDebugCursorActive}`);
}

function initDebugCursor(scene, camera, renderer, groundPlane) {
    sceneRef = scene;
    cameraRef = camera;
    rendererRef = renderer;
    groundPlaneMeshRef = groundPlane;
    createDebugCursorLines();
    // Add listeners specific to the debug cursor
    renderer.domElement.addEventListener('mousemove', updateDebugCursorPosition, false);
    document.getElementById('chk-debug-cursor')?.addEventListener('change', (event) => {
        toggleDebugCursor(event.target.checked);
    });
}

export { initDebugCursor, toggleDebugCursor }; // Only export necessary functions