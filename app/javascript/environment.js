// app/javascript/environment.js
//
// Environment detection and configuration for development vs production.
// Provides utilities for environment-specific behavior.
//

/**
 * Detects the current environment based on hostname and Rails environment meta tag.
 * @returns {string} 'development', 'production', or 'test'
 */
function detectEnvironment() {
    // Check Rails environment meta tag first (most reliable)
    const railsEnvMeta = document.querySelector('meta[name="rails-env"]');
    if (railsEnvMeta) {
        const env = railsEnvMeta.getAttribute('content');
        if (env === 'development' || env === 'production' || env === 'test') {
            return env;
        }
    }

    // Fallback to hostname detection
    const hostname = window.location.hostname;

    // Production indicators
    if (hostname.includes('herokuapp.com') ||
        hostname.includes('railway.app') ||
        hostname.includes('render.com') ||
        !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
        return 'production';
    }

    // Development indicators
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
        return 'development';
    }

    // Default to production for safety (better to be conservative)
    return 'production';
}

// Detect environment once at module load
const ENVIRONMENT = detectEnvironment();

/**
 * Environment configuration object with feature flags and settings.
 */
const CONFIG = {
    development: {
        // Logging
        enableVerboseLogging: true,
        enablePerformanceLogging: true,
        logApiCalls: true,
        logRateLimiting: true,
        logRenderCycles: false, // Can be noisy, disabled by default

        // Debugging
        enableDebugHelpers: true,
        showAxesHelper: false,
        showGridHelper: true,
        enableWireframeMode: false,

        // Performance
        enableAnimations: true,
        maxToastMessages: 5,
        toastDuration: 4000,

        // Error Handling
        showDetailedErrors: true,
        reportErrorsToServer: false,

        // Rate Limiting
        enableRateLimiting: true,
        rateLimitMultiplier: 1.0 // Can increase limits in dev if needed
    },

    production: {
        // Logging
        enableVerboseLogging: false,
        enablePerformanceLogging: false,
        logApiCalls: false,
        logRateLimiting: false,
        logRenderCycles: false,

        // Debugging
        enableDebugHelpers: false,
        showAxesHelper: false,
        showGridHelper: false,
        enableWireframeMode: false,

        // Performance
        enableAnimations: true,
        maxToastMessages: 3,
        toastDuration: 3000,

        // Error Handling
        showDetailedErrors: false,
        reportErrorsToServer: true,

        // Rate Limiting
        enableRateLimiting: true,
        rateLimitMultiplier: 1.0
    },

    test: {
        // Logging
        enableVerboseLogging: false,
        enablePerformanceLogging: false,
        logApiCalls: false,
        logRateLimiting: false,
        logRenderCycles: false,

        // Debugging
        enableDebugHelpers: false,
        showAxesHelper: false,
        showGridHelper: false,
        enableWireframeMode: false,

        // Performance
        enableAnimations: false, // Faster tests
        maxToastMessages: 5,
        toastDuration: 1000, // Shorter for tests

        // Error Handling
        showDetailedErrors: true,
        reportErrorsToServer: false,

        // Rate Limiting
        enableRateLimiting: false, // Disable in tests for speed
        rateLimitMultiplier: 0
    }
};

/**
 * Gets the current environment name.
 * @returns {string} 'development', 'production', or 'test'
 */
export function getEnvironment() {
    return ENVIRONMENT;
}

/**
 * Checks if current environment is development.
 * @returns {boolean}
 */
export function isDevelopment() {
    return ENVIRONMENT === 'development';
}

/**
 * Checks if current environment is production.
 * @returns {boolean}
 */
export function isProduction() {
    return ENVIRONMENT === 'production';
}

/**
 * Checks if current environment is test.
 * @returns {boolean}
 */
export function isTest() {
    return ENVIRONMENT === 'test';
}

/**
 * Gets a configuration value for the current environment.
 * @param {string} key - Configuration key
 * @returns {any} Configuration value
 */
export function getConfig(key) {
    const envConfig = CONFIG[ENVIRONMENT];
    if (envConfig && key in envConfig) {
        return envConfig[key];
    }

    // Fallback to production config if key not found
    console.warn(`Config key "${key}" not found for environment "${ENVIRONMENT}", using production default`);
    return CONFIG.production[key];
}

/**
 * Logs a message only in development environment.
 * @param {...any} args - Arguments to log
 */
export function devLog(...args) {
    if (isDevelopment() && getConfig('enableVerboseLogging')) {
        console.log('[DEV]', ...args);
    }
}

/**
 * Logs API-related messages if enabled.
 * @param {...any} args - Arguments to log
 */
export function apiLog(...args) {
    if (getConfig('logApiCalls')) {
        console.log('[API]', ...args);
    }
}

/**
 * Logs performance-related messages if enabled.
 * @param {...any} args - Arguments to log
 */
export function perfLog(...args) {
    if (getConfig('enablePerformanceLogging')) {
        console.log('[PERF]', ...args);
    }
}

/**
 * Logs rate limiting messages if enabled.
 * @param {...any} args - Arguments to log
 */
export function rateLimitLog(...args) {
    if (getConfig('logRateLimiting')) {
        console.log('[RATE]', ...args);
    }
}

/**
 * Logs render cycle messages if enabled.
 * @param {...any} args - Arguments to log
 */
export function renderLog(...args) {
    if (getConfig('logRenderCycles')) {
        console.log('[RENDER]', ...args);
    }
}

/**
 * Gets the complete configuration for the current environment.
 * Useful for debugging or displaying in dev tools.
 * @returns {Object} Current environment configuration
 */
export function getFullConfig() {
    return {
        environment: ENVIRONMENT,
        ...CONFIG[ENVIRONMENT]
    };
}

// Log environment on load in development
if (isDevelopment()) {
    console.log(`%c🚀 OKNOTOK Layout - ${ENVIRONMENT.toUpperCase()} MODE`, 'color: #00ff00; font-weight: bold; font-size: 14px;');
    console.log('Environment config:', getFullConfig());
}
