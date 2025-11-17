// app/javascript/geometryUtils.js
//
// Geometry and position calculation utilities for bracket and beam placement.
// These functions handle socket availability checks, position calculations,
// and bracket finding logic.
//

import * as THREE from 'three';
import { CROSSBEAM_LENGTH, POSITION_TOLERANCE } from './constants.js';

/**
 * Checks if a specific socket on a bracket is available (not already used by a beam).
 *
 * @param {number} bracketId - The ID of the bracket to check
 * @param {string} socketName - The socket name (e.g., '+x', '-y', etc.)
 * @param {Object} layoutData - The layout data containing brackets and beams
 * @returns {boolean} - True if socket is available, false if already occupied
 */
export function isSocketAvailable(bracketId, socketName, layoutData) {
    if (!layoutData || !layoutData.beams) {return true;}
    return !layoutData.beams.some(beam =>
        (beam.start_bracket_id === bracketId && beam.start_socket === socketName) ||
        (beam.end_bracket_id === bracketId && beam.end_socket === socketName)
    );
}

/**
 * Returns the opposite socket name for a given socket.
 *
 * @param {string} socketName - The socket name (e.g., '+x', '-y', etc.)
 * @returns {string|null} - The opposite socket name, or null if invalid
 */
export function getOppositeSocket(socketName) {
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

/**
 * Calculates the position where a new bracket should be placed based on
 * a starting bracket and socket direction.
 *
 * @param {THREE.Group} startBracketGroup - The starting bracket group
 * @param {string} socketName - The socket name indicating direction
 * @returns {THREE.Vector3|null} - The calculated position, or null if invalid socket
 */
export function calculateNewBracketPosition(startBracketGroup, socketName) {
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

/**
 * Finds an existing bracket near a target position within a tolerance.
 *
 * @param {THREE.Vector3} targetPosition - The position to search near
 * @param {Object} layoutData - The layout data containing brackets
 * @param {number} tolerance - The distance tolerance for matching (default: POSITION_TOLERANCE)
 * @returns {Object|null} - The bracket data if found, null otherwise
 */
export function findExistingBracketNear(targetPosition, layoutData, tolerance = POSITION_TOLERANCE) {
    if (!layoutData || !layoutData.brackets) {return null;}
    for (const bracket of layoutData.brackets) {
        const distance = targetPosition.distanceTo(new THREE.Vector3(bracket.x, bracket.y, bracket.z));
        if (distance < tolerance && Math.abs(targetPosition.y - bracket.y) < tolerance) {
            console.log(`Found existing bracket ${bracket.id} near target position.`);
            return bracket;
        }
    }
    return null;
}
