// static/js/solar-system/orbital-mechanics.js
// FIXED: Orbital animation system with proper Venus retrograde and Uranus tilt

window.OrbitalMechanics = (function() {
    'use strict';

    /**
     * Orbital mechanics system for animating planet orbits with correct rotations
     */
    class OrbitalMechanics {
        constructor(options = {}) {
            this.options = {
                timeScale: 20,         // Base time scale (days per second)
                enableElliptical: false,
                showOrbitalPaths: true,
                pathOpacity: 0.3,
                pathSegments: 128,
                enableRealisticRotations: true, // NEW: Enable realistic rotations
                ...options
            };

            this.orbitingBodies = new Map();
            this.orbitalPaths = new Map();
            this.time = 0;
            this.lastUpdateTime = 0;

            this.currentSpeedMultiplier = 1.0;
            this.scene = null;
        }

        /**
         * Initialize orbital mechanics system
         */
        init(scene) {
            this.scene = scene;
            this.lastUpdateTime = Date.now();

            if (window.Helpers) {
                window.Helpers.log('Orbital mechanics system initialized with realistic rotations', 'debug');
            }
        }

        /**
         * Add a planet to orbital animation with FIXED rotation parameters
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
                rotationAngle: Math.random() * Math.PI * 2,
                // NEW: Store initial rotation state for special cases
                initialRotationApplied: false
            });

            if (this.options.showOrbitalPaths) {
                this.createOrbitalPath(planetName, orbitalParams);
            }

            // FIXED: Apply special rotation setup for Venus and Uranus
            this.setupSpecialRotations(planetMesh, planetData);

            if (window.Helpers) {
                window.Helpers.log(`Added orbiting body: ${planetData.name} - Period: ${orbitalParams.period.toFixed(1)} days`, 'debug');
            }
        }

        /**
         * FIXED: Calculate orbital parameters with proper rotation handling
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

            // FIXED: Proper rotation calculation with special cases
            const rotationParams = this.calculateRotationParameters(planetData);

            return {
                radius: orbitalRadius,
                period: orbitalPeriod,
                angularVelocity: angularVelocity,
                rotationVelocity: rotationParams.velocity,
                rotationAxis: rotationParams.axis, // NEW: Rotation axis for tilted planets
                isRetrograde: rotationParams.isRetrograde,
                axialTilt: rotationParams.axialTilt, // NEW: Store axial tilt
                eccentricity: planetData.orbital_eccentricity || 0,
                inclination: 0
            };
        }

        /**
         * NEW: Calculate proper rotation parameters for each planet
         */
        calculateRotationParameters(planetData) {
            const planetName = planetData.name.toLowerCase();
            const rotationPeriod = Math.abs(planetData.rotation_period) / 24; // Convert hours to days
            const baseRotationVelocity = (2 * Math.PI) / rotationPeriod * 0.05; // Scale for visualization

            // Default parameters
            let params = {
                velocity: baseRotationVelocity,
                axis: new THREE.Vector3(0, 1, 0), // Default Y-axis
                isRetrograde: planetData.rotation_period < 0,
                axialTilt: planetData.axial_tilt || 0
            };

            // FIXED: Special cases for Venus and Uranus
            switch (planetName) {
                case 'venus':
                    // Venus rotates backwards (retrograde) and very slowly
                    params.isRetrograde = true;
                    params.velocity = -baseRotationVelocity * 0.1; // Very slow and backwards
                    params.axialTilt = 177.4; // Nearly upside down
                    console.log(`🌟 Venus: Retrograde rotation at ${params.velocity.toFixed(4)} rad/update`);
                    break;

                case 'uranus':
                    // Uranus rotates on its side (98° tilt)
                    params.axialTilt = 98; // Extreme tilt - rotates on its side
                    params.axis = new THREE.Vector3(
                        Math.sin(THREE.MathUtils.degToRad(98)),
                        Math.cos(THREE.MathUtils.degToRad(98)),
                        0
                    ).normalize();
                    console.log(`🌟 Uranus: 98° axial tilt, axis:`, params.axis);
                    break;

                case 'pluto':
                    // Pluto also has retrograde rotation
                    params.isRetrograde = true;
                    params.velocity = -baseRotationVelocity;
                    params.axialTilt = 122.5;
                    break;

                default:
                    // Apply normal axial tilt if available
                    if (planetData.axial_tilt !== undefined) {
                        const tiltRad = THREE.MathUtils.degToRad(planetData.axial_tilt);
                        params.axis = new THREE.Vector3(
                            Math.sin(tiltRad),
                            Math.cos(tiltRad),
                            0
                        ).normalize();
                    }
                    break;
            }

            return params;
        }

        /**
         * NEW: Setup special rotations for Venus and Uranus
         */
        setupSpecialRotations(planetMesh, planetData) {
            const planetName = planetData.name.toLowerCase();

            switch (planetName) {
                case 'venus':
                    // Venus: Tilt the planet to reflect its retrograde rotation
                    planetMesh.rotation.z = THREE.MathUtils.degToRad(177.4);
                    console.log('🌟 Applied Venus 177.4° tilt');
                    break;

                case 'uranus':
                    // Uranus: Tilt the planet 98 degrees so it rotates on its side
                    planetMesh.rotation.z = THREE.MathUtils.degToRad(98);
                    console.log('🌟 Applied Uranus 98° side rotation');
                    break;

                case 'earth':
                    // Earth: Apply realistic 23.5° axial tilt
                    planetMesh.rotation.z = THREE.MathUtils.degToRad(23.5);
                    console.log('🌍 Applied Earth 23.5° axial tilt');
                    break;

                case 'mars':
                    // Mars: Similar tilt to Earth
                    planetMesh.rotation.z = THREE.MathUtils.degToRad(25.2);
                    console.log('🔴 Applied Mars 25.2° axial tilt');
                    break;

                case 'saturn':
                    // Saturn: Notable axial tilt
                    planetMesh.rotation.z = THREE.MathUtils.degToRad(26.7);
                    console.log('🪐 Applied Saturn 26.7° axial tilt');
                    break;

                case 'neptune':
                    // Neptune: Moderate tilt
                    planetMesh.rotation.z = THREE.MathUtils.degToRad(28.3);
                    console.log('🔵 Applied Neptune 28.3° axial tilt');
                    break;
            }
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
         * FIXED: Update orbital positions with speed-based control
         */
        update(deltaTime, speedMultiplier = 1) {
            this.currentSpeedMultiplier = speedMultiplier;

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
         * FIXED: Update planet self-rotation with proper handling of special cases
         */
        updatePlanetRotation(body, timeProgression) {
            const { mesh, params, data } = body;
            const planetName = data.name.toLowerCase();

            // Apply rotation based on the planet's rotation axis and velocity
            const rotationDelta = params.rotationVelocity * timeProgression;

            switch (planetName) {
                case 'venus':
                    // Venus: Rotate around Y-axis but backwards due to retrograde rotation
                    // The initial tilt is already applied in setupSpecialRotations
                    mesh.rotation.y += rotationDelta; // This will be negative due to params.velocity
                    break;

                case 'uranus':
                    // Uranus: Rotate around its tilted axis (on its side)
                    // The 98° tilt is already applied in setupSpecialRotations
                    // Rotate around the X-axis since it's tilted on its side
                    mesh.rotation.x += rotationDelta;
                    break;

                default:
                    // All other planets: Normal rotation around Y-axis
                    // Any axial tilts are already applied in setupSpecialRotations
                    mesh.rotation.y += rotationDelta;
                    break;
            }

            // Store the rotation angle for reference
            body.rotationAngle += rotationDelta;
        }

        /**
         * Set speed multiplier
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

                // Reapply special rotations
                this.setupSpecialRotations(body.mesh, body.data);
            });

            if (window.Helpers) {
                window.Helpers.log('All planetary positions reset with correct rotations', 'debug');
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
                rotationAngle: body.rotationAngle,
                axialTilt: body.params.axialTilt, // NEW
                isRetrograde: body.params.isRetrograde // NEW
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
         * Get orbital statistics with speed-based state
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
                currentSpeedMultiplier: this.currentSpeedMultiplier,
                isAtZeroSpeed: this.currentSpeedMultiplier === 0,
                pathsVisible: this.options.showOrbitalPaths,
                baseTimeScale: this.options.timeScale,
                realisticRotations: this.options.enableRealisticRotations // NEW
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

        // Getters for external access
        get OrbitingBodyCount() { return this.orbitingBodies.size; }
        get SimulationTime() { return this.time; }
        get CurrentSpeed() { return this.currentSpeedMultiplier; }
        get IsAtZeroSpeed() { return this.currentSpeedMultiplier === 0; }
        get TimeSpeed() { return this.currentSpeedMultiplier; }
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

console.log('🌟 FIXED OrbitalMechanics with Venus retrograde and Uranus 98° tilt loaded successfully');