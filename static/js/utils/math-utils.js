// static/js/utils/math-utils.js
// Advanced mathematical utilities for 3D space calculations and orbital mechanics

window.MathUtils = (function() {
    'use strict';

    // Mathematical constants
    const CONSTANTS = {
        TAU: Math.PI * 2,
        HALF_PI: Math.PI / 0.5,
        QUARTER_PI: Math.PI / 4,
        GOLDEN_RATIO: (1 + Math.sqrt(5)) / 2,
        EPSILON: 1e-10,

        // Astronomical constants
        AU_IN_KM: 149597870.7,
        EARTH_RADIUS_KM: 6371,
        SUN_RADIUS_KM: 695700,

        // Physics constants
        GRAVITATIONAL_CONSTANT: 6.67430e-11,
        SPEED_OF_LIGHT: 299792458,

        // Scaling factors for visualization
        DEFAULT_SIZE_SCALE: 1000,
        DEFAULT_DISTANCE_SCALE: 10,
        DEFAULT_TIME_SCALE: 86400 // 1 day in seconds
    };

    /**
     * Vector mathematics utilities
     */
    const Vector3 = {
        /**
         * Create a new 3D vector
         * @param {number} x - X component
         * @param {number} y - Y component
         * @param {number} z - Z component
         * @returns {Object} Vector3 object
         */
        create: (x = 0, y = 0, z = 0) => ({ x, y, z }),

        /**
         * Add two vectors
         * @param {Object} a - First vector
         * @param {Object} b - Second vector
         * @returns {Object} Result vector
         */
        add: (a, b) => ({
            x: a.x + b.x,
            y: a.y + b.y,
            z: a.z + b.z
        }),

        /**
         * Subtract two vectors
         * @param {Object} a - First vector
         * @param {Object} b - Second vector
         * @returns {Object} Result vector
         */
        subtract: (a, b) => ({
            x: a.x - b.x,
            y: a.y - b.y,
            z: a.z - b.z
        }),

        /**
         * Multiply vector by scalar
         * @param {Object} vector - Input vector
         * @param {number} scalar - Scalar value
         * @returns {Object} Result vector
         */
        multiplyScalar: (vector, scalar) => ({
            x: vector.x * scalar,
            y: vector.y * scalar,
            z: vector.z * scalar
        }),

        /**
         * Calculate vector magnitude
         * @param {Object} vector - Input vector
         * @returns {number} Vector magnitude
         */
        magnitude: (vector) => {
            return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
        },

        /**
         * Normalize vector to unit length
         * @param {Object} vector - Input vector
         * @returns {Object} Normalized vector
         */
        normalize: (vector) => {
            const mag = Vector3.magnitude(vector);
            if (mag === 0) return Vector3.create();
            return Vector3.multiplyScalar(vector, 1 / mag);
        },

        /**
         * Calculate dot product of two vectors
         * @param {Object} a - First vector
         * @param {Object} b - Second vector
         * @returns {number} Dot product
         */
        dot: (a, b) => {
            return a.x * b.x + a.y * b.y + a.z * b.z;
        },

        /**
         * Calculate cross product of two vectors
         * @param {Object} a - First vector
         * @param {Object} b - Second vector
         * @returns {Object} Cross product vector
         */
        cross: (a, b) => ({
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x
        }),

        /**
         * Calculate distance between two points
         * @param {Object} a - First point
         * @param {Object} b - Second point
         * @returns {number} Distance
         */
        distance: (a, b) => {
            return Vector3.magnitude(Vector3.subtract(a, b));
        },

        /**
         * Linear interpolation between two vectors
         * @param {Object} a - Start vector
         * @param {Object} b - End vector
         * @param {number} t - Interpolation factor (0-1)
         * @returns {Object} Interpolated vector
         */
        lerp: (a, b, t) => ({
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t,
            z: a.z + (b.z - a.z) * t
        }),

        /**
         * Spherical linear interpolation
         * @param {Object} a - Start vector (normalized)
         * @param {Object} b - End vector (normalized)
         * @param {number} t - Interpolation factor (0-1)
         * @returns {Object} Interpolated vector
         */
        slerp: (a, b, t) => {
            const dot = Vector3.dot(a, b);
            const theta = Math.acos(Math.max(-1, Math.min(1, dot)));
            const sinTheta = Math.sin(theta);

            if (Math.abs(sinTheta) < CONSTANTS.EPSILON) {
                return Vector3.lerp(a, b, t);
            }

            const factorA = Math.sin((1 - t) * theta) / sinTheta;
            const factorB = Math.sin(t * theta) / sinTheta;

            return Vector3.add(
                Vector3.multiplyScalar(a, factorA),
                Vector3.multiplyScalar(b, factorB)
            );
        }
    };

    /**
     * Orbital mechanics calculations
     */
    const OrbitalMechanics = {
        /**
         * Calculate orbital position using parametric equations
         * @param {Object} params - Orbital parameters
         * @returns {Object} Position vector
         */
        calculateOrbitalPosition: (params) => {
            const {
                semiMajorAxis,
                eccentricity = 0,
                inclination = 0,
                argumentOfPeriapsis = 0,
                longitudeOfAscendingNode = 0,
                trueAnomaly
            } = params;

            // Calculate distance from focus
            const radius = (semiMajorAxis * (1 - eccentricity * eccentricity)) /
                          (1 + eccentricity * Math.cos(trueAnomaly));

            // Position in orbital plane
            const x_orbital = radius * Math.cos(trueAnomaly);
            const y_orbital = radius * Math.sin(trueAnomaly);
            const z_orbital = 0;

            // Apply rotations for 3D orientation
            const position = OrbitalMechanics.applyOrbitalRotations(
                { x: x_orbital, y: y_orbital, z: z_orbital },
                inclination,
                argumentOfPeriapsis,
                longitudeOfAscendingNode
            );

            return position;
        },

        /**
         * Apply orbital rotations to transform from orbital plane to 3D space
         * @param {Object} position - Position in orbital plane
         * @param {number} inclination - Orbital inclination
         * @param {number} argumentOfPeriapsis - Argument of periapsis
         * @param {number} longitudeOfAscendingNode - Longitude of ascending node
         * @returns {Object} Transformed position
         */
        applyOrbitalRotations: (position, inclination, argumentOfPeriapsis, longitudeOfAscendingNode) => {
            let { x, y, z } = position;

            // Rotation matrices for orbital mechanics
            // 1. Rotate by argument of periapsis around z-axis
            const cosAP = Math.cos(argumentOfPeriapsis);
            const sinAP = Math.sin(argumentOfPeriapsis);
            let x1 = x * cosAP - y * sinAP;
            let y1 = x * sinAP + y * cosAP;
            let z1 = z;

            // 2. Rotate by inclination around x-axis
            const cosI = Math.cos(inclination);
            const sinI = Math.sin(inclination);
            let x2 = x1;
            let y2 = y1 * cosI - z1 * sinI;
            let z2 = y1 * sinI + z1 * cosI;

            // 3. Rotate by longitude of ascending node around z-axis
            const cosLAN = Math.cos(longitudeOfAscendingNode);
            const sinLAN = Math.sin(longitudeOfAscendingNode);
            let x3 = x2 * cosLAN - y2 * sinLAN;
            let y3 = x2 * sinLAN + y2 * cosLAN;
            let z3 = z2;

            return { x: x3, y: y3, z: z3 };
        },

        /**
         * Calculate true anomaly from mean anomaly (simplified)
         * @param {number} meanAnomaly - Mean anomaly in radians
         * @param {number} eccentricity - Orbital eccentricity
         * @returns {number} True anomaly in radians
         */
        meanAnomalyToTrueAnomaly: (meanAnomaly, eccentricity) => {
            // Solve Kepler's equation using Newton-Raphson method
            let eccentricAnomaly = meanAnomaly;

            for (let i = 0; i < 10; i++) {
                const delta = (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) /
                             (1 - eccentricity * Math.cos(eccentricAnomaly));
                eccentricAnomaly -= delta;

                if (Math.abs(delta) < CONSTANTS.EPSILON) break;
            }

            // Convert eccentric anomaly to true anomaly
            const trueAnomaly = 2 * Math.atan2(
                Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
                Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
            );

            return trueAnomaly;
        },

        /**
         * Calculate orbital velocity at given position
         * @param {number} radius - Distance from central body
         * @param {number} semiMajorAxis - Semi-major axis
         * @param {number} centralBodyMass - Mass of central body
         * @returns {number} Orbital velocity
         */
        calculateOrbitalVelocity: (radius, semiMajorAxis, centralBodyMass) => {
            // Vis-viva equation: v² = GM(2/r - 1/a)
            const GM = CONSTANTS.GRAVITATIONAL_CONSTANT * centralBodyMass;
            const velocitySquared = GM * (2 / radius - 1 / semiMajorAxis);
            return Math.sqrt(Math.max(0, velocitySquared));
        }
    };

    /**
     * Scaling utilities for visualization
     */
    const Scaling = {
        /**
         * Scale planetary sizes for visualization
         * @param {number} realDiameter - Real diameter in km
         * @param {number} scaleFactor - Scaling factor
         * @returns {number} Scaled radius for Three.js
         */
        scalePlanetSize: (realDiameter, scaleFactor = CONSTANTS.DEFAULT_SIZE_SCALE) => {
            const radius = (realDiameter / 2) / scaleFactor;
            return Math.max(radius, 0.01); // Minimum visible size
        },

        /**
         * Scale orbital distances for visualization
         * @param {number} realDistanceAU - Real distance in AU
         * @param {number} scaleFactor - Scaling factor
         * @returns {number} Scaled distance
         */
        scaleOrbitalDistance: (realDistanceAU, scaleFactor = CONSTANTS.DEFAULT_DISTANCE_SCALE) => {
            const scaledDistance = realDistanceAU * scaleFactor;
            return Math.max(scaledDistance, 0.5); // Minimum distance from center
        },

        /**
         * Scale time for animation speed
         * @param {number} realPeriodDays - Real orbital period in days
         * @param {number} speedMultiplier - Animation speed multiplier
         * @returns {number} Animation period in milliseconds
         */
        scaleTime: (realPeriodDays, speedMultiplier = 1000) => {
            // Convert to animation time (faster for visualization)
            const baseAnimationTime = 10000; // 10 seconds for Earth orbit
            return (realPeriodDays / 365.25) * baseAnimationTime / speedMultiplier;
        },

        /**
         * Calculate logarithmic scaling for extreme ranges
         * @param {number} value - Value to scale
         * @param {number} min - Minimum value in range
         * @param {number} max - Maximum value in range
         * @param {number} outputMin - Output minimum
         * @param {number} outputMax - Output maximum
         * @returns {number} Logarithmically scaled value
         */
        logScale: (value, min, max, outputMin, outputMax) => {
            const logMin = Math.log(min);
            const logMax = Math.log(max);
            const logValue = Math.log(value);

            const normalizedLog = (logValue - logMin) / (logMax - logMin);
            return outputMin + normalizedLog * (outputMax - outputMin);
        }
    };

    /**
     * Noise and procedural generation utilities
     */
    const Noise = {
        /**
         * Simple 1D noise function
         * @param {number} x - Input value
         * @returns {number} Noise value between -1 and 1
         */
        noise1D: (x) => {
            x = (x << 13) ^ x;
            return (1.0 - ((x * (x * x * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0);
        },

        /**
         * Simple 2D noise function (pseudo-random)
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @returns {number} Noise value between -1 and 1
         */
        noise2D: (x, y) => {
            const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
            return (n - Math.floor(n)) * 2 - 1;
        },

        /**
         * Fractal noise (sum of octaves)
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @param {number} octaves - Number of octaves
         * @param {number} persistence - Amplitude persistence
         * @returns {number} Fractal noise value
         */
        fractalNoise2D: (x, y, octaves = 4, persistence = 0.5) => {
            let value = 0;
            let amplitude = 1;
            let frequency = 1;
            let maxValue = 0;

            for (let i = 0; i < octaves; i++) {
                value += Noise.noise2D(x * frequency, y * frequency) * amplitude;
                maxValue += amplitude;
                amplitude *= persistence;
                frequency *= 2;
            }

            return value / maxValue;
        },

        /**
         * Generate smooth random values for star positions
         * @param {number} seed - Random seed
         * @param {number} count - Number of values
         * @returns {Array} Array of random values
         */
        generateStarPositions: (seed, count) => {
            const positions = [];
            let rng = seed;

            for (let i = 0; i < count; i++) {
                // Simple linear congruential generator
                rng = (rng * 1664525 + 1013904223) % Math.pow(2, 32);

                // Generate spherical coordinates
                const phi = (rng / Math.pow(2, 32)) * CONSTANTS.TAU; // Azimuth
                rng = (rng * 1664525 + 1013904223) % Math.pow(2, 32);
                const cosTheta = 2 * (rng / Math.pow(2, 32)) - 1; // Cos of polar angle
                const theta = Math.acos(cosTheta);

                // Convert to Cartesian coordinates on unit sphere
                const radius = 100 + Math.random() * 500; // Varying distances
                const x = radius * Math.sin(theta) * Math.cos(phi);
                const y = radius * Math.sin(theta) * Math.sin(phi);
                const z = radius * Math.cos(theta);

                positions.push({ x, y, z, brightness: Math.random() });
            }

            return positions;
        }
    };

    /**
     * Spherical mathematics for celestial mechanics
     */
    const Spherical = {
        /**
         * Convert Cartesian to spherical coordinates
         * @param {Object} cartesian - Cartesian coordinates {x, y, z}
         * @returns {Object} Spherical coordinates {radius, theta, phi}
         */
        cartesianToSpherical: (cartesian) => {
            const { x, y, z } = cartesian;
            const radius = Math.sqrt(x * x + y * y + z * z);
            const theta = Math.atan2(y, x); // Azimuth
            const phi = Math.acos(z / radius); // Polar angle

            return { radius, theta, phi };
        },

        /**
         * Convert spherical to Cartesian coordinates
         * @param {Object} spherical - Spherical coordinates {radius, theta, phi}
         * @returns {Object} Cartesian coordinates {x, y, z}
         */
        sphericalToCartesian: (spherical) => {
            const { radius, theta, phi } = spherical;
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            return { x, y, z };
        },

        /**
         * Calculate great circle distance between two points on sphere
         * @param {Object} point1 - First point {lat, lon} in radians
         * @param {Object} point2 - Second point {lat, lon} in radians
         * @param {number} radius - Sphere radius
         * @returns {number} Great circle distance
         */
        greatCircleDistance: (point1, point2, radius = 1) => {
            const { lat: lat1, lon: lon1 } = point1;
            const { lat: lat2, lon: lon2 } = point2;

            const deltaLat = lat2 - lat1;
            const deltaLon = lon2 - lon1;

            const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                     Math.cos(lat1) * Math.cos(lat2) *
                     Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return radius * c;
        }
    };

    /**
     * Camera mathematics for 3D positioning
     */
    const Camera = {
        /**
         * Calculate camera position for optimal viewing
         * @param {Object} target - Target position to look at
         * @param {number} distance - Distance from target
         * @param {number} elevation - Elevation angle in radians
         * @param {number} azimuth - Azimuth angle in radians
         * @returns {Object} Camera position
         */
        calculateCameraPosition: (target, distance, elevation, azimuth) => {
            const x = target.x + distance * Math.cos(elevation) * Math.cos(azimuth);
            const y = target.y + distance * Math.sin(elevation);
            const z = target.z + distance * Math.cos(elevation) * Math.sin(azimuth);

            return { x, y, z };
        },

        /**
         * Calculate field of view for given distance and object size
         * @param {number} objectSize - Size of object to view
         * @param {number} distance - Distance to object
         * @returns {number} Recommended field of view in radians
         */
        calculateFOV: (objectSize, distance) => {
            return 2 * Math.atan(objectSize / (2 * distance));
        },

        /**
         * Calculate zoom factor to fit object in view
         * @param {number} objectSize - Size of object
         * @param {number} viewportSize - Viewport dimension
         * @param {number} currentDistance - Current camera distance
         * @returns {number} Required zoom factor
         */
        calculateZoomToFit: (objectSize, viewportSize, currentDistance) => {
            const requiredDistance = (objectSize * currentDistance) / viewportSize;
            return currentDistance / requiredDistance;
        }
    };

    /**
     * Utility functions for astronomical calculations
     */
    const Astronomy = {
        /**
         * Convert astronomical units to kilometers
         * @param {number} au - Distance in AU
         * @returns {number} Distance in kilometers
         */
        auToKm: (au) => au * CONSTANTS.AU_IN_KM,

        /**
         * Convert kilometers to astronomical units
         * @param {number} km - Distance in kilometers
         * @returns {number} Distance in AU
         */
        kmToAu: (km) => km / CONSTANTS.AU_IN_KM,

        /**
         * Calculate apparent magnitude based on distance and intrinsic brightness
         * @param {number} intrinsicBrightness - Intrinsic brightness
         * @param {number} distance - Distance from observer
         * @returns {number} Apparent magnitude
         */
        calculateApparentMagnitude: (intrinsicBrightness, distance) => {
            // Simplified magnitude calculation
            return intrinsicBrightness + 5 * Math.log10(distance / 10);
        },

        /**
         * Calculate angular size of object
         * @param {number} diameter - Object diameter
         * @param {number} distance - Distance to object
         * @returns {number} Angular size in radians
         */
        calculateAngularSize: (diameter, distance) => {
            return 2 * Math.atan(diameter / (2 * distance));
        },

        /**
         * Calculate Hill sphere radius (sphere of gravitational influence)
         * @param {number} primaryMass - Mass of primary body
         * @param {number} secondaryMass - Mass of secondary body
         * @param {number} semiMajorAxis - Orbital semi-major axis
         * @returns {number} Hill sphere radius
         */
        calculateHillSphere: (primaryMass, secondaryMass, semiMajorAxis) => {
            return semiMajorAxis * Math.pow(secondaryMass / (3 * primaryMass), 1/3);
        }
    };

    // Public API
    return {
        Vector3,
        OrbitalMechanics,
        Scaling,
        Noise,
        Spherical,
        Camera,
        Astronomy,
        CONSTANTS,

        // Convenience functions
        degToRad: (degrees) => degrees * (Math.PI / 180),
        radToDeg: (radians) => radians * (180 / Math.PI),

        /**
         * Clamp value between min and max
         * @param {number} value - Value to clamp
         * @param {number} min - Minimum value
         * @param {number} max - Maximum value
         * @returns {number} Clamped value
         */
        clamp: (value, min, max) => Math.min(Math.max(value, min), max),

        /**
         * Generate deterministic random number from seed
         * @param {number} seed - Random seed
         * @returns {number} Pseudo-random number between 0 and 1
         */
        seededRandom: (seed) => {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        },

        /**
         * Calculate smooth step interpolation
         * @param {number} edge0 - Lower edge
         * @param {number} edge1 - Upper edge
         * @param {number} x - Input value
         * @returns {number} Smooth step result
         */
        smoothstep: (edge0, edge1, x) => {
            const t = MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
            return t * t * (3 - 2 * t);
        },

        /**
         * Calculate smoother step interpolation
         * @param {number} edge0 - Lower edge
         * @param {number} edge1 - Upper edge
         * @param {number} x - Input value
         * @returns {number} Smoother step result
         */
        smootherstep: (edge0, edge1, x) => {
            const t = MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
            return t * t * t * (t * (t * 6 - 15) + 10);
        }
    };
})();

// Make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.MathUtils;
}

console.log('MathUtils module loaded successfully');