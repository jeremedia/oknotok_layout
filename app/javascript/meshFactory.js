// app/javascript/meshFactory.js

import * as THREE from 'three';
import {
    UPRIGHT_HEIGHT, CROSSBEAM_LENGTH, BRACKET_SOCKET_DEPTH,
    BEAM_WIDTH, BEAM_DEPTH, DEFAULT_PLOT_SIZE,
    COLOR_BRACKET, COLOR_BEAM, COLOR_PLOT_BOUNDARY,
    COLOR_GRID_CENTER, COLOR_GRID,
    BRACKET_CUBE_WIDTH,
    BRACKET_SOCKET_LENGTH, BRACKET_SOCKET_WIDTH,
    CREATION_ANIMATION_DURATION, INITIAL_SCALE,
    FOOTER_SOCKET_HEIGHT, FOOTER_SOCKET_WIDTH,
    FOOTER_BASE_WIDTH, FOOTER_BASE_HEIGHT, COLOR_PLOT_GROUND


} from './constants.js';
import { checkForCompletedSquares}  from "./eventHandlers";
// --- Reusable Meshes/Materials (Optional optimization) ---
const bracketGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); // Adjust size as needed
const bracketMaterial = new THREE.MeshStandardMaterial({ color: COLOR_BRACKET });
const beamMaterial = new THREE.MeshStandardMaterial({ color: COLOR_BEAM });
const footerBaseGeometry = new THREE.BoxGeometry(FOOTER_BASE_WIDTH, FOOTER_BASE_HEIGHT, FOOTER_BASE_WIDTH);
const footerSocketGeometry = new THREE.BoxGeometry(FOOTER_SOCKET_WIDTH, FOOTER_SOCKET_HEIGHT, FOOTER_SOCKET_WIDTH);
// Use bracketMaterial for the footer as per the drawing
const footerMaterial = bracketMaterial; // Reuse bracket material

const shadeClothMaterial = new THREE.MeshStandardMaterial({ // Or MeshBasicMaterial if no lighting needed
    color: 0x333333, // Dark grey/black
    side: THREE.DoubleSide, // Visible from both sides
    transparent: true,
    opacity: 0.9,
    metalness: 0.1, // Low metalness
    roughness: 0.8  // High roughness
});
// NEW: Shade Cloth Geometry (use CROSSBEAM_LENGTH)
const shadeClothGeometry = new THREE.PlaneGeometry(CROSSBEAM_LENGTH, CROSSBEAM_LENGTH);


// --- Mesh Creation Functions ---
const socketGeometry = new THREE.BoxGeometry(
    BRACKET_SOCKET_WIDTH,  // Width (X)
    BRACKET_SOCKET_WIDTH,  // Height (Y) - Sockets are square
    BRACKET_SOCKET_LENGTH  // Length (Z) - Along the socket's axis
);

const centralCubeGeometry = new THREE.BoxGeometry(
    BRACKET_CUBE_WIDTH,
    BRACKET_CUBE_WIDTH,
    BRACKET_CUBE_WIDTH
);


