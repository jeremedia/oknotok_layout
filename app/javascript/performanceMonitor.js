// app/javascript/performanceMonitor.js
//
// Performance monitoring and metrics collection for OKNOTOK Layout.
// Tracks FPS, memory, API calls, and render performance.
//

import { perfLog, getConfig, isDevelopment } from './environment.js';

/**
 * Performance metrics storage
 */
const metrics = {
    // Frame rate tracking
    fps: {
        current: 0,
        average: 0,
        min: Infinity,
        max: 0,
        samples: []
    },

    // Memory tracking (if available)
    memory: {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0
    },

    // API call tracking
    apiCalls: {
        total: 0,
        successful: 0,
        failed: 0,
        averageDuration: 0,
        recentCalls: [] // Last 10 calls with timing
    },

    // Render tracking
    renders: {
        total: 0,
        skipped: 0,
        averageDuration: 0,
        recentDurations: [] // Last 100 render times
    },

    // User interactions
    interactions: {
        clicks: 0,
        creates: 0,
        deletes: 0,
        undos: 0,
        redos: 0
    }
};

/**
 * FPS calculation state
 */
let fpsLastTime = performance.now();
let fpsFrameCount = 0;
const FPS_UPDATE_INTERVAL = 1000; // Update FPS every second
const FPS_SAMPLE_LIMIT = 60; // Keep last 60 FPS samples (1 minute at 1Hz)

/**
 * Updates FPS metrics based on current frame time.
 * Should be called every frame in the animation loop.
 */
export function updateFPS() {
    const now = performance.now();
    fpsFrameCount++;

    const elapsed = now - fpsLastTime;

    if (elapsed >= FPS_UPDATE_INTERVAL) {
        const currentFPS = Math.round((fpsFrameCount * 1000) / elapsed);

        metrics.fps.current = currentFPS;
        metrics.fps.min = Math.min(metrics.fps.min, currentFPS);
        metrics.fps.max = Math.max(metrics.fps.max, currentFPS);

        // Add to samples
        metrics.fps.samples.push(currentFPS);

        // Keep only recent samples
        if (metrics.fps.samples.length > FPS_SAMPLE_LIMIT) {
            metrics.fps.samples.shift();
        }

        // Calculate average
        metrics.fps.average = Math.round(
            metrics.fps.samples.reduce((a, b) => a + b, 0) / metrics.fps.samples.length
        );

        // Reset for next interval
        fpsLastTime = now;
        fpsFrameCount = 0;

        perfLog(`FPS: ${currentFPS} (avg: ${metrics.fps.average}, min: ${metrics.fps.min}, max: ${metrics.fps.max})`);
    }
}

/**
 * Updates memory metrics if Performance Memory API is available.
 */
export function updateMemory() {
    if (performance.memory) {
        metrics.memory.usedJSHeapSize = performance.memory.usedJSHeapSize;
        metrics.memory.totalJSHeapSize = performance.memory.totalJSHeapSize;
        metrics.memory.jsHeapSizeLimit = performance.memory.jsHeapSizeLimit;

        const usedMB = (metrics.memory.usedJSHeapSize / 1048576).toFixed(2);
        const limitMB = (metrics.memory.jsHeapSizeLimit / 1048576).toFixed(2);

        perfLog(`Memory: ${usedMB}MB / ${limitMB}MB`);
    }
}

/**
 * Records an API call with timing information.
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {number} duration - Call duration in ms
 * @param {boolean} success - Whether call succeeded
 */
export function recordAPICall(method, url, duration, success = true) {
    metrics.apiCalls.total++;

    if (success) {
        metrics.apiCalls.successful++;
    } else {
        metrics.apiCalls.failed++;
    }

    // Add to recent calls
    metrics.apiCalls.recentCalls.push({
        method,
        url,
        duration,
        success,
        timestamp: Date.now()
    });

    // Keep only last 10 calls
    if (metrics.apiCalls.recentCalls.length > 10) {
        metrics.apiCalls.recentCalls.shift();
    }

    // Update average duration
    const totalDuration = metrics.apiCalls.recentCalls.reduce((sum, call) => sum + call.duration, 0);
    metrics.apiCalls.averageDuration = Math.round(totalDuration / metrics.apiCalls.recentCalls.length);

    perfLog(`API ${method} ${url}: ${duration}ms (success: ${success})`);
}

/**
 * Records a render cycle with timing.
 * @param {number} duration - Render duration in ms
 * @param {boolean} skipped - Whether render was skipped
 */
export function recordRender(duration, skipped = false) {
    if (skipped) {
        metrics.renders.skipped++;
    } else {
        metrics.renders.total++;
        metrics.renders.recentDurations.push(duration);

        // Keep only last 100 durations
        if (metrics.renders.recentDurations.length > 100) {
            metrics.renders.recentDurations.shift();
        }

        // Update average
        const totalDuration = metrics.renders.recentDurations.reduce((sum, d) => sum + d, 0);
        metrics.renders.averageDuration = totalDuration / metrics.renders.recentDurations.length;
    }
}

/**
 * Records user interaction events.
 * @param {string} type - Interaction type (click, create, delete, undo, redo)
 */
export function recordInteraction(type) {
    if (type in metrics.interactions) {
        metrics.interactions[type]++;
        perfLog(`Interaction: ${type} (total: ${metrics.interactions[type]})`);
    }
}

/**
 * Gets current performance metrics.
 * @returns {Object} Current metrics snapshot
 */
export function getMetrics() {
    return {
        ...metrics,
        timestamp: Date.now()
    };
}

/**
 * Resets all performance metrics.
 */
export function resetMetrics() {
    metrics.fps.current = 0;
    metrics.fps.average = 0;
    metrics.fps.min = Infinity;
    metrics.fps.max = 0;
    metrics.fps.samples = [];

    metrics.apiCalls.total = 0;
    metrics.apiCalls.successful = 0;
    metrics.apiCalls.failed = 0;
    metrics.apiCalls.averageDuration = 0;
    metrics.apiCalls.recentCalls = [];

    metrics.renders.total = 0;
    metrics.renders.skipped = 0;
    metrics.renders.averageDuration = 0;
    metrics.renders.recentDurations = [];

    metrics.interactions.clicks = 0;
    metrics.interactions.creates = 0;
    metrics.interactions.deletes = 0;
    metrics.interactions.undos = 0;
    metrics.interactions.redos = 0;

    perfLog('Performance metrics reset');
}

/**
 * Formats metrics as a readable string for console logging.
 * @returns {string} Formatted metrics
 */
export function formatMetrics() {
    const m = metrics;
    const memUsedMB = (m.memory.usedJSHeapSize / 1048576).toFixed(2);
    const memLimitMB = (m.memory.jsHeapSizeLimit / 1048576).toFixed(2);

    return `
═══════════════════════════════════════════════════════
  OKNOTOK Layout - Performance Metrics
═══════════════════════════════════════════════════════

FPS:
  Current: ${m.fps.current} fps
  Average: ${m.fps.average} fps
  Min/Max: ${m.fps.min}/${m.fps.max} fps

Memory:
  Used: ${memUsedMB} MB
  Limit: ${memLimitMB} MB
  Usage: ${((m.memory.usedJSHeapSize / m.memory.jsHeapSizeLimit) * 100).toFixed(1)}%

API Calls:
  Total: ${m.apiCalls.total}
  Successful: ${m.apiCalls.successful}
  Failed: ${m.apiCalls.failed}
  Avg Duration: ${m.apiCalls.averageDuration}ms

Renders:
  Total: ${m.renders.total}
  Skipped: ${m.renders.skipped}
  Avg Duration: ${m.renders.averageDuration.toFixed(2)}ms
  Skip Rate: ${((m.renders.skipped / (m.renders.total + m.renders.skipped)) * 100).toFixed(1)}%

Interactions:
  Clicks: ${m.interactions.clicks}
  Creates: ${m.interactions.creates}
  Deletes: ${m.interactions.deletes}
  Undos: ${m.interactions.undos}
  Redos: ${m.interactions.redos}

═══════════════════════════════════════════════════════
`;
}

/**
 * Logs formatted metrics to console.
 */
export function logMetrics() {
    console.log(formatMetrics());
}

/**
 * Starts automatic performance monitoring.
 * Updates memory metrics every 10 seconds.
 * @returns {number} Interval ID (use clearInterval to stop)
 */
export function startMonitoring() {
    if (!getConfig('enablePerformanceLogging')) {
        perfLog('Performance monitoring disabled in current environment');
        return null;
    }

    perfLog('Starting performance monitoring...');

    // Update memory every 10 seconds
    const intervalId = setInterval(() => {
        updateMemory();
    }, 10000);

    // Log metrics every 30 seconds in development
    if (isDevelopment()) {
        setInterval(() => {
            logMetrics();
        }, 30000);
    }

    return intervalId;
}

/**
 * Exposes performance metrics to window for debugging in development.
 */
if (isDevelopment()) {
    window.perfMetrics = {
        get: getMetrics,
        log: logMetrics,
        reset: resetMetrics,
        format: formatMetrics
    };

    perfLog('Performance metrics exposed to window.perfMetrics');
    perfLog('Available commands: perfMetrics.get(), perfMetrics.log(), perfMetrics.reset()');
}
