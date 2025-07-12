// static/js/__tests__/planet-factory.test.js
// FIXED: Tests now import the real PlanetFactory class for proper coverage

// ===================================================================
// ENHANCED THREE.JS MOCKS FOR PLANET FACTORY (from lighting-system.test.js)
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

// Mock window and console for the planet factory
global.window = global.window || {};
global.console = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

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

// Import the actual PlanetFactory from the JS module
require('../solar-system/planet-factory.js');
const { PlanetFactory } = window.PlanetFactory;

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
// MAIN TEST SUITE - TESTING REAL IMPLEMENTATION
// ===================================================================

describe('PlanetFactory', () => {
    let planetFactory;

    beforeEach(() => {
        jest.clearAllMocks();
        planetFactory = new PlanetFactory();
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
            const customFactory = new PlanetFactory({
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
            await planetFactory.init();

            expect(planetFactory.isInitialized).toBe(true);
            expect(planetFactory.textureLoader).toBeInstanceOf(THREE.TextureLoader);
            expect(planetFactory.texturePaths).toBeDefined();
        });

        test('should handle initialization errors', async () => {
            // Force an error by mocking initializeTextures to fail
            const originalInitializeTextures = planetFactory.initializeTextures;
            planetFactory.initializeTextures = jest.fn().mockRejectedValue(new Error('Init failed'));

            await expect(planetFactory.init()).rejects.toThrow('Init failed');

            // Restore
            planetFactory.initializeTextures = originalInitializeTextures;
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
            // Force an error by mocking createEnhancedPlanetMesh to fail
            const originalCreateMesh = planetFactory.createEnhancedPlanetMesh;
            planetFactory.createEnhancedPlanetMesh = jest.fn().mockRejectedValue(new Error('Creation failed'));

            const planetData = createMockPlanetData();
            const planet = await planetFactory.createPlanet(planetData);

            expect(planet).toBeInstanceOf(THREE.Group);
            expect(planet.children[0].userData.type).toBe('fallback');

            // Restore
            planetFactory.createEnhancedPlanetMesh = originalCreateMesh;
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
            // Mock texture loading to fail for Saturn rings
            const originalLoad = planetFactory.textureLoader.load;
            planetFactory.textureLoader.load = jest.fn((url, onLoad, onProgress, onError) => {
                if (url.includes('saturn_rings')) {
                    setTimeout(() => onError(new Error('Texture failed')), 10);
                } else {
                    originalLoad.call(planetFactory.textureLoader, url, onLoad, onProgress, onError);
                }
            });

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
                name: 'GenericPlanet',
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

        test('should handle invalid diameters gracefully', () => {
            const invalidDiameters = [null, undefined, NaN, 0, -100, 'invalid'];

            invalidDiameters.forEach(diameter => {
                const planetData = createMockPlanetData({ diameter });
                const size = planetFactory.calculateScaledSize(planetData);

                expect(size).toBeGreaterThanOrEqual(0.3);
                expect(size).toBeLessThanOrEqual(6.0);
                expect(isNaN(size)).toBe(false);
            });
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
            const uninitializedFactory = new PlanetFactory();
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
            const geometries = Array.from(planetFactory.geometryCache.values());
            const materials = Array.from(planetFactory.materialCache.values());

            planetFactory.dispose();

            // Check that dispose was called on resources
            geometries.forEach(geometry => {
                expect(geometry.dispose).toHaveBeenCalled();
            });

            materials.forEach(material => {
                expect(material.dispose).toHaveBeenCalled();
            });

            expect(planetFactory.materialCache.size).toBe(0);
            expect(planetFactory.geometryCache.size).toBe(0);
            expect(planetFactory.textureCache.size).toBe(0);
            expect(planetFactory.planetInstances.size).toBe(0);
            expect(planetFactory.isInitialized).toBe(false);
        });

        test('should handle disposal when not initialized', () => {
            const uninitializedFactory = new PlanetFactory();

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

    describe('Factory Method', () => {
        test('should create planet factory via factory method', () => {
            const planetFactoryFromFactory = window.PlanetFactory.create({
                enableTextures: false,
                quality: 'high'
            });

            expect(planetFactoryFromFactory).toBeInstanceOf(PlanetFactory);
            expect(planetFactoryFromFactory.options.enableTextures).toBe(false);
            expect(planetFactoryFromFactory.options.quality).toBe('high');
        });

        test('should create planet factory with default options via factory', () => {
            const planetFactoryFromFactory = window.PlanetFactory.create();

            expect(planetFactoryFromFactory).toBeInstanceOf(PlanetFactory);
            expect(planetFactoryFromFactory.options.enableTextures).toBe(true);
            expect(planetFactoryFromFactory.options.quality).toBe('medium');
        });
    });

    describe('Console Logging', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('should log initialization messages', async () => {
            await planetFactory.init();

            expect(console.log).toHaveBeenCalledWith('🚀 Initializing Enhanced Planet Factory with textures, moons, and rings...');
            expect(console.log).toHaveBeenCalledWith('✅ Enhanced Planet Factory initialized successfully');
        });

        test('should log planet creation messages', async () => {
            await planetFactory.init();

            const earthData = createMockPlanetData({ name: 'Earth' });
            await planetFactory.createPlanet(earthData);

            expect(console.log).toHaveBeenCalledWith('🪐 Creating enhanced Earth with textures...');
            expect(console.log).toHaveBeenCalledWith('✅ Enhanced Earth created successfully');
        });

        test('should log quality setting changes', () => {
            planetFactory.setQuality('high');
            expect(console.log).toHaveBeenCalledWith('Planet factory quality set to high');
        });

        test('should log disposal message', () => {
            planetFactory.dispose();
            expect(console.log).toHaveBeenCalledWith('Enhanced Planet factory disposed');
        });
    });
});