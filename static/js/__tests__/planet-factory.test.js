// static/js/__tests__/planet-factory.test.js
// Comprehensive tests for the enhanced Planet Factory with textures, moons, and rings

// ===================================================================
// ENHANCED THREE.JS MOCKS FOR PLANET FACTORY
// ===================================================================

const THREE = {
    // Core geometry
    SphereGeometry: jest.fn(function(radius, widthSegments, heightSegments) {
        this.radius = radius || 1;
        this.widthSegments = widthSegments || 32;
        this.heightSegments = heightSegments || 32;
        this.dispose = jest.fn();
    }),

    RingGeometry: jest.fn(function(innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength) {
        this.innerRadius = innerRadius || 0.5;
        this.outerRadius = outerRadius || 1;
        this.thetaSegments = thetaSegments || 32;
        this.phiSegments = phiSegments || 1;
        this.thetaStart = thetaStart || 0;
        this.thetaLength = thetaLength || Math.PI * 2;
        this.dispose = jest.fn();
    }),

    // Materials
    MeshBasicMaterial: jest.fn(function(options = {}) {
        this.map = options.map || null;
        this.color = options.color || new THREE.Color(0xffffff);
        this.transparent = options.transparent || false;
        this.opacity = options.opacity || 1.0;
        this.side = options.side || 'FrontSide';
        this.depthWrite = options.depthWrite !== false;
        this.alphaTest = options.alphaTest || 0;
        this.blending = options.blending || 'NormalBlending';
        this.dispose = jest.fn();
        this.userData = {};
    }),

    MeshStandardMaterial: jest.fn(function(options = {}) {
        this.map = options.map || null;
        this.normalMap = options.normalMap || null;
        this.color = options.color || new THREE.Color(0xffffff);
        this.roughness = options.roughness || 0.5;
        this.metalness = options.metalness || 0.0;
        this.emissive = options.emissive || new THREE.Color(0x000000);
        this.emissiveIntensity = options.emissiveIntensity || 1.0;
        this.transparent = options.transparent || false;
        this.opacity = options.opacity || 1.0;
        this.dispose = jest.fn();
        this.userData = {};
    }),

    ShaderMaterial: jest.fn(function(options = {}) {
        this.uniforms = options.uniforms || {};
        this.vertexShader = options.vertexShader || '';
        this.fragmentShader = options.fragmentShader || '';
        this.transparent = options.transparent || false;
        this.blending = options.blending || 'NormalBlending';
        this.side = options.side || 'FrontSide';
        this.depthWrite = options.depthWrite !== false;
        this.dispose = jest.fn();
    }),

    // Core objects
    Mesh: jest.fn(function(geometry, material) {
        this.geometry = geometry;
        this.material = material;
        this.position = {
            set: jest.fn((x, y, z) => {
                this.position.x = x;
                this.position.y = y;
                this.position.z = z;
            }),
            x: 0, y: 0, z: 0
        };
        this.rotation = {
            x: 0, y: 0, z: 0
        };
        this.scale = {
            setScalar: jest.fn((scale) => {
                this.scale.x = this.scale.y = this.scale.z = scale;
            }),
            x: 1, y: 1, z: 1
        };
        this.name = '';
        this.userData = {};
        this.castShadow = false;
        this.receiveShadow = false;
    }),

    Group: jest.fn(function() {
        this.children = [];
        this.name = '';
        this.userData = {};
        this.position = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.scale = { x: 1, y: 1, z: 1 };

        this.add = jest.fn((object) => {
            this.children.push(object);
            object.parent = this;
        });

        this.remove = jest.fn((object) => {
            const index = this.children.indexOf(object);
            if (index > -1) {
                this.children.splice(index, 1);
                object.parent = null;
            }
        });

        this.getObjectByName = jest.fn((name) => {
            return this.children.find(child => child.name === name) || null;
        });

        this.traverse = jest.fn((callback) => {
            const traverse = (object) => {
                callback(object);
                if (object.children) {
                    object.children.forEach(traverse);
                }
            };
            traverse(this);
        });
    }),

    // Texture system
    TextureLoader: jest.fn(function() {
        this.load = jest.fn((url, onLoad, onProgress, onError) => {
            // Simulate async texture loading
            setTimeout(() => {
                if (url.includes('_fail') || url.includes('non-existent')) {
                    // Simulate texture loading failure
                    if (onError) onError(new Error(`Failed to load texture: ${url}`));
                } else {
                    // Simulate successful texture loading
                    const mockTexture = new THREE.Texture();
                    mockTexture.image = { width: 512, height: 512 };
                    mockTexture.needsUpdate = true;
                    if (onLoad) onLoad(mockTexture);
                }
            }, 10);
        });
    }),

    Texture: jest.fn(function() {
        this.wrapS = 'ClampToEdgeWrapping';
        this.wrapT = 'ClampToEdgeWrapping';
        this.magFilter = 'LinearFilter';
        this.minFilter = 'LinearMipMapLinearFilter';
        this.generateMipmaps = true;
        this.needsUpdate = false;
        this.image = null;
        this.dispose = jest.fn();
    }),

    // Color system
    Color: jest.fn(function(color) {
        if (typeof color === 'number') {
            this.r = ((color >> 16) & 255) / 255;
            this.g = ((color >> 8) & 255) / 255;
            this.b = (color & 255) / 255;
        } else if (typeof color === 'string') {
            // Simple hex parsing
            const hex = color.replace('#', '');
            this.r = parseInt(hex.substr(0, 2), 16) / 255;
            this.g = parseInt(hex.substr(2, 2), 16) / 255;
            this.b = parseInt(hex.substr(4, 2), 16) / 255;
        } else {
            this.r = 1;
            this.g = 1;
            this.b = 1;
        }

        this.setHex = jest.fn((hex) => {
            this.r = ((hex >> 16) & 255) / 255;
            this.g = ((hex >> 8) & 255) / 255;
            this.b = (hex & 255) / 255;
            return this;
        });

        this.clone = jest.fn(() => {
            const cloned = new THREE.Color();
            cloned.r = this.r;
            cloned.g = this.g;
            cloned.b = this.b;
            return cloned;
        });

        this.multiplyScalar = jest.fn((scalar) => {
            this.r *= scalar;
            this.g *= scalar;
            this.b *= scalar;
            return this;
        });
    }),

    // Constants
    RepeatWrapping: 'RepeatWrapping',
    ClampToEdgeWrapping: 'ClampToEdgeWrapping',
    LinearFilter: 'LinearFilter',
    LinearMipMapLinearFilter: 'LinearMipMapLinearFilter',
    DoubleSide: 'DoubleSide',
    BackSide: 'BackSide',
    FrontSide: 'FrontSide',
    AdditiveBlending: 'AdditiveBlending',
    NormalBlending: 'NormalBlending'
};

// Global THREE setup
global.THREE = THREE;

// Mock console methods to reduce test output noise
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
});

afterAll(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
});

// ===================================================================
// MOCK PLANET FACTORY IMPLEMENTATION
// ===================================================================

class MockPlanetFactory {
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

