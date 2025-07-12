// static/js/solar-system/planet-factory.js
// ENHANCED Planet Factory with Texture Loading, Moon Systems, and Ring Systems

window.PlanetFactory = (function() {
    'use strict';

    /**
     * Enhanced planet factory with full texture support, moons, and rings
     */
    class PlanetFactory {
        constructor(options = {}) {
            this.options = {
                defaultSegments: 64,
                highQualitySegments: 128,
                lowQualitySegments: 32,
                enableTextures: true,
                enableNormalMaps: true,
                enableAtmosphere: true,
                enableRings: true,
                enableMoons: true,
                quality: 'medium',
                ...options
            };

            // Caches
            this.materialCache = new Map();
            this.geometryCache = new Map();
            this.textureCache = new Map();
            this.planetInstances = new Map();
            this.moonSystems = new Map();
            this.ringSystems = new Map();
            this.atmospheres = new Map();

            // Texture loader
            this.textureLoader = new THREE.TextureLoader();

            this.isInitialized = false;
        }

        /**
         * Initialize the enhanced planet factory
         */
        async init() {
            try {
                console.log('🚀 Initializing Enhanced Planet Factory with textures, moons, and rings...');

                // Initialize texture loading system
                await this.initializeTextures();

                this.isInitialized = true;

                console.log('✅ Enhanced Planet Factory initialized successfully');

            } catch (error) {
                console.error('❌ Failed to initialize Enhanced Planet Factory:', error);
                throw error;
            }
        }

        /**
         * Initialize texture loading system
         */
        async initializeTextures() {
            // Define texture paths - adjust these paths to match your texture files
            this.texturePaths = {
                // Planet textures
                sun: '/static/textures/sun_texture.jpg',
                mercury: '/static/textures/mercury_texture.jpg',
                venus: '/static/textures/venus_texture.jpg',
                earth: '/static/textures/earth_texture.jpg',
                mars: '/static/textures/mars_texture.jpg',
                jupiter: '/static/textures/jupiter_texture.jpg',
                saturn: '/static/textures/saturn_texture.jpg',
                uranus: '/static/textures/uranus_texture.jpg',
                neptune: '/static/textures/neptune_texture.jpg',
                pluto: '/static/textures/pluto_texture.jpg',

                // Moon textures
                moon: '/static/textures/moon_texture.jpg',
                phobos: '/static/textures/phobos_texture.jpg',
                deimos: '/static/textures/deimos_texture.jpg',
                io: '/static/textures/io_texture.jpg',
                europa: '/static/textures/europa_texture.jpg',
                ganymede: '/static/textures/ganymede_texture.jpg',
                callisto: '/static/textures/callisto_texture.jpg',
                titan: '/static/textures/titan_texture.jpg',
                enceladus: '/static/textures/enceladus_texture.jpg',

                // Ring textures
                saturn_rings: '/static/textures/saturn_rings.png',
                uranus_rings: '/static/textures/uranus_rings.png',
                jupiter_rings: '/static/textures/jupiter_rings.png',
                neptune_rings: '/static/textures/neptune_rings.png',

                // Normal/bump maps
                earth_normal: '/static/textures/earth_normal.jpg',
                mars_normal: '/static/textures/mars_normal.jpg',
                moon_normal: '/static/textures/moon_normal.jpg'
            };

            console.log('🎨 Texture loading system initialized');
        }

        /**
         * Enhanced planet creation with textures, moons, and rings
         */
        async createPlanet(planetData, options = {}) {
            if (!this.isInitialized) {
                await this.init();
            }

            try {
                const planetOptions = {
                    quality: this.options.quality,
                    enableAtmosphere: this.options.enableAtmosphere && this.shouldHaveAtmosphere(planetData),
                    enableRings: this.options.enableRings && planetData.has_rings,
                    enableMoons: this.options.enableMoons && planetData.has_moons,
                    enableGlow: planetData.name === 'Sun',
                    enableTextures: this.options.enableTextures,
                    ...options
                };

                // Create planet group to hold all components
                const planetGroup = new THREE.Group();
                planetGroup.name = `${planetData.name}_group`;
                planetGroup.userData = { planetData, type: 'planet' };

                console.log(`🪐 Creating enhanced ${planetData.name} with textures...`);

                // Create main planet mesh with texture
                const planetMesh = await this.createEnhancedPlanetMesh(planetData, planetOptions);
                planetGroup.add(planetMesh);

                // Add atmosphere if applicable
                if (planetOptions.enableAtmosphere) {
                    const atmosphere = await this.createAtmosphere(planetData, planetOptions);
                    if (atmosphere) {
                        planetGroup.add(atmosphere);
                        this.atmospheres.set(planetData.name, atmosphere);
                    }
                }

                // Add ring system if applicable
                if (planetOptions.enableRings) {
                    const rings = await this.createEnhancedRingSystem(planetData, planetOptions);
                    if (rings) {
                        planetGroup.add(rings);
                        this.ringSystems.set(planetData.name, rings);
                    }
                }

                // Add moon system if applicable
                if (planetOptions.enableMoons) {
                    const moons = await this.createMoonSystem(planetData, planetOptions);
                    if (moons && moons.children.length > 0) {
                        planetGroup.add(moons);
                        this.moonSystems.set(planetData.name, moons);
                    }
                }

                // Add glow effect for the sun
                if (planetOptions.enableGlow) {
                    const glow = await this.createSunGlow(planetData, planetOptions);
                    if (glow) {
                        planetGroup.add(glow);
                    }
                }

                // Store planet instance
                this.planetInstances.set(planetData.name, planetGroup);

                console.log(`✅ Enhanced ${planetData.name} created successfully`);

                return planetGroup;

            } catch (error) {
                console.error(`❌ Failed to create enhanced planet ${planetData.name}:`, error);
                return this.createFallbackPlanet(planetData);
            }
        }

        /**
         * Create enhanced planet mesh with texture loading
         */
        async createEnhancedPlanetMesh(planetData, options = {}) {
            const geometry = this.getOrCreateGeometry(planetData, options);
            const material = await this.createEnhancedMaterial(planetData, options);

            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = planetData.name;
            mesh.userData = { planetData, type: 'planetMesh' };

            // Set position and scale
            const scaledSize = this.calculateScaledSize(planetData);
            mesh.scale.setScalar(scaledSize);

            // Enable shadows for non-sun objects
            if (planetData.name !== 'Sun') {
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }

            return mesh;
        }

        /**
         * Create enhanced material with texture loading
         */
        async createEnhancedMaterial(planetData, options = {}) {
            const materialKey = `${planetData.name}_${options.quality || 'medium'}_textured`;

            if (this.materialCache.has(materialKey)) {
                return this.materialCache.get(materialKey);
            }

            let material;

            if (planetData.name === 'Sun') {
                material = await this.createEnhancedSunMaterial(planetData, options);
            } else {
                material = await this.createEnhancedPlanetMaterial(planetData, options);
            }

            this.materialCache.set(materialKey, material);
            return material;
        }

        /**
         * Create enhanced sun material with texture - FIXED VERSION
         */
        async createEnhancedSunMaterial(planetData, options = {}) {
            const baseColor = new THREE.Color(planetData.color_hex || '#FDB813');

            try {
                // Try to load sun texture
                const texture = await this.loadTexture('sun');

                // Use MeshBasicMaterial for the Sun (doesn't have emissive property issues)
                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    color: baseColor.clone().multiplyScalar(1.2), // Brighter for sun effect
                    transparent: false
                });

                material.userData = {
                    isSun: true,
                    baseColor: baseColor,
                    intensity: 1.2
                };

                console.log('🌟 Sun texture loaded successfully');
                return material;

            } catch (error) {
                console.warn('☀️ Sun texture failed to load, using procedural material');

                // Fallback to enhanced procedural sun material
                return new THREE.MeshBasicMaterial({
                    color: baseColor.clone().multiplyScalar(1.5), // Make it bright
                    transparent: false
                });
            }
        }

        /**
         * Create enhanced planet material with textures
         */
        async createEnhancedPlanetMaterial(planetData, options = {}) {
            const baseColor = new THREE.Color(planetData.color_hex || '#888888');
            const planetName = planetData.name.toLowerCase();

            try {
                // Load main texture
                const texture = await this.loadTexture(planetName);

                const materialOptions = {
                    map: texture,
                    roughness: this.getRoughness(planetData),
                    metalness: this.getMetalness(planetData),
                };

                // Try to load normal map if available
                try {
                    const normalMap = await this.loadTexture(`${planetName}_normal`);
                    materialOptions.normalMap = normalMap;
                    console.log(`🗺️ Normal map loaded for ${planetData.name}`);
                } catch (normalError) {
                    console.log(`📍 No normal map available for ${planetData.name}`);
                }

                // Add planet-specific properties
                this.addPlanetSpecificProperties(materialOptions, planetData);

                const material = new THREE.MeshStandardMaterial(materialOptions);

                material.userData = {
                    planetData: planetData,
                    originalColor: baseColor.clone(),
                    hasTexture: true
                };

                console.log(`🎨 Texture loaded successfully for ${planetData.name}`);
                return material;

            } catch (error) {
                console.warn(`🎨 Texture failed to load for ${planetData.name}, using procedural fallback`);

                // Create procedural fallback material
                return this.createProceduralMaterial(planetData);
            }
        }

        /**
         * Create procedural fallback material
         */
        createProceduralMaterial(planetData) {
            const baseColor = new THREE.Color(planetData.color_hex || '#888888');

            const materialOptions = {
                color: baseColor,
                roughness: this.getRoughness(planetData),
                metalness: this.getMetalness(planetData),
            };

            this.addPlanetSpecificProperties(materialOptions, planetData);

            const material = new THREE.MeshStandardMaterial(materialOptions);
            material.userData = {
                planetData: planetData,
                originalColor: baseColor.clone(),
                hasTexture: false
            };

            return material;
        }

        /**
         * Load texture with caching and fallbacks
         */
        async loadTexture(textureName) {
            if (this.textureCache.has(textureName)) {
                return this.textureCache.get(textureName);
            }

            return new Promise((resolve, reject) => {
                const texturePath = this.texturePaths[textureName];

                if (!texturePath) {
                    reject(new Error(`No texture path defined for ${textureName}`));
                    return;
                }

                this.textureLoader.load(
                    texturePath,
                    (texture) => {
                        // Configure texture
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        texture.magFilter = THREE.LinearFilter;
                        texture.minFilter = THREE.LinearMipMapLinearFilter;
                        texture.generateMipmaps = true;

                        // Cache the texture
                        this.textureCache.set(textureName, texture);
                        resolve(texture);
                    },
                    undefined,
                    (error) => {
                        console.warn(`Failed to load texture ${texturePath}:`, error);
                        reject(error);
                    }
                );
            });
        }

        /**
         * Create enhanced ring system with textures
         */
        async createEnhancedRingSystem(planetData, options = {}) {
            if (!planetData.has_rings) {
                return null;
            }

            const ringGroup = new THREE.Group();
            ringGroup.name = `${planetData.name}_rings`;

            const planetName = planetData.name.toLowerCase();

            console.log(`💍 Creating ring system for ${planetData.name}...`);

            if (planetName === 'saturn') {
                await this.createSaturnRings(ringGroup);
            } else if (planetName === 'uranus') {
                await this.createUranusRings(ringGroup);
            } else if (planetName === 'jupiter') {
                await this.createJupiterRings(ringGroup);
            } else if (planetName === 'neptune') {
                await this.createNeptuneRings(ringGroup);
            } else {
                await this.createGenericRings(ringGroup, planetData);
            }

            console.log(`✅ Ring system created for ${planetData.name}`);
            return ringGroup;
        }

        /**
         * Create Saturn's detailed ring system with texture
         */
        async createSaturnRings(ringGroup) {
            try {
                const ringTexture = await this.loadTexture('saturn_rings');

                // Saturn's main ring system
                const geometry = new THREE.RingGeometry(4.2, 6.5, 128);

                const material = new THREE.MeshBasicMaterial({
                    map: ringTexture,
                    transparent: true,
                    opacity: 0.8,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    alphaTest: 0.1
                });

                const ringMesh = new THREE.Mesh(geometry, material);
                ringMesh.rotation.x = Math.PI / 2;
                ringGroup.add(ringMesh);

                console.log('🪐 Saturn rings texture loaded successfully');

            } catch (error) {
                console.warn('💍 Saturn ring texture failed, using procedural rings');
                await this.createProceduralSaturnRings(ringGroup);
            }
        }

        /**
         * Create procedural Saturn rings as fallback
         */
        async createProceduralSaturnRings(ringGroup) {
            const ringDivisions = [
                { inner: 1.2, outer: 1.5, opacity: 0.8, color: 0xCCCCCC },
                { inner: 1.6, outer: 1.9, opacity: 0.6, color: 0xAAAAAA },
                { inner: 2.0, outer: 2.3, opacity: 0.9, color: 0xDDDDDD },
                { inner: 2.4, outer: 2.5, opacity: 0.4, color: 0x999999 }
            ];

            for (const ring of ringDivisions) {
                const geometry = new THREE.RingGeometry(ring.inner, ring.outer, 64);
                const material = new THREE.MeshBasicMaterial({
                    color: ring.color,
                    transparent: true,
                    opacity: ring.opacity,
                    side: THREE.DoubleSide,
                    depthWrite: false
                });

                const ringMesh = new THREE.Mesh(geometry, material);
                ringMesh.rotation.x = Math.PI / 2;
                ringMesh.rotation.z = Math.random() * Math.PI * 2;
                ringGroup.add(ringMesh);
            }
        }

        /**
         * Create Uranus rings
         */
        async createUranusRings(ringGroup) {
            try {
                const ringTexture = await this.loadTexture('uranus_rings');

                const geometry = new THREE.RingGeometry(3.8, 4.2, 64);
                const material = new THREE.MeshBasicMaterial({
                    map: ringTexture,
                    transparent: true,
                    opacity: 0.4,
                    side: THREE.DoubleSide,
                    depthWrite: false
                });

                const ringMesh = new THREE.Mesh(geometry, material);
                ringMesh.rotation.x = Math.PI / 2;
                ringMesh.rotation.z = Math.PI / 2; // Uranus rings are vertical
                ringGroup.add(ringMesh);

            } catch (error) {
                // Fallback to simple ring
                const geometry = new THREE.RingGeometry(1.8, 2.2, 64);
                const material = new THREE.MeshBasicMaterial({
                    color: 0x4FD0FF,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.DoubleSide,
                    depthWrite: false
                });

                const ringMesh = new THREE.Mesh(geometry, material);
                ringMesh.rotation.x = Math.PI / 2;
                ringMesh.rotation.z = Math.PI / 2;
                ringGroup.add(ringMesh);
            }
        }

        /**
         * Create Jupiter's faint ring system
         */
        async createJupiterRings(ringGroup) {
            const geometry = new THREE.RingGeometry(3.4, 3.8, 64);
            const material = new THREE.MeshBasicMaterial({
                color: 0xD2691E,
                transparent: true,
                opacity: 0.2,
                side: THREE.DoubleSide,
                depthWrite: false
            });

            const ringMesh = new THREE.Mesh(geometry, material);
            ringMesh.rotation.x = Math.PI / 2;
            ringGroup.add(ringMesh);
        }

        /**
         * Create Neptune's ring arcs
         */
        async createNeptuneRings(ringGroup) {
            // Neptune has ring arcs rather than complete rings
            const arcCount = 4;
            for (let i = 0; i < arcCount; i++) {
                const geometry = new THREE.RingGeometry(3.0, 3.2, 32, 1, i * Math.PI / 2, Math.PI / 2);
                const material = new THREE.MeshBasicMaterial({
                    color: 0x4169E1,
                    transparent: true,
                    opacity: 0.4,
                    side: THREE.DoubleSide,
                    depthWrite: false
                });

                const ringMesh = new THREE.Mesh(geometry, material);
                ringMesh.rotation.x = Math.PI / 2;
                ringGroup.add(ringMesh);
            }
        }

        /**
         * Create generic ring system
         */
        async createGenericRings(ringGroup, planetData) {
            const geometry = new THREE.RingGeometry(1.2, 2.0, 64);
            const ringColor = new THREE.Color(planetData.color_hex).multiplyScalar(0.7);

            const material = new THREE.MeshBasicMaterial({
                color: ringColor,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide,
                depthWrite: false
            });

            const ringMesh = new THREE.Mesh(geometry, material);
            ringMesh.rotation.x = Math.PI / 2;
            ringGroup.add(ringMesh);
        }

        /**
         * Create moon system for planets
         */
        async createMoonSystem(planetData, options = {}) {
            if (!planetData.has_moons || !planetData.moon_count) {
                return null;
            }

            const moonGroup = new THREE.Group();
            moonGroup.name = `${planetData.name}_moons`;

            const planetName = planetData.name.toLowerCase();

            console.log(`🌙 Creating moon system for ${planetData.name} (${planetData.moon_count} moons)...`);

            // Create specific moon systems for major planets
            switch (planetName) {
                case 'earth':
                    await this.createEarthMoons(moonGroup);
                    break;
                case 'mars':
                    await this.createMarsMoons(moonGroup);
                    break;
                case 'jupiter':
                    await this.createJupiterMoons(moonGroup);
                    break;
                case 'saturn':
                    await this.createSaturnMoons(moonGroup);
                    break;
                default:
                    await this.createGenericMoons(moonGroup, planetData);
                    break;
            }

            console.log(`✅ Moon system created for ${planetData.name}`);
            return moonGroup;
        }

        /**
         * Create Earth's moon system
         */
        async createEarthMoons(moonGroup) {
            try {
                const moonTexture = await this.loadTexture('moon');
                let normalMap = null;

                try {
                    normalMap = await this.loadTexture('moon_normal');
                } catch (e) {
                    console.log('Moon normal map not available');
                }

                const geometry = new THREE.SphereGeometry(0.3, 32, 32);
                const material = new THREE.MeshStandardMaterial({
                    map: moonTexture,
                    normalMap: normalMap,
                    roughness: 0.9,
                    metalness: 0.0
                });

                const moon = new THREE.Mesh(geometry, material);
                moon.name = 'Moon';
                moon.position.set(8, 0, 0); // Distance from Earth
                moon.castShadow = true;
                moon.receiveShadow = true;

                moon.userData = {
                    type: 'moon',
                    orbitalRadius: 8,
                    orbitalSpeed: 0.1,
                    rotationSpeed: 0.1,
                    moonData: {
                        name: 'Moon',
                        diameter: 3474.8, // km
                        distance: 384400 // km from Earth
                    }
                };

                moonGroup.add(moon);
                console.log('🌙 Earth\'s Moon created with texture');

            } catch (error) {
                console.warn('🌙 Moon texture failed, using procedural moon');
                this.createProceduralMoon(moonGroup, 'Moon', 8, 0.3, 0x999999);
            }
        }

        /**
         * Create Mars moon system (Phobos and Deimos)
         */
        async createMarsMoons(moonGroup) {
            // Phobos
            try {
                const phobosTexture = await this.loadTexture('phobos');
                this.createTexturedMoon(moonGroup, 'Phobos', 4, 0.15, phobosTexture);
            } catch (error) {
                this.createProceduralMoon(moonGroup, 'Phobos', 4, 0.15, 0x8B7765);
            }

            // Deimos
            try {
                const deimosTexture = await this.loadTexture('deimos');
                this.createTexturedMoon(moonGroup, 'Deimos', 6, 0.1, deimosTexture);
            } catch (error) {
                this.createProceduralMoon(moonGroup, 'Deimos', 6, 0.1, 0x8B7765);
            }

            console.log('🔴 Mars moons (Phobos & Deimos) created');
        }

        /**
         * Create Jupiter's major moons
         */
        async createJupiterMoons(moonGroup) {
            const majorMoons = [
                { name: 'Io', distance: 10, size: 0.4, texture: 'io', color: 0xFFFF99 },
                { name: 'Europa', distance: 13, size: 0.35, texture: 'europa', color: 0xCCCCFF },
                { name: 'Ganymede', distance: 16, size: 0.5, texture: 'ganymede', color: 0x999999 },
                { name: 'Callisto', distance: 20, size: 0.45, texture: 'callisto', color: 0x555555 }
            ];

            for (const moonData of majorMoons) {
                try {
                    const texture = await this.loadTexture(moonData.texture);
                    this.createTexturedMoon(moonGroup, moonData.name, moonData.distance, moonData.size, texture);
                } catch (error) {
                    this.createProceduralMoon(moonGroup, moonData.name, moonData.distance, moonData.size, moonData.color);
                }
            }

            console.log('🪐 Jupiter\'s major moons created');
        }

        /**
         * Create Saturn's major moons
         */
        async createSaturnMoons(moonGroup) {
            const majorMoons = [
                { name: 'Titan', distance: 18, size: 0.45, texture: 'titan', color: 0xFFAA55 },
                { name: 'Enceladus', distance: 12, size: 0.2, texture: 'enceladus', color: 0xFFFFFF }
            ];

            for (const moonData of majorMoons) {
                try {
                    const texture = await this.loadTexture(moonData.texture);
                    this.createTexturedMoon(moonGroup, moonData.name, moonData.distance, moonData.size, texture);
                } catch (error) {
                    this.createProceduralMoon(moonGroup, moonData.name, moonData.distance, moonData.size, moonData.color);
                }
            }

            console.log('🪐 Saturn\'s major moons created');
        }

        /**
         * Create generic moons for other planets
         */
        async createGenericMoons(moonGroup, planetData) {
            const moonCount = Math.min(planetData.moon_count, 4); // Limit for performance

            for (let i = 0; i < moonCount; i++) {
                const distance = 6 + i * 3;
                const size = 0.1 + Math.random() * 0.2;
                const color = 0x888888 + Math.random() * 0x444444;

                this.createProceduralMoon(moonGroup, `Moon_${i + 1}`, distance, size, color);
            }
        }

        /**
         * Create textured moon
         */
        createTexturedMoon(moonGroup, name, distance, size, texture) {
            const geometry = new THREE.SphereGeometry(size, 16, 16);
            const material = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.9,
                metalness: 0.0
            });

            const moon = new THREE.Mesh(geometry, material);
            moon.name = name;
            moon.position.set(distance, 0, 0);
            moon.castShadow = true;
            moon.receiveShadow = true;

            moon.userData = {
                type: 'moon',
                orbitalRadius: distance,
                orbitalSpeed: 0.1 / distance, // Slower for farther moons
                rotationSpeed: 0.05,
                moonData: { name: name }
            };

            moonGroup.add(moon);
        }

        /**
         * Create procedural moon
         */
        createProceduralMoon(moonGroup, name, distance, size, color) {
            const geometry = new THREE.SphereGeometry(size, 16, 16);
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(color), // Fix: wrap color in THREE.Color constructor
                roughness: 0.9,
                metalness: 0.0
            });

            const moon = new THREE.Mesh(geometry, material);
            moon.name = name;
            moon.position.set(distance, 0, 0);
            moon.castShadow = true;
            moon.receiveShadow = true;

            moon.userData = {
                type: 'moon',
                orbitalRadius: distance,
                orbitalSpeed: 0.1 / distance,
                rotationSpeed: 0.05,
                moonData: { name: name }
            };

            moonGroup.add(moon);
        }

        /**
         * Update system with moon orbits and rotations
         */
        update(deltaTime) {
            if (!this.isInitialized) return;

            this.planetInstances.forEach((planetGroup, planetName) => {
                this.updatePlanetGroup(planetGroup, deltaTime);
            });
        }

        /**
         * Update individual planet group including moons
         */
        updatePlanetGroup(planetGroup, deltaTime) {
            const planetData = planetGroup.userData.planetData;

            // Update main planet rotation
            const planetMesh = planetGroup.getObjectByName(planetData.name);
            if (planetMesh && planetData.rotation_period) {
                const rotationSpeed = (2 * Math.PI) / (planetData.rotation_period * 3600);
                planetMesh.rotation.y += rotationSpeed * deltaTime * 1000;
            }

            // Update moon orbits
            const moonSystem = this.moonSystems.get(planetData.name);
            if (moonSystem) {
                this.updateMoonOrbits(moonSystem, deltaTime);
            }

            // Update shader animations
            planetGroup.traverse((child) => {
                if (child.material && child.material.uniforms) {
                    if (child.material.uniforms.time) {
                        child.material.uniforms.time.value += deltaTime;
                    }
                }
            });

            // Update atmosphere effects
            const atmosphere = this.atmospheres.get(planetData.name);
            if (atmosphere && atmosphere.material.uniforms) {
                atmosphere.material.uniforms.time.value += deltaTime;
            }
        }

        /**
         * Update moon orbits
         */
        updateMoonOrbits(moonSystem, deltaTime) {
            moonSystem.children.forEach(moon => {
                if (moon.userData && moon.userData.type === 'moon') {
                    const userData = moon.userData;

                    // Update orbital position
                    if (userData.orbitalAngle === undefined) {
                        userData.orbitalAngle = Math.random() * Math.PI * 2;
                    }

                    userData.orbitalAngle += userData.orbitalSpeed * deltaTime * 10;

                    // Calculate new position
                    const x = Math.cos(userData.orbitalAngle) * userData.orbitalRadius;
                    const z = Math.sin(userData.orbitalAngle) * userData.orbitalRadius;
                    const y = Math.sin(userData.orbitalAngle * 2) * 0.5; // Slight vertical motion

                    moon.position.set(x, y, z);

                    // Update moon rotation
                    moon.rotation.y += userData.rotationSpeed * deltaTime * 10;
                }
            });
        }

        /**
         * Create atmosphere effect
         */
        async createAtmosphere(planetData, options = {}) {
            if (!this.shouldHaveAtmosphere(planetData)) {
                return null;
            }

            const atmosphereRadius = 1.05;
            const geometry = new THREE.SphereGeometry(atmosphereRadius, 32, 32);
            const atmosphereColor = this.getAtmosphereColor(planetData);

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0.0 },
                    atmosphereColor: { value: atmosphereColor },
                    opacity: { value: 0.3 },
                    fresnelPower: { value: 3.0 }
                },
                vertexShader: `
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        vPosition = position;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 atmosphereColor;
                    uniform float opacity;
                    uniform float fresnelPower;
                    
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    
                    void main() {
                        vec3 viewDirection = normalize(cameraPosition - vPosition);
                        float fresnel = 1.0 - abs(dot(viewDirection, vNormal));
                        fresnel = pow(fresnel, fresnelPower);
                        
                        float pulse = sin(time * 2.0) * 0.1 + 0.9;
                        
                        gl_FragColor = vec4(atmosphereColor, fresnel * opacity * pulse);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                depthWrite: false
            });

            const atmosphereMesh = new THREE.Mesh(geometry, material);
            atmosphereMesh.name = `${planetData.name}_atmosphere`;
            atmosphereMesh.userData = { type: 'atmosphere', planetData };

            return atmosphereMesh;
        }

        /**
         * Create sun glow effect - FIXED VERSION
         */
        async createSunGlow(planetData, options = {}) {
            const glowRadius = 1.8; // Slightly larger glow
            const geometry = new THREE.SphereGeometry(glowRadius, 32, 32);
            const glowColor = new THREE.Color(planetData.color_hex || '#FDB813');

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0.0 },
                    glowColor: { value: glowColor },
                    intensity: { value: 0.6 }
                },
                vertexShader: `
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        vPosition = position;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 glowColor;
                    uniform float intensity;
                    
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    
                    void main() {
                        vec3 viewDirection = normalize(cameraPosition - vPosition);
                        float fresnel = 1.0 - abs(dot(viewDirection, vNormal));
                        
                        float pulse = sin(time * 2.0) * 0.3 + 0.7;
                        
                        float alpha = fresnel * intensity * pulse;
                        gl_FragColor = vec4(glowColor, alpha);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                depthWrite: false
            });

            const glowMesh = new THREE.Mesh(geometry, material);
            glowMesh.name = `${planetData.name}_glow`;
            glowMesh.userData = { type: 'glow', planetData };

            return glowMesh;
        }

        // Helper methods (existing methods from original)
        shouldHaveAtmosphere(planetData) {
            const atmosphericPlanets = ['Earth', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
            return atmosphericPlanets.includes(planetData.name);
        }

        getAtmosphereColor(planetData) {
            const atmosphereColors = {
                'Earth': new THREE.Color(0x87CEEB),
                'Venus': new THREE.Color(0xFFC649),
                'Mars': new THREE.Color(0xFF6B47),
                'Jupiter': new THREE.Color(0xD2691E),
                'Saturn': new THREE.Color(0xFAD5A5),
                'Uranus': new THREE.Color(0x4FD0FF),
                'Neptune': new THREE.Color(0x4169E1)
            };
            return atmosphereColors[planetData.name] || new THREE.Color(planetData.color_hex);
        }

        getRoughness(planetData) {
            const roughnessMap = {
                'terrestrial': 0.8,
                'gas_giant': 0.1,
                'ice_giant': 0.3,
                'dwarf_planet': 0.9
            };
            return roughnessMap[planetData.planet_type] || 0.7;
        }

        getMetalness(planetData) {
            const metalnessMap = {
                'terrestrial': 0.1,
                'gas_giant': 0.0,
                'ice_giant': 0.0,
                'dwarf_planet': 0.2
            };
            return metalnessMap[planetData.planet_type] || 0.0;
        }

        addPlanetSpecificProperties(materialOptions, planetData) {
            switch (planetData.name) {
                case 'Earth':
                    materialOptions.roughness = 0.7;
                    materialOptions.metalness = 0.1;
                    materialOptions.emissive = new THREE.Color(0x001122);
                    materialOptions.emissiveIntensity = 0.05;
                    break;

                case 'Mars':
                    materialOptions.roughness = 0.9;
                    materialOptions.metalness = 0.05;
                    break;

                case 'Venus':
                    materialOptions.roughness = 0.1;
                    materialOptions.metalness = 0.0;
                    materialOptions.emissive = new THREE.Color(planetData.color_hex);
                    materialOptions.emissiveIntensity = 0.1;
                    break;

                case 'Jupiter':
                case 'Saturn':
                    materialOptions.roughness = 0.1;
                    materialOptions.metalness = 0.0;
                    break;

                case 'Uranus':
                case 'Neptune':
                    materialOptions.roughness = 0.2;
                    materialOptions.metalness = 0.0;
                    materialOptions.emissive = new THREE.Color(planetData.color_hex);
                    materialOptions.emissiveIntensity = 0.05;
                    break;

                default:
                    materialOptions.roughness = 0.8;
                    materialOptions.metalness = 0.1;
            }
        }

        calculateScaledSize(planetData) {
            const MIN_SIZE = 0.3;
            const MAX_SIZE = 6.0;

            let scaledSize;

            if (planetData.name === 'Sun') {
                scaledSize = 5.0;
            } else {
                const earthDiameter = 12756;
                const diameter = planetData.diameter;

                // Fix: Handle NaN, undefined, null, and invalid diameters
                if (!diameter || isNaN(diameter) || diameter <= 0) {
                    return MIN_SIZE;
                }

                const sizeRatio = diameter / earthDiameter;

                if (sizeRatio < 0.1) {
                    scaledSize = 0.3 + (sizeRatio * 5);
                } else if (sizeRatio < 1.0) {
                    scaledSize = 0.5 + (sizeRatio * 1.5);
                } else {
                    scaledSize = 1.0 + Math.log(sizeRatio) * 0.8;
                }
            }

            const result = Math.max(MIN_SIZE, Math.min(MAX_SIZE, scaledSize));

            // Fix: Ensure we never return NaN
            return isNaN(result) ? MIN_SIZE : result;
        }


        getOrCreateGeometry(planetData, options = {}) {
            const segments = this.getSegmentCount(planetData, options.quality);
            const geometryKey = `sphere_${segments}`;

            if (this.geometryCache.has(geometryKey)) {
                return this.geometryCache.get(geometryKey);
            }

            const geometry = new THREE.SphereGeometry(1, segments, segments);
            this.geometryCache.set(geometryKey, geometry);

            return geometry;
        }

        getSegmentCount(planetData, quality = 'medium') {
            const baseSegments = {
                'low': this.options.lowQualitySegments,
                'medium': this.options.defaultSegments,
                'high': this.options.highQualitySegments
            }[quality] || this.options.defaultSegments;

            if (planetData.name === 'Sun' || planetData.name === 'Earth') {
                return Math.min(baseSegments * 1.5, 128);
            }

            return baseSegments;
        }

        createFallbackPlanet(planetData) {
            const geometry = new THREE.SphereGeometry(1, 32, 32);
            const material = new THREE.MeshStandardMaterial({
                color: planetData.color_hex || '#888888',
                roughness: 0.7,
                metalness: 0.1
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = planetData.name;
            mesh.userData = { planetData, type: 'fallback' };

            const scaledSize = this.calculateScaledSize(planetData);
            mesh.scale.setScalar(scaledSize);

            const group = new THREE.Group();
            group.add(mesh);
            group.name = `${planetData.name}_group`;
            group.userData = { planetData, type: 'planet' };

            return group;
        }

        /**
         * Set quality level
         */
        setQuality(quality) {
            this.options.quality = quality;
            this.materialCache.clear();
            this.geometryCache.clear();

            console.log(`Planet factory quality set to ${quality}`);
        }

        /**
         * Get planet instance
         */
        getPlanet(planetName) {
            return this.planetInstances.get(planetName) || null;
        }

        /**
         * Get all planet instances
         */
        getAllPlanets() {
            return this.planetInstances;
        }

        /**
         * Get factory statistics
         */
        getStats() {
            return {
                isInitialized: this.isInitialized,
                planetsCreated: this.planetInstances.size,
                materialsCached: this.materialCache.size,
                texturesCached: this.textureCache.size,
                geometriesCached: this.geometryCache.size,
                moonSystems: this.moonSystems.size,
                ringSystems: this.ringSystems.size,
                atmospheres: this.atmospheres.size,
                quality: this.options.quality
            };
        }

        /**
         * Dispose of factory resources
         */
        dispose() {
            // Dispose geometries
            this.geometryCache.forEach(geometry => geometry.dispose());
            this.geometryCache.clear();

            // Dispose materials
            this.materialCache.forEach(material => material.dispose());
            this.materialCache.clear();

            // Dispose textures
            this.textureCache.forEach(texture => texture.dispose());
            this.textureCache.clear();

            // Clear planet instances
            this.planetInstances.clear();
            this.moonSystems.clear();
            this.ringSystems.clear();
            this.atmospheres.clear();

            this.isInitialized = false;

            console.log('Enhanced Planet factory disposed');
        }
    }

    // Public API
    return {
        PlanetFactory,

        // Factory function
        create: (options = {}) => {
            return new PlanetFactory(options);
        }
    };
})();

console.log('✅ Enhanced PlanetFactory with textures, moons, and rings loaded successfully');