// app/javascript/constants.js

// --- Layout/Plot Constants ---
export const DEFAULT_PLOT_SIZE = 50;
export const MIN_PLOT_DIMENSION = 50; // Minimum width/depth for plot (feet)
export const PLOT_DIMENSION_INCREMENT = 50; // Plot dimensions must be multiples of this (feet)

// --- Structural Constants ---
export const UPRIGHT_HEIGHT = 8; // Standard height for uprights (feet)
export const CROSSBEAM_LENGTH = 12; // Standard length for crossbeams (feet)
export const BRACKET_SOCKET_DEPTH = 1; // How far the beam goes into the bracket (feet)
export const BEAM_WIDTH = 3.5 / 12; // Approx 3.5 inches converted to feet
export const BEAM_DEPTH = 3.5 / 12;

// --- Tolerance Constants ---
export const POSITION_TOLERANCE = 0.1; // Position matching tolerance (feet)
export const LENGTH_TOLERANCE = 0.5; // Beam length tolerance (feet)
export const BRACKET_OVERLAP_TOLERANCE = 1.0; // Min distance between brackets (feet)

// --- Colors ---
export const COLOR_BRACKET = 0xffa500; // Orange
export const COLOR_BEAM = 'red';    // SaddleBrown
export const COLOR_SELECTION = 0x00ff00; // Green
export const COLOR_PLOT_BOUNDARY = 0x0000ff; // Blue
export const COLOR_PLOT_GROUND = 0xafac76; // Tan/beige
export const COLOR_GRID_CENTER = 0x888888;
export const COLOR_GRID = 0xbbbbbb;
export const COLOR_BACKGROUND = 0xcccccc;

// --- Material Properties ---
export const SHADE_CLOTH_OPACITY = 0.9;
export const SHADE_CLOTH_METALNESS = 0.1; // Low metalness for fabric
export const SHADE_CLOTH_ROUGHNESS = 0.8; // High roughness for fabric

// --- Scene/Rendering Constants ---
export const CAMERA_FOV = 75; // Field of view (degrees)
export const CAMERA_NEAR_CLIP = 0.1; // Near clipping plane (feet)
export const CAMERA_FAR_CLIP = 2000; // Far clipping plane (feet)
export const CAMERA_START_X = 15; // Initial camera position X (feet)
export const CAMERA_START_Y = 15; // Initial camera position Y (feet)
export const CAMERA_START_Z = 25; // Initial camera position Z (feet)
export const AMBIENT_LIGHT_INTENSITY = 0.6; // Ambient light intensity (0-1)
export const DIRECTIONAL_LIGHT_INTENSITY = 0.8; // Directional light intensity (0-1)

// --- Visual Constants ---
export const DEBUG_LINE_LENGTH = 25; // Length of debug lines (feet)
export const DEBUG_CURSOR_HEIGHT = 0.02; // Height offset for debug cursor (feet)
export const DEBUG_CURSOR_OPACITY = 0.7; // Debug cursor opacity (0-1)
export const DEBUG_CURSOR_RENDER_ORDER = 999; // High render order to show on top

export const BRACKET_VISUAL_SIZE = 0.5; // Size of bracket cube visualization (feet)
export const SHADE_CLOTH_Y_OFFSET = 0.1; // Y offset for shade cloth below beams (feet)
export const BOUNDARY_LINE_HEIGHT = 1.03; // Y position of plot boundary lines (feet)
export const BOUNDARY_BOX_HEIGHT = 0.01; // Height of plot boundary box (feet)
export const GROUND_PLANE_VERTICES_HEIGHT = 0.01; // Y offset for ground plane vertices (feet)

// --- Bracket Dimensions (feet) ---
export const BRACKET_CUBE_WIDTH = 4 / 12;    // 4in width/depth/height for central cube
export const BRACKET_SOCKET_LENGTH = 1;      // 1ft length for each socket arm
export const BRACKET_SOCKET_WIDTH = 4 / 12;  // 4in width/depth (matches cube faces)

// --- Footer Dimensions (feet) ---
export const FOOTER_SOCKET_HEIGHT = 1;       // 1ft tall socket part
export const FOOTER_SOCKET_WIDTH = 4 / 12;   // 4in width/depth
export const FOOTER_BASE_WIDTH = 1;          // 1ft square base width/depth
export const FOOTER_BASE_HEIGHT = 0.5 / 12;  // 0.5in thick base

// --- Animation Constants ---
export const CREATION_ANIMATION_DURATION = 0.25; // seconds (e.g., 250ms)
export const INITIAL_SCALE = 0.01; // Start very small
export const FINAL_SCALE = 1.0; // Final scale for animated objects

// --- Undo/Redo Constants ---
export const MAX_UNDO_STEPS = 50; // Maximum number of undo steps to keep in history

// --- Storage Keys ---
export const CAMERA_STORAGE_KEY = 'oknotokCameraState';