function addBracketMesh(bracketData, scene, clock) { // Pass clock instance
    if (!bracketData || !scene || !clock) return null;
    const bracketGroupName = `bracket_group_${bracketData.id}`;
    if (scene.getObjectByName(bracketGroupName)) return scene.getObjectByName(bracketGroupName);

    // ... (Group creation, positioning, userData setup - keep as before) ...
    const bracketGroup = new THREE.Group();
    bracketGroup.position.set(bracketData.x, bracketData.y, bracketData.z);
    bracketGroup.name = bracketGroupName;
    bracketGroup.userData = {
        type: 'bracket',
        id: bracketData.id,
        originalMaterialRef: bracketMaterial,
        // --- Animation Data ---
        isAnimatingScale: true,
        animationStartTime: clock.getElapsedTime(), // Record start time
        animationDuration: CREATION_ANIMATION_DURATION,
        targetScale: 1.0 // Final scale
    };

    // --- Central Cube ---
    const cubeMesh = new THREE.Mesh(centralCubeGeometry, bracketMaterial);
    cubeMesh.name = `bracket_${bracketData.id}_cube`;
    // Add userData to central cube as well, might be clicked
    cubeMesh.userData = { type: 'bracket_part', parentGroupId: bracketData.id };
    bracketGroup.add(cubeMesh);

    // --- Sockets ---
    const socketCenterOffset = (BRACKET_CUBE_WIDTH / 2) + (BRACKET_SOCKET_LENGTH / 2);

    const createSocket = (name, rotation, position) => {
        const socket = new THREE.Mesh(socketGeometry, bracketMaterial);
        socket.name = `bracket_${bracketData.id}_socket_${name}`;
        socket.rotation.copy(rotation);
        socket.position.copy(position);
        // *** ADD SOCKET NAME TO USERDATA ***
        socket.userData = { type: 'socket', socketName: name, parentGroupId: bracketData.id };
        bracketGroup.add(socket);
    };

    // Create sockets using the helper
    createSocket('+x', new THREE.Euler(0, Math.PI / 2, 0), new THREE.Vector3(socketCenterOffset, 0, 0));
    createSocket('-x', new THREE.Euler(0, -Math.PI / 2, 0), new THREE.Vector3(-socketCenterOffset, 0, 0));
    createSocket('+y', new THREE.Euler(-Math.PI / 2, 0, 0), new THREE.Vector3(0, socketCenterOffset, 0));
    createSocket('-y', new THREE.Euler(Math.PI / 2, 0, 0), new THREE.Vector3(0, -socketCenterOffset, 0));
    createSocket('+z', new THREE.Euler(0, 0, 0), new THREE.Vector3(0, 0, socketCenterOffset));
    createSocket('-z', new THREE.Euler(0, Math.PI, 0), new THREE.Vector3(0, 0, -socketCenterOffset)); // Rotate Y 180 for -Z

    bracketGroup.scale.set(INITIAL_SCALE, INITIAL_SCALE, INITIAL_SCALE);

    scene.add(bracketGroup);
    console.log(`Creating bracket mesh ${bracketData.id} with scale animation.`);

    return bracketGroup;
}