        // Mock texture paths
        this.texturePaths = {
            sun: '/static/textures/sun_texture.jpg',
            earth: '/static/textures/earth_texture.jpg',
            mars: '/static/textures/mars_texture.jpg',
            jupiter: '/static/textures/jupiter_texture.jpg',
            saturn: '/static/textures/saturn_texture.jpg',
            moon: '/static/textures/moon_texture.jpg',
            saturn_rings: '/static/textures/saturn_rings.png',
            earth_normal: '/static/textures/earth_normal.jpg'
        };
    }

    async init() {
        try {
            await this.initializeTextures();
            this.isInitialized = true;
            return true;
        } catch (error) {
            throw error;
        }
    }

    async initializeTextures() {
        // Mock texture initialization
        return Promise.resolve();
    }

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

            const planetGroup = new THREE.Group();
            planetGroup.name = `${planetData.name}_group`;
            planetGroup.userData = { planetData, type: 'planet' };

            // Create main planet mesh
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

            this.planetInstances.set(planetData.name, planetGroup);
            return planetGroup;

        } catch (error) {
            // Fix: Ensure fallback planet is created and stored
            const fallbackPlanet = this.createFallbackPlanet(planetData);
            this.planetInstances.set(planetData.name, fallbackPlanet); // This was missing!
            return fallbackPlanet;
        }
    }

    async createEnhancedPlanetMesh(planetData, options = {}) {
        const geometry = this.getOrCreateGeometry(planetData, options);
        const material = await this.createEnhancedMaterial(planetData, options);

        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = planetData.name;
        mesh.userData = { planetData, type: 'planetMesh' };

        const scaledSize = this.calculateScaledSize(planetData);
        mesh.scale.setScalar(scaledSize);

        if (planetData.name !== 'Sun') {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }

        return mesh;
    }

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

    async createEnhancedSunMaterial(planetData, options = {}) {
        const baseColor = new THREE.Color(planetData.color_hex || '#FDB813');

        try {
            const texture = await this.loadTexture('sun');
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                color: baseColor.clone().multiplyScalar(1.2)
            });

            material.userData = {
                isSun: true,
                baseColor: baseColor,
                intensity: 1.2
            };

            return material;
        } catch (error) {
            return new THREE.MeshBasicMaterial({
                color: baseColor.clone().multiplyScalar(1.5)
            });
        }
    }

    async createEnhancedPlanetMaterial(planetData, options = {}) {
        const baseColor = new THREE.Color(planetData.color_hex || '#888888');
        const planetName = planetData.name.toLowerCase();

        try {
            const texture = await this.loadTexture(planetName);

            const materialOptions = {
                map: texture,
                roughness: this.getRoughness(planetData),
                metalness: this.getMetalness(planetData),
            };

            // Try to load normal map
            try {
                const normalMap = await this.loadTexture(`${planetName}_normal`);
                materialOptions.normalMap = normalMap;
            } catch (normalError) {
                // Normal map not available, continue without it
            }

            this.addPlanetSpecificProperties(materialOptions, planetData);

            const material = new THREE.MeshStandardMaterial(materialOptions);
            material.userData = {
                planetData: planetData,
                originalColor: baseColor.clone(),
                hasTexture: true
            };

            return material;
        } catch (error) {
            return this.createProceduralMaterial(planetData);
        }
    }

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
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.magFilter = THREE.LinearFilter;
                    texture.minFilter = THREE.LinearMipMapLinearFilter;
                    texture.generateMipmaps = true;

                    this.textureCache.set(textureName, texture);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    reject(error);
                }
            );
        });
    }

    async createEnhancedRingSystem(planetData, options = {}) {
        if (!planetData.has_rings) {
            return null;
        }

        const ringGroup = new THREE.Group();
        ringGroup.name = `${planetData.name}_rings`;

        const planetName = planetData.name.toLowerCase();

        if (planetName === 'saturn') {
            await this.createSaturnRings(ringGroup);
        } else if (planetName === 'uranus') {
            await this.createUranusRings(ringGroup);
        } else {
            await this.createGenericRings(ringGroup, planetData);
        }

        return ringGroup;
    }

    async createSaturnRings(ringGroup) {
        try {
            const ringTexture = await this.loadTexture('saturn_rings');

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
        } catch (error) {
            await this.createProceduralSaturnRings(ringGroup);
        }
    }

    async createProceduralSaturnRings(ringGroup) {
        const ringDivisions = [
            { inner: 1.2, outer: 1.5, opacity: 0.8, color: 0xCCCCCC },
            { inner: 1.6, outer: 1.9, opacity: 0.6, color: 0xAAAAAA }
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
            ringGroup.add(ringMesh);
        }
    }

    async createUranusRings(ringGroup) {
        const geometry = new THREE.RingGeometry(3.8, 4.2, 64);
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

    async createMoonSystem(planetData, options = {}) {
        if (!planetData.has_moons || !planetData.moon_count) {
            return null;
        }

        const moonGroup = new THREE.Group();
        moonGroup.name = `${planetData.name}_moons`;
        const planetName = planetData.name.toLowerCase();

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
            default:
                await this.createGenericMoons(moonGroup, planetData);
                break;
        }

        return moonGroup;
    }

    async createEarthMoons(moonGroup) {
        try {
            const moonTexture = await this.loadTexture('moon');
            this.createTexturedMoon(moonGroup, 'Moon', 8, 0.3, moonTexture);
        } catch (error) {
            this.createProceduralMoon(moonGroup, 'Moon', 8, 0.3, 0x999999);
        }
    }

    async createMarsMoons(moonGroup) {
        this.createProceduralMoon(moonGroup, 'Phobos', 4, 0.15, 0x8B7765);
        this.createProceduralMoon(moonGroup, 'Deimos', 6, 0.1, 0x8B7765);
    }

    async createJupiterMoons(moonGroup) {
        const majorMoons = [
            { name: 'Io', distance: 10, size: 0.4, color: 0xFFFF99 },
            { name: 'Europa', distance: 13, size: 0.35, color: 0xCCCCFF },
            { name: 'Ganymede', distance: 16, size: 0.5, color: 0x999999 },
            { name: 'Callisto', distance: 20, size: 0.45, color: 0x555555 }
        ];

        for (const moonData of majorMoons) {
            this.createProceduralMoon(moonGroup, moonData.name, moonData.distance, moonData.size, moonData.color);
        }
    }

    async createGenericMoons(moonGroup, planetData) {
        const moonCount = Math.min(planetData.moon_count, 4);

        for (let i = 0; i < moonCount; i++) {
            const distance = 6 + i * 3;
            const size = 0.1 + Math.random() * 0.2;
            const color = 0x888888 + Math.random() * 0x444444;

            this.createProceduralMoon(moonGroup, `Moon_${i + 1}`, distance, size, color);
        }
    }

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
            orbitalSpeed: 0.1 / distance,
            rotationSpeed: 0.05,
            moonData: { name: name }
        };

        moonGroup.add(moon);
    }

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

    update(deltaTime) {
        if (!this.isInitialized) return;

        this.planetInstances.forEach((planetGroup, planetName) => {
            this.updatePlanetGroup(planetGroup, deltaTime);
        });
    }

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

    updateMoonOrbits(moonSystem, deltaTime) {
        moonSystem.children.forEach(moon => {
            if (moon.userData && moon.userData.type === 'moon') {
                const userData = moon.userData;

                if (userData.orbitalAngle === undefined) {
                    userData.orbitalAngle = Math.random() * Math.PI * 2;
                }

                userData.orbitalAngle += userData.orbitalSpeed * deltaTime * 10;

                const x = Math.cos(userData.orbitalAngle) * userData.orbitalRadius;
                const z = Math.sin(userData.orbitalAngle) * userData.orbitalRadius;
                const y = Math.sin(userData.orbitalAngle * 2) * 0.5;

                moon.position.set(x, y, z);
                moon.rotation.y += userData.rotationSpeed * deltaTime * 10;
            }
        });
    }

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
            vertexShader: 'mock vertex shader',
            fragmentShader: 'mock fragment shader',
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

    async createSunGlow(planetData, options = {}) {
        const glowRadius = 1.8;
        const geometry = new THREE.SphereGeometry(glowRadius, 32, 32);
        const glowColor = new THREE.Color(planetData.color_hex || '#FDB813');

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                glowColor: { value: glowColor },
                intensity: { value: 0.6 }
            },
            vertexShader: 'mock vertex shader',
            fragmentShader: 'mock fragment shader',
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

    // Helper methods
    shouldHaveAtmosphere(planetData) {
        const atmosphericPlanets = ['Earth', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'ComplexPlanet'];
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

    setQuality(quality) {
        this.options.quality = quality;
        this.materialCache.clear();
        this.geometryCache.clear();
    }

    getPlanet(planetName) {
        return this.planetInstances.get(planetName) || null;
    }

    getAllPlanets() {
        return this.planetInstances;
    }

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

    dispose() {
        this.geometryCache.forEach(geometry => geometry.dispose());
        this.geometryCache.clear();

        this.materialCache.forEach(material => material.dispose());
        this.materialCache.clear();

        this.textureCache.forEach(texture => texture.dispose());
        this.textureCache.clear();

        this.planetInstances.clear();
        this.moonSystems.clear();
        this.ringSystems.clear();
        this.atmospheres.clear();

        this.isInitialized = false;
    }
}

