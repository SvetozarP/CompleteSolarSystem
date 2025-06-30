// static/js/solar-system/orbital-mechanics.js
// Realistic orbital animation system with accurate relative speeds

window.OrbitalMechanics = (function() {
    'use strict';

    /**
     * Orbital mechanics system for animating planet orbits
     */
    class OrbitalMechanics {
        constructor(options = {}) {
            this.options = {
                timeScale: 20,         // Reduced from 100 - Much slower orbital motion
                pausedTimeScale: 0,    // Time scale when paused
                realTimeScale: 1,      // Real-time scaling factor
                enableElliptical: false, // Circular orbits for now
                showOrbitalPaths: true,
                pathOpacity: 0.3,
                pathSegments: 128,
                ...options
            };

            this.orbitingBodies = new Map();
            this.orbitalPaths = new Map();
            this.time = 0;
            this.lastUpdateTime = 0;
            this.isPaused = false;
            this.currentTimeScale = this.options.timeScale;
            this.scene = null;
        }

        /**
         * Initialize orbital mechanics system
         * @param {THREE.Scene} scene - Three.js scene
         */
        init(scene) {
            this.scene = scene;
            this.lastUpdateTime = Date.now();

            if (window.Helpers) {
                window.Helpers.log('Orbital mechanics system initialized', 'debug');
            }
        }

        /**
         * Add a planet to orbital animation
         * @param {THREE.Mesh} planetMesh - Planet mesh
         * @param {Object} planetData - Planet data from database
         */
        addOrbitingBody(planetMesh, planetData) {
            if (!planetMesh || !planetData) return;

            const planetName = planetData.name.toLowerCase();

            // Skip the sun (doesn't orbit)
            if (planetName === 'sun') {
                return;
            }

            // Calculate orbital parameters
            const orbitalParams = this.calculateOrbitalParameters(planetData);

            // Store orbital body data
            this.orbitingBodies.set(planetName, {
                mesh: planetMesh,
                data: planetData,
                params: orbitalParams,
                currentAngle: Math.random() * Math.PI * 2, // Random starting position
                rotationAngle: Math.random() * Math.PI * 2
            });

            // Create orbital path visualization
            if (this.options.showOrbitalPaths) {
                this.createOrbitalPath(planetName, orbitalParams);
            }

            if (window.Helpers) {
                window.Helpers.log(`Added orbiting body: ${planetData.name} - Period: ${orbitalParams.period.toFixed(1)} days`, 'debug');
            }
        }

        /**
         * Calculate orbital parameters from planet data
         * @param {Object} planetData - Planet data
         * @returns {Object} Orbital parameters
         */
        calculateOrbitalParameters(planetData) {
            // Use the same scaling as PlanetFactory (updated values)
            const DISTANCE_SCALE_FACTOR = 25; // Updated to match PlanetFactory
            const DISTANCE_MULTIPLIERS = {
                'mercury': 2.0,  // Updated to match PlanetFactory
                'venus': 2.5,    // Updated to match PlanetFactory
                'earth': 3.0,    // Updated to match PlanetFactory
                'mars': 4.5,     // Updated to match PlanetFactory - much further from Earth
                'jupiter': 2.5,  // Updated to match PlanetFactory - much further from Mars
                'saturn': 2.2,   // Updated to match PlanetFactory
                'uranus': 1.8,   // Updated to match PlanetFactory
                'neptune': 1.5,  // Updated to match PlanetFactory
                'pluto': 1.2     // Updated to match PlanetFactory
            };

            const planetName = planetData.name.toLowerCase();
            const multiplier = DISTANCE_MULTIPLIERS[planetName] || 1.0;

            // Calculate orbital radius (same as PlanetFactory distance calculation)
            const orbitalRadius = Math.max(
                planetData.distance_from_sun * DISTANCE_SCALE_FACTOR * multiplier,
                20 // Minimum distance
            );

            // Orbital period in Earth days
            const orbitalPeriod = planetData.orbital_period;

            // Calculate angular velocity (radians per day)
            const angularVelocity = (2 * Math.PI) / orbitalPeriod;

            // Rotation period for planet spin (much slower)
            const rotationPeriod = Math.abs(planetData.rotation_period) / 24; // Convert hours to days
            const rotationVelocity = (2 * Math.PI) / rotationPeriod * 0.05; // Much slower rotation (5x slower than before)

            // Handle retrograde rotation
            const isRetrograde = planetData.rotation_period < 0;

            return {
                radius: orbitalRadius,
                period: orbitalPeriod,
                angularVelocity: angularVelocity,
                rotationVelocity: isRetrograde ? -rotationVelocity : rotationVelocity,
                eccentricity: planetData.orbital_eccentricity || 0,
                inclination: 0, // Simplified - no inclination for now
                isRetrograde: isRetrograde
            };
        }

        /**
         * Create orbital path visualization
         * @param {string} planetName - Planet name
         * @param {Object} orbitalParams - Orbital parameters
         */
        createOrbitalPath(planetName, orbitalParams) {
            const geometry = new THREE.RingGeometry(
                orbitalParams.radius - 0.1,
                orbitalParams.radius + 0.1,
                this.options.pathSegments
            );

            const material = new THREE.MeshBasicMaterial({
                color: 0x444444,
                transparent: true,
                opacity: this.options.pathOpacity,
                side: THREE.DoubleSide
            });

            const orbitalPath = new THREE.Mesh(geometry, material);
            orbitalPath.rotation.x = Math.PI / 2; // Rotate to lie flat
            orbitalPath.name = `${planetName}_orbit_path`;

            this.orbitalPaths.set(planetName, orbitalPath);
            this.scene.add(orbitalPath);
        }

        /**
         * Update orbital positions and rotations
         * @param {number} deltaTime - Time since last update in seconds
         * @param {number} speedMultiplier - Animation speed multiplier
         */
        update(deltaTime, speedMultiplier = 1) {
            if (this.isPaused) return;

            // Calculate time progression in simulation days
            // timeScale is days per second, so deltaTime * timeScale * speedMultiplier = days elapsed
            const timeProgression = deltaTime * this.currentTimeScale * speedMultiplier;
            this.time += timeProgression;

            // Update each orbiting body
            this.orbitingBodies.forEach((body, planetName) => {
                this.updatePlanetPosition(body, timeProgression);
                this.updatePlanetRotation(body, timeProgression);
            });
        }

        /**
         * Update planet orbital position
         * @param {Object} body - Orbiting body data
         * @param {number} timeProgression - Time progression in days
         */
        updatePlanetPosition(body, timeProgression) {
            const { mesh, params } = body;

            // Update orbital angle
            body.currentAngle += params.angularVelocity * timeProgression;

            // Keep angle in reasonable range
            if (body.currentAngle > Math.PI * 2) {
                body.currentAngle -= Math.PI * 2;
            }

            // Calculate position (circular orbit for now)
            const x = Math.cos(body.currentAngle) * params.radius;
            const z = Math.sin(body.currentAngle) * params.radius;
            const y = 0; // No inclination for now

            // Update mesh position
            mesh.position.set(x, y, z);
        }

        /**
         * Update planet self-rotation
         * @param {Object} body - Orbiting body data
         * @param {number} timeProgression - Time progression in days
         */
        updatePlanetRotation(body, timeProgression) {
            const { mesh, params } = body;

            // Update rotation angle
            body.rotationAngle += params.rotationVelocity * timeProgression;

            // Apply rotation to mesh
            mesh.rotation.y = body.rotationAngle;
        }

        /**
         * Play/pause orbital animation
         * @param {boolean} playing - Animation playing state
         */
        setPlaying(playing) {
            this.isPaused = !playing;

            if (window.Helpers) {
                window.Helpers.log(`Orbital animation ${playing ? 'resumed' : 'paused'}`, 'debug');
            }
        }

        /**
         * Set animation speed
         * @param {number} speed - Speed multiplier
         */
        setSpeed(speed) {
            this.currentTimeScale = this.options.timeScale * speed;

            if (window.Helpers) {
                window.Helpers.log(`Orbital animation speed set to ${speed}x`, 'debug');
            }
        }

        /**
         * Reset all planets to initial positions
         */
        resetPositions() {
            this.time = 0;

            this.orbitingBodies.forEach((body, planetName) => {
                // Reset to random starting positions
                body.currentAngle = Math.random() * Math.PI * 2;
                body.rotationAngle = Math.random() * Math.PI * 2;

                // Update position immediately
                this.updatePlanetPosition(body, 0);
                this.updatePlanetRotation(body, 0);
            });

            if (window.Helpers) {
                window.Helpers.log('All planetary positions reset', 'debug');
            }
        }

        /**
         * Show or hide orbital paths
         * @param {boolean} visible - Paths visible
         */
        setOrbitalPathsVisible(visible) {
            this.options.showOrbitalPaths = visible;

            this.orbitalPaths.forEach((path, planetName) => {
                path.visible = visible;
            });

            if (window.Helpers) {
                window.Helpers.log(`Orbital paths ${visible ? 'shown' : 'hidden'}`, 'debug');
            }
        }

        /**
         * Get planet position by name
         * @param {string} planetName - Planet name
         * @returns {THREE.Vector3|null} Planet position
         */
        getPlanetPosition(planetName) {
            const body = this.orbitingBodies.get(planetName.toLowerCase());
            return body ? body.mesh.position.clone() : null;
        }

        /**
         * Get planet orbital data by name
         * @param {string} planetName - Planet name
         * @returns {Object|null} Orbital data
         */
        getPlanetOrbitalData(planetName) {
            const body = this.orbitingBodies.get(planetName.toLowerCase());
            if (!body) return null;

            return {
                name: body.data.name,
                currentAngle: body.currentAngle,
                orbitalRadius: body.params.radius,
                orbitalPeriod: body.params.period,
                position: body.mesh.position.clone(),
                rotationAngle: body.rotationAngle
            };
        }

        /**
         * Get all orbital data
         * @returns {Array} Array of orbital data for all planets
         */
        getAllOrbitalData() {
            const data = [];
            this.orbitingBodies.forEach((body, planetName) => {
                data.push(this.getPlanetOrbitalData(planetName));
            });
            return data;
        }

        /**
         * Get simulation time in days
         * @returns {number} Simulation time
         */
        getSimulationTime() {
            return this.time;
        }

        /**
         * Get simulation time in years
         * @returns {number} Simulation time in years
         */
        getSimulationTimeYears() {
            return this.time / 365.25;
        }

        /**
         * Get formatted simulation time
         * @returns {string} Formatted time string
         */
        getFormattedTime() {
            const totalDays = Math.floor(this.time);
            const years = Math.floor(totalDays / 365.25);
            const remainingDays = Math.floor(totalDays % 365.25);

            if (years > 0) {
                return `${years}y ${remainingDays}d`;
            } else if (totalDays >= 30) {
                const months = Math.floor(totalDays / 30.44); // Average days per month
                const remainingDaysInMonth = Math.floor(totalDays % 30.44);
                return `${months}m ${remainingDaysInMonth}d`;
            } else {
                return `${totalDays}d`;
            }
        }

        /**
         * Calculate relative positions between planets
         * @param {string} planet1 - First planet name
         * @param {string} planet2 - Second planet name
         * @returns {Object|null} Distance and angle data
         */
        getRelativePosition(planet1, planet2) {
            const pos1 = this.getPlanetPosition(planet1);
            const pos2 = this.getPlanetPosition(planet2);

            if (!pos1 || !pos2) return null;

            const distance = pos1.distanceTo(pos2);
            const direction = pos2.clone().sub(pos1).normalize();

            return {
                distance: distance,
                direction: direction,
                planet1: planet1,
                planet2: planet2
            };
        }

        /**
         * Find the closest planet to a given position
         * @param {THREE.Vector3} position - Position to check from
         * @returns {Object|null} Closest planet data
         */
        getClosestPlanet(position) {
            let closestPlanet = null;
            let closestDistance = Infinity;

            this.orbitingBodies.forEach((body, planetName) => {
                const distance = position.distanceTo(body.mesh.position);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestPlanet = {
                        name: planetName,
                        distance: distance,
                        position: body.mesh.position.clone()
                    };
                }
            });

            return closestPlanet;
        }

        /**
         * Set orbital path opacity
         * @param {number} opacity - Opacity value (0-1)
         */
        setOrbitalPathOpacity(opacity) {
            this.options.pathOpacity = Math.max(0, Math.min(1, opacity));

            this.orbitalPaths.forEach((path) => {
                path.material.opacity = this.options.pathOpacity;
            });
        }

        /**
         * Get orbital statistics and verification data
         * @returns {Object} Orbital statistics
         */
        getStats() {
            const earthData = this.orbitingBodies.get('earth');
            const earthCompletedOrbits = earthData ? this.time / earthData.params.period : 0;

            return {
                orbitingBodyCount: this.orbitingBodies.size,
                orbitalPathCount: this.orbitalPaths.size,
                simulationTime: this.getFormattedTime(),
                simulationDays: this.time,
                simulationYears: this.getSimulationTimeYears(),
                earthCompletedOrbits: earthCompletedOrbits.toFixed(3), // For verification
                currentTimeScale: this.currentTimeScale,
                isPaused: this.isPaused,
                pathsVisible: this.options.showOrbitalPaths
            };
        }

        /**
         * Enable performance mode
         * @param {boolean} enabled - Performance mode enabled
         */
        setPerformanceMode(enabled) {
            if (enabled) {
                // Reduce orbital path segments for better performance
                this.options.pathSegments = 64;
                this.setOrbitalPathOpacity(0.1);
            } else {
                // Restore full quality
                this.options.pathSegments = 128;
                this.setOrbitalPathOpacity(0.3);
            }

            // Recreate orbital paths with new settings
            this.recreateOrbitalPaths();
        }

        /**
         * Recreate orbital paths with current settings
         */
        recreateOrbitalPaths() {
            // Remove existing paths
            this.orbitalPaths.forEach((path) => {
                this.scene.remove(path);
                path.geometry.dispose();
                path.material.dispose();
            });
            this.orbitalPaths.clear();

            // Recreate paths if enabled
            if (this.options.showOrbitalPaths) {
                this.orbitingBodies.forEach((body, planetName) => {
                    this.createOrbitalPath(planetName, body.params);
                });
            }
        }

        /**
         * Get planet by name
         * @param {string} planetName - Planet name
         * @returns {THREE.Mesh|null} Planet mesh
         */
        getPlanet(planetName) {
            const body = this.orbitingBodies.get(planetName.toLowerCase());
            return body ? body.mesh : null;
        }

        /**
         * Check if planet exists in orbital system
         * @param {string} planetName - Planet name
         * @returns {boolean} Planet exists
         */
        hasPlanet(planetName) {
            return this.orbitingBodies.has(planetName.toLowerCase());
        }

        /**
         * Get all planet names in orbital system
         * @returns {Array} Array of planet names
         */
        getPlanetNames() {
            return Array.from(this.orbitingBodies.keys());
        }

        /**
         * Dispose of orbital mechanics system
         */
        dispose() {
            // Remove orbital paths from scene
            this.orbitalPaths.forEach((path) => {
                this.scene.remove(path);
                if (path.geometry) path.geometry.dispose();
                if (path.material) path.material.dispose();
            });

            // Clear data structures
            this.orbitingBodies.clear();
            this.orbitalPaths.clear();

            this.scene = null;
            this.time = 0;

            if (window.Helpers) {
                window.Helpers.log('Orbital mechanics system disposed', 'debug');
            }
        }

        // Getters for external access
        get OrbitingBodyCount() { return this.orbitingBodies.size; }
        get SimulationTime() { return this.time; }
        get IsPaused() { return this.isPaused; }
        get TimeSpeed() { return this.currentTimeScale / this.options.timeScale; }
        get OrbitingBodies() { return this.orbitingBodies; }
    }

    // Public API
    return {
        OrbitalMechanics,

        // Factory function
        create: (options = {}) => {
            return new OrbitalMechanics(options);
        },

        // Utility functions
        calculateOrbitalVelocity: (radius, centralMass) => {
            // Simplified orbital velocity calculation
            const G = 6.67430e-11; // Gravitational constant
            return Math.sqrt(G * centralMass / radius);
        },

        degreesToRadians: (degrees) => degrees * (Math.PI / 180),
        radiansToDegrees: (radians) => radians * (180 / Math.PI),

        // Constants
        EARTH_ORBITAL_PERIOD: 365.25, // Earth days
        AU_TO_KM: 149597870.7, // 1 AU in kilometers
        SECONDS_PER_DAY: 86400
    };
})();

console.log('OrbitalMechanics module loaded successfully');