// app/javascript/constants.js

export const DEFAULT_PLOT_SIZE = 50;
export const UPRIGHT_HEIGHT = 8; // Standard height for uprights (feet)
export const CROSSBEAM_LENGTH = 12; // Standard length for crossbeams (feet)
export const BRACKET_SOCKET_DEPTH = 1; // How far the beam goes into the bracket (feet)
export const BEAM_WIDTH = 3.5 / 12; // Approx 3.5 inches converted to feet
export const BEAM_DEPTH = 3.5 / 12;

// Colors
export const COLOR_BRACKET = 0xffa500; // Orange
export const COLOR_BEAM = "red";    // SaddleBrown
export const COLOR_SELECTION = 0x00ff00; // Green
export const COLOR_PLOT_BOUNDARY = 0x0000ff; // Blue

export const COLOR_PLOT_GROUND = 0xafac76; // Blue

export const COLOR_GRID_CENTER = 0x888888;
export const COLOR_GRID = 0xbbbbbb;
export const COLOR_BACKGROUND = 0xcccccc;

export const DEBUG_LINE_LENGTH = 25; // Length of debug lines (feet)

// Bracket Dimensions (feet)

export const BRACKET_CUBE_WIDTH = 4 / 12;    // 4in width/depth/height for central cube
export const BRACKET_SOCKET_LENGTH = 1;      // 1ft length for each socket arm
export const BRACKET_SOCKET_WIDTH = 4 / 12;  // 4in width/depth (matches cube faces)
// --- Animation Constants ---
export const CREATION_ANIMATION_DURATION = 0.25; // seconds (e.g., 250ms)
export const INITIAL_SCALE = 0.01; // Start very small

export const FOOTER_SOCKET_HEIGHT = 1;       // 1ft tall socket part
export const FOOTER_SOCKET_WIDTH = 4 / 12;   // 4in width/depth
export const FOOTER_BASE_WIDTH = 1;          // 1ft square base width/depth
export const FOOTER_BASE_HEIGHT = 0.5 / 12;  // 0.5in thick base

export const CAMERA_STORAGE_KEY = 'oknotokCameraState';