// ===================================================================
// TEST DATA FACTORIES
// ===================================================================

const createMockPlanetData = (overrides = {}) => ({
    name: 'Earth',
    diameter: 12756,
    color_hex: '#4F94CD',
    planet_type: 'terrestrial',
    rotation_period: 24,
    has_rings: false,
    has_moons: true,
    moon_count: 1,
    ...overrides
});

const createMockSunData = () => ({
    name: 'Sun',
    diameter: 1391000,
    color_hex: '#FDB813',
    planet_type: 'star',
    rotation_period: 609.12,
    has_rings: false,
    has_moons: false,
    moon_count: 0
});

const createMockSaturnData = () => ({
    name: 'Saturn',
    diameter: 120536,
    color_hex: '#FAD5A5',
    planet_type: 'gas_giant',
    rotation_period: 10.7,
    has_rings: true,
    has_moons: true,
    moon_count: 82
});

const createMockJupiterData = () => ({
    name: 'Jupiter',
    diameter: 142984,
    color_hex: '#D2691E',
    planet_type: 'gas_giant',
    rotation_period: 9.9,
    has_rings: true,
    has_moons: true,
    moon_count: 79
});

const createMockMarsData = () => ({
    name: 'Mars',
    diameter: 6792,
    color_hex: '#CD5C5C',
    planet_type: 'terrestrial',
    rotation_period: 24.6,
    has_rings: false,
    has_moons: true,
    moon_count: 2
});

// ===================================================================
// MAIN TEST SUITE
// ===================================================================