function addBeamMesh(beamData, scene, clock) {
    if (!beamData || !scene || !clock) return null;
    const beamGroupName = `beam_group_${beamData.id}`;
    if (scene.getObjectByName(beamGroupName)) return scene.getObjectByName(beamGroupName);

    let visibleLength = beamData.length;
    const startBracketGroup = scene.getObjectByName(`bracket_group_${beamData.start_bracket_id}`);
    const endBracketGroup = beamData.end_bracket_id ? scene.getObjectByName(`bracket_group_${beamData.end_bracket_id}`) : null;

    if (!startBracketGroup) { /* ... error handling ... */ return null; }

    const startBracketPos = startBracketGroup.position.clone();
    let beamGeometry;
    const meshMaterial = beamMaterial.clone();
    const beamMesh = new THREE.Mesh(undefined, meshMaterial);
    beamMesh.userData = { type: 'beam', id: beamData.id, start_bracket_id: beamData.start_bracket_id, end_bracket_id: beamData.end_bracket_id, sourceData: beamData };
    beamMesh.name = `beam_${beamData.id}`;

    const beamGroup = new THREE.Group();
    beamGroup.name = beamGroupName;
    // Store if it's an upright touching ground for easier identification later
    const isGroundedUpright = (beamData.beam_type === 'upright' && !endBracketGroup);
    beamGroup.userData = {
        type: 'beam_group',
        id: beamData.id,
        beamType: beamData.beam_type, // Store type
        isGrounded: isGroundedUpright, // Store grounded status
        originalMaterialRef: meshMaterial,
        sourceData: beamData, // Store original data
    };

    // --- Animation Data --- (Keep as before)
    beamGroup.userData.isAnimatingScale = true;
    beamGroup.userData.animationStartTime = clock.getElapsedTime();
    beamGroup.userData.animationDuration = CREATION_ANIMATION_DURATION; // Assumes this constant exists
    beamGroup.userData.targetScale = 1.0;
    // const axesHelper = new THREE.AxesHelper(1);
    // beamGroup.add(axesHelper);


    if (isGroundedUpright) {
        // --- Upright Beam ---
        visibleLength = beamData.length - BRACKET_SOCKET_DEPTH;
        beamGeometry = new THREE.BoxGeometry(BEAM_WIDTH, visibleLength, BEAM_DEPTH);
        beamMesh.geometry = beamGeometry;
        beamMesh.position.set(0, 0, 0); // Mesh centered in group

        // Position the GROUP center correctly
        beamGroup.position.set(startBracketPos.x, visibleLength / 2, startBracketPos.z); // Center Y=3.5 for 8ft upright



        // --- Create and Add Footer ---
        const footerGroupName = `footer_group_${beamData.id}`;
        // Check if footer already exists (e.g., during initial load)
        if (!scene.getObjectByName(footerGroupName)) {
            const footerGroup = new THREE.Group();
            footerGroup.name = footerGroupName;
            footerGroup.userData = { type: 'footer', beamId: beamData.id }; // Link to beam

            // Position footer group at the base of the upright
            footerGroup.position.set(startBracketPos.x, 0, startBracketPos.z);

            // Create Base Mesh
            const baseMesh = new THREE.Mesh(footerBaseGeometry, footerMaterial);
            baseMesh.position.y = FOOTER_BASE_HEIGHT / 2; // Center base vertically
            baseMesh.name = `footer_base_${beamData.id}`;
            footerGroup.add(baseMesh);

            // Create Socket Mesh
            const socketMesh = new THREE.Mesh(footerSocketGeometry, footerMaterial);
            socketMesh.position.y = FOOTER_BASE_HEIGHT + (FOOTER_SOCKET_HEIGHT / 2); // Center socket on top of base
            socketMesh.name = `footer_socket_${beamData.id}`;
            footerGroup.add(socketMesh);

            scene.add(footerGroup);
            console.log(`Creating footer group ${footerGroupName}`);
        }
        // --- End Footer Creation ---

    } else if (beamData.beam_type === 'crossbeam' && endBracketGroup) {
        // --- Crossbeam --- (Keep existing logic for positioning/rotation)
        const endBracketPos = endBracketGroup.position.clone();
        // Use visual distance between socket exits for geometry length
        const startExitOffset = getSocketExitOffset(beamData.start_socket); // Assumes getSocketExitOffset exists
        const visualStartPoint = startBracketPos.clone().add(startExitOffset);
        const endExitOffset = getSocketExitOffset(beamData.end_socket);
        const visualEndPoint = endBracketPos.clone().add(endExitOffset);
        visibleLength = visualStartPoint.distanceTo(visualEndPoint);

        beamGeometry = new THREE.BoxGeometry(BEAM_WIDTH, visibleLength, BEAM_DEPTH);
        beamMesh.geometry = beamGeometry;

        const midPoint = new THREE.Vector3().addVectors(visualStartPoint, visualEndPoint).multiplyScalar(0.5);
        beamGroup.position.copy(midPoint);

        const directionVector = new THREE.Vector3().subVectors(visualEndPoint, visualStartPoint).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(up, directionVector);
        beamGroup.quaternion.copy(quaternion);

        beamMesh.position.set(0, 0, 0);

    } else { /* ... error handling ... */ return null; }

    beamGroup.add(beamMesh);
    beamGroup.scale.set(INITIAL_SCALE, INITIAL_SCALE, INITIAL_SCALE); // Apply initial scale for animation
    scene.add(beamGroup);
    console.log(`Creating ${beamData.beam_type} group ${beamData.id} (vis length ${visibleLength.toFixed(1)})`);
    return beamGroup;
}
// Helper function (ensure this exists from previous steps or add it)
function getSocketExitOffset(socketName) {
    const offset = BRACKET_CUBE_WIDTH / 2;
    switch (socketName) {
        case '+x': return new THREE.Vector3(offset, 0, 0);
        case '-x': return new THREE.Vector3(-offset, 0, 0);
        case '+y': return new THREE.Vector3(0, offset, 0);
        case '-y': return new THREE.Vector3(0, -offset, 0);
        case '+z': return new THREE.Vector3(0, 0, offset);
        case '-z': return new THREE.Vector3(0, 0, -offset);
        default:   console.warn(`Unknown socket name for offset: ${socketName}`); return new THREE.Vector3();
    }
}
// --- Bulk Rendering Functions ---

function renderBrackets(brackets, scene, clock) {
    if (!brackets || !scene) return;
    console.log(`Rendering ${brackets.length} brackets.`);
    brackets.forEach(bracketData => addBracketMesh(bracketData, scene, clock));
}

function renderBeams(beams, scene, clock) {
    if (!beams || !scene) return;
    console.log(`Rendering ${beams.length} beams.`);
    // Important: Render beams *after* all brackets are potentially in the scene
    beams.forEach(beamData => addBeamMesh(beamData, scene, clock));
}

// --- NEW: Add Shade Cloth ---
function addShadeClothMesh(bracketIds, scene, clock) { // Pass clock
    if (!bracketIds || bracketIds.length !== 4 || !scene || !clock) return null; // Check clock

    const sortedIds = [...bracketIds].sort((a, b) => a - b);
    const shadeClothName = `shade_cloth_${sortedIds.join('_')}`;

    if (scene.getObjectByName(shadeClothName)) {
        console.log(`Shade cloth ${shadeClothName} already exists.`);
        return scene.getObjectByName(shadeClothName);
    }

    const bracketGroups = sortedIds.map(id => scene.getObjectByName(`bracket_group_${id}`));
    if (bracketGroups.some(group => !group)) { /* ... error handling ... */ return null; }
    const positions = bracketGroups.map(group => group.position);
    const center = new THREE.Vector3();
    positions.forEach(pos => center.add(pos));
    center.divideScalar(4);
    const averageY = center.y;

    const shadeClothMesh = new THREE.Mesh(shadeClothGeometry, shadeClothMaterial);
    shadeClothMesh.name = shadeClothName;
    shadeClothMesh.userData = {
        type: 'shade_cloth',
        bracketIds: sortedIds,
        // --- Animation Data ---
        isAnimatingScale: true,
        animationStartTime: clock.getElapsedTime(),
        animationDuration: CREATION_ANIMATION_DURATION, // Use same duration for now
        targetScale: 1.0
    };

    shadeClothMesh.position.set(center.x, averageY - 0.1, center.z);
    shadeClothMesh.rotation.x = -Math.PI / 2;

    // --- Set Initial Scale ---
    // Since it's a plane, scaling Y doesn't make sense visually. Scale X and Z.
    shadeClothMesh.scale.set(INITIAL_SCALE, INITIAL_SCALE, INITIAL_SCALE); // Start small in all axes for consistency
    // Or maybe just X and Z: shadeClothMesh.scale.set(INITIAL_SCALE, 1.0, INITIAL_SCALE);

    scene.add(shadeClothMesh);
    console.log(`Created ${shadeClothName} with scale animation.`);
    return shadeClothMesh;
}

function renderPlotBoundary(width, depth, scene) {
    if (!scene) return;
    // Remove existing boundary/grid if any
    const existingBoundary = scene.getObjectByName("plotBoundary");
    if (existingBoundary) scene.remove(existingBoundary);
    const existingGrid = scene.getObjectByName("plotGrid");
    if (existingGrid) scene.remove(existingGrid);

    const w = width || DEFAULT_PLOT_SIZE;
    const d = depth || DEFAULT_PLOT_SIZE;
    const maxSize = Math.max(w, d, DEFAULT_PLOT_SIZE); // Ensure grid is reasonably sized
    const halfW = w / 2;
    const halfD = d / 2;

    // Draw GridHelper matching plot size
    const gridHelper = new THREE.GridHelper(maxSize, maxSize / 5, COLOR_GRID_CENTER, COLOR_GRID);
    gridHelper.name = "plotGrid";
    // scene.add(gridHelper);

    // Draw boundary lines
    const points = [
        new THREE.Vector3(-halfW, 0.01, -halfD), new THREE.Vector3(halfW, 0.01, -halfD),
        new THREE.Vector3(halfW, 0.01, halfD), new THREE.Vector3(-halfW, 0.01, halfD),
        new THREE.Vector3(-halfW, 0.01, -halfD) // Close loop
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: COLOR_PLOT_BOUNDARY, linewidth: 2 });
    const boundary = new THREE.Line(geometry, material);
    boundary.name = "plotBoundary";
    boundary.position.y = 1.03; // Slightly above ground plane
    scene.add(boundary);
    console.log(`Rendered plot boundary: ${w}x${d}`);

    // Draw boundary box (optional)
    const boxGeometry = new THREE.BoxGeometry(w, 0.01, d);
    const boxMaterial = new THREE.MeshBasicMaterial({ color: COLOR_PLOT_GROUND, side: THREE.DoubleSide });
    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    boxMesh.name = "plotBoundaryBox";
    boxMesh.position.set(0, 0.01, 0); // Centered
    scene.add(boxMesh);
}


// app/javascript/meshFactory.js
// ... (keep existing constants and functions: addBracketMesh, addBeamMesh, etc.) ...

// --- Mesh Removal ---
function removeMesh(objectToRemove, scene) { // Can be Group or Mesh
    if (!objectToRemove || !scene) return;

    console.log(`Removing object: ${objectToRemove.name}`);

    // If it's a group, recursively dispose of children's geometry/material
    if (objectToRemove.isGroup) {
        objectToRemove.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
    } else if (objectToRemove.isMesh) { // If it's a single mesh (less likely now)
        if (objectToRemove.geometry) objectToRemove.geometry.dispose();
        if (objectToRemove.material) {
            if (Array.isArray(objectToRemove.material)) {
                objectToRemove.material.forEach(material => material.dispose());
            } else {
                objectToRemove.material.dispose();
            }
        }
    }

    // Remove the main object (group or mesh) from the scene
    scene.remove(objectToRemove);
    objectToRemove.parent = null; // Break link
    // Optional: Clear userData
    objectToRemove.userData = {};
}

// NEW function for panel visuals
/**
 * Adds both the ground beam and the sloping 12×12 panel for a given top beam.
 * The panel slopes away from the center of the square that the beam is part of.
 *
 * @param {THREE.Group} topBeamGroup - The top (roof) beam group.
 * @param {THREE.Scene} scene - The Three.js scene.
 * @param {THREE.Clock} clock - The clock (for animations, if any).
 * @param {Array<THREE.Vector3>} squareBracketPositions - An array of 4 Vector3 positions for the brackets
 *                                                       that form the complete square.
 *                                                       (If not provided or not length 4, a default is used.)
 * @returns {Object|null} - An object containing { groundBeamGroup, panelMesh } or null on error.
 */
function addGroundBeamAndPanelVisuals(topBeamGroup, scene, clock, squareBracketPositions) {
    if (!topBeamGroup || !scene || !clock) return null;

    if(squareBracketPositions === null || squareBracketPositions === undefined) {
        const beamData = topBeamGroup.userData.sourceData;
        squareBracketPositions = checkForCompletedSquares(beamData)
    }
    const topBeamId = topBeamGroup.userData.id;
    const groundBeamName = `ground_beam_vis_${topBeamId}`;
    const panelName = `panel_vis_${topBeamId}`;

    // Prevent duplicate visuals.
    if (scene.getObjectByName(groundBeamName) || scene.getObjectByName(panelName)) {
        console.log(`Visuals for panel on beam ${topBeamId} already exist.`);
        return;
    }
    console.log(`Creating ground beam and panel visuals for top beam ${topBeamId}`);

    // --- 1. Compute the Roof Center ---
    // If squareBracketPositions is provided and has 4 entries, compute the average.
    let roofCenter;
    if (squareBracketPositions && squareBracketPositions.length === 4) {
        roofCenter = new THREE.Vector3();
        squareBracketPositions.forEach(pos => roofCenter.add(pos));
        roofCenter.divideScalar(4);
        // draw a sphere at the center
        // const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        // const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        // const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
        // sphereMesh.position.copy(roofCenter);
        // scene.add(sphereMesh);
    } else {
        // Fallback: if no square data, use a default center.
        console.log("no square bracket positions provided, aborting.");
        return;
        // roofCenter = new THREE.Vector3(0, 8, 0);
    }
    console.log("Computed roof center:", roofCenter);

    // --- 2. Get the top beam's world position.
    const topPos = new THREE.Vector3();
    topBeamGroup.getWorldPosition(topPos);
    console.log("Top beam position:", topPos);

    // --- 3. Determine the "outward" direction ---
    // The direction is from the roof center towards the top beam.
    // Flatten to the XZ plane so the slope is horizontal.
    const outwardDir = topPos.clone().sub(roofCenter);
    outwardDir.y = 0;
    outwardDir.normalize();
    console.log("Outward direction (from roof center to top beam):", outwardDir);

    // draw a line from the roof center to the top beam
    // const lineGeometry = new THREE.BufferGeometry().setFromPoints([roofCenter, topPos]);
    // const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    // const lineMesh = new THREE.Line(lineGeometry, lineMaterial);
    // scene.add(lineMesh);



    // --- 4. Compute the ground beam position ---
    // For a 12-ft panel with an 8-ft vertical difference, the horizontal offset is ~8.92 ft.
    const horizontalOffset = 8.92;
    const groundPos = topPos.clone().add(outwardDir.clone().multiplyScalar(horizontalOffset));
    groundPos.y = 0; // Ground beam sits at y = 0.
    console.log("Ground beam position:", groundPos);

    // --- 5. Create the ground beam visual ---
    const groundBeamGeom = new THREE.BoxGeometry(BEAM_WIDTH, CROSSBEAM_LENGTH, BEAM_DEPTH);
    const groundBeamMesh = new THREE.Mesh(groundBeamGeom, beamMaterial.clone());
    const groundBeamGroup = new THREE.Group();
    groundBeamGroup.name = groundBeamName;
    groundBeamGroup.position.copy(groundPos);

    // draw a line from the roof center to the ground beam
    // const lineGeometry2 = new THREE.BufferGeometry().setFromPoints([roofCenter, groundPos]);
    // const lineMaterial2 = new THREE.LineBasicMaterial({ color: 0x0000ff });
    // const lineMesh2 = new THREE.Line(lineGeometry2, lineMaterial2);
    // scene.add(lineMesh2);

//     // Optionally, align the ground beam's rotation with the top beam's yaw.
//     // Ensure the world matrices are updated
//     topBeamGroup.updateMatrixWorld(true);
//
// // Retrieve the world quaternion for the object
//     const worldQuaternion = new THREE.Quaternion();
//     topBeamGroup.getWorldQuaternion(worldQuaternion);
//
// // Convert the quaternion to Euler angles (specify rotation order as needed)
//     const worldEuler = new THREE.Euler().setFromQuaternion(worldQuaternion, 'XYZ');
//
// // Get the y-axis rotation value
//     const yRotation = worldEuler.y;
//     console.log("World Y Rotation:", yRotation);
//
//
//     const groundRotY = yRotation;
//     const quatX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
//     const quatY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), groundRotY);
//     groundBeamGroup.quaternion.multiplyQuaternions(quatY, quatX);
//     groundBeamGroup.add(groundBeamMesh);
//     scene.add(groundBeamGroup);

    const worldQuat = new THREE.Quaternion();
    topBeamGroup.getWorldQuaternion(worldQuat);

    if (groundBeamGroup.parent) {
        const parentWorldQuat = new THREE.Quaternion();
       groundBeamGroup.parent.getWorldQuaternion(parentWorldQuat);
        parentWorldQuat.invert();
      groundBeamGroup.quaternion.copy(parentWorldQuat.multiply(worldQuat));
    } else {
        // If target has no parent, you can assign the world rotation directly.
       groundBeamGroup.quaternion.copy(worldQuat);
    }
    groundBeamGroup.position.copy(groundPos);
    groundBeamGroup.add(groundBeamMesh);
    scene.add(groundBeamGroup);

    // --- 6. Create the 12×12 panel visual ---
    // By default, PlaneGeometry is in the XY plane (with +Z as its normal).
    const panelGeometry = new THREE.PlaneGeometry(12, 12);
    const panelMesh = new THREE.Mesh(panelGeometry, shadeClothMaterial.clone());
    panelMesh.name = panelName;

    // --- 7. Position the Panel ---
    // Place the panel at the midpoint between the top beam and ground beam.
    const panelCenter = topPos.clone().add(groundPos).multiplyScalar(0.5);
    panelMesh.position.copy(panelCenter);
    console.log("Panel center:", panelCenter);

    // --- 8. Define the Panel's Local Coordinate System ---
    // localY: from ground beam to top beam (the slope direction).
    const localY = new THREE.Vector3().subVectors(topPos, groundPos).normalize();
    console.log("Panel local Y (slope direction):", localY);

    // localX: Use the vector from the roof center to the top beam,
    // then project it onto the plane perpendicular to localY.
    const candidateX = topPos.clone().sub(roofCenter).normalize();
    const dot = candidateX.dot(localY);
    const localX = candidateX.sub(localY.clone().multiplyScalar(dot)).normalize();
    console.log("Panel local X:", localX);

    // localZ: the panel's normal.
    const localZ = new THREE.Vector3().crossVectors(localX, localY).normalize();
    console.log("Panel local Z (normal):", localZ);

    // --- 9. Build the Rotation Matrix and Derive the Quaternion ---
    // The basis is (localX, localY, localZ), which aligns with the panel’s geometry.
    const rotationMatrix = new THREE.Matrix4().makeBasis(localX, localY, localZ);
    const panelQuaternion = new THREE.Quaternion().setFromRotationMatrix(rotationMatrix);
    console.log("Panel quaternion:", panelQuaternion);

    // --- 10. Apply the Orientation to the Panel ---
    panelMesh.quaternion.copy(panelQuaternion);

    // --- 11. (Optional) Add an AxesHelper for Debugging ---
    // const axesHelper = new THREE.AxesHelper(3);
    // panelMesh.add(axesHelper);

    // --- 12. Rotate the panel 90 degrees around the localZ axis ---
    // This is to ensure the panel is oriented correctly.
    panelMesh.rotateY(Math.PI / 2);

    scene.add(panelMesh);

    console.log(`Created panel for top beam ${topBeamId} at center: ${panelCenter.toArray()}`);
    return { groundBeamGroup, panelMesh };
}


// NEW function to remove panel visuals
function removeGroundBeamAndPanelVisuals(topBeamId, scene) {
    if (!topBeamId || !scene) return;
    const groundBeamName = `ground_beam_vis_${topBeamId}`;
    const panelName = `panel_vis_${topBeamId}`;
    const groundBeamVis = scene.getObjectByName(groundBeamName);
    const panelVis = scene.getObjectByName(panelName);

    if (groundBeamVis) {
        console.log(`Removing visual ${groundBeamName}`);
        removeMesh(groundBeamVis, scene); // Use existing removeMesh helper
    }
    if (panelVis) {
        console.log(`Removing visual ${panelName}`);
        removeMesh(panelVis, scene);
    }
}


// Update exports
export {
    addBracketMesh, addBeamMesh, addShadeClothMesh,
    renderBrackets, renderBeams,
    renderPlotBoundary,
    removeMesh,
    addGroundBeamAndPanelVisuals,
    removeGroundBeamAndPanelVisuals
};