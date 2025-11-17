// app/javascript/socketHighlighter.js
//
// Visual feedback for socket availability.
// Highlights available sockets in green and occupied sockets in red
// to help users understand where they can place crossbeams.
//

import * as THREE from 'three';
import { isSocketAvailable } from './geometryUtils.js';

// Socket highlight colors
const SOCKET_AVAILABLE_COLOR = 0x00ff00; // Bright green
const SOCKET_OCCUPIED_COLOR = 0xff0000;  // Bright red
// const _SOCKET_NEUTRAL_COLOR = 0xaaaaaa;   // Default gray (reserved for future use)

// Store original materials to restore later
const originalMaterials = new Map();

/**
 * Highlights all sockets on a bracket with color-coded availability.
 *
 * @param {THREE.Group} bracketGroup - The bracket group containing socket meshes
 * @param {Object} layoutData - The layout data to check socket availability
 * @param {boolean} showOccupied - Whether to show occupied sockets in red (default: true)
 */
export function highlightBracketSockets(bracketGroup, layoutData, showOccupied = true) {
    if (!bracketGroup || !layoutData) {return;}

    const bracketId = bracketGroup.userData.id;
    if (!bracketId) {return;}

    // Find all socket meshes in the bracket group
    bracketGroup.traverse((child) => {
        if (child.isMesh && child.userData.type === 'socket') {
            const socketName = child.userData.socketName;
            if (!socketName) {return;}

            // Store original material if not already stored
            if (!originalMaterials.has(child.uuid)) {
                originalMaterials.set(child.uuid, child.material);
            }

            // Check if socket is available
            const available = isSocketAvailable(bracketId, socketName, layoutData);

            // Create highlight material based on availability
            let highlightColor;
            if (available) {
                highlightColor = SOCKET_AVAILABLE_COLOR;
            } else if (showOccupied) {
                highlightColor = SOCKET_OCCUPIED_COLOR;
            } else {
                // If not showing occupied, keep original material
                return;
            }

            // Apply highlight material with emissive glow
            child.material = new THREE.MeshStandardMaterial({
                color: highlightColor,
                emissive: highlightColor,
                emissiveIntensity: 0.5,
                metalness: 0.3,
                roughness: 0.7
            });
        }
    });
}

/**
 * Highlights a specific socket on a bracket.
 *
 * @param {THREE.Group} bracketGroup - The bracket group
 * @param {string} socketName - The socket name (e.g., '+x', '-y')
 * @param {number} color - The color to highlight (hex)
 * @param {number} emissiveIntensity - How bright the glow should be (default: 0.7)
 */
export function highlightSpecificSocket(bracketGroup, socketName, color = SOCKET_AVAILABLE_COLOR, emissiveIntensity = 0.7) {
    if (!bracketGroup || !socketName) {return;}

    bracketGroup.traverse((child) => {
        if (child.isMesh &&
            child.userData.type === 'socket' &&
            child.userData.socketName === socketName) {

            // Store original material
            if (!originalMaterials.has(child.uuid)) {
                originalMaterials.set(child.uuid, child.material);
            }

            // Apply highlight
            child.material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: emissiveIntensity,
                metalness: 0.3,
                roughness: 0.7
            });
        }
    });
}

/**
 * Restores original socket materials on a bracket group.
 *
 * @param {THREE.Group} bracketGroup - The bracket group to unhighlight
 */
export function unhighlightBracketSockets(bracketGroup) {
    if (!bracketGroup) {return;}

    bracketGroup.traverse((child) => {
        if (child.isMesh && child.userData.type === 'socket') {
            const originalMaterial = originalMaterials.get(child.uuid);
            if (originalMaterial) {
                // Dispose of the highlight material
                if (child.material !== originalMaterial) {
                    child.material.dispose();
                }
                // Restore original
                child.material = originalMaterial;
                originalMaterials.delete(child.uuid);
            }
        }
    });
}

/**
 * Clears all socket highlights in the scene.
 *
 * @param {THREE.Scene} scene - The Three.js scene
 */
export function clearAllSocketHighlights(scene) {
    if (!scene) {return;}

    scene.traverse((object) => {
        if (object.isGroup && object.userData.type === 'bracket') {
            unhighlightBracketSockets(object);
        }
    });
}

/**
 * Highlights available sockets on all brackets in the scene.
 * Useful for showing all possible connection points.
 *
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} layoutData - The layout data
 */
export function highlightAllAvailableSockets(scene, layoutData) {
    if (!scene || !layoutData) {return;}

    scene.traverse((object) => {
        if (object.isGroup && object.userData.type === 'bracket') {
            highlightBracketSockets(object, layoutData, false); // Only show available, not occupied
        }
    });
}

/**
 * Pulses a socket highlight for extra attention.
 * Used to indicate the best socket to use.
 *
 * @param {THREE.Group} bracketGroup - The bracket group
 * @param {string} socketName - The socket name
 * @param {number} duration - How long to pulse (ms)
 */
export function pulseSocket(bracketGroup, socketName, duration = 2000) {
    if (!bracketGroup || !socketName) {return;}

    const socket = findSocket(bracketGroup, socketName);
    if (!socket) {return;}

    // Store original material
    if (!originalMaterials.has(socket.uuid)) {
        originalMaterials.set(socket.uuid, socket.material);
    }

    const startTime = Date.now();
    const pulseColor = SOCKET_AVAILABLE_COLOR;

    const pulse = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= duration) {
            // Restore original material
            const originalMaterial = originalMaterials.get(socket.uuid);
            if (originalMaterial) {
                if (socket.material !== originalMaterial) {
                    socket.material.dispose();
                }
                socket.material = originalMaterial;
                originalMaterials.delete(socket.uuid);
            }
            return;
        }

        // Calculate pulse intensity (sine wave)
        const intensity = 0.3 + Math.sin((elapsed / 300) * Math.PI) * 0.4;

        socket.material = new THREE.MeshStandardMaterial({
            color: pulseColor,
            emissive: pulseColor,
            emissiveIntensity: intensity,
            metalness: 0.3,
            roughness: 0.7
        });

        requestAnimationFrame(pulse);
    };

    pulse();
}

/**
 * Helper to find a specific socket mesh in a bracket group.
 *
 * @param {THREE.Group} bracketGroup - The bracket group
 * @param {string} socketName - The socket name
 * @returns {THREE.Mesh|null} - The socket mesh or null
 */
function findSocket(bracketGroup, socketName) {
    let foundSocket = null;
    bracketGroup.traverse((child) => {
        if (child.isMesh &&
            child.userData.type === 'socket' &&
            child.userData.socketName === socketName) {
            foundSocket = child;
        }
    });
    return foundSocket;
}

export default {
    highlightBracketSockets,
    highlightSpecificSocket,
    unhighlightBracketSockets,
    clearAllSocketHighlights,
    highlightAllAvailableSockets,
    pulseSocket
};