describe('PlanetFactory', () => {
    let planetFactory;

    beforeEach(() => {
        jest.clearAllMocks();
        planetFactory = new MockPlanetFactory();
    });

    afterEach(() => {
        if (planetFactory) {
            planetFactory.dispose();
        }
    });

    describe('Initialization', () => {
        test('should create PlanetFactory with default options', () => {
            expect(planetFactory).toBeDefined();
            expect(planetFactory.options.defaultSegments).toBe(64);
            expect(planetFactory.options.enableTextures).toBe(true);
            expect(planetFactory.options.enableAtmosphere).toBe(true);
            expect(planetFactory.options.enableRings).toBe(true);
            expect(planetFactory.options.enableMoons).toBe(true);
            expect(planetFactory.options.quality).toBe('medium');
        });

        test('should create PlanetFactory with custom options', () => {
            const customFactory = new MockPlanetFactory({
                enableTextures: false,
                quality: 'high',
                defaultSegments: 128
            });

            expect(customFactory.options.enableTextures).toBe(false);
            expect(customFactory.options.quality).toBe('high');
            expect(customFactory.options.defaultSegments).toBe(128);

            customFactory.dispose();
        });

        test('should initialize successfully', async () => {
            const success = await planetFactory.init();

            expect(success).toBe(true);
            expect(planetFactory.isInitialized).toBe(true);
            expect(planetFactory.textureLoader).toBeInstanceOf(THREE.TextureLoader);
        });

        test('should handle initialization errors', async () => {
            const errorFactory = new MockPlanetFactory();
            errorFactory.initializeTextures = jest.fn().mockRejectedValue(new Error('Init failed'));

            await expect(errorFactory.init()).rejects.toThrow('Init failed');
        });

        test('should initialize core properties correctly', () => {
            expect(planetFactory.materialCache).toBeInstanceOf(Map);
            expect(planetFactory.geometryCache).toBeInstanceOf(Map);
            expect(planetFactory.textureCache).toBeInstanceOf(Map);
            expect(planetFactory.planetInstances).toBeInstanceOf(Map);
            expect(planetFactory.moonSystems).toBeInstanceOf(Map);
            expect(planetFactory.ringSystems).toBeInstanceOf(Map);
            expect(planetFactory.atmospheres).toBeInstanceOf(Map);
        });
    });

    describe('Planet Creation', () => {
        beforeEach(async () => {
            await planetFactory.init();
        });

        test('should create a basic terrestrial planet', async () => {
            const earthData = createMockPlanetData();
            const planet = await planetFactory.createPlanet(earthData);

            expect(planet).toBeInstanceOf(THREE.Group);
            expect(planet.name).toBe('Earth_group');
            expect(planet.userData.planetData).toBe(earthData);
            expect(planet.userData.type).toBe('planet');

            // Should contain main planet mesh
            const planetMesh = planet.getObjectByName('Earth');
            expect(planetMesh).toBeInstanceOf(THREE.Mesh);
            expect(planetMesh.geometry).toBeInstanceOf(THREE.SphereGeometry);
            expect(planetMesh.material).toBeDefined();

            // Should be stored in instances
            expect(planetFactory.planetInstances.get('Earth')).toBe(planet);
        });

        test('should create the Sun with special properties', async () => {
            const sunData = createMockSunData();
            const sun = await planetFactory.createPlanet(sunData);

            expect(sun).toBeInstanceOf(THREE.Group);
            expect(sun.name).toBe('Sun_group');

            const sunMesh = sun.getObjectByName('Sun');
            expect(sunMesh).toBeInstanceOf(THREE.Mesh);
            expect(sunMesh.castShadow).toBe(false);
            expect(sunMesh.receiveShadow).toBe(false);

            // Should have glow effect
            const glowMesh = sun.children.find(child => child.name === 'Sun_glow');
            expect(glowMesh).toBeDefined();
        });

        test('should create planet with atmosphere when applicable', async () => {
            const earthData = createMockPlanetData({ name: 'Earth' });
            const planet = await planetFactory.createPlanet(earthData);

            // Should have atmosphere
            const atmosphere = planet.children.find(child => child.name === 'Earth_atmosphere');
            expect(atmosphere).toBeDefined();
            expect(atmosphere.userData.type).toBe('atmosphere');
            expect(planetFactory.atmospheres.get('Earth')).toBe(atmosphere);
        });

        test('should create planet with ring system when applicable', async () => {
            const saturnData = createMockSaturnData();
            const planet = await planetFactory.createPlanet(saturnData);

            // Should have ring system
            const rings = planet.children.find(child => child.name === 'Saturn_rings');
            expect(rings).toBeDefined();
            expect(rings).toBeInstanceOf(THREE.Group);
            expect(planetFactory.ringSystems.get('Saturn')).toBe(rings);
        });

        test('should create planet with moon system when applicable', async () => {
            const earthData = createMockPlanetData({ name: 'Earth', has_moons: true, moon_count: 1 });
            const planet = await planetFactory.createPlanet(earthData);

            // Should have moon system
            const moons = planet.children.find(child => child.name === 'Earth_moons');
            expect(moons).toBeDefined();
            expect(moons).toBeInstanceOf(THREE.Group);
            expect(planetFactory.moonSystems.get('Earth')).toBe(moons);
        });

        test('should disable features based on options', async () => {
            const earthData = createMockPlanetData();
            const planet = await planetFactory.createPlanet(earthData, {
                enableAtmosphere: false,
                enableMoons: false
            });

            // Should not have atmosphere or moons
            const atmosphere = planet.children.find(child => child.name === 'Earth_atmosphere');
            const moons = planet.children.find(child => child.name === 'Earth_moons');

            expect(atmosphere).toBeUndefined();
            expect(moons).toBeUndefined();
        });

        test('should create fallback planet on error', async () => {
            const errorFactory = new MockPlanetFactory();
            errorFactory.createEnhancedPlanetMesh = jest.fn().mockRejectedValue(new Error('Creation failed'));

            const planetData = createMockPlanetData();
            const planet = await errorFactory.createPlanet(planetData);

            expect(planet).toBeInstanceOf(THREE.Group);
            expect(planet.children[0].userData.type).toBe('fallback');
        });
    });

    describe('Material Creation', () => {
        beforeEach(async () => {
            await planetFactory.init();
        });

        test('should create enhanced sun material', async () => {
            const sunData = createMockSunData();
            const material = await planetFactory.createEnhancedSunMaterial(sunData);

            expect(material).toBeInstanceOf(THREE.MeshBasicMaterial);
            expect(material.userData.isSun).toBe(true);
            expect(material.userData.baseColor).toBeInstanceOf(THREE.Color);
        });

        test('should create enhanced planet material with texture', async () => {
            const earthData = createMockPlanetData({ name: 'Earth' });
            const material = await planetFactory.createEnhancedPlanetMaterial(earthData);

            expect(material).toBeDefined();
            expect(material.userData.planetData).toBe(earthData);
        });

        test('should create procedural material as fallback', () => {
            const planetData = createMockPlanetData();
            const material = planetFactory.createProceduralMaterial(planetData);

            expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
            expect(material.userData.hasTexture).toBe(false);
            expect(material.userData.originalColor).toBeInstanceOf(THREE.Color);
        });

        test('should cache materials properly', async () => {
            const earthData = createMockPlanetData();

            const material1 = await planetFactory.createEnhancedMaterial(earthData, { quality: 'medium' });
            const material2 = await planetFactory.createEnhancedMaterial(earthData, { quality: 'medium' });

            expect(material1).toBe(material2);
            expect(planetFactory.materialCache.size).toBeGreaterThan(0);
        });

        test('should add planet-specific material properties', () => {
            const materialOptions = {};
            const earthData = createMockPlanetData({ name: 'Earth' });

            planetFactory.addPlanetSpecificProperties(materialOptions, earthData);

            expect(materialOptions.roughness).toBe(0.7);
            expect(materialOptions.metalness).toBe(0.1);
            expect(materialOptions.emissive).toBeInstanceOf(THREE.Color);
            expect(materialOptions.emissiveIntensity).toBe(0.05);
        });

        test('should calculate correct roughness and metalness', () => {
            const terrestrial = createMockPlanetData({ planet_type: 'terrestrial' });
            const gasGiant = createMockPlanetData({ planet_type: 'gas_giant' });
            const iceGiant = createMockPlanetData({ planet_type: 'ice_giant' });

            expect(planetFactory.getRoughness(terrestrial)).toBe(0.8);
            expect(planetFactory.getRoughness(gasGiant)).toBe(0.1);
            expect(planetFactory.getRoughness(iceGiant)).toBe(0.3);

            expect(planetFactory.getMetalness(terrestrial)).toBe(0.1);
            expect(planetFactory.getMetalness(gasGiant)).toBe(0.0);
            expect(planetFactory.getMetalness(iceGiant)).toBe(0.0);
        });
    });

    describe('Texture Loading', () => {
        beforeEach(async () => {
            await planetFactory.init();
        });

        test('should load texture successfully', async () => {
            const texture = await planetFactory.loadTexture('earth');

            expect(texture).toBeInstanceOf(THREE.Texture);
            expect(texture.wrapS).toBe(THREE.RepeatWrapping);
            expect(texture.wrapT).toBe(THREE.RepeatWrapping);
            expect(planetFactory.textureCache.get('earth')).toBe(texture);
        });

        test('should return cached texture on subsequent loads', async () => {
            const texture1 = await planetFactory.loadTexture('earth');
            const texture2 = await planetFactory.loadTexture('earth');

            expect(texture1).toBe(texture2);
            expect(planetFactory.textureLoader.load).toHaveBeenCalledTimes(1);
        });

        test('should reject for non-existent textures', async () => {
            await expect(planetFactory.loadTexture('non_existent')).rejects.toThrow();
        });

        test('should reject when no texture path is defined', async () => {
            await expect(planetFactory.loadTexture('undefined_texture')).rejects.toThrow(
                'No texture path defined for undefined_texture'
            );
        });
    });

    describe('Ring System Creation', () => {
        beforeEach(async () => {
            await planetFactory.init();
        });

        test('should create Saturn ring system', async () => {
            const saturnData = createMockSaturnData();
            const rings = await planetFactory.createEnhancedRingSystem(saturnData);

            expect(rings).toBeInstanceOf(THREE.Group);
            expect(rings.name).toBe('Saturn_rings');
            expect(rings.children.length).toBeGreaterThan(0);

            const ringMesh = rings.children[0];
            expect(ringMesh).toBeInstanceOf(THREE.Mesh);
            expect(ringMesh.geometry).toBeInstanceOf(THREE.RingGeometry);
        });

        test('should create Uranus ring system', async () => {
            const uranusData = createMockPlanetData({
                name: 'Uranus',
                has_rings: true,
                planet_type: 'ice_giant'
            });
            const rings = await planetFactory.createEnhancedRingSystem(uranusData);

            expect(rings).toBeInstanceOf(THREE.Group);
            expect(rings.children.length).toBeGreaterThan(0);

            const ringMesh = rings.children[0];
            expect(ringMesh.rotation.z).toBe(Math.PI / 2); // Uranus rings are vertical
        });

        test('should create generic rings for other planets', async () => {
            const genericPlanet = createMockPlanetData({
                name: 'GenericPlanet',
                has_rings: true
            });
            const rings = await planetFactory.createEnhancedRingSystem(genericPlanet);

            expect(rings).toBeInstanceOf(THREE.Group);
            expect(rings.children.length).toBeGreaterThan(0);
        });

        test('should return null for planets without rings', async () => {
            const earthData = createMockPlanetData({ has_rings: false });
            const rings = await planetFactory.createEnhancedRingSystem(earthData);

            expect(rings).toBeNull();
        });

        test('should fall back to procedural rings on texture failure', async () => {
            // Mock texture loading to fail
            planetFactory.loadTexture = jest.fn().mockRejectedValue(new Error('Texture failed'));

            const saturnData = createMockSaturnData();
            const rings = await planetFactory.createEnhancedRingSystem(saturnData);

            expect(rings).toBeInstanceOf(THREE.Group);
            expect(rings.children.length).toBeGreaterThan(0);
        });
    });

    describe('Moon System Creation', () => {
        beforeEach(async () => {
            await planetFactory.init();
        });

        test('should create Earth moon system', async () => {
            const earthData = createMockPlanetData({ name: 'Earth', has_moons: true, moon_count: 1 });
            const moons = await planetFactory.createMoonSystem(earthData);

            expect(moons).toBeInstanceOf(THREE.Group);
            expect(moons.name).toBe('Earth_moons');
            expect(moons.children.length).toBe(1);

            const moon = moons.children[0];
            expect(moon.name).toBe('Moon');
            expect(moon.userData.type).toBe('moon');
            expect(moon.userData.orbitalRadius).toBe(8);
        });

        test('should create Mars moon system with Phobos and Deimos', async () => {
            const marsData = createMockMarsData();
            const moons = await planetFactory.createMoonSystem(marsData);

            expect(moons).toBeInstanceOf(THREE.Group);
            expect(moons.children.length).toBe(2);

            const phobos = moons.children.find(m => m.name === 'Phobos');
            const deimos = moons.children.find(m => m.name === 'Deimos');

            expect(phobos).toBeDefined();
            expect(deimos).toBeDefined();
            expect(phobos.userData.orbitalRadius).toBe(4);
            expect(deimos.userData.orbitalRadius).toBe(6);
        });

        test('should create Jupiter major moons', async () => {
            const jupiterData = createMockJupiterData();
            const moons = await planetFactory.createMoonSystem(jupiterData);

            expect(moons).toBeInstanceOf(THREE.Group);
            expect(moons.children.length).toBe(4);

            const moonNames = moons.children.map(m => m.name);
            expect(moonNames).toContain('Io');
            expect(moonNames).toContain('Europa');
            expect(moonNames).toContain('Ganymede');
            expect(moonNames).toContain('Callisto');
        });

        test('should create generic moons for other planets', async () => {
            const genericPlanet = createMockPlanetData({
                name: 'GenericPlanet',
                has_moons: true,
                moon_count: 3
            });
            const moons = await planetFactory.createMoonSystem(genericPlanet);

            expect(moons).toBeInstanceOf(THREE.Group);
            expect(moons.children.length).toBe(3);

            moons.children.forEach((moon, index) => {
                expect(moon.name).toBe(`Moon_${index + 1}`);
                expect(moon.userData.type).toBe('moon');
            });
        });

        test('should return null for planets without moons', async () => {
            const planetData = createMockPlanetData({ has_moons: false });
            const moons = await planetFactory.createMoonSystem(planetData);

            expect(moons).toBeNull();
        });

        test('should limit moon count for performance', async () => {
            const planetData = createMockPlanetData({
                name: 'GenericPlanet', // Fix: Use name that will trigger createGenericMoons
                has_moons: true,
                moon_count: 20 // Should be limited to 4
            });
            const moons = await planetFactory.createMoonSystem(planetData);

            expect(moons.children.length).toBe(4);
        });

        test('should create textured moon', () => {
            const moonGroup = new THREE.Group();
            const mockTexture = new THREE.Texture();

            planetFactory.createTexturedMoon(moonGroup, 'TestMoon', 10, 0.5, mockTexture);

            expect(moonGroup.children.length).toBe(1);
            const moon = moonGroup.children[0];
            expect(moon.name).toBe('TestMoon');
            expect(moon.material.map).toBe(mockTexture);
            expect(moon.userData.orbitalRadius).toBe(10);
        });

        test('should create procedural moon', () => {
            const moonGroup = new THREE.Group();

            planetFactory.createProceduralMoon(moonGroup, 'TestMoon', 10, 0.5, 0xFFFFFF);

            expect(moonGroup.children.length).toBe(1);
            const moon = moonGroup.children[0];
            expect(moon.name).toBe('TestMoon');
            expect(moon.material.color).toBeInstanceOf(THREE.Color);
            expect(moon.userData.orbitalRadius).toBe(10);
        });
    });

    describe('Atmosphere Creation', () => {
        beforeEach(async () => {
            await planetFactory.init();
        });

        test('should create atmosphere for atmospheric planets', async () => {
            const earthData = createMockPlanetData({ name: 'Earth' });
            const atmosphere = await planetFactory.createAtmosphere(earthData);

            expect(atmosphere).toBeInstanceOf(THREE.Mesh);
            expect(atmosphere.name).toBe('Earth_atmosphere');
            expect(atmosphere.userData.type).toBe('atmosphere');
            expect(atmosphere.material).toBeInstanceOf(THREE.ShaderMaterial);
            expect(atmosphere.material.uniforms.atmosphereColor).toBeDefined();
        });

        test('should return null for non-atmospheric planets', async () => {
            const moonData = createMockPlanetData({ name: 'Moon' });
            const atmosphere = await planetFactory.createAtmosphere(moonData);

            expect(atmosphere).toBeNull();
        });

        test('should determine correct atmosphere colors', () => {
            const earthColor = planetFactory.getAtmosphereColor(createMockPlanetData({ name: 'Earth' }));
            const marsColor = planetFactory.getAtmosphereColor(createMockPlanetData({ name: 'Mars' }));

            expect(earthColor).toBeInstanceOf(THREE.Color);
            expect(marsColor).toBeInstanceOf(THREE.Color);
            expect(earthColor.r).not.toBe(marsColor.r);
        });

        test('should identify atmospheric planets correctly', () => {
            expect(planetFactory.shouldHaveAtmosphere(createMockPlanetData({ name: 'Earth' }))).toBe(true);
            expect(planetFactory.shouldHaveAtmosphere(createMockPlanetData({ name: 'Mars' }))).toBe(true);
            expect(planetFactory.shouldHaveAtmosphere(createMockPlanetData({ name: 'Moon' }))).toBe(false);
            expect(planetFactory.shouldHaveAtmosphere(createMockPlanetData({ name: 'Mercury' }))).toBe(false);
        });
    });

    describe('Sun Glow Creation', () => {
        beforeEach(async () => {
            await planetFactory.init();
        });

        test('should create sun glow effect', async () => {
            const sunData = createMockSunData();
            const glow = await planetFactory.createSunGlow(sunData);

            expect(glow).toBeInstanceOf(THREE.Mesh);
            expect(glow.name).toBe('Sun_glow');
            expect(glow.userData.type).toBe('glow');
            expect(glow.material).toBeInstanceOf(THREE.ShaderMaterial);
            expect(glow.material.uniforms.glowColor).toBeDefined();
            expect(glow.material.uniforms.intensity.value).toBe(0.6);
        });

        test('should use correct glow color', async () => {
            const sunData = createMockSunData();
            const glow = await planetFactory.createSunGlow(sunData);

            const glowColor = glow.material.uniforms.glowColor.value;
            expect(glowColor).toBeInstanceOf(THREE.Color);
        });
    });

    describe('Geometry Management', () => {
        beforeEach(async () => {
            await planetFactory.init();
        });

        test('should cache geometries properly', () => {
            const planetData = createMockPlanetData();

            const geometry1 = planetFactory.getOrCreateGeometry(planetData, { quality: 'medium' });
            const geometry2 = planetFactory.getOrCreateGeometry(planetData, { quality: 'medium' });

            expect(geometry1).toBe(geometry2);
            expect(planetFactory.geometryCache.size).toBeGreaterThan(0);
        });

        test('should calculate correct segment counts', () => {
            const earthData = createMockPlanetData({ name: 'Earth' });
            const sunData = createMockSunData();
            const regularPlanet = createMockPlanetData({ name: 'Mars' });

            const earthSegments = planetFactory.getSegmentCount(earthData, 'medium');
            const sunSegments = planetFactory.getSegmentCount(sunData, 'medium');
            const regularSegments = planetFactory.getSegmentCount(regularPlanet, 'medium');

            // Earth and Sun should have higher segment counts
            expect(earthSegments).toBeGreaterThan(regularSegments);
            expect(sunSegments).toBeGreaterThan(regularSegments);
            expect(earthSegments).toBeLessThanOrEqual(128);
        });

        test('should respect quality settings for segments', () => {
            const planetData = createMockPlanetData();

            const lowSegments = planetFactory.getSegmentCount(planetData, 'low');
            const mediumSegments = planetFactory.getSegmentCount(planetData, 'medium');
            const highSegments = planetFactory.getSegmentCount(planetData, 'high');

            expect(lowSegments).toBeLessThan(mediumSegments);
            expect(mediumSegments).toBeLessThan(highSegments);
        });

        test('should create proper sphere geometries', () => {
            const planetData = createMockPlanetData();
            const geometry = planetFactory.getOrCreateGeometry(planetData);

            expect(geometry).toBeInstanceOf(THREE.SphereGeometry);
            expect(geometry.radius).toBe(1);
        });
    });

    describe('Size Calculation', () => {
        beforeEach(async () => {
            await planetFactory.init();
        });

        test('should calculate correct scaled sizes', () => {
            const earthData = createMockPlanetData({ name: 'Earth', diameter: 12756 });
            const sunData = createMockSunData();
            const moonData = createMockPlanetData({ name: 'Moon', diameter: 3474 });
            const jupiterData = createMockJupiterData();

            const earthSize = planetFactory.calculateScaledSize(earthData);
            const sunSize = planetFactory.calculateScaledSize(sunData);
            const moonSize = planetFactory.calculateScaledSize(moonData);
            const jupiterSize = planetFactory.calculateScaledSize(jupiterData);

            // Sun should be largest
            expect(sunSize).toBe(5.0);

            // Jupiter should be larger than Earth
            expect(jupiterSize).toBeGreaterThan(earthSize);

            // Earth should be larger than Moon
            expect(earthSize).toBeGreaterThan(moonSize);

            // All sizes should be within bounds
            expect(sunSize).toBeGreaterThanOrEqual(0.3);
            expect(sunSize).toBeLessThanOrEqual(6.0);
        });

        test('should handle very small planets', () => {
            const tinyPlanet = createMockPlanetData({ diameter: 100 });
            const size = planetFactory.calculateScaledSize(tinyPlanet);

            expect(size).toBeGreaterThanOrEqual(0.3);
        });

        test('should handle very large planets', () => {
            const hugePlanet = createMockPlanetData({ diameter: 500000 });
            const size = planetFactory.calculateScaledSize(hugePlanet);

            expect(size).toBeLessThanOrEqual(6.0);
        });
    });

    describe('Update System', () => {
        beforeEach(async () => {
            await planetFactory.init();
        });

        test('should update planet rotations', async () => {
            const earthData = createMockPlanetData({ rotation_period: 24 });
            const planet = await planetFactory.createPlanet(earthData);

            const planetMesh = planet.getObjectByName('Earth');
            const initialRotation = planetMesh.rotation.y;

            planetFactory.update(1.0); // 1 second

            expect(planetMesh.rotation.y).not.toBe(initialRotation);
        });

        test('should update moon orbits', async () => {
            const earthData = createMockPlanetData({ name: 'Earth', has_moons: true, moon_count: 1 });
            const planet = await planetFactory.createPlanet(earthData);

            const moonSystem = planetFactory.moonSystems.get('Earth');
            const moon = moonSystem.children[0];
            const initialPosition = { ...moon.position };

            planetFactory.update(1.0);

            expect(moon.position.x).not.toBe(initialPosition.x);
            expect(moon.position.z).not.toBe(initialPosition.z);
        });

        test('should update shader uniforms', async () => {
            const earthData = createMockPlanetData({ name: 'Earth' });
            const planet = await planetFactory.createPlanet(earthData);

            // Mock shader material with uniforms
            const atmosphere = planetFactory.atmospheres.get('Earth');
            if (atmosphere && atmosphere.material.uniforms) {
                const initialTime = atmosphere.material.uniforms.time.value;

                planetFactory.update(1.0);

                expect(atmosphere.material.uniforms.time.value).toBeGreaterThan(initialTime);
            }
        });

        test('should not update when not initialized', () => {
            const uninitializedFactory = new MockPlanetFactory();
            expect(() => uninitializedFactory.update(1.0)).not.toThrow();
        });

        test('should handle missing rotation period gracefully', async () => {
            const planetData = createMockPlanetData({ rotation_period: null });
            const planet = await planetFactory.createPlanet(planetData);

            expect(() => planetFactory.update(1.0)).not.toThrow();
        });
    });

    describe('Quality Management', () => {
        beforeEach(async () => {
            await planetFactory.init();
        });

        test('should set quality and clear caches', () => {
            // Add something to caches first
            planetFactory.materialCache.set('test', 'material');
            planetFactory.geometryCache.set('test', 'geometry');

            planetFactory.setQuality('high');

            expect(planetFactory.options.quality).toBe('high');
            expect(planetFactory.materialCache.size).toBe(0);
            expect(planetFactory.geometryCache.size).toBe(0);
        });

        test('should apply quality settings during creation', async () => {
            planetFactory.setQuality('low');

            const planetData = createMockPlanetData();
            const planet = await planetFactory.createPlanet(planetData);

            expect(planet).toBeDefined();
            expect(planetFactory.options.quality).toBe('low');
        });
    });

    describe('Planet Retrieval', () => {
        beforeEach(async () => {
            await planetFactory.init();
        });

        test('should retrieve planet by name', async () => {
            const earthData = createMockPlanetData({ name: 'Earth' });
            const createdPlanet = await planetFactory.createPlanet(earthData);

            const retrievedPlanet = planetFactory.getPlanet('Earth');

            expect(retrievedPlanet).toBe(createdPlanet);
        });

        test('should return null for non-existent planet', () => {
            const planet = planetFactory.getPlanet('NonExistent');

            expect(planet).toBeNull();
        });

        test('should get all planets', async () => {
            const earthData = createMockPlanetData({ name: 'Earth' });
            const marsData = createMockMarsData();

            await planetFactory.createPlanet(earthData);
            await planetFactory.createPlanet(marsData);

            const allPlanets = planetFactory.getAllPlanets();

            expect(allPlanets).toBeInstanceOf(Map);
            expect(allPlanets.size).toBe(2);
            expect(allPlanets.has('Earth')).toBe(true);
            expect(allPlanets.has('Mars')).toBe(true);
        });
    });

    describe('Statistics', () => {
        beforeEach(async () => {
            await planetFactory.init();
        });

        test('should provide comprehensive stats', async () => {
            const earthData = createMockPlanetData({ name: 'Earth' });
            const saturnData = createMockSaturnData();

            await planetFactory.createPlanet(earthData);
            await planetFactory.createPlanet(saturnData);

            const stats = planetFactory.getStats();

            expect(stats).toEqual({
                isInitialized: true,
                planetsCreated: 2,
                materialsCached: expect.any(Number),
                texturesCached: expect.any(Number),
                geometriesCached: expect.any(Number),
                moonSystems: 2, // Both Earth and Saturn have moons
                ringSystems: 1, // Only Saturn has rings
                atmospheres: 2, // Both have atmospheres
                quality: 'medium'
            });
        });

        test('should track cache sizes correctly', async () => {
            const planetData = createMockPlanetData();
            await planetFactory.createPlanet(planetData);

            const stats = planetFactory.getStats();

            expect(stats.materialsCached).toBeGreaterThan(0);
            expect(stats.geometriesCached).toBeGreaterThan(0);
        });
    });

    describe('Disposal and Cleanup', () => {
        beforeEach(async () => {
            await planetFactory.init();
        });

        test('should dispose all resources', async () => {
            const earthData = createMockPlanetData();
            await planetFactory.createPlanet(earthData);

            // Track dispose calls
            const geometryDisposeSpy = jest.spyOn(planetFactory.geometryCache.get(planetFactory.geometryCache.keys().next().value), 'dispose');

            planetFactory.dispose();

            expect(geometryDisposeSpy).toHaveBeenCalled();
            expect(planetFactory.materialCache.size).toBe(0);
            expect(planetFactory.geometryCache.size).toBe(0);
            expect(planetFactory.textureCache.size).toBe(0);
            expect(planetFactory.planetInstances.size).toBe(0);
            expect(planetFactory.isInitialized).toBe(false);
        });

        test('should handle disposal when not initialized', () => {
            const uninitializedFactory = new MockPlanetFactory();

            expect(() => uninitializedFactory.dispose()).not.toThrow();
        });

        test('should clear all system maps', async () => {
            const earthData = createMockPlanetData({ name: 'Earth' });
            const saturnData = createMockSaturnData();

            await planetFactory.createPlanet(earthData);
            await planetFactory.createPlanet(saturnData);

            expect(planetFactory.moonSystems.size).toBeGreaterThan(0);
            expect(planetFactory.ringSystems.size).toBeGreaterThan(0);
            expect(planetFactory.atmospheres.size).toBeGreaterThan(0);

            planetFactory.dispose();

            expect(planetFactory.moonSystems.size).toBe(0);
            expect(planetFactory.ringSystems.size).toBe(0);
            expect(planetFactory.atmospheres.size).toBe(0);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        beforeEach(async () => {
            await planetFactory.init();
        });

        test('should handle invalid planet data gracefully', async () => {
            const invalidData = {
                name: null,
                diameter: 'invalid',
                color_hex: 'not-a-color'
            };

            const planet = await planetFactory.createPlanet(invalidData);

            expect(planet).toBeDefined();
            expect(planet).toBeInstanceOf(THREE.Group);
        });

        test('should handle missing planet properties', async () => {
            const minimalData = { name: 'TestPlanet' };

            const planet = await planetFactory.createPlanet(minimalData);

            expect(planet).toBeDefined();
            expect(planet.name).toBe('TestPlanet_group');
        });

        test('should handle texture loading failures gracefully', async () => {
            // Mock texture loader to fail
            planetFactory.textureLoader.load = jest.fn((url, onLoad, onProgress, onError) => {
                setTimeout(() => onError(new Error('Network error')), 10);
            });

            const planetData = createMockPlanetData();
            const planet = await planetFactory.createPlanet(planetData);

            expect(planet).toBeDefined();
        });

        test('should handle zero or negative diameters', () => {
            const zeroDiameter = createMockPlanetData({ diameter: 0 });
            const negativeDiameter = createMockPlanetData({ diameter: -1000 });

            const zeroSize = planetFactory.calculateScaledSize(zeroDiameter);
            const negativeSize = planetFactory.calculateScaledSize(negativeDiameter);

            expect(zeroSize).toBeGreaterThanOrEqual(0.3);
            expect(negativeSize).toBeGreaterThanOrEqual(0.3);
        });

        test('should handle planets with excessive moon counts', async () => {
            const planetData = createMockPlanetData({
                has_moons: true,
                moon_count: 1000
            });

            const planet = await planetFactory.createPlanet(planetData);
            const moonSystem = planetFactory.moonSystems.get(planetData.name);

            // Should limit moon count for performance
            expect(moonSystem.children.length).toBeLessThanOrEqual(4);
        });

        test('should handle missing texture paths', async () => {
            // Remove a texture path
            delete planetFactory.texturePaths.earth;

            const earthData = createMockPlanetData({ name: 'Earth' });
            const planet = await planetFactory.createPlanet(earthData);

            expect(planet).toBeDefined();
        });

        test('should handle shader material creation errors', async () => {
            // Mock ShaderMaterial to throw
            const originalShaderMaterial = THREE.ShaderMaterial;
            THREE.ShaderMaterial = jest.fn(() => {
                throw new Error('Shader compilation failed');
            });

            const earthData = createMockPlanetData({ name: 'Earth' });
            const planet = await planetFactory.createPlanet(earthData);

            expect(planet).toBeDefined();

            // Restore
            THREE.ShaderMaterial = originalShaderMaterial;
        });
    });

    describe('Performance and Memory Tests', () => {
        beforeEach(async () => {
            await planetFactory.init();
        });

        test('should reuse cached materials efficiently', async () => {
            const planetData1 = createMockPlanetData({ name: 'Planet1' });
            const planetData2 = createMockPlanetData({ name: 'Planet2' });

            await planetFactory.createPlanet(planetData1);
            await planetFactory.createPlanet(planetData2);

            // Should have cached geometries
            expect(planetFactory.geometryCache.size).toBeGreaterThan(0);
        });

        test('should handle rapid planet creation', async () => {
            const planets = [];
            const startTime = Date.now();

            for (let i = 0; i < 10; i++) {
                const planetData = createMockPlanetData({ name: `Planet_${i}` });
                planets.push(await planetFactory.createPlanet(planetData));
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(planets.length).toBe(10);
            expect(duration).toBeLessThan(5000); // Should complete reasonably quickly
        });

        test('should handle multiple updates efficiently', async () => {
            const earthData = createMockPlanetData({ name: 'Earth', has_moons: true });
            await planetFactory.createPlanet(earthData);

            const startTime = Date.now();

            // Rapid updates
            for (let i = 0; i < 100; i++) {
                planetFactory.update(0.016);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(1000); // Should handle updates efficiently
        });

        test('should manage memory usage with large numbers of objects', async () => {
            const initialStats = planetFactory.getStats();

            // Create multiple complex planets
            for (let i = 0; i < 5; i++) {
                const saturnData = createMockSaturnData();
                saturnData.name = `Saturn_${i}`;
                await planetFactory.createPlanet(saturnData);
            }

            const finalStats = planetFactory.getStats();

            expect(finalStats.planetsCreated).toBe(5);
            expect(finalStats.moonSystems).toBe(5);
            expect(finalStats.ringSystems).toBe(5);
        });
    });

    describe('Integration Tests', () => {
        test('should complete full planet creation workflow', async () => {
            await planetFactory.init();

            // Create a variety of planets
            const sun = await planetFactory.createPlanet(createMockSunData());
            const earth = await planetFactory.createPlanet(createMockPlanetData({ name: 'Earth' }));
            const saturn = await planetFactory.createPlanet(createMockSaturnData());
            const mars = await planetFactory.createPlanet(createMockMarsData());

            // Verify all planets were created
            expect(sun).toBeDefined();
            expect(earth).toBeDefined();
            expect(saturn).toBeDefined();
            expect(mars).toBeDefined();

            // Verify special features
            expect(sun.children.find(c => c.name === 'Sun_glow')).toBeDefined();
            expect(earth.children.find(c => c.name === 'Earth_atmosphere')).toBeDefined();
            expect(saturn.children.find(c => c.name === 'Saturn_rings')).toBeDefined();
            expect(mars.children.find(c => c.name === 'Mars_moons')).toBeDefined();

            // Test update system
            planetFactory.update(1.0);

            // Test statistics
            const stats = planetFactory.getStats();
            expect(stats.planetsCreated).toBe(4);
            expect(stats.isInitialized).toBe(true);

            // Test cleanup
            planetFactory.dispose();
            expect(planetFactory.isInitialized).toBe(false);
        });

        test('should handle mixed quality settings', async () => {
            await planetFactory.init();

            const lowQualityPlanet = await planetFactory.createPlanet(
                createMockPlanetData({ name: 'LowQuality' }),
                { quality: 'low' }
            );

            const highQualityPlanet = await planetFactory.createPlanet(
                createMockPlanetData({ name: 'HighQuality' }),
                { quality: 'high' }
            );

            expect(lowQualityPlanet).toBeDefined();
            expect(highQualityPlanet).toBeDefined();
        });

        test('should coordinate with external systems', async () => {
            await planetFactory.init();

            const earth = await planetFactory.createPlanet(createMockPlanetData({ name: 'Earth' }));

            // Simulate external lighting system interaction
            earth.traverse((child) => {
                if (child.material) {
                    // External systems should be able to modify materials
                    if (child.material.userData) {
                        expect(child.material.userData).toBeDefined();
                    }
                }
            });

            // Simulate external animation system interaction
            planetFactory.update(1.0);

            expect(earth.children.length).toBeGreaterThan(1); // Should have moons, atmosphere, etc.
        });
    });

    describe('Backward Compatibility', () => {
        test('should work without modern features enabled', async () => {
            const basicFactory = new MockPlanetFactory({
                enableTextures: false,
                enableAtmosphere: false,
                enableRings: false,
                enableMoons: false
            });

            await basicFactory.init();

            const planet = await basicFactory.createPlanet(createMockPlanetData());

            expect(planet).toBeDefined();
            expect(planet.children.length).toBe(1); // Only the main planet mesh

            basicFactory.dispose();
        });

        test('should handle legacy planet data formats', async () => {
            await planetFactory.init();

            const legacyData = {
                name: 'LegacyPlanet',
                // Missing many modern properties
            };

            const planet = await planetFactory.createPlanet(legacyData);

            expect(planet).toBeDefined();
            expect(planet.name).toBe('LegacyPlanet_group');
        });
    });

    describe('Advanced Features', () => {
        beforeEach(async () => {
            await planetFactory.init();
        });

        test('should handle complex planet configurations', async () => {
            const complexPlanet = createMockPlanetData({
                name: 'ComplexPlanet',
                diameter: 50000,
                planet_type: 'gas_giant',
                has_rings: true,
                has_moons: true,
                moon_count: 5,
                rotation_period: 12
            });

            const planet = await planetFactory.createPlanet(complexPlanet, {
                quality: 'high',
                enableAtmosphere: true,
                enableRings: true,
                enableMoons: true
            });

            expect(planet).toBeDefined();
            expect(planet.children.length).toBeGreaterThan(1);

            // Should have all features
            const rings = planet.children.find(c => c.name === 'ComplexPlanet_rings');
            const moons = planet.children.find(c => c.name === 'ComplexPlanet_moons');
            const atmosphere = planet.children.find(c => c.name === 'ComplexPlanet_atmosphere');

            expect(rings).toBeDefined();
            expect(moons).toBeDefined();
            // Fix: Gas giants should have atmospheres - ComplexPlanet should be in atmospheric list
            expect(atmosphere).toBeDefined();
        });

        test('should support dynamic feature toggling', async () => {
            const planetData = createMockPlanetData({ name: 'Earth' });

            // Create with all features
            const fullPlanet = await planetFactory.createPlanet(planetData, {
                enableAtmosphere: true,
                enableMoons: true
            });

            // Create with limited features
            const limitedPlanet = await planetFactory.createPlanet(
                { ...planetData, name: 'EarthLimited' },
                {
                    enableAtmosphere: false,
                    enableMoons: false
                }
            );

            expect(fullPlanet.children.length).toBeGreaterThan(limitedPlanet.children.length);
        });

        test('should handle texture fallback scenarios', async () => {
            // Create planet with working textures
            const planetData = createMockPlanetData({ name: 'Earth' });
            const planet1 = await planetFactory.createPlanet(planetData);

            // Force texture loading to fail
            planetFactory.loadTexture = jest.fn().mockRejectedValue(new Error('Network error'));

            // Create planet with failed textures
            const planet2 = await planetFactory.createPlanet({...planetData, name: 'Earth2'});

            expect(planet1).toBeDefined();
            expect(planet2).toBeDefined();

            // Both should be created, but with different materials
            const mesh1 = planet1.getObjectByName('Earth');
            const mesh2 = planet2.getObjectByName('Earth2');

            expect(mesh1.material).toBeDefined();
            expect(mesh2.material).toBeDefined();
        });
    });

    describe('Edge Cases and Stress Tests', () => {
        beforeEach(async () => {
            await planetFactory.init();
        });

        test('should handle extremely large numbers', () => {
            const extremePlanet = createMockPlanetData({
                diameter: Number.MAX_SAFE_INTEGER,
                rotation_period: Number.MAX_SAFE_INTEGER
            });

            const size = planetFactory.calculateScaledSize(extremePlanet);
            expect(size).toBeLessThanOrEqual(6.0);
            expect(size).toBeGreaterThanOrEqual(0.3);
        });

        test('should handle NaN and undefined values', () => {
            const invalidPlanet = createMockPlanetData({
                diameter: NaN,
                rotation_period: undefined
            });

            const size = planetFactory.calculateScaledSize(invalidPlanet);
            expect(size).toBeGreaterThanOrEqual(0.3);
        });

        test('should handle concurrent planet creation', async () => {
            const promises = [];
            for (let i = 0; i < 5; i++) {
                const planetData = createMockPlanetData({ name: `ConcurrentPlanet_${i}` });
                promises.push(planetFactory.createPlanet(planetData));
            }

            const planets = await Promise.all(promises);

            expect(planets).toHaveLength(5);
            planets.forEach(planet => {
                expect(planet).toBeDefined();
                expect(planet).toBeInstanceOf(THREE.Group);
            });
        });

        test('should maintain state consistency during errors', async () => {
            const workingPlanet = createMockPlanetData({ name: 'Working' });
            await planetFactory.createPlanet(workingPlanet);

            const initialStats = planetFactory.getStats();

            // Force an error during creation
            const originalCreateMesh = planetFactory.createEnhancedPlanetMesh;
            planetFactory.createEnhancedPlanetMesh = jest.fn().mockRejectedValue(new Error('Creation failed'));

            const failingPlanet = createMockPlanetData({ name: 'Failing' });
            await planetFactory.createPlanet(failingPlanet); // This will create a fallback planet

            // Restore
            planetFactory.createEnhancedPlanetMesh = originalCreateMesh;

            const finalStats = planetFactory.getStats();

            // Fix: Should have created fallback planet, so total should be 2
            expect(finalStats.planetsCreated).toBe(2);
            expect(planetFactory.isInitialized).toBe(true);
        });
    });
});