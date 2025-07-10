// static/js/__tests__/lighting-system.test.js
// FIXED: Tests now import the real LightingSystem class for proper coverage

// Mock THREE.js with enhanced lighting components
const THREE = {
    DirectionalLight: jest.fn(function(color, intensity) {
        this.color = { setHex: jest.fn() };
        this.intensity = intensity || 1;
        this.position = { set: jest.fn(), copy: jest.fn() };
        this.target = {
            position: { set: jest.fn() },
            updateMatrixWorld: jest.fn()
        };
        this.castShadow = false;
        this.shadow = {
            mapSize: {
                width: 2048,
                height: 2048,
                setScalar: jest.fn((value) => {
                    this.width = value;
                    this.height = value;
                })
            },
            camera: {
                near: 0.1, far: 1000,
                left: -100, right: 100,
                top: 100, bottom: -100
            },
            bias: 0,
            radius: 1
        };
        this.name = '';
    }),

    AmbientLight: jest.fn(function(color, intensity) {
        this.color = { setHex: jest.fn() };
        this.intensity = intensity || 1;
        this.name = '';
    }),

    PointLight: jest.fn(function(color, intensity, distance, decay) {
        this.color = { setHex: jest.fn() };
        this.intensity = intensity || 1;
        this.distance = distance || 0;
        this.decay = decay || 1;
        this.position = { set: jest.fn(), copy: jest.fn() };
        this.name = '';
    }),

    HemisphereLight: jest.fn(function(skyColor, groundColor, intensity) {
        this.color = { setHex: jest.fn() };
        this.groundColor = { setHex: jest.fn() };
        this.intensity = intensity || 1;
        this.name = '';
    }),

    EffectComposer: jest.fn(function(renderer) {
        this.renderer = renderer;
        this.passes = [];
        this.addPass = jest.fn((pass) => this.passes.push(pass));
        this.render = jest.fn();
        this.setSize = jest.fn();
        this.dispose = jest.fn();
    }),

    RenderPass: jest.fn(function(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.enabled = true;
    }),

    UnrealBloomPass: jest.fn(function(resolution, strength, radius, threshold) {
        this.resolution = resolution || { x: 1024, y: 768 };
        this.strength = strength || 1.0;
        this.radius = radius || 0.5;
        this.threshold = threshold || 0.8;
        this.enabled = true;
        this.setSize = jest.fn();
        // Add resolution.set method
        if (this.resolution) {
            this.resolution.set = jest.fn((width, height) => {
                this.resolution.x = width;
                this.resolution.y = height;
            });
        }
    }),

    Vector2: jest.fn(function(x, y) {
        this.x = x || 0;
        this.y = y || 0;
        this.set = jest.fn((x, y) => {
            this.x = x;
            this.y = y;
        });
    }),

    Vector3: jest.fn(function(x, y, z) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.set = jest.fn();
        this.copy = jest.fn();
        this.distanceTo = jest.fn(() => 10);
    }),

    Color: jest.fn(function(color) {
        this.r = 1;
        this.g = 1;
        this.b = 1;
        this.setHex = jest.fn();
        this.multiplyScalar = jest.fn((scalar) => this);
    }),

    ShaderMaterial: jest.fn(function(options) {
        this.uniforms = options.uniforms || {};
        this.vertexShader = options.vertexShader || '';
        this.fragmentShader = options.fragmentShader || '';
        this.transparent = options.transparent || false;
        this.blending = options.blending;
        this.side = options.side;
        this.depthWrite = options.depthWrite;
        this.dispose = jest.fn();
    }),

    SphereGeometry: jest.fn(function(radius, widthSegments, heightSegments) {
        this.dispose = jest.fn();
    }),

    Mesh: jest.fn(function(geometry, material) {
        this.geometry = geometry;
        this.material = material;
        this.name = '';
        this.userData = {};
    }),

    MeshStandardMaterial: jest.fn(function(options = {}) {
        this.roughness = options.roughness || 0.5;
        this.metalness = options.metalness || 0.0;
        this.emissive = options.emissive || new THREE.Color(0x000000);
        this.emissiveIntensity = options.emissiveIntensity || 1.0;
        this.needsUpdate = false;
        this.dispose = jest.fn();
    }),

    AdditiveBlending: 'AdditiveBlending',
    BackSide: 'BackSide'
};

// Global THREE setup
global.THREE = THREE;

// Mock window and console for the lighting system
global.window = global.window || {};
global.console = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Mock innerWidth and innerHeight
global.window.innerWidth = 1024;
global.window.innerHeight = 768;

// Import the actual LightingSystem
require('../solar-system/lighting-system.js');
const { LightingSystem } = window.LightingSystem;

// Mock scene, camera, and renderer
const createMockScene = () => ({
    add: jest.fn(),
    remove: jest.fn(),
    getObjectByName: jest.fn((name) => {
        // Return a mock object with dispose method
        return {
            dispose: jest.fn(),
            name: name
        };
    })
});

const createMockCamera = () => ({
    position: new THREE.Vector3(0, 50, 100)
});

const createMockRenderer = () => ({
    render: jest.fn(),
    setSize: jest.fn(),
    capabilities: {
        getMaxAnisotropy: jest.fn(() => 16)
    }
});

const createMockPlanetData = (overrides = {}) => ({
    name: 'Earth',
    planet_type: 'terrestrial',
    color_hex: '#4F94CD',
    ...overrides
});

const createMockPlanetMesh = () => ({
    material: new THREE.MeshStandardMaterial()
});

const createMockSunObject = () => ({
    position: { x: 0, y: 0, z: 0 }
});

describe('LightingSystem', () => {
    let lightingSystem;
    let mockScene;
    let mockCamera;
    let mockRenderer;

    beforeEach(() => {
        jest.clearAllMocks();

        mockScene = createMockScene();
        mockCamera = createMockCamera();
        mockRenderer = createMockRenderer();

        lightingSystem = new LightingSystem();
    });

    afterEach(() => {
        if (lightingSystem && lightingSystem.isInitialized) {
            lightingSystem.dispose();
        }
    });

    describe('Initialization', () => {
        test('should initialize with default options', () => {
            expect(lightingSystem.options.enableSunLight).toBe(true);
            expect(lightingSystem.options.enableAmbientLight).toBe(true);
            expect(lightingSystem.options.enableBloom).toBe(true);
            expect(lightingSystem.options.enableAtmosphere).toBe(true);
            expect(lightingSystem.options.sunIntensity).toBe(2.0);
            expect(lightingSystem.options.ambientIntensity).toBe(0.2);
            expect(lightingSystem.options.bloomStrength).toBe(1.0);
        });

        test('should allow custom options', () => {
            const customOptions = {
                enableBloom: false,
                sunIntensity: 3.0,
                ambientIntensity: 0.5,
                bloomThreshold: 0.5
            };
            const customLightingSystem = new LightingSystem(customOptions);

            expect(customLightingSystem.options.enableBloom).toBe(false);
            expect(customLightingSystem.options.sunIntensity).toBe(3.0);
            expect(customLightingSystem.options.ambientIntensity).toBe(0.5);
            expect(customLightingSystem.options.bloomThreshold).toBe(0.5);
        });

        test('should initialize with scene, camera, and renderer', async () => {
            const success = await lightingSystem.init(mockScene, mockCamera, mockRenderer);

            expect(success).toBeUndefined(); // init doesn't return anything in real implementation
            expect(lightingSystem.isInitialized).toBe(true);
            expect(lightingSystem.scene).toBe(mockScene);
            expect(lightingSystem.camera).toBe(mockCamera);
            expect(lightingSystem.renderer).toBe(mockRenderer);
        });

        test('should handle initialization errors', async () => {
            // Force an error by making scene.add throw
            mockScene.add = jest.fn(() => {
                throw new Error('Scene error');
            });

            await expect(lightingSystem.init(mockScene, mockCamera, mockRenderer))
                .rejects.toThrow('Scene error');

            expect(lightingSystem.isInitialized).toBe(false);
        });
    });

    describe('Core Lighting Creation', () => {
        beforeEach(async () => {
            await lightingSystem.init(mockScene, mockCamera, mockRenderer);
        });

        test('should create sun directional light when enabled', () => {
            expect(lightingSystem.sunLight).toBeInstanceOf(THREE.DirectionalLight);
            expect(lightingSystem.sunLight.name).toBe('sunLight');
            expect(lightingSystem.sunLight.castShadow).toBe(true);
            expect(lightingSystem.sunLight.position.set).toHaveBeenCalledWith(0, 0, 0);
            expect(mockScene.add).toHaveBeenCalledWith(lightingSystem.sunLight);
        });

        test('should create ambient light when enabled', () => {
            expect(lightingSystem.ambientLight).toBeInstanceOf(THREE.AmbientLight);
            expect(lightingSystem.ambientLight.name).toBe('ambientLight');
            expect(lightingSystem.ambientLight.intensity).toBe(0.2);
            expect(mockScene.add).toHaveBeenCalledWith(lightingSystem.ambientLight);
        });

        test('should create sun point light', () => {
            expect(lightingSystem.sunPointLight).toBeInstanceOf(THREE.PointLight);
            expect(lightingSystem.sunPointLight.name).toBe('sunPointLight');
            expect(lightingSystem.sunPointLight.intensity).toBe(2.0);
            expect(lightingSystem.sunPointLight.distance).toBe(200);
            expect(lightingSystem.sunPointLight.decay).toBe(1.8);
            expect(mockScene.add).toHaveBeenCalledWith(lightingSystem.sunPointLight);
        });

        test('should create atmospheric hemisphere light when enabled', () => {
            expect(lightingSystem.atmosphericLight).toBeInstanceOf(THREE.HemisphereLight);
            expect(lightingSystem.atmosphericLight.name).toBe('atmosphericLight');
            expect(lightingSystem.atmosphericLight.intensity).toBe(0.4);
            expect(mockScene.add).toHaveBeenCalledWith(lightingSystem.atmosphericLight);
        });

        test('should not create lights when disabled', async () => {
            const disabledLightingSystem = new LightingSystem({
                enableSunLight: false,
                enableAmbientLight: false,
                enableAtmosphere: false
            });

            await disabledLightingSystem.init(mockScene, mockCamera, mockRenderer);

            expect(disabledLightingSystem.sunLight).toBeNull();
            expect(disabledLightingSystem.ambientLight).toBeNull();
            expect(disabledLightingSystem.atmosphericLight).toBeNull();
            // Sun point light should still be created
            expect(disabledLightingSystem.sunPointLight).toBeInstanceOf(THREE.PointLight);
        });
    });

    describe('Post-Processing and Bloom', () => {
        beforeEach(async () => {
            await lightingSystem.init(mockScene, mockCamera, mockRenderer);
        });

        test('should setup bloom post-processing when enabled', () => {
            expect(lightingSystem.composer).toBeInstanceOf(THREE.EffectComposer);
            expect(lightingSystem.renderPass).toBeInstanceOf(THREE.RenderPass);
            expect(lightingSystem.bloomPass).toBeInstanceOf(THREE.UnrealBloomPass);
            expect(lightingSystem.bloomEnabled).toBe(true);
        });

        test('should configure bloom pass with correct parameters', () => {
            expect(lightingSystem.bloomPass.strength).toBe(1.0);
            expect(lightingSystem.bloomPass.radius).toBe(0.5);
            expect(lightingSystem.bloomPass.threshold).toBe(0.8);
        });

        test('should add passes to composer in correct order', () => {
            expect(lightingSystem.composer.addPass).toHaveBeenCalledTimes(2);
            expect(lightingSystem.composer.addPass).toHaveBeenNthCalledWith(1, lightingSystem.renderPass);
            expect(lightingSystem.composer.addPass).toHaveBeenNthCalledWith(2, lightingSystem.bloomPass);
        });

        test('should handle missing post-processing classes gracefully', async () => {
            // Temporarily remove post-processing classes
            const originalEffectComposer = THREE.EffectComposer;
            delete THREE.EffectComposer;

            const fallbackLightingSystem = new LightingSystem();
            await fallbackLightingSystem.init(mockScene, mockCamera, mockRenderer);

            expect(fallbackLightingSystem.bloomEnabled).toBe(false);
            expect(fallbackLightingSystem.composer).toBeNull();

            // Restore
            THREE.EffectComposer = originalEffectComposer;
        });

        test('should enable/disable bloom correctly', () => {
            lightingSystem.setBloomEnabled(false);
            expect(lightingSystem.bloomPass.enabled).toBe(false);
            expect(lightingSystem.bloomEnabled).toBe(false);

            lightingSystem.setBloomEnabled(true);
            expect(lightingSystem.bloomPass.enabled).toBe(true);
            expect(lightingSystem.bloomEnabled).toBe(true);
        });
    });

    describe('Sun Reference and Lighting Updates', () => {
        beforeEach(async () => {
            await lightingSystem.init(mockScene, mockCamera, mockRenderer);
        });

        test('should set sun reference correctly', () => {
            const mockSunObject = createMockSunObject();
            lightingSystem.setSunReference(mockSunObject);

            expect(lightingSystem.sunObject).toBe(mockSunObject);
            expect(lightingSystem.sunPosition).toBe(mockSunObject.position);
        });

        test('should update sun light position when sun object is set', () => {
            const mockSunObject = createMockSunObject();
            mockSunObject.position = { x: 10, y: 5, z: -3 };

            lightingSystem.setSunReference(mockSunObject);
            lightingSystem.update(0.016);

            expect(lightingSystem.sunLight.position.copy).toHaveBeenCalledWith(mockSunObject.position);
            expect(lightingSystem.sunLight.target.position.set).toHaveBeenCalledWith(0, 0, 0);
            expect(lightingSystem.sunLight.target.updateMatrixWorld).toHaveBeenCalled();
            expect(lightingSystem.sunPointLight.position.copy).toHaveBeenCalledWith(mockSunObject.position);
        });

        test('should not update lighting when not initialized', () => {
            lightingSystem.isInitialized = false;
            lightingSystem.update(0.016);

            // Should not throw or call any update methods
            expect(lightingSystem.sunLight.position.copy).not.toHaveBeenCalled();
        });
    });

    describe('Atmospheric Effects', () => {
        beforeEach(async () => {
            await lightingSystem.init(mockScene, mockCamera, mockRenderer);
        });

        test('should update atmospheric light intensity based on camera distance', () => {
            const mockSunObject = createMockSunObject();
            lightingSystem.setSunReference(mockSunObject);

            // Mock camera distance calculation
            mockCamera.position.distanceTo = jest.fn(() => 100); // Mid-range distance

            lightingSystem.update(0.016);

            // Calculate expected value
            const normalizedDistance = 100 / 200; // 0.5
            const expectedIntensity = 0.6 - (normalizedDistance * (0.6 - 0.2));

            expect(lightingSystem.atmosphericLight.intensity).toBe(expectedIntensity);
        });

        test('should clamp atmospheric intensity at maximum distance', () => {
            const mockSunObject = createMockSunObject();
            lightingSystem.setSunReference(mockSunObject);

            mockCamera.position.distanceTo = jest.fn(() => 300); // Beyond max distance

            lightingSystem.update(0.016);

            // Should be at minimum intensity
            expect(lightingSystem.atmosphericLight.intensity).toBe(0.2);
        });

        test('should set maximum atmospheric intensity at close distance', () => {
            const mockSunObject = createMockSunObject();
            lightingSystem.setSunReference(mockSunObject);

            mockCamera.position.distanceTo = jest.fn(() => 10); // Very close

            lightingSystem.update(0.016);

            // Calculate expected value
            const normalizedDistance = 10 / 200; // 0.05
            const expectedIntensity = 0.6 - (normalizedDistance * (0.6 - 0.2));

            expect(lightingSystem.atmosphericLight.intensity).toBe(expectedIntensity);
        });
    });

    describe('Bloom Effects Updates', () => {
        beforeEach(async () => {
            await lightingSystem.init(mockScene, mockCamera, mockRenderer);
        });

        test('should update bloom strength based on distance to sun', () => {
            const mockSunObject = createMockSunObject();
            lightingSystem.setSunReference(mockSunObject);

            mockCamera.position.distanceTo = jest.fn(() => 75); // Mid-range distance

            lightingSystem.update(0.016);

            // Should adjust bloom strength based on distance (75 out of max 150)
            const normalizedDistance = 75 / 150;
            const expectedStrength = 1.5 - (normalizedDistance * 1.0); // maxBloom - (distance * range)
            expect(lightingSystem.bloomPass.strength).toBe(expectedStrength);
        });

        test('should not update bloom effects when bloom is disabled', () => {
            lightingSystem.setBloomEnabled(false);
            const originalStrength = lightingSystem.bloomPass.strength;

            const mockSunObject = createMockSunObject();
            lightingSystem.setSunReference(mockSunObject);
            mockCamera.position.distanceTo = jest.fn(() => 50);

            lightingSystem.update(0.016);

            // Bloom strength should not change when disabled
            expect(lightingSystem.bloomPass.strength).toBe(originalStrength);
        });
    });

    describe('Planet Material Enhancement', () => {
        beforeEach(async () => {
            await lightingSystem.init(mockScene, mockCamera, mockRenderer);
        });

        test('should enhance planet material with correct roughness and metalness', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ planet_type: 'terrestrial' });

            lightingSystem.addPlanet(planetMesh, planetData);

            expect(planetMesh.material.roughness).toBe(0.8); // terrestrial roughness
            expect(planetMesh.material.metalness).toBe(0.1); // terrestrial metalness
            expect(planetMesh.material.needsUpdate).toBe(true);
        });

        test('should set emissive properties for gas giants', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({
                planet_type: 'gas_giant',
                color_hex: '#D2691E'
            });

            lightingSystem.addPlanet(planetMesh, planetData);

            expect(planetMesh.material.emissive).toBeInstanceOf(THREE.Color);
            expect(planetMesh.material.emissiveIntensity).toBe(0.2);
            expect(planetMesh.material.roughness).toBe(0.1); // gas giant roughness
            expect(planetMesh.material.metalness).toBe(0.0); // gas giant metalness
        });

        test('should set emissive properties for ice giants', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({
                planet_type: 'ice_giant',
                color_hex: '#4FD0FF'
            });

            lightingSystem.addPlanet(planetMesh, planetData);

            expect(planetMesh.material.emissive).toBeInstanceOf(THREE.Color);
            expect(planetMesh.material.emissiveIntensity).toBe(0.2);
            expect(planetMesh.material.roughness).toBe(0.3); // ice giant roughness
            expect(planetMesh.material.metalness).toBe(0.0); // ice giant metalness
        });

        test('should handle dwarf planets correctly', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ planet_type: 'dwarf_planet' });

            lightingSystem.addPlanet(planetMesh, planetData);

            expect(planetMesh.material.roughness).toBe(0.9); // dwarf planet roughness
            expect(planetMesh.material.metalness).toBe(0.2); // dwarf planet metalness
        });

        test('should use default values for unknown planet types', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ planet_type: 'unknown' });

            lightingSystem.addPlanet(planetMesh, planetData);

            expect(planetMesh.material.roughness).toBe(0.7); // default roughness
            expect(planetMesh.material.metalness).toBe(0.0); // default metalness
        });

        test('should handle materials without roughness/metalness properties', () => {
            const planetMesh = {
                material: {
                    needsUpdate: false
                }
            };
            const planetData = createMockPlanetData();

            expect(() => {
                lightingSystem.addPlanet(planetMesh, planetData);
            }).not.toThrow();

            expect(planetMesh.material.needsUpdate).toBe(true);
        });

        test('should handle null or undefined inputs gracefully', () => {
            expect(() => {
                lightingSystem.addPlanet(null, createMockPlanetData());
            }).not.toThrow();

            expect(() => {
                lightingSystem.addPlanet(createMockPlanetMesh(), null);
            }).not.toThrow();

            expect(() => {
                lightingSystem.addPlanet(null, null);
            }).not.toThrow();
        });
    });

    describe('Quality Settings', () => {
        beforeEach(async () => {
            await lightingSystem.init(mockScene, mockCamera, mockRenderer);
        });

        test('should set low quality correctly', () => {
            lightingSystem.setQuality('low');

            expect(lightingSystem.sunLight.castShadow).toBe(false);
            expect(lightingSystem.bloomPass.enabled).toBe(false);
            expect(lightingSystem.bloomEnabled).toBe(false);
            expect(lightingSystem.ambientLight.intensity).toBe(0.5);
        });

        test('should set medium quality correctly', () => {
            lightingSystem.setQuality('medium');

            expect(lightingSystem.sunLight.castShadow).toBe(true);
            expect(lightingSystem.sunLight.shadow.mapSize.setScalar).toHaveBeenCalledWith(1024);
            expect(lightingSystem.bloomPass.enabled).toBe(true);
            expect(lightingSystem.bloomEnabled).toBe(true);
            expect(lightingSystem.ambientLight.intensity).toBe(0.2); // original intensity
        });

        test('should set high quality correctly', () => {
            lightingSystem.setQuality('high');

            expect(lightingSystem.sunLight.castShadow).toBe(true);
            expect(lightingSystem.sunLight.shadow.mapSize.setScalar).toHaveBeenCalledWith(2048);
            expect(lightingSystem.sunLight.shadow.radius).toBe(4);
            expect(lightingSystem.bloomPass.enabled).toBe(true);
            expect(lightingSystem.bloomPass.strength).toBe(1.2); // boosted bloom strength

            const expectedAmbient = 0.2 * 1.1;
            expect(lightingSystem.ambientLight.intensity).toBe(expectedAmbient);
        });

        test('should default to medium quality for unknown settings', () => {
            lightingSystem.setQuality('unknown');

            expect(lightingSystem.sunLight.castShadow).toBe(true);
            expect(lightingSystem.bloomEnabled).toBe(true);
            expect(lightingSystem.ambientLight.intensity).toBe(0.2);
        });
    });

    describe('Rendering', () => {
        beforeEach(async () => {
            await lightingSystem.init(mockScene, mockCamera, mockRenderer);
        });

        test('should render using composer when bloom is enabled', () => {
            lightingSystem.render();

            expect(lightingSystem.composer.render).toHaveBeenCalled();
            expect(lightingSystem.renderer.render).not.toHaveBeenCalled();
        });

        test('should render using fallback when bloom is disabled', () => {
            lightingSystem.setBloomEnabled(false);
            lightingSystem.render();

            expect(lightingSystem.renderer.render).toHaveBeenCalledWith(lightingSystem.scene, lightingSystem.camera);
            expect(lightingSystem.composer.render).not.toHaveBeenCalled();
        });

        test('should render using fallback when composer is not available', () => {
            lightingSystem.composer = null;
            lightingSystem.render();

            expect(lightingSystem.renderer.render).toHaveBeenCalledWith(lightingSystem.scene, lightingSystem.camera);
        });
    });

    describe('Resize Handling', () => {
        beforeEach(async () => {
            await lightingSystem.init(mockScene, mockCamera, mockRenderer);
        });

        test('should resize composer when available', () => {
            lightingSystem.handleResize(1920, 1080);

            expect(lightingSystem.composer.setSize).toHaveBeenCalledWith(1920, 1080);
        });

        test('should resize bloom pass resolution when available', () => {
            lightingSystem.handleResize(1920, 1080);

            expect(lightingSystem.bloomPass.resolution.set).toHaveBeenCalledWith(1920, 1080);
        });

        test('should use setSize method as fallback for bloom pass', () => {
            // Remove resolution.set method
            lightingSystem.bloomPass.resolution.set = undefined;

            lightingSystem.handleResize(1920, 1080);

            expect(lightingSystem.bloomPass.setSize).toHaveBeenCalledWith(1920, 1080);
        });

        test('should handle resize errors gracefully', () => {
            lightingSystem.bloomPass.resolution.set = jest.fn(() => {
                throw new Error('Resize error');
            });
            lightingSystem.bloomPass.setSize = jest.fn(() => {
                throw new Error('Resize error');
            });

            expect(() => {
                lightingSystem.handleResize(1920, 1080);
            }).not.toThrow();
        });

        test('should handle missing composer gracefully', () => {
            lightingSystem.composer = null;

            expect(() => {
                lightingSystem.handleResize(1920, 1080);
            }).not.toThrow();
        });
    });

    describe('Statistics and Information', () => {
        beforeEach(async () => {
            await lightingSystem.init(mockScene, mockCamera, mockRenderer);
        });

        test('should return comprehensive stats', () => {
            const stats = lightingSystem.getStats();

            expect(stats).toEqual({
                isInitialized: true,
                bloomEnabled: true,
                lightsCount: 4, // sun, ambient, atmospheric, sun point
                shadowsEnabled: true,
                sunPosition: { x: 0, y: 0, z: 0 }
            });
        });

        test('should count lights correctly', () => {
            expect(lightingSystem.getLightsCount()).toBe(4);
        });

        test('should count lights correctly when some are disabled', async () => {
            const partialLightingSystem = new LightingSystem({
                enableAmbientLight: false,
                enableAtmosphere: false
            });
            await partialLightingSystem.init(mockScene, mockCamera, mockRenderer);

            expect(partialLightingSystem.getLightsCount()).toBe(2); // only sun directional and sun point
        });

        test('should report shadows correctly', () => {
            lightingSystem.setQuality('low');
            const stats = lightingSystem.getStats();
            expect(stats.shadowsEnabled).toBe(false);

            lightingSystem.setQuality('high');
            const stats2 = lightingSystem.getStats();
            expect(stats2.shadowsEnabled).toBe(true);
        });
    });

    describe('Disposal and Cleanup', () => {
        beforeEach(async () => {
            await lightingSystem.init(mockScene, mockCamera, mockRenderer);
        });

        test('should dispose all resources correctly', () => {
            lightingSystem.dispose();

            expect(lightingSystem.composer.dispose).toHaveBeenCalled();
            expect(lightingSystem.scene).toBeNull();
            expect(lightingSystem.camera).toBeNull();
            expect(lightingSystem.renderer).toBeNull();
            expect(lightingSystem.sunObject).toBeNull();
            expect(lightingSystem.isInitialized).toBe(false);
        });

        test('should remove all lights on disposal', () => {
            lightingSystem.dispose();

            expect(lightingSystem.sunLight).toBeNull();
            expect(lightingSystem.ambientLight).toBeNull();
            expect(lightingSystem.atmosphericLight).toBeNull();
            expect(lightingSystem.sunPointLight).toBeNull();
        });

        test('should handle disposal when not fully initialized', () => {
            const uninitializedSystem = new LightingSystem();

            // The real implementation now handles null scene gracefully
            expect(() => {
                uninitializedSystem.dispose();
            }).not.toThrow();
        });

        test('should handle disposal with missing composer', () => {
            lightingSystem.composer = null;

            expect(() => {
                lightingSystem.dispose();
            }).not.toThrow();
        });
    });

    describe('Getters', () => {
        beforeEach(async () => {
            await lightingSystem.init(mockScene, mockCamera, mockRenderer);
        });

        test('should provide correct getter values', () => {
            expect(lightingSystem.SunLight).toBe(lightingSystem.sunLight);
            expect(lightingSystem.AmbientLight).toBe(lightingSystem.ambientLight);
            expect(lightingSystem.BloomEnabled).toBe(lightingSystem.bloomEnabled);
            expect(lightingSystem.IsInitialized).toBe(lightingSystem.isInitialized);
        });

        test('should return correct values after state changes', () => {
            lightingSystem.setBloomEnabled(false);
            expect(lightingSystem.BloomEnabled).toBe(false);

            lightingSystem.dispose();
            expect(lightingSystem.IsInitialized).toBe(false);
            expect(lightingSystem.SunLight).toBeNull();
            expect(lightingSystem.AmbientLight).toBeNull();
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle initialization with missing scene', async () => {
            await expect(lightingSystem.init(null, mockCamera, mockRenderer))
                .rejects.toThrow();
        });

        test('should handle update without camera', async () => {
            await lightingSystem.init(mockScene, null, mockRenderer);

            expect(() => {
                lightingSystem.update(0.016);
            }).not.toThrow();
        });

        test('should handle bloom setup failure gracefully', async () => {
            // Mock EffectComposer to throw error
            THREE.EffectComposer = jest.fn(() => {
                throw new Error('Composer creation failed');
            });

            await lightingSystem.init(mockScene, mockCamera, mockRenderer);

            expect(lightingSystem.bloomEnabled).toBe(false);
            expect(lightingSystem.composer).toBeNull();
        });

        test('should handle material enhancement with invalid material', () => {
            const invalidMesh = { material: null };
            const planetData = createMockPlanetData();

            expect(() => {
                lightingSystem.addPlanet(invalidMesh, planetData);
            }).not.toThrow();
        });

        test('should handle sun position updates with invalid sun object', () => {
            lightingSystem.setSunReference({ position: null });

            expect(() => {
                lightingSystem.update(0.016);
            }).not.toThrow();
        });

        test('should handle atmospheric updates without atmospheric light', () => {
            lightingSystem.atmosphericLight = null;

            expect(() => {
                lightingSystem.update(0.016);
            }).not.toThrow();
        });

        test('should handle bloom updates without bloom pass', () => {
            lightingSystem.bloomPass = null;
            lightingSystem.bloomEnabled = true;

            expect(() => {
                lightingSystem.update(0.016);
            }).not.toThrow();
        });
    });

    describe('Performance Considerations', () => {
        beforeEach(async () => {
            await lightingSystem.init(mockScene, mockCamera, mockRenderer);
        });

        test('should skip updates when not initialized', () => {
            lightingSystem.isInitialized = false;
            const updateSpy = jest.spyOn(lightingSystem, 'updateAtmosphericEffects');

            lightingSystem.update(0.016);

            expect(updateSpy).not.toHaveBeenCalled();
        });

        test('should efficiently handle repeated quality changes', () => {
            // Track shadow map size changes
            lightingSystem.setQuality('high');
            expect(lightingSystem.sunLight.shadow.mapSize.setScalar).toHaveBeenCalledWith(2048);

            lightingSystem.setQuality('low');
            expect(lightingSystem.sunLight.castShadow).toBe(false);

            lightingSystem.setQuality('medium');
            expect(lightingSystem.sunLight.shadow.mapSize.setScalar).toHaveBeenCalledWith(1024);
        });

        test('should handle rapid resize calls efficiently', () => {
            // Ensure composer exists and mock setSize to track calls
            if (lightingSystem.composer) {
                lightingSystem.composer.setSize = jest.fn();

                lightingSystem.handleResize(1920, 1080);
                lightingSystem.handleResize(1920, 1080); // Same size
                lightingSystem.handleResize(1024, 768);

                expect(lightingSystem.composer.setSize).toHaveBeenCalledTimes(3);
            } else {
                // If no composer, just test that resize doesn't throw
                expect(() => {
                    lightingSystem.handleResize(1920, 1080);
                    lightingSystem.handleResize(1920, 1080);
                    lightingSystem.handleResize(1024, 768);
                }).not.toThrow();
            }
        });
    });

    describe('Integration with Other Systems', () => {
        beforeEach(async () => {
            await lightingSystem.init(mockScene, mockCamera, mockRenderer);
        });

        test('should work correctly with multiple planet materials', () => {
            const planets = [
                { mesh: createMockPlanetMesh(), data: createMockPlanetData({ name: 'Earth', planet_type: 'terrestrial' }) },
                { mesh: createMockPlanetMesh(), data: createMockPlanetData({ name: 'Jupiter', planet_type: 'gas_giant' }) },
                { mesh: createMockPlanetMesh(), data: createMockPlanetData({ name: 'Uranus', planet_type: 'ice_giant' }) }
            ];

            planets.forEach(planet => {
                lightingSystem.addPlanet(planet.mesh, planet.data);
            });

            // Each planet should have different material properties
            expect(planets[0].mesh.material.roughness).toBe(0.8); // terrestrial
            expect(planets[1].mesh.material.roughness).toBe(0.1); // gas giant
            expect(planets[2].mesh.material.roughness).toBe(0.3); // ice giant

            expect(planets[1].mesh.material.emissiveIntensity).toBe(0.2); // gas giant has emissive
            expect(planets[2].mesh.material.emissiveIntensity).toBe(0.2); // ice giant has emissive
        });

        test('should properly coordinate with scene updates', () => {
            const mockSunObject = createMockSunObject();
            mockSunObject.position = { x: 50, y: 10, z: -20 };

            lightingSystem.setSunReference(mockSunObject);
            lightingSystem.update(0.016);

            // Verify all lights are positioned correctly relative to sun
            expect(lightingSystem.sunLight.position.copy).toHaveBeenCalledWith(mockSunObject.position);
            expect(lightingSystem.sunPointLight.position.copy).toHaveBeenCalledWith(mockSunObject.position);
        });
    });

    describe('Factory Method', () => {
        test('should create lighting system via factory method', () => {
            const lightingSystemFromFactory = window.LightingSystem.create({
                enableBloom: false,
                sunIntensity: 3.0
            });

            expect(lightingSystemFromFactory).toBeInstanceOf(LightingSystem);
            expect(lightingSystemFromFactory.options.enableBloom).toBe(false);
            expect(lightingSystemFromFactory.options.sunIntensity).toBe(3.0);
        });

        test('should create lighting system with default options via factory', () => {
            const lightingSystemFromFactory = window.LightingSystem.create();

            expect(lightingSystemFromFactory).toBeInstanceOf(LightingSystem);
            expect(lightingSystemFromFactory.options.enableBloom).toBe(true);
            expect(lightingSystemFromFactory.options.sunIntensity).toBe(2.0);
        });
    });

    describe('Console Logging', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('should log initialization messages', async () => {
            await lightingSystem.init(mockScene, mockCamera, mockRenderer);

            expect(console.log).toHaveBeenCalledWith('🌟 Initializing enhanced lighting system...');
            expect(console.log).toHaveBeenCalledWith('✅ Enhanced lighting system initialized successfully');
        });

        test('should log error messages on initialization failure', async () => {
            mockScene.add = jest.fn(() => {
                throw new Error('Scene error');
            });

            try {
                await lightingSystem.init(mockScene, mockCamera, mockRenderer);
            } catch (error) {
                expect(console.error).toHaveBeenCalledWith('❌ Failed to initialize lighting system:', error);
            }
        });

        test('should log quality setting changes', () => {
            lightingSystem.setQuality('high');
            expect(console.log).toHaveBeenCalledWith('  ✅ Lighting quality set to high');
        });

        test('should log planet enhancement', async () => {
            await lightingSystem.init(mockScene, mockCamera, mockRenderer);

            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ name: 'Earth' });

            lightingSystem.addPlanet(planetMesh, planetData);

            expect(console.log).toHaveBeenCalledWith('  ✅ Enhanced lighting applied to Earth');
        });

        test('should log disposal message', () => {
            lightingSystem.dispose();
            expect(console.log).toHaveBeenCalledWith('✅ Lighting system disposed');
        });
    });
});