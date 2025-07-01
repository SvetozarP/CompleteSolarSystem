// static/js/solar-system/particle-systems.js
// Enhanced particle systems with starfield, nebula effects, and asteroid belt - FIXED

window.ParticleSystems = (function() {
    'use strict';

    /**
     * Starfield particle system for background stars
     */
    class StarfieldSystem {
        constructor(options = {}) {
            this.options = {
                starCount: 5000,
                starDistance: 500,
                starSizeMin: 0.1,
                starSizeMax: 2.0,
                twinkleSpeed: 0.5,
                colorVariation: true,
                ...options
            };

            this.stars = null;
            this.starGeometry = null;
            this.starMaterial = null;
            this.twinkleUniforms = null;
            this.time = 0;
        }

        /**
         * Initialize the starfield system
         * @param {THREE.Scene} scene - Three.js scene
         * @returns {Promise<void>}
         */
        async init(scene) {
            try {
                await this.createStarfield();
                scene.add(this.stars);

                if (window.Helpers) {
                    window.Helpers.log(`Starfield created with ${this.options.starCount} stars`, 'debug');
                }
            } catch (error) {
                if (window.Helpers) {
                    window.Helpers.handleError(error, 'StarfieldSystem.init');
                }
            }
        }

        /**
         * Create the starfield geometry and material
         */
        async createStarfield() {
            // Create geometry
            this.starGeometry = new THREE.BufferGeometry();

            // Generate star positions
            const positions = new Float32Array(this.options.starCount * 3);
            const colors = new Float32Array(this.options.starCount * 3);
            const sizes = new Float32Array(this.options.starCount);
            const phases = new Float32Array(this.options.starCount);

            for (let i = 0; i < this.options.starCount; i++) {
                const i3 = i * 3;

                // Generate random position on sphere
                const phi = Math.random() * Math.PI * 2;
                const cosTheta = Math.random() * 2 - 1;
                const theta = Math.acos(cosTheta);

                // Vary distance for depth
                const distance = this.options.starDistance + (Math.random() - 0.5) * 200;

                positions[i3] = distance * Math.sin(theta) * Math.cos(phi);
                positions[i3 + 1] = distance * Math.sin(theta) * Math.sin(phi);
                positions[i3 + 2] = distance * Math.cos(theta);

                // Generate star color based on stellar classification
                const starType = Math.random();
                let r, g, b;

                if (starType > 0.85) {
                    // Blue giants (hot)
                    r = 0.7 + Math.random() * 0.3;
                    g = 0.8 + Math.random() * 0.2;
                    b = 1.0;
                } else if (starType > 0.65) {
                    // White stars
                    const intensity = 0.9 + Math.random() * 0.1;
                    r = g = b = intensity;
                } else if (starType > 0.35) {
                    // Yellow stars (like our Sun)
                    r = 1.0;
                    g = 0.9 + Math.random() * 0.1;
                    b = 0.6 + Math.random() * 0.3;
                } else if (starType > 0.15) {
                    // Orange stars
                    r = 1.0;
                    g = 0.6 + Math.random() * 0.3;
                    b = 0.3 + Math.random() * 0.3;
                } else {
                    // Red dwarfs
                    r = 1.0;
                    g = 0.3 + Math.random() * 0.4;
                    b = 0.2 + Math.random() * 0.2;
                }

                colors[i3] = r;
                colors[i3 + 1] = g;
                colors[i3 + 2] = b;

                // Random size based on star magnitude
                const magnitude = Math.random();
                sizes[i] = this.options.starSizeMin + magnitude * magnitude *
                          (this.options.starSizeMax - this.options.starSizeMin);

                // Random phase for twinkling
                phases[i] = Math.random() * Math.PI * 2;
            }

            // Set geometry attributes
            this.starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            this.starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            this.starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
            this.starGeometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

            // Create shader material for twinkling effect
            this.createStarMaterial();

            // Create points mesh
            this.stars = new THREE.Points(this.starGeometry, this.starMaterial);
            this.stars.name = 'starfield';
        }

        /**
         * Create custom shader material for stars
         */
        createStarMaterial() {
            // Uniforms for animation
            this.twinkleUniforms = {
                time: { value: 0.0 },
                twinkleSpeed: { value: this.options.twinkleSpeed }
            };

            this.starMaterial = new THREE.ShaderMaterial({
                uniforms: this.twinkleUniforms,
                vertexShader: `
                    attribute float size;
                    attribute float phase;
                    
                    uniform float time;
                    uniform float twinkleSpeed;
                    
                    varying vec3 vColor;
                    varying float vTwinkle;
                    
                    void main() {
                        vColor = color;
                        
                        // Calculate twinkling effect
                        float twinklePhase = phase + time * twinkleSpeed;
                        vTwinkle = 0.8 + 0.2 * sin(twinklePhase) * sin(twinklePhase * 1.3);
                        
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        
                        gl_PointSize = size * (300.0 / -mvPosition.z);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    #ifdef GL_ES
                    precision mediump float;
                    #endif
                    
                    varying vec3 vColor;
                    varying float vTwinkle;
                    
                    void main() {
                        // Create circular star shape
                        vec2 coord = gl_PointCoord - vec2(0.5);
                        float dist = length(coord);
                        
                        if (dist > 0.5) discard;
                        
                        // Soft edge falloff
                        float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
                        alpha *= vTwinkle;
                        
                        // Add slight glow for brighter stars
                        float glow = 1.0 - smoothstep(0.0, 0.4, dist);
                        alpha += glow * 0.3 * vTwinkle;
                        
                        gl_FragColor = vec4(vColor, alpha);
                    }
                `,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                transparent: true,
                vertexColors: true
            });
        }

        /**
         * Update starfield animation
         * @param {number} deltaTime - Time since last frame
         */
        update(deltaTime) {
            if (this.twinkleUniforms) {
                this.time += deltaTime;
                this.twinkleUniforms.time.value = this.time;
            }
        }

        /**
         * Toggle starfield visibility
         * @param {boolean} visible - Visibility state
         */
        setVisible(visible) {
            if (this.stars) {
                this.stars.visible = visible;
            }
        }

        /**
         * Dispose of resources
         */
        dispose() {
            if (this.starGeometry) {
                this.starGeometry.dispose();
            }
            if (this.starMaterial) {
                this.starMaterial.dispose();
            }
        }
    }

    /**
     * Nebula particle system for colorful space gas effects
     */
    class NebulaSystem {
        constructor(options = {}) {
            this.options = {
                particleCount: 2000,
                nebulaDistance: 800,
                particleSize: 10.0,
                driftSpeed: 0.1,
                colorPalette: [
                    { r: 1.0, g: 0.3, b: 0.8 }, // Magenta
                    { r: 0.3, g: 0.6, b: 1.0 }, // Blue
                    { r: 0.8, g: 0.2, b: 1.0 }, // Purple
                    { r: 0.2, g: 1.0, b: 0.8 }, // Cyan
                    { r: 1.0, g: 0.6, b: 0.2 }  // Orange
                ],
                opacity: 0.15,
                ...options
            };

            this.nebula = null;
            this.nebulaGeometry = null;
            this.nebulaMaterial = null;
            this.nebulaUniforms = null;
            this.time = 0;
        }

        /**
         * Initialize the nebula system
         * @param {THREE.Scene} scene - Three.js scene
         */
        async init(scene) {
            try {
                await this.createNebula();
                scene.add(this.nebula);

                if (window.Helpers) {
                    window.Helpers.log(`Nebula created with ${this.options.particleCount} particles`, 'debug');
                }
            } catch (error) {
                if (window.Helpers) {
                    window.Helpers.handleError(error, 'NebulaSystem.init');
                }
            }
        }

        /**
         * Create nebula geometry and material
         */
        async createNebula() {
            this.nebulaGeometry = new THREE.BufferGeometry();

            const positions = new Float32Array(this.options.particleCount * 3);
            const colors = new Float32Array(this.options.particleCount * 3);
            const sizes = new Float32Array(this.options.particleCount);
            const velocities = new Float32Array(this.options.particleCount * 3);

            for (let i = 0; i < this.options.particleCount; i++) {
                const i3 = i * 3;

                // Create clustered distribution (multiple nebula regions)
                const clusterCount = 3;
                const cluster = Math.floor(Math.random() * clusterCount);

                // Cluster centers
                const clusterCenters = [
                    { x: 200, y: 100, z: -300 },
                    { x: -300, y: -150, z: 400 },
                    { x: 100, y: -200, z: -200 }
                ];

                const center = clusterCenters[cluster];
                const spread = 150;

                // Gaussian distribution around cluster center
                positions[i3] = center.x + (Math.random() - 0.5) * spread * 2;
                positions[i3 + 1] = center.y + (Math.random() - 0.5) * spread * 2;
                positions[i3 + 2] = center.z + (Math.random() - 0.5) * spread * 2;

                // Select color from palette
                const colorIndex = Math.floor(Math.random() * this.options.colorPalette.length);
                const baseColor = this.options.colorPalette[colorIndex];

                // Add some color variation
                const variation = 0.3;
                colors[i3] = Math.max(0, Math.min(1, baseColor.r + (Math.random() - 0.5) * variation));
                colors[i3 + 1] = Math.max(0, Math.min(1, baseColor.g + (Math.random() - 0.5) * variation));
                colors[i3 + 2] = Math.max(0, Math.min(1, baseColor.b + (Math.random() - 0.5) * variation));

                // Particle size with some variation
                sizes[i] = this.options.particleSize * (0.5 + Math.random() * 1.5);

                // Slow random drift velocities
                velocities[i3] = (Math.random() - 0.5) * this.options.driftSpeed;
                velocities[i3 + 1] = (Math.random() - 0.5) * this.options.driftSpeed;
                velocities[i3 + 2] = (Math.random() - 0.5) * this.options.driftSpeed;
            }

            this.nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            this.nebulaGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            this.nebulaGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
            this.nebulaGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

            this.createNebulaMaterial();

            this.nebula = new THREE.Points(this.nebulaGeometry, this.nebulaMaterial);
            this.nebula.name = 'nebula';
        }

        /**
         * Create nebula shader material
         */
        createNebulaMaterial() {
            this.nebulaUniforms = {
                time: { value: 0.0 },
                opacity: { value: this.options.opacity }
            };

            this.nebulaMaterial = new THREE.ShaderMaterial({
                uniforms: this.nebulaUniforms,
                vertexShader: `
                    attribute float size;
                    attribute vec3 velocity;
                    
                    uniform float time;
                    
                    varying vec3 vColor;
                    varying float vDistance;
                    
                    void main() {
                        vColor = color;
                        
                        // Drift particles slowly
                        vec3 pos = position + velocity * time * 0.1;
                        
                        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                        vDistance = -mvPosition.z;
                        
                        gl_PointSize = size * (300.0 / vDistance);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    #ifdef GL_ES
                    precision mediump float;
                    #endif
                    
                    uniform float opacity;
                    
                    varying vec3 vColor;
                    varying float vDistance;
                    
                    void main() {
                        vec2 coord = gl_PointCoord - vec2(0.5);
                        float dist = length(coord);
                        
                        // Soft circular shape
                        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                        alpha *= alpha; // Softer falloff
                        
                        // Distance fade
                        float distanceFade = 1.0 - smoothstep(400.0, 1000.0, vDistance);
                        alpha *= distanceFade * opacity;
                        
                        gl_FragColor = vec4(vColor, alpha);
                    }
                `,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                transparent: true,
                vertexColors: true
            });
        }

        /**
         * Update nebula animation
         * @param {number} deltaTime - Time since last frame
         */
        update(deltaTime) {
            if (this.nebulaUniforms) {
                this.time += deltaTime;
                this.nebulaUniforms.time.value = this.time;
            }
        }

        /**
         * Set nebula opacity
         * @param {number} opacity - Opacity value (0-1)
         */
        setOpacity(opacity) {
            this.options.opacity = opacity;
            if (this.nebulaUniforms) {
                this.nebulaUniforms.opacity.value = opacity;
            }
        }

        /**
         * Toggle nebula visibility
         * @param {boolean} visible - Visibility state
         */
        setVisible(visible) {
            if (this.nebula) {
                this.nebula.visible = visible;
            }
        }

        /**
         * Dispose of resources
         */
        dispose() {
            if (this.nebulaGeometry) {
                this.nebulaGeometry.dispose();
            }
            if (this.nebulaMaterial) {
                this.nebulaMaterial.dispose();
            }
        }
    }

    /**
     * Asteroid belt particle system
     */
    class AsteroidBeltSystem {
        constructor(options = {}) {
            this.options = {
                asteroidCount: 1000,
                // REMOVED: hardcoded positions
                // NEW: Calculate positions dynamically based on Mars and Jupiter
                calculateDynamicPositions: true,
                particleSize: 0.5,
                orbitSpeed: 0.1,
                densityVariation: 0.3, // Vary density within belt
                ...options
            };

            this.asteroids = null;
            this.asteroidGeometry = null;
            this.asteroidMaterial = null;
            this.time = 0;

            // Dynamic positioning properties
            this.innerRadius = 90;  // Will be calculated
            this.outerRadius = 110; // Will be calculated
            this.planetPositions = null; // Store planet positions for reference
        }


    /**
     * Initialize asteroid belt with dynamic positioning
     * @param {THREE.Scene} scene - Three.js scene
     * @param {Map} planetInstances - Map of planet instances for position reference
     */
    async init(scene, planetInstances = null) {
        try {
            this.planetPositions = planetInstances;

            // Calculate dynamic positions based on Mars and Jupiter
            this.calculateBeltPositions();

            await this.createAsteroidBelt();
            scene.add(this.asteroids);

            if (window.Helpers) {
                window.Helpers.log(`Asteroid belt created with ${this.options.asteroidCount} asteroids between ${this.innerRadius.toFixed(1)} and ${this.outerRadius.toFixed(1)} units`, 'debug');
            }
        } catch (error) {
            if (window.Helpers) {
                window.Helpers.handleError(error, 'AsteroidBeltSystem.init');
            }
        }
    }

    /**
     * Calculate asteroid belt positions based on Mars and Jupiter orbital distances
     */
    calculateBeltPositions() {
        let marsDistance = 75;   // Default fallback
        let jupiterDistance = 130; // Default fallback

        // Try to get actual planet positions if available
        if (this.planetPositions) {
            const mars = this.planetPositions.get('Mars');
            const jupiter = this.planetPositions.get('Jupiter');

            if (mars && mars.position) {
                // Calculate distance from center
                marsDistance = Math.sqrt(
                    mars.position.x * mars.position.x +
                    mars.position.z * mars.position.z
                );
                console.log(`🔴 Mars actual distance: ${marsDistance.toFixed(1)} units`);
            }

            if (jupiter && jupiter.position) {
                // Calculate distance from center
                jupiterDistance = Math.sqrt(
                    jupiter.position.x * jupiter.position.x +
                    jupiter.position.z * jupiter.position.z
                );
                console.log(`🟠 Jupiter actual distance: ${jupiterDistance.toFixed(1)} units`);
            }
        }

        // Position asteroid belt between Mars and Jupiter with some buffer
        this.innerRadius = marsDistance + 8;      // 8 units beyond Mars orbit
        this.outerRadius = jupiterDistance - 12;   // 12 units before Jupiter orbit

        // Ensure minimum belt width
        if (this.outerRadius - this.innerRadius < 15) {
            const center = (this.innerRadius + this.outerRadius) / 2;
            this.innerRadius = center - 10;
            this.outerRadius = center + 10;
        }

        if (window.Helpers) {
            window.Helpers.log(`Asteroid belt positioned: Mars at ${marsDistance.toFixed(1)}, Jupiter at ${jupiterDistance.toFixed(1)}, Belt: ${this.innerRadius.toFixed(1)}-${this.outerRadius.toFixed(1)}`, 'debug');
        }
    }
    // Update the createAsteroidBelt method to use calculated positions:
    /**
     * Create asteroid belt geometry with calculated positions
     */
    async createAsteroidBelt() {
        this.asteroidGeometry = new THREE.BufferGeometry();

        const positions = new Float32Array(this.options.asteroidCount * 3);
        const colors = new Float32Array(this.options.asteroidCount * 3);
        const sizes = new Float32Array(this.options.asteroidCount);
        const orbitalData = new Float32Array(this.options.asteroidCount * 2); // radius, angle

        for (let i = 0; i < this.options.asteroidCount; i++) {
            const i3 = i * 3;
            const i2 = i * 2;

            // Use calculated orbital parameters with realistic distribution
            let radius;

            // Create realistic asteroid distribution (denser in middle, sparser at edges)
            const rand = Math.random();
            if (rand < 0.7) {
                // 70% in main belt (middle section)
                const midPoint = (this.innerRadius + this.outerRadius) / 2;
                const halfWidth = (this.outerRadius - this.innerRadius) / 4;
                radius = midPoint + (Math.random() - 0.5) * halfWidth;
            } else {
                // 30% scattered throughout belt
                radius = this.innerRadius + Math.random() * (this.outerRadius - this.innerRadius);
            }

            // Add some variation to make it look more natural
            radius += (Math.random() - 0.5) * this.options.densityVariation;

            // Ensure radius stays within bounds
            radius = Math.max(this.innerRadius, Math.min(this.outerRadius, radius));

            const angle = Math.random() * Math.PI * 2;
            const inclination = (Math.random() - 0.5) * 0.15; // Reduced inclination for more realistic belt

            // Position
            positions[i3] = radius * Math.cos(angle);
            positions[i3 + 1] = Math.sin(inclination) * radius * 0.08; // Thinner belt
            positions[i3 + 2] = radius * Math.sin(angle);

            // Store orbital data for animation
            orbitalData[i2] = radius;
            orbitalData[i2 + 1] = angle;

            // Enhanced asteroid colors with more variety
            const asteroidType = Math.random();
            let r, g, b;

            if (asteroidType > 0.8) {
                // Metallic asteroids (nickel-iron) - 20%
                r = 0.7 + Math.random() * 0.2;
                g = 0.6 + Math.random() * 0.3;
                b = 0.5 + Math.random() * 0.2;
            } else if (asteroidType > 0.5) {
                // Stony asteroids (silicate) - 30%
                r = 0.5 + Math.random() * 0.3;
                g = 0.4 + Math.random() * 0.2;
                b = 0.3 + Math.random() * 0.2;
            } else if (asteroidType > 0.2) {
                // Carbonaceous asteroids - 30%
                r = 0.2 + Math.random() * 0.2;
                g = 0.2 + Math.random() * 0.2;
                b = 0.2 + Math.random() * 0.15;
            } else {
                // Ice-rich asteroids (rare) - 20%
                r = 0.4 + Math.random() * 0.2;
                g = 0.4 + Math.random() * 0.2;
                b = 0.5 + Math.random() * 0.3;
            }

            colors[i3] = r;
            colors[i3 + 1] = g;
            colors[i3 + 2] = b;

            // Size variation - larger asteroids are rarer
            const sizeRoll = Math.random();
            let asteroidSize;
            if (sizeRoll > 0.95) {
                // Large asteroids (5%)
                asteroidSize = this.options.particleSize * (2.0 + Math.random() * 3.0);
            } else if (sizeRoll > 0.8) {
                // Medium asteroids (15%)
                asteroidSize = this.options.particleSize * (1.0 + Math.random() * 2.0);
            } else {
                // Small asteroids (80%)
                asteroidSize = this.options.particleSize * (0.3 + Math.random() * 1.0);
            }

            sizes[i] = asteroidSize;
        }

        this.asteroidGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.asteroidGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.asteroidGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        this.asteroidGeometry.setAttribute('orbitalData', new THREE.BufferAttribute(orbitalData, 2));

        this.createAsteroidMaterial();

        this.asteroids = new THREE.Points(this.asteroidGeometry, this.asteroidMaterial);
        this.asteroids.name = 'asteroidBelt';
    }

        /**
         * Create asteroid material
         */
        createAsteroidMaterial() {
            this.asteroidMaterial = new THREE.PointsMaterial({
                vertexColors: true,
                size: this.options.particleSize,
                sizeAttenuation: true,
                transparent: true,
                opacity: 0.8,
                blending: THREE.NormalBlending
            });
        }
    /**
     * Update asteroid belt position if planet positions change
     * @param {Map} planetInstances - Updated planet instances
     */
    updateBeltPosition(planetInstances) {
        if (!planetInstances) return;

        this.planetPositions = planetInstances;
        const oldInner = this.innerRadius;
        const oldOuter = this.outerRadius;

        // Recalculate positions
        this.calculateBeltPositions();

        // Only recreate if positions changed significantly
        if (Math.abs(oldInner - this.innerRadius) > 5 || Math.abs(oldOuter - this.outerRadius) > 5) {
            if (window.Helpers) {
                window.Helpers.log('Asteroid belt position updated due to planet position changes', 'debug');
            }

            // Dispose old geometry
            if (this.asteroidGeometry) {
                this.asteroidGeometry.dispose();
            }

            // Recreate with new positions
            this.createAsteroidBelt();
        }
    }
        /**
         * Update asteroid belt (orbital motion)
         * @param {number} deltaTime - Time since last frame
         */
        update(deltaTime) {
            if (this.asteroidGeometry) {
                this.time += deltaTime * this.options.orbitSpeed;

                const positions = this.asteroidGeometry.attributes.position.array;
                const orbitalData = this.asteroidGeometry.attributes.orbitalData.array;

                for (let i = 0; i < this.options.asteroidCount; i++) {
                    const i3 = i * 3;
                    const i2 = i * 2;

                    const radius = orbitalData[i2];
                    const baseAngle = orbitalData[i2 + 1];
                    const currentAngle = baseAngle + this.time / radius; // Slower for outer orbits

                    positions[i3] = radius * Math.cos(currentAngle);
                    positions[i3 + 2] = radius * Math.sin(currentAngle);
                }

                this.asteroidGeometry.attributes.position.needsUpdate = true;
            }
        }

        /**
         * Toggle asteroid belt visibility
         * @param {boolean} visible - Visibility state
         */
        setVisible(visible) {
            if (this.asteroids) {
                this.asteroids.visible = visible;
            }
        }

        /**
         * Dispose of resources
         */
        dispose() {
            if (this.asteroidGeometry) {
                this.asteroidGeometry.dispose();
            }
            if (this.asteroidMaterial) {
                this.asteroidMaterial.dispose();
            }
        }
    }

    /**
     * Main particle system manager
     */
    class ParticleSystemManager {
        constructor(options = {}) {
            this.options = {
                enableStarfield: true,
                enableNebula: true,
                enableAsteroidBelt: true,
                performanceMode: false,
                ...options
            };

            this.systems = new Map();
            this.scene = null;
            this.isInitialized = false;
        }

        /**
         * Initialize all particle systems
         * @param {THREE.Scene} scene - Three.js scene
         */
        async init(scene) {
            this.scene = scene;

            try {
                const initPromises = [];

                // Initialize starfield
                if (this.options.enableStarfield) {
                    const starfieldOptions = this.options.performanceMode ?
                        { starCount: 2000 } : { starCount: 5000 };

                    const starfield = new StarfieldSystem(starfieldOptions);
                    this.systems.set('starfield', starfield);
                    initPromises.push(starfield.init(scene));
                }

                // Initialize nebula
                if (this.options.enableNebula) {
                    const nebulaOptions = this.options.performanceMode ?
                        { particleCount: 1000, opacity: 0.1 } : { particleCount: 2000, opacity: 0.15 };

                    const nebula = new NebulaSystem(nebulaOptions);
                    this.systems.set('nebula', nebula);
                    initPromises.push(nebula.init(scene));
                }

                // Initialize asteroid belt
                if (this.options.enableAsteroidBelt) {
                    const asteroidOptions = this.options.performanceMode ?
                        { asteroidCount: 500 } : { asteroidCount: 1000 };

                    const asteroidBelt = new AsteroidBeltSystem(asteroidOptions);
                    this.systems.set('asteroidBelt', asteroidBelt);
                    initPromises.push(asteroidBelt.init(scene));
                }

                await Promise.all(initPromises);
                this.isInitialized = true;

                if (window.Helpers) {
                    window.Helpers.log('All particle systems initialized successfully', 'debug');
                }

            } catch (error) {
                if (window.Helpers) {
                    window.Helpers.handleError(error, 'ParticleSystemManager.init');
                }
            }
        }

        /**
         * Update all particle systems
         * @param {number} deltaTime - Time since last frame
         */
        update(deltaTime) {
            if (!this.isInitialized) return;

            this.systems.forEach((system, name) => {
                if (system.update) {
                    system.update(deltaTime);
                }
            });
        }

        /**
         * Toggle visibility of a specific system
         * @param {string} systemName - Name of the system
         * @param {boolean} visible - Visibility state
         */
        setSystemVisible(systemName, visible) {
            const system = this.systems.get(systemName);
            if (system && system.setVisible) {
                system.setVisible(visible);
            }
        }

        /**
         * Set performance mode (reduces particle counts)
         * @param {boolean} enabled - Performance mode enabled
         */
        setPerformanceMode(enabled) {
            this.options.performanceMode = enabled;

            // Adjust opacity for better performance
            if (enabled) {
                this.setSystemOpacity('nebula', 0.08);
            } else {
                this.setSystemOpacity('nebula', 0.15);
            }
        }

        /**
         * Set opacity for nebula system
         * @param {string} systemName - System name
         * @param {number} opacity - Opacity value
         */
        setSystemOpacity(systemName, opacity) {
            const system = this.systems.get(systemName);
            if (system && system.setOpacity) {
                system.setOpacity(opacity);
            }
        }

        /**
         * Get system by name
         * @param {string} name - System name
         * @returns {Object|null} Particle system
         */
        getSystem(name) {
            return this.systems.get(name) || null;
        }

        /**
         * Get all system names
         * @returns {Array} Array of system names
         */
        getSystemNames() {
            return Array.from(this.systems.keys());
        }

        /**
         * Get performance statistics
         * @returns {Object} Performance stats
         */
        getStats() {
            const stats = {
                totalSystems: this.systems.size,
                systems: {}
            };

            this.systems.forEach((system, name) => {
                if (system.options) {
                    stats.systems[name] = {
                        particleCount: system.options.starCount ||
                                     system.options.particleCount ||
                                     system.options.asteroidCount || 0,
                        visible: system.stars?.visible ||
                                system.nebula?.visible ||
                                system.asteroids?.visible || true
                    };
                }
            });

            return stats;
        }

        /**
         * Dispose of all particle systems
         */
        dispose() {
            this.systems.forEach((system, name) => {
                if (system.dispose) {
                    system.dispose();
                }

                // Remove from scene
                if (this.scene) {
                    const object = this.scene.getObjectByName(name);
                    if (object) {
                        this.scene.remove(object);
                    }
                }
            });

            this.systems.clear();
            this.isInitialized = false;
        }
    }

    // Public API
    return {
        StarfieldSystem,
        NebulaSystem,
        AsteroidBeltSystem,
        ParticleSystemManager,

        // Factory function for easy setup
        create: (options = {}) => {
            return new ParticleSystemManager(options);
        },

        // Individual system creators
        createStarfield: (options = {}) => new StarfieldSystem(options),
        createNebula: (options = {}) => new NebulaSystem(options),
        createAsteroidBelt: (options = {}) => new AsteroidBeltSystem(options)
    };
})();

// Make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ParticleSystems;
}

console.log('ParticleSystems module loaded successfully');