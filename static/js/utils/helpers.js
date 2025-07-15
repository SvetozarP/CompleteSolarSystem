// static/js/utils/helpers.js
// Enhanced utility functions for the Solar System application

/**
 * General utility functions following functional programming principles
 */
window.Helpers = (function() {
    'use strict';

    // Constants
    const CONSTANTS = {
        AU_TO_KM: 149597870.7, // 1 AU in kilometers
        EARTH_RADIUS: 6371, // Earth radius in km
        DEGREES_TO_RADIANS: Math.PI / 180,
        RADIANS_TO_DEGREES: 180 / Math.PI,
        MAX_SAFE_DISTANCE: 1000000 // Maximum safe distance for calculations
    };

    /**
     * Mathematical utility functions
     */
    const MathHelper = {
        /**
         * Clamp a value between min and max
         * @param {number} value - Value to clamp
         * @param {number} min - Minimum value
         * @param {number} max - Maximum value
         * @returns {number} Clamped value
         */
        clamp: (value, min, max) => {
            return Math.min(Math.max(value, min), max);
        },

        /**
         * Linear interpolation between two values
         * @param {number} a - Start value
         * @param {number} b - End value
         * @param {number} t - Interpolation factor (0-1)
         * @returns {number} Interpolated value
         */
        lerp: (a, b, t) => {
            return a + (b - a) * MathHelper.clamp(t, 0, 1);
        },

        /**
         * Convert degrees to radians
         * @param {number} degrees - Angle in degrees
         * @returns {number} Angle in radians
         */
        degToRad: (degrees) => degrees * CONSTANTS.DEGREES_TO_RADIANS,

        /**
         * Convert radians to degrees
         * @param {number} radians - Angle in radians
         * @returns {number} Angle in degrees
         */
        radToDeg: (radians) => radians * CONSTANTS.RADIANS_TO_DEGREES,

        /**
         * Calculate distance between two 3D points
         * @param {Object} point1 - First point {x, y, z}
         * @param {Object} point2 - Second point {x, y, z}
         * @returns {number} Distance between points
         */
        distance3D: (point1, point2) => {
            const dx = point2.x - point1.x;
            const dy = point2.y - point1.y;
            const dz = point2.z - point1.z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        },

        /**
         * Generate random number between min and max
         * @param {number} min - Minimum value
         * @param {number} max - Maximum value
         * @returns {number} Random number
         */
        random: (min, max) => {
            return Math.random() * (max - min) + min;
        },

        /**
         * Generate random integer between min and max (inclusive)
         * @param {number} min - Minimum value
         * @param {number} max - Maximum value
         * @returns {number} Random integer
         */
        randomInt: (min, max) => {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        /**
         * Normalize a value from one range to another
         * @param {number} value - Value to normalize
         * @param {number} inMin - Input range minimum
         * @param {number} inMax - Input range maximum
         * @param {number} outMin - Output range minimum
         * @param {number} outMax - Output range maximum
         * @returns {number} Normalized value
         */
        normalize: (value, inMin, inMax, outMin, outMax) => {
            return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
        }
    };

    /**
     * Color utility functions
     */
    const Color = {
        /**
         * Convert hex color to RGB object
         * @param {string} hex - Hex color (e.g., "#FF6B47")
         * @returns {Object} RGB object {r, g, b}
         */
        hexToRgb: (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16) / 255,
                g: parseInt(result[2], 16) / 255,
                b: parseInt(result[3], 16) / 255
            } : null;
        },

        /**
         * Convert RGB to hex color
         * @param {number} r - Red (0-255)
         * @param {number} g - Green (0-255)
         * @param {number} b - Blue (0-255)
         * @returns {string} Hex color
         */
        rgbToHex: (r, g, b) => {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        },

        /**
         * Generate random color in hex format
         * @returns {string} Random hex color
         */
        randomHex: () => {
            return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        },

        /**
         * Lighten or darken a hex color
         * @param {string} hex - Hex color
         * @param {number} amount - Amount to lighten (positive) or darken (negative)
         * @returns {string} Modified hex color
         */
        adjustBrightness: (hex, amount) => {
            const rgb = Color.hexToRgb(hex);
            if (!rgb) return hex;

            const r = MathHelper.clamp(Math.round(rgb.r * 255 + amount), 0, 255);
            const g = MathHelper.clamp(Math.round(rgb.g * 255 + amount), 0, 255);
            const b = MathHelper.clamp(Math.round(rgb.b * 255 + amount), 0, 255);

            return Color.rgbToHex(r, g, b);
        }
    };

    /**
     * DOM utility functions
     */
    const DOM = {
        /**
         * Get element by ID with error handling
         * @param {string} id - Element ID
         * @returns {HTMLElement|null} Element or null
         */
        getElementById: (id) => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`Element with ID '${id}' not found`);
            }
            return element;
        },

        /**
         * Create element with attributes and content
         * @param {string} tag - HTML tag
         * @param {Object} attributes - Element attributes
         * @param {string} content - Inner content
         * @returns {HTMLElement} Created element
         */
        createElement: (tag, attributes = {}, content = '') => {
            const element = document.createElement(tag);

            Object.keys(attributes).forEach(key => {
                if (key === 'className') {
                    element.className = attributes[key];
                } else if (key === 'dataset') {
                    Object.keys(attributes[key]).forEach(dataKey => {
                        element.dataset[dataKey] = attributes[key][dataKey];
                    });
                } else {
                    element.setAttribute(key, attributes[key]);
                }
            });

            if (content) {
                element.innerHTML = content;
            }

            return element;
        },

        /**
         * Add event listener with automatic cleanup
         * @param {HTMLElement} element - Target element
         * @param {string} event - Event type
         * @param {Function} handler - Event handler
         * @param {Object} options - Event options
         * @returns {Function} Cleanup function
         */
        addEventListenerWithCleanup: (element, event, handler, options = {}) => {
            element.addEventListener(event, handler, options);
            return () => element.removeEventListener(event, handler, options);
        },

        /**
         * Check if element is visible in viewport
         * @param {HTMLElement} element - Element to check
         * @returns {boolean} Is visible
         */
        isElementVisible: (element) => {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        }
    };

    /**
     * Performance monitoring utilities
     */
    const Performance = {
        /**
         * Measure function execution time
         * @param {Function} fn - Function to measure
         * @param {Array} args - Function arguments
         * @returns {Object} Result and execution time
         */
        measure: (fn, ...args) => {
            const start = performance.now();
            const result = fn(...args);
            const end = performance.now();
            return {
                result,
                executionTime: end - start
            };
        },

        /**
         * Debounce function calls
         * @param {Function} func - Function to debounce
         * @param {number} wait - Delay in milliseconds
         * @returns {Function} Debounced function
         */
        debounce: (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        /**
         * Throttle function calls
         * @param {Function} func - Function to throttle
         * @param {number} limit - Time limit in milliseconds
         * @returns {Function} Throttled function
         */
        throttle: (func, limit) => {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        /**
         * Simple FPS counter
         * @returns {Object} FPS counter with update method
         */
        createFPSCounter: () => {
            let frames = 0;
            let prevTime = performance.now();
            let fps = 60;

            return {
                update: () => {
                    frames++;
                    const currentTime = performance.now();
                    if (currentTime >= prevTime + 1000) {
                        fps = Math.round((frames * 1000) / (currentTime - prevTime));
                        frames = 0;
                        prevTime = currentTime;
                    }
                    return fps;
                },
                getFPS: () => fps
            };
        }
    };

    /**
     * Validation utilities
     */
    const Validation = {
        /**
         * Check if value is a valid number
         * @param {*} value - Value to check
         * @returns {boolean} Is valid number
         */
        isValidNumber: (value) => {
            return typeof value === 'number' && !isNaN(value) && isFinite(value);
        },

        /**
         * Check if object has required properties
         * @param {Object} obj - Object to check
         * @param {Array} requiredProps - Required property names
         * @returns {boolean} Has all required properties
         */
        hasRequiredProperties: (obj, requiredProps) => {
            return requiredProps.every(prop => obj.hasOwnProperty(prop));
        },

        /**
         * Validate planet data structure
         * @param {Object} planetData - Planet data object
         * @returns {boolean} Is valid planet data
         */
        isValidPlanetData: (planetData) => {
            const required = ['name', 'distance_from_sun', 'diameter', 'color_hex'];
            return Validation.hasRequiredProperties(planetData, required) &&
                   Validation.isValidNumber(planetData.distance_from_sun) &&
                   Validation.isValidNumber(planetData.diameter);
        }
    };

    /**
     * Animation utilities
     */
    const Animation = {
        /**
         * Easing functions
         */
        easing: {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
        },

        /**
         * Animate a value over time
         * @param {Object} options - Animation options
         * @returns {Promise} Animation promise
         */
        animate: (options) => {
            const {
                from,
                to,
                duration = 1000,
                easing = Animation.easing.linear,
                onUpdate,
                onComplete
            } = options;

            return new Promise((resolve) => {
                const startTime = performance.now();
                const startValue = from;
                const endValue = to;
                const totalChange = endValue - startValue;

                function update() {
                    const currentTime = performance.now();
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const easedProgress = easing(progress);
                    const currentValue = startValue + (totalChange * easedProgress);

                    if (onUpdate) {
                        onUpdate(currentValue, progress);
                    }

                    if (progress < 1) {
                        requestAnimationFrame(update);
                    } else {
                        if (onComplete) {
                            onComplete(endValue);
                        }
                        resolve(endValue);
                    }
                }

                requestAnimationFrame(update);
            });
        }
    };

    // Public API
    return {
        MathHelper,
        Color,
        DOM,
        Performance,
        Validation,
        Animation,
        CONSTANTS,

        // Convenience methods
        log: (message, type = 'info') => {
            const timestamp = new Date().toISOString();
            const prefix = `[${timestamp}] [${type.toUpperCase()}]`;

            switch (type) {
                case 'error':
                    console.error(prefix, message);
                    break;
                case 'warn':
                    console.warn(prefix, message);
                    break;
                case 'debug':
                    if (window.SolarSystemConfig?.debug) {
                        console.log(prefix, message);
                    }
                    break;
                default:
                    console.log(prefix, message);
            }
        },

        // Error handling
        handleError: (error, context = 'Unknown') => {
            const errorMessage = `Error in ${context}: ${error.message || error}`;
            Helpers.log(errorMessage, 'error');

            // Report to notification system if available
            if (window.NotificationSystem?.showError) {
                window.NotificationSystem.showError(`An error occurred in ${context}`);
            }

            return false;
        }
    };
})();

// Make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.Helpers;
}

console.log('Helpers module loaded successfully');