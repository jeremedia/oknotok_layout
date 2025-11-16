// app/javascript/squareDetection.js
//
// Square detection logic for identifying completed 4-bracket squares
// and automatically adding shade cloth to them.
//

import * as THREE from 'three';
import { CROSSBEAM_LENGTH, POSITION_TOLERANCE, LENGTH_TOLERANCE } from './constants.js';
import { addShadeClothMesh } from './meshFactory.js';

/**
 * Detects completed squares formed by crossbeam connections.
 *
 * ALGORITHM EXPLANATION:
 * This function checks if adding a new crossbeam completes a square structure.
 * A valid square consists of:
 * - 4 brackets at the same height (Y coordinate within tolerance)
 * - 4 crossbeams connecting them in a closed loop
 * - All side lengths approximately equal to CROSSBEAM_LENGTH (12 ft)
 *
 * SEARCH STRATEGY:
 * Given trigger beam A-B, we search for two additional brackets C and D such that:
 * 1. There exists beam A-D (from bracket A)
 * 2. There exists beam B-C (from bracket B)
 * 3. There exists beam C-D (completing the square)
 * 4. All distances are within tolerance of CROSSBEAM_LENGTH
 *
 * This creates the pattern:  A --- B
 *                            |     |
 *                            D --- C
 *
 * PERFORMANCE NOTE:
 * We use distanceToSquared() instead of distance() to avoid expensive sqrt() calls.
 * We only compute sqrt() for debugging/logging.
 *
 * @param {Object} triggerBeamData - The beam that was just added, potentially completing a square
 * @param {Object} layoutData - The layout data containing brackets and beams
 * @param {THREE.Scene} scene - The Three.js scene for adding shade cloth
 * @param {THREE.Clock} clock - The clock for animations
 * @returns {Array<THREE.Vector3>|undefined} - Array of 4 bracket positions if square found, undefined otherwise
 */
export function checkForCompletedSquares(triggerBeamData, layoutData, scene, clock) {
    console.log(`Checking for squares triggered by beam: ${triggerBeamData?.id}`);
    if (!layoutData || !layoutData.brackets || !layoutData.beams || triggerBeamData.beam_type !== 'crossbeam') {
        console.log(" -> Check aborted: Invalid data or not a crossbeam.");
        return;
    }

    // Tolerance values for floating-point comparisons
    const tolerance = POSITION_TOLERANCE; // Position tolerance (feet) - accounts for floating-point imprecision
    const lengthTolerance = LENGTH_TOLERANCE; // Length tolerance (feet) - allows for minor construction variances
    const targetLength = CROSSBEAM_LENGTH; // 12 feet - target side length
    // Pre-compute squared bounds to avoid sqrt() in tight loop
    const targetLengthSqMin = Math.pow(targetLength - lengthTolerance, 2);
    const targetLengthSqMax = Math.pow(targetLength + lengthTolerance, 2);

    const bA_id = triggerBeamData.start_bracket_id;
    const bB_id = triggerBeamData.end_bracket_id;
    const bA = layoutData.brackets.find(b => b.id === bA_id);
    const bB = layoutData.brackets.find(b => b.id === bB_id);

    if (!bA || !bB || Math.abs(bA.y - bB.y) > tolerance) {
        return;
    }

    const posA = new THREE.Vector3(bA.x, bA.y, bA.z);
    const posB = new THREE.Vector3(bB.x, bB.y, bB.z);

    const beamsFromA = layoutData.beams.filter(b => b.id !== triggerBeamData.id && b.beam_type === 'crossbeam' && (b.start_bracket_id === bA_id || b.end_bracket_id === bA_id));
    const beamsFromB = layoutData.beams.filter(b => b.id !== triggerBeamData.id && b.beam_type === 'crossbeam' && (b.start_bracket_id === bB_id || b.end_bracket_id === bB_id));

    for (const beamAD of beamsFromA) {
        const bD_id = (beamAD.start_bracket_id === bA_id) ? beamAD.end_bracket_id : beamAD.start_bracket_id;
        const bD = layoutData.brackets.find(b => b.id === bD_id);
        if (!bD || Math.abs(bD.y - bA.y) > tolerance) {
            continue;
        }
        const posD = new THREE.Vector3(bD.x, bD.y, bD.z);
        const distSqAD = posA.distanceToSquared(posD);
        if (distSqAD < targetLengthSqMin || distSqAD > targetLengthSqMax) {
            continue;
        }

        for (const beamBC of beamsFromB) {
            const bC_id = (beamBC.start_bracket_id === bB_id) ? beamBC.end_bracket_id : beamBC.start_bracket_id;
            const bC = layoutData.brackets.find(b => b.id === bC_id);
            if (!bC || Math.abs(bC.y - bA.y) > tolerance) {
                continue;
            }
            const posC = new THREE.Vector3(bC.x, bC.y, bC.z);
            const distSqBC = posB.distanceToSquared(posC);
            if (distSqBC < targetLengthSqMin || distSqBC > targetLengthSqMax) {
                continue;
            }

            // Now that we have valid A, B, C, D candidates, check if C and D are connected by the 4th beam.
            // Also ensure C and D are NOT the same as A or B, and C is not the same as D.
            if (bC_id === bA_id || bC_id === bB_id || bD_id === bA_id || bD_id === bB_id || bC_id === bD_id) {
                continue; // Skip if corners aren't distinct
            }

            // Check distance between C and D (should be ~12ft)
            const distSqCD = posC.distanceToSquared(posD);
            if (distSqCD < targetLengthSqMin || distSqCD > targetLengthSqMax) {
                continue; // C and D are not the right distance apart
            }

            // Check if the closing beam (CD or DC) exists in the data
            const beamCD = layoutData.beams.find(b =>
                b.beam_type === 'crossbeam' &&
                ((b.start_bracket_id === bC_id && b.end_bracket_id === bD_id) || (b.start_bracket_id === bD_id && b.end_bracket_id === bC_id))
            );

            if (beamCD) {
                // Found a completed square!
                addShadeClothMesh([bA_id, bB_id, bC_id, bD_id], scene, clock);
                // collect the four bracket positions and return them as an array
                const bracketPositions = [bA, bB, bC, bD].map(b => new THREE.Vector3(b.x, b.y, b.z));
                console.log("          -> Completed square found with brackets:", bracketPositions);
                return bracketPositions; // Stop searching
            }
        }
    }
}

/**
 * Checks all existing beams in the layout for completed squares.
 * Typically called on initial load to detect squares that were saved previously.
 *
 * @param {Object} layoutData - The layout data containing brackets and beams
 * @param {THREE.Scene} scene - The Three.js scene for adding shade cloths
 * @param {THREE.Clock} clock - The clock for animations
 */
export function checkAllExistingBeamsForSquares(layoutData, scene, clock) {
    console.log("Checking all initially loaded beams for completed squares...");
    if (!layoutData || !layoutData.beams) {
        console.log(" -> No beams data available for initial check.");
        return;
    }

    layoutData.beams.forEach(beam => {
        if (beam.beam_type === 'crossbeam') {
            // Call the existing check function for each crossbeam
            // It returns early if a square is found involving that beam,
            // preventing redundant checks for the same square from different trigger beams.
            // We rely on addShadeClothMesh checking existence internally.
            checkForCompletedSquares(beam, layoutData, scene, clock);
        }
    });
    console.log("Initial square check complete.");
}
