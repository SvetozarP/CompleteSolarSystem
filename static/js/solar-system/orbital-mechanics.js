// static/js/solar-system/orbital-mechanics.js
// FIXED: Smooth animation for distant planets with improved time scaling

window.OrbitalMechanics = (function() {
    'use strict';

    /**
     * Orbital mechanics system for animating planet orbits with smooth distant planet animation
     */
    class OrbitalMechanics {
        constructor(options = {}) {
            this.options = {
                timeScale: 20,         // Base time scale (days per second)
                enableElliptical: false,
                showOrbitalPaths: true,
                pathOpacity: 0.3,
                pathSegments: 128,
                // NEW: Smooth animation settings
                minAnimationSpeed: 0.001,  // Minimum animation speed for very slow planets
                maxAnimationSpeed: 0.1,    // Maximum animation speed for fast planets
                smoothingFactor: 0.02,     // Smoothing factor for distant planets
                ...options
            };

            this.orbitingBodies = new Map();
            this.orbitalPaths = new Map();
            this.time = 0;
            this.lastUpdateTime = 0;

            // MODIFIED: Remove isPaused, use currentSpeedMultiplier instead
            this.currentSpeedMultiplier = 1.0; // Speed multiplier (can be 0)
            this.scene = null;

            // NEW: Accumulated angle tracking for smooth animation
            this.accumulatedAngles = new Map();
        }

        /**
         * Initialize orbital mechanics system
         */
        init(scene) {
            this.scene = scene;
            this.lastUpdateTime = Date.now();

            if (window.Helpers) {
                window.Helpers.log('Orbital mechanics system initialized with smooth distant planet animation', 'debug');
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
                rotationAngle: Math.random() * Math.PI * 2,
                // NEW: Add previous position for smooth interpolation
                previousPosition: { x: 0, y: 0, z: 0 },
                targetPosition: { x: 0, y: 0, z: 0 }
            });

            // Initialize accumulated angle tracking
            this.accumulatedAngles.set(planetName, 0);

            if (this.options.showOrbitalPaths) {
                this.createOrbitalPath(planetName, orbitalParams);
            }

            if (window.Helpers) {
                window.Helpers.log(`Added orbiting body: ${planetData.name} - Period: ${orbitalParams.period.toFixed(1)} days`, 'debug');
            }
        }

        /**
         * IMPROVED: Calculate orbital parameters with better speed scaling for distant planets
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

            // IMPROVED: Calculate angular velocity with smoothing for distant planets
            let angularVelocity = (2 * Math.PI) / orbitalPeriod;

            // Apply smoothing for very slow planets (distant ones)
            if (orbitalPeriod > 1000) { // For Saturn, Uranus, Neptune, Pluto
                // Scale up the angular velocity for better visual animation
                const speedBoostFactor = Math.log10(orbitalPeriod / 100) + 1;
                angularVelocity *= speedBoostFactor;
            }

            // Clamp angular velocity to reasonable range for smooth animation
            angularVelocity = Math.max(
                this.options.minAnimationSpeed,
                Math.min(this.options.maxAnimationSpeed, angularVelocity)
            );

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
                isRetrograde: isRetrograde,
                // NEW: Add smooth animation properties
                smoothedAngularVelocity: angularVelocity * this.options.smoothingFactor
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
         * IMPROVED: Update orbital positions with smooth animation for distant planets
         */
        update(deltaTime, speedMultiplier = 1) {
            this.currentSpeedMultiplier = speedMultiplier;

            // Calculate time progression - will be 0 if speedMultiplier is 0
            const timeProgression = deltaTime * this.options.timeScale * this.currentSpeedMultiplier;
            this.time += timeProgression;

            // Update each orbiting body with improved smoothing
            this.orbitingBodies.forEach((body, planetName) => {
                this.updatePlanetPositionSmooth(body, planetName, timeProgression, deltaTime);
                this.updatePlanetRotation(body, timeProgression);
            });
        }

        /**
         * NEW: Update planet orbital position with smooth interpolation for distant planets
         */
        updatePlanetPositionSmooth(body, planetName, timeProgression, deltaTime) {
            const { mesh, params } = body;

            // Get current accumulated angle
            let accumulatedAngle = this.accumulatedAngles.get(planetName) || 0;

            // Calculate base angular increment
            let angularIncrement = params.angularVelocity * timeProgression;

            // SMOOTH ANIMATION FIX: Apply adaptive smoothing based on orbital period
            const orbitalPeriod = params.period;

            if (orbitalPeriod > 1000) { // Distant planets (Saturn, Uranus, Neptune, Pluto)
                // Use smoother, more consistent angular increment
                const smoothingFactor = Math.min(1.0, 365.25 / orbitalPeriod);
                angularIncrement *= (1 + smoothingFactor * 2); // Boost for visibility

                // Apply additional smoothing for very distant planets
                if (orbitalPeriod > 10000) { // Neptune, Pluto
                    angularIncrement *= 1.5; // Extra boost for outermost planets
                }
            }

            // Update accumulated angle
            accumulatedAngle += angularIncrement;

            // Normalize angle to 0-2π range
            if (accumulatedAngle > Math.PI * 2) {
                accumulatedAngle -= Math.PI * 2;
            }

            // Store updated angle
            this.accumulatedAngles.set(planetName, accumulatedAngle);

            // Calculate smooth position using accumulated angle
            const x = Math.cos(accumulatedAngle) * params.radius;
            const z = Math.sin(accumulatedAngle) * params.radius;
            const y = 0;

            // SMOOTH INTERPOLATION: For very slow planets, use interpolation between positions
            if (orbitalPeriod > 2000) {
                // Store previous position if not set
                if (!body.previousPosition.x && !body.previousPosition.z) {
                    body.previousPosition = { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z };
                }

                // Calculate target position
                body.targetPosition = { x, y, z };

                // Interpolate between previous and target positions for smoothness
                const lerpFactor = Math.min(0.1, deltaTime * 2); // Smooth interpolation

                const smoothX = body.previousPosition.x + (body.targetPosition.x - body.previousPosition.x) * lerpFactor;
                const smoothZ = body.previousPosition.z + (body.targetPosition.z - body.previousPosition.z) * lerpFactor;

                mesh.position.set(smoothX, y, smoothZ);

                // Update previous position
                body.previousPosition = { x: smoothX, y, z: smoothZ };
            } else {
                // For closer planets, use direct position update
                mesh.position.set(x, y, z);
            }

            // Update the body's current angle for other systems that might need it
            body.currentAngle = accumulatedAngle;
        }

        /**
         * IMPROVED: Update planet self-rotation with consistent timing
         */
        updatePlanetRotation(body, timeProgression) {
            const { mesh, params, data } = body;
            const planetName = data.name.toLowerCase();

            // Calculate rotation delta with consistent timing
            let rotationDelta = params.rotationVelocity * timeProgression;

            // Apply smoothing for distant planets
            if (params.period > 1000) {
                rotationDelta *= 1.2; // Slightly faster rotation for better visibility
            }

            if (planetName === 'venus') {
                mesh.rotation.y -= Math.abs(rotationDelta);
            } else if (planetName === 'uranus') {
                mesh.rotation.x += rotationDelta;
                // Apply ring and moon alignment
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
            // Uranus rotates on its side with 98° tilt
            const uranusTilt = THREE.MathUtils.degToRad(98);

            // Fix rings: align with planet's tilted equator
            const rings = uranusMesh.getObjectByName('Uranus_rings');
            if (rings) {
                rings.rotation.x = 0;
                rings.rotation.y = 0;
                rings.rotation.z = uranusTilt;
            }

            // Fix moons: orbit in the same tilted plane as the rings
            const moonSystem = uranusMesh.getObjectByName('Uranus_moons');
            if (moonSystem) {
                moonSystem.rotation.set(0, 0, 0);
                moonSystem.rotation.z = uranusTilt;

                // Update moon positions in the tilted orbital plane
                moonSystem.children.forEach(moon => {
                    if (moon.userData && moon.userData.type === 'moon') {
                        const userData = moon.userData;
                        if (userData.orbitalAngle === undefined) {
                            userData.orbitalAngle = Math.random() * Math.PI * 2;
                        }

                        const radius = userData.orbitalRadius || 10;
                        const x = Math.cos(userData.orbitalAngle) * radius;
                        const y = Math.sin(userData.orbitalAngle) * radius;
                        const z = 0;

                        moon.position.set(x, y, z);
                        userData.orbitalAngle += userData.orbitalSpeed || 0.01;
                    }
                });
            }
        }

        /**
         * IMPROVED: Set speed multiplier with enhanced distant planet handling
         */
        setSpeed(speedMultiplier) {
            this.currentSpeedMultiplier = speedMultiplier;

            // If speed is being set to non-zero after being zero, reset smooth interpolation
            if (speedMultiplier > 0 && this.previousSpeedMultiplier === 0) {
                this.orbitingBodies.forEach((body, planetName) => {
                    // Reset previous position to current position to avoid jumps
                    body.previousPosition = {
                        x: body.mesh.position.x,
                        y: body.mesh.position.y,
                        z: body.mesh.position.z
                    };
                });
            }

            this.previousSpeedMultiplier = speedMultiplier;

            if (window.Helpers) {
                window.Helpers.log(`Orbital animation speed set to ${speedMultiplier}x with smooth distant planet animation`, 'debug');
            }
        }

        /**
         * DEPRECATED: Kept for compatibility but maps to speed control
         */
        setPlaying(playing) {
            this.setSpeed(playing ? 1.0 : 0);
        }

        /**
         * Reset all planets to initial positions with smooth animation reset
         */
        resetPositions() {
            this.time = 0;

            this.orbitingBodies.forEach((body, planetName) => {
                const initialAngle = Math.random() * Math.PI * 2;
                body.currentAngle = initialAngle;
                body.rotationAngle = Math.random() * Math.PI * 2;

                // Reset accumulated angles
                this.accumulatedAngles.set(planetName, initialAngle);

                // Reset smooth interpolation data
                body.previousPosition = { x: 0, y: 0, z: 0 };
                body.targetPosition = { x: 0, y: 0, z: 0 };

                this.updatePlanetPositionSmooth(body, planetName, 0, 0.016); // Pass default deltaTime
                this.updatePlanetRotation(body, 0);
            });

            if (window.Helpers) {
                window.Helpers.log('All planetary positions reset with smooth animation', 'debug');
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

            const accumulatedAngle = this.accumulatedAngles.get(planetName.toLowerCase()) || 0;

            return {
                name: body.data.name,
                currentAngle: accumulatedAngle,
                orbitalRadius: body.params.radius,
                orbitalPeriod: body.params.period,
                position: body.mesh.position.clone(),
                rotationAngle: body.rotationAngle,
                smoothAnimationActive: body.params.period > 1000
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
         * IMPROVED: Get orbital statistics with smooth animation info
         */
        getStats() {
            const earthData = this.orbitingBodies.get('earth');
            const earthCompletedOrbits = earthData ? this.time / earthData.params.period : 0;

            // Count planets using smooth animation
            let smoothAnimationCount = 0;
            this.orbitingBodies.forEach((body) => {
                if (body.params.period > 1000) smoothAnimationCount++;
            });

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
                smoothAnimationBodies: smoothAnimationCount
            };
        }

        /**
         * Enable performance mode with smooth animation optimization
         */
        setPerformanceMode(enabled) {
            if (enabled) {
                this.options.pathSegments = 64;
                this.setOrbitalPathOpacity(0.1);
                // Reduce smoothing for better performance
                this.options.smoothingFactor = 0.01;
            } else {
                this.options.pathSegments = 128;
                this.setOrbitalPathOpacity(0.3);
                // Restore full smoothing
                this.options.smoothingFactor = 0.02;
            }

            this.recreateOrbitalPaths();
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
            this.accumulatedAngles.clear(); // NEW: Clear accumulated angles

            this.scene = null;
            this.time = 0;

            if (window.Helpers) {
                window.Helpers.log('Orbital mechanics system with smooth animation disposed', 'debug');
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

console.log('OrbitalMechanics with SMOOTH distant planet animation loaded successfully');