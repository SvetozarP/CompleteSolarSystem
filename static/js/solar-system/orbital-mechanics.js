// static/js/solar-system/orbital-mechanics.js
// Orbital animation system with speed-based control (no pause state)

window.OrbitalMechanics = (function() {
    'use strict';

    /**
     * Orbital mechanics system for animating planet orbits
     */
    class OrbitalMechanics {
        constructor(options = {}) {
            this.options = {
                timeScale: 20,         // Base time scale (days per second)
                enableElliptical: false,
                showOrbitalPaths: true,
                pathOpacity: 0.3,
                pathSegments: 128,
                ...options
            };

            this.orbitingBodies = new Map();
            this.orbitalPaths = new Map();
            this.time = 0;
            this.lastUpdateTime = 0;

            // MODIFIED: Remove isPaused, use currentSpeedMultiplier instead
            this.currentSpeedMultiplier = 1.0; // Speed multiplier (can be 0)
            this.scene = null;
        }

        /**
         * Initialize orbital mechanics system
         */
        init(scene) {
            this.scene = scene;
            this.lastUpdateTime = Date.now();

            if (window.Helpers) {
                window.Helpers.log('Orbital mechanics system initialized with speed-based control', 'debug');
            }
        }

        /**
         * Add a planet to orbital animation
         */
        addOrbitingBody(planetMesh, planetData) {
            if (!planetMesh || !planetData) return;

            const planetName = planetData.name.toLowerCase();

            if (planetName === 'sun') {
                return;
            }

            const orbitalParams = this.calculateOrbitalParameters(planetData);

            this.orbitingBodies.set(planetName, {
                mesh: planetMesh,
                data: planetData,
                params: orbitalParams,
                currentAngle: Math.random() * Math.PI * 2,
                rotationAngle: Math.random() * Math.PI * 2
            });

            if (this.options.showOrbitalPaths) {
                this.createOrbitalPath(planetName, orbitalParams);
            }

            if (window.Helpers) {
                window.Helpers.log(`Added orbiting body: ${planetData.name} - Period: ${orbitalParams.period.toFixed(1)} days`, 'debug');
            }
        }

        /**
         * Calculate orbital parameters from planet data
         */
        calculateOrbitalParameters(planetData) {
            const DISTANCE_SCALE_FACTOR = 25;
            const DISTANCE_MULTIPLIERS = {
                'mercury': 2.0,
                'venus': 2.5,
                'earth': 3.0,
                'mars': 4.5,
                'jupiter': 2.5,
                'saturn': 2.2,
                'uranus': 1.8,
                'neptune': 1.5,
                'pluto': 1.2
            };

            const planetName = planetData.name.toLowerCase();
            const multiplier = DISTANCE_MULTIPLIERS[planetName] || 1.0;

            const orbitalRadius = Math.max(
                planetData.distance_from_sun * DISTANCE_SCALE_FACTOR * multiplier,
                20
            );

            const orbitalPeriod = planetData.orbital_period;
            const angularVelocity = (2 * Math.PI) / orbitalPeriod;

            const rotationPeriod = Math.abs(planetData.rotation_period) / 24;
            const rotationVelocity = (2 * Math.PI) / rotationPeriod * 0.05;
            const isRetrograde = planetData.rotation_period < 0;

            return {
                radius: orbitalRadius,
                period: orbitalPeriod,
                angularVelocity: angularVelocity,
                rotationVelocity: isRetrograde ? -rotationVelocity : rotationVelocity,
                eccentricity: planetData.orbital_eccentricity || 0,
                inclination: 0,
                isRetrograde: isRetrograde
            };
        }

        /**
         * Create orbital path visualization
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
            orbitalPath.rotation.x = Math.PI / 2;
            orbitalPath.name = `${planetName}_orbit_path`;

            this.orbitalPaths.set(planetName, orbitalPath);
            this.scene.add(orbitalPath);
        }

        /**
         * MODIFIED: Update orbital positions with speed-based control
         */
        update(deltaTime, speedMultiplier = 1) {
            // MODIFIED: Use speed multiplier instead of pause check
            this.currentSpeedMultiplier = speedMultiplier;

            // Calculate time progression - will be 0 if speedMultiplier is 0
            const timeProgression = deltaTime * this.options.timeScale * this.currentSpeedMultiplier;
            this.time += timeProgression;

            // Update each orbiting body
            this.orbitingBodies.forEach((body, planetName) => {
                this.updatePlanetPosition(body, timeProgression);
                this.updatePlanetRotation(body, timeProgression);
            });
        }

        /**
         * Update planet orbital position
         */
        updatePlanetPosition(body, timeProgression) {
            const { mesh, params } = body;

            body.currentAngle += params.angularVelocity * timeProgression;

            if (body.currentAngle > Math.PI * 2) {
                body.currentAngle -= Math.PI * 2;
            }

            const x = Math.cos(body.currentAngle) * params.radius;
            const z = Math.sin(body.currentAngle) * params.radius;
            const y = 0;

            mesh.position.set(x, y, z);
        }

        /**
         * MINIMAL FIX: Update planet self-rotation - ONLY modify Venus and Uranus behavior
         */
        updatePlanetRotation(body, timeProgression) {
            const { mesh, params, data } = body;
            const planetName = data.name.toLowerCase();
            const rotationDelta = params.rotationVelocity * timeProgression;

            if (planetName === 'venus') {
                mesh.rotation.y -= Math.abs(rotationDelta);

            } else if (planetName === 'uranus') {
                mesh.rotation.x += rotationDelta;

                // URANUS FIX: Apply ring and moon alignment
                this.fixUranusRingAndMoonAlignment(mesh);

            } else {
                mesh.rotation.y += rotationDelta;
            }

            body.rotationAngle += rotationDelta;
        }


        /**
         * URANUS FIX: Keep rings aligned with planet's equator and moons in solar system plane
         */
        fixUranusRingAndMoonAlignment(uranusMesh) {
            // Fix rings: align with planet's tilted equator
            const rings = uranusMesh.getObjectByName('Uranus_rings');
            if (rings) {
                rings.rotation.z = THREE.MathUtils.degToRad(98);
            }

            // Fix moons: keep in solar system plane
            const moonSystem = uranusMesh.getObjectByName('Uranus_moons');
            if (moonSystem) {
                moonSystem.rotation.set(0, 0, 0);

                // Update moon positions to stay in horizontal plane
                moonSystem.children.forEach(moon => {
                    if (moon.userData && moon.userData.type === 'moon') {
                        const userData = moon.userData;
                        if (userData.orbitalAngle === undefined) {
                            userData.orbitalAngle = Math.random() * Math.PI * 2;
                        }

                        const radius = userData.orbitalRadius || 10;
                        const x = Math.cos(userData.orbitalAngle) * radius;
                        const z = Math.sin(userData.orbitalAngle) * radius;
                        const y = 0; // Keep in solar system plane

                        moon.position.set(x, y, z);
                    }
                });
            }
        }

        // MINIMAL SETUP FIX: Only apply initial tilts, don't change rotation axes
        setupSpecialRotations(planetMesh, planetData) {
            const planetName = planetData.name.toLowerCase();

            // ONLY apply initial tilts - don't modify rotation behavior
            switch (planetName) {
                case 'venus':
                    // Venus: Apply 177.4° tilt to show it's nearly upside down
                    planetMesh.rotation.z = THREE.MathUtils.degToRad(177.4);
                    break;

                case 'uranus':
                    // Uranus: Apply 98° tilt so it's on its side
                    planetMesh.rotation.z = THREE.MathUtils.degToRad(98);
                    break;
            }
        }

        /**
         * MODIFIED: Set speed multiplier instead of play/pause
         */
        setSpeed(speedMultiplier) {
            this.currentSpeedMultiplier = speedMultiplier;

            if (window.Helpers) {
                window.Helpers.log(`Orbital animation speed set to ${speedMultiplier}x`, 'debug');
            }
        }

        /**
         * DEPRECATED: Kept for compatibility but maps to speed control
         */
        setPlaying(playing) {
            // Map old play/pause to speed 0/1 for compatibility
            this.setSpeed(playing ? 1.0 : 0);

            if (window.Helpers) {
                window.Helpers.log(`Orbital animation ${playing ? 'resumed' : 'paused'} (using speed control)`, 'debug');
            }
        }

        /**
         * Reset all planets to initial positions
         */
        resetPositions() {
            this.time = 0;

            this.orbitingBodies.forEach((body, planetName) => {
                body.currentAngle = Math.random() * Math.PI * 2;
                body.rotationAngle = Math.random() * Math.PI * 2;

                this.updatePlanetPosition(body, 0);
                this.updatePlanetRotation(body, 0);
            });

            if (window.Helpers) {
                window.Helpers.log('All planetary positions reset', 'debug');
            }
        }

        /**
         * Show or hide orbital paths
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
         */
        getPlanetPosition(planetName) {
            const body = this.orbitingBodies.get(planetName.toLowerCase());
            return body ? body.mesh.position.clone() : null;
        }

        /**
         * Get planet orbital data by name
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
         */
        getSimulationTime() {
            return this.time;
        }

        /**
         * Get simulation time in years
         */
        getSimulationTimeYears() {
            return this.time / 365.25;
        }

        /**
         * Get formatted simulation time
         */
        getFormattedTime() {
            const totalDays = Math.floor(this.time);
            const years = Math.floor(totalDays / 365.25);
            const remainingDays = Math.floor(totalDays % 365.25);

            if (years > 0) {
                return `${years}y ${remainingDays}d`;
            } else if (totalDays >= 30) {
                const months = Math.floor(totalDays / 30.44);
                const remainingDaysInMonth = Math.floor(totalDays % 30.44);
                return `${months}m ${remainingDaysInMonth}d`;
            } else {
                return `${totalDays}d`;
            }
        }

        /**
         * Calculate relative positions between planets
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
         */
        setOrbitalPathOpacity(opacity) {
            this.options.pathOpacity = Math.max(0, Math.min(1, opacity));

            this.orbitalPaths.forEach((path) => {
                path.material.opacity = this.options.pathOpacity;
            });
        }

        /**
         * MODIFIED: Get orbital statistics with speed-based state
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
                earthCompletedOrbits: earthCompletedOrbits.toFixed(3),
                currentSpeedMultiplier: this.currentSpeedMultiplier, // MODIFIED: Show speed instead of pause state
                isAtZeroSpeed: this.currentSpeedMultiplier === 0, // NEW: Indicates if effectively "paused"
                pathsVisible: this.options.showOrbitalPaths,
                baseTimeScale: this.options.timeScale
            };
        }

        /**
         * Enable performance mode
         */
        setPerformanceMode(enabled) {
            if (enabled) {
                this.options.pathSegments = 64;
                this.setOrbitalPathOpacity(0.1);
            } else {
                this.options.pathSegments = 128;
                this.setOrbitalPathOpacity(0.3);
            }

            this.recreateOrbitalPaths();
        }

        /**
         * Recreate orbital paths with current settings
         */
        recreateOrbitalPaths() {
            this.orbitalPaths.forEach((path) => {
                this.scene.remove(path);
                path.geometry.dispose();
                path.material.dispose();
            });
            this.orbitalPaths.clear();

            if (this.options.showOrbitalPaths) {
                this.orbitingBodies.forEach((body, planetName) => {
                    this.createOrbitalPath(planetName, body.params);
                });
            }
        }

        /**
         * Get planet by name
         */
        getPlanet(planetName) {
            const body = this.orbitingBodies.get(planetName.toLowerCase());
            return body ? body.mesh : null;
        }

        /**
         * Check if planet exists in orbital system
         */
        hasPlanet(planetName) {
            return this.orbitingBodies.has(planetName.toLowerCase());
        }

        /**
         * Get all planet names in orbital system
         */
        getPlanetNames() {
            return Array.from(this.orbitingBodies.keys());
        }

        /**
         * Get current speed multiplier
         */
        getCurrentSpeed() {
            return this.currentSpeedMultiplier;
        }

        /**
         * Check if animation is effectively paused (speed = 0)
         */
        isEffectivelyPaused() {
            return this.currentSpeedMultiplier === 0;
        }

        /**
         * DEPRECATED: Kept for compatibility
         */
        get IsPaused() {
            return this.currentSpeedMultiplier === 0;
        }

        /**
         * Dispose of orbital mechanics system
         */
        dispose() {
            this.orbitalPaths.forEach((path) => {
                this.scene.remove(path);
                if (path.geometry) path.geometry.dispose();
                if (path.material) path.material.dispose();
            });

            this.orbitingBodies.clear();
            this.orbitalPaths.clear();

            this.scene = null;
            this.time = 0;

            if (window.Helpers) {
                window.Helpers.log('Orbital mechanics system disposed', 'debug');
            }
        }

        // Getters for external access - MODIFIED for speed-based approach
        get OrbitingBodyCount() { return this.orbitingBodies.size; }
        get SimulationTime() { return this.time; }
        get CurrentSpeed() { return this.currentSpeedMultiplier; } // NEW
        get IsAtZeroSpeed() { return this.currentSpeedMultiplier === 0; } // NEW
        get TimeSpeed() { return this.currentSpeedMultiplier; } // MODIFIED: Return speed multiplier
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
            const G = 6.67430e-11;
            return Math.sqrt(G * centralMass / radius);
        },

        degreesToRadians: (degrees) => degrees * (Math.PI / 180),
        radiansToDegrees: (radians) => radians * (180 / Math.PI),

        // Constants
        EARTH_ORBITAL_PERIOD: 365.25,
        AU_TO_KM: 149597870.7,
        SECONDS_PER_DAY: 86400
    };
})();

console.log('OrbitalMechanics with speed-based control loaded successfully');