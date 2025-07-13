// static/js/__tests__/solar-system-app.test.js
// Comprehensive tests for SolarSystemApp with proper mocking and coverage

// Mock THREE.js with all required components
const THREE = {
    Scene: jest.fn(function() {
        this.add = jest.fn();
        this.remove = jest.fn();
        this.getObjectByName = jest.fn();
        this.children = [];
    }),

    PerspectiveCamera: jest.fn(function(fov, aspect, near, far) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.position = {
            x: 0, y: 0, z: 100,
            set: jest.fn(),
            copy: jest.fn(),
            distanceTo: jest.fn(() => 50)
        };
        this.lookAt = jest.fn();
        this.updateProjectionMatrix = jest.fn();
    }),

    WebGLRenderer: jest.fn(function(options) {
        this.domElement = document.createElement('canvas');
        this.setSize = jest.fn();
        this.render = jest.fn();
        this.setClearColor = jest.fn();
        this.setPixelRatio = jest.fn();
        this.shadowMap = {
            enabled: false,
            type: 'PCFSoftShadowMap'
        };
        this.capabilities = {
            getMaxAnisotropy: jest.fn(() => 16)
        };
    }),

    Group: jest.fn(function() {
        this.add = jest.fn();
        this.remove = jest.fn();
        this.getObjectByName = jest.fn();
        this.position = { set: jest.fn(), x: 0, y: 0, z: 0 };
        this.rotation = { set: jest.fn(), x: 0, y: 0, z: 0 };
        this.scale = { set: jest.fn(), x: 1, y: 1, z: 1 };
        this.userData = {};
        this.name = '';
        this.visible = true;
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
    }),

    PCFSoftShadowMap: 'PCFSoftShadowMap'
};

// Global THREE setup
global.THREE = THREE;

// Mock window and console
global.window = global.window || {};
global.console = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
    return setTimeout(callback, 16);
});
global.cancelAnimationFrame = jest.fn((id) => {
    clearTimeout(id);
});

// Mock window dimensions
global.window.innerWidth = 1024;
global.window.innerHeight = 768;

// Mock document methods
global.document = {
    ...global.document,
    addEventListener: jest.fn((type, handler) => {
        // Actually register the event listener for testing
        if (!global.document._eventListeners) {
            global.document._eventListeners = {};
        }
        if (!global.document._eventListeners[type]) {
            global.document._eventListeners[type] = [];
        }
        global.document._eventListeners[type].push(handler);
    }),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn((event) => {
        // Actually dispatch to registered listeners
        if (global.document._eventListeners && global.document._eventListeners[event.type]) {
            global.document._eventListeners[event.type].forEach(handler => {
                handler(event);
            });
        }
        return true;
    }),
    getElementById: jest.fn((id) => {
        const element = {
            textContent: '',
            clientWidth: 1024,
            clientHeight: 768
        };
        // Make textContent writable for tests
        Object.defineProperty(element, 'textContent', {
            value: '',
            writable: true
        });
        return element;
    }),
    createElement: jest.fn((tag) => {
        if (tag === 'canvas') {
            return {
                getContext: jest.fn(() => ({})),
                width: 1024,
                height: 768
            };
        }
        return {};
    })
};

// Mock system dependencies
const createMockSceneManager = () => ({
    Scene: new THREE.Scene(),
    Camera: new THREE.PerspectiveCamera(),
    Renderer: new THREE.WebGLRenderer(),
    Container: { clientWidth: 1024, clientHeight: 768 },
    init: jest.fn().mockResolvedValue(true),
    addObject: jest.fn(),
    setQuality: jest.fn(),
    updateSize: jest.fn(),
    render: jest.fn(),
    takeScreenshot: jest.fn(),
    getStats: jest.fn(() => ({
        fps: 60,
        frameTime: 16,
        triangles: 1000,
        drawCalls: 10
    })),
    dispose: jest.fn()
});

const createMockLightingSystem = () => ({
    init: jest.fn().mockResolvedValue(undefined),
    setSunReference: jest.fn(),
    addPlanet: jest.fn(),
    setQuality: jest.fn(),
    setBloomEnabled: jest.fn(),
    update: jest.fn(),
    render: jest.fn(),
    handleResize: jest.fn(),
    getStats: jest.fn(() => ({
        isInitialized: true,
        bloomEnabled: true,
        lightsCount: 4
    })),
    dispose: jest.fn(),
    BloomEnabled: true
});

const createMockPlanetFactory = () => ({
    init: jest.fn().mockResolvedValue(true),
    createPlanet: jest.fn().mockResolvedValue(new THREE.Group()),
    update: jest.fn(),
    setQuality: jest.fn(),
    getStats: jest.fn(() => ({
        planetsCreated: 10,
        texturesLoaded: 15
    })),
    dispose: jest.fn()
});

const createMockParticleManager = () => ({
    init: jest.fn().mockResolvedValue(true),
    update: jest.fn(),
    setSystemVisible: jest.fn(),
    setQuality: jest.fn(),
    getStats: jest.fn(() => ({
        activeParticles: 5000,
        systemsActive: 3
    })),
    dispose: jest.fn()
});

const createMockOrbitalMechanics = () => ({
    init: jest.fn(),
    addOrbitingBody: jest.fn(),
    update: jest.fn(),
    setSpeed: jest.fn(),
    setOrbitalPathsVisible: jest.fn(),
    getFormattedTime: jest.fn(() => 'Year 2024, Day 365'),
    dispose: jest.fn()
});

const createMockCameraControls = () => ({
    init: jest.fn().mockResolvedValue(true),
    setPosition: jest.fn(),
    lookAt: jest.fn(),
    update: jest.fn(),
    stopFollowing: jest.fn(),
    dispose: jest.fn(),
    IsFollowing: false,
    FollowedPlanet: null,
    followDistance: null
});

const createMockInteractionManager = () => ({
    init: jest.fn().mockResolvedValue(true),
    focusAndFollowPlanet: jest.fn(),
    update: jest.fn(),
    dispose: jest.fn(),
    SelectedPlanet: null
});

const createMockPlanetLabels = () => ({
    init: jest.fn().mockResolvedValue(true),
    setVisible: jest.fn(),
    getStats: jest.fn(() => ({
        labelsVisible: 10,
        labelsEnabled: true
    })),
    dispose: jest.fn()
});

const createMockApiClient = () => ({
    getPlanets: jest.fn().mockResolvedValue([
        {
            name: 'Sun', display_order: 0, color_hex: '#FDB813',
            distance_from_sun: 0.0, diameter: 1392700,
            planet_type: 'star', has_rings: false, has_moons: false,
            orbital_period: 0, rotation_period: 609.12
        },
        {
            name: 'Earth', display_order: 3, color_hex: '#4F94CD',
            distance_from_sun: 1.0, diameter: 12756,
            planet_type: 'terrestrial', has_rings: false, has_moons: true,
            orbital_period: 365.25, rotation_period: 23.93, moon_count: 1
        }
    ]),
    getSystemInfo: jest.fn().mockResolvedValue({
        total_planets: 10,
        total_moons: 200,
        system_age: '4.6 billion years'
    })
});

const createMockNotificationSystem = () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn()
});

const createMockHelpers = () => ({
    log: jest.fn(),
    handleError: jest.fn()
});

const createMockLoadingManager = () => ({
    updateProgress: jest.fn()
});

const createMockControlPanel = () => ({
    updateSimulationTime: jest.fn(),
    updateCameraDistance: jest.fn(),
    updateSelectedPlanet: jest.fn(),
    handleKeyPress: jest.fn()
});

// Setup window mocks
global.window.SceneManager = {
    create: jest.fn(() => createMockSceneManager())
};

global.window.LightingSystem = {
    create: jest.fn(() => createMockLightingSystem())
};

global.window.PlanetFactory = {
    create: jest.fn(() => createMockPlanetFactory())
};

global.window.EnhancedParticleSystems = {
    create: jest.fn(() => createMockParticleManager())
};

global.window.ParticleSystems = {
    create: jest.fn(() => createMockParticleManager())
};

global.window.OrbitalMechanics = {
    create: jest.fn(() => createMockOrbitalMechanics())
};

global.window.CameraControls = {
    create: jest.fn(() => createMockCameraControls())
};

global.window.InteractionManager = {
    create: jest.fn(() => createMockInteractionManager())
};

global.window.PlanetLabels = {
    create: jest.fn(() => createMockPlanetLabels())
};

global.window.ApiClient = createMockApiClient();
global.window.NotificationSystem = createMockNotificationSystem();
global.window.Helpers = createMockHelpers();
global.window.LoadingManager = createMockLoadingManager();
global.window.ControlPanel = createMockControlPanel();

// Mock SolarSystemConfig
global.window.SolarSystemConfig = {
    debug: true
};

// Import the actual SolarSystemApp
require('../solar-system/solar-system-app.js');
const { SolarSystemApp } = window;

describe('SolarSystemApp', () => {
    let app;
    let mockSceneManager;
    let mockLightingSystem;
    let mockPlanetFactory;

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset animation frame mocks
        global.requestAnimationFrame.mockClear();
        global.cancelAnimationFrame.mockClear();

        // Reset document mocks and event listeners
        global.document._eventListeners = {};
        global.document.addEventListener = jest.fn((type, handler) => {
            if (!global.document._eventListeners[type]) {
                global.document._eventListeners[type] = [];
            }
            global.document._eventListeners[type].push(handler);
        });
        global.document.removeEventListener = jest.fn();
        global.document.dispatchEvent = jest.fn((event) => {
            if (global.document._eventListeners && global.document._eventListeners[event.type]) {
                global.document._eventListeners[event.type].forEach(handler => {
                    handler(event);
                });
            }
            return true;
        });
        global.document.getElementById = jest.fn((id) => {
            const element = {
                textContent: '',
                clientWidth: 1024,
                clientHeight: 768
            };
            Object.defineProperty(element, 'textContent', {
                value: '',
                writable: true
            });
            return element;
        });

        // Create fresh mocks
        mockSceneManager = createMockSceneManager();
        mockLightingSystem = createMockLightingSystem();
        mockPlanetFactory = createMockPlanetFactory();

        // Update window mocks to return fresh instances
        global.window.SceneManager.create.mockReturnValue(mockSceneManager);
        global.window.LightingSystem.create.mockReturnValue(mockLightingSystem);
        global.window.PlanetFactory.create.mockReturnValue(mockPlanetFactory);

        // Reset API client mocks to default behavior
        global.window.ApiClient.getPlanets.mockResolvedValue([
            {
                name: 'Sun', display_order: 0, color_hex: '#FDB813',
                distance_from_sun: 0.0, diameter: 1392700,
                planet_type: 'star', has_rings: false, has_moons: false,
                orbital_period: 0, rotation_period: 609.12
            },
            {
                name: 'Earth', display_order: 3, color_hex: '#4F94CD',
                distance_from_sun: 1.0, diameter: 12756,
                planet_type: 'terrestrial', has_rings: false, has_moons: true,
                orbital_period: 365.25, rotation_period: 23.93, moon_count: 1
            }
        ]);

        app = new SolarSystemApp();
    });

    afterEach(() => {
        if (app && app.isInitialized) {
            app.dispose();
        }
        jest.clearAllTimers();
    });

    describe('Constructor and Initialization', () => {
        test('should initialize with default options', () => {
            expect(app.options.containerId).toBe('canvas-container');
            expect(app.options.enableBloom).toBe(true);
            expect(app.options.enableAdvancedLighting).toBe(true);
            expect(app.options.qualityLevel).toBe('high');
            expect(app.options.performanceMode).toBe(false);
            expect(app.animationSpeed).toBe(1.0);
            expect(app.isInitialized).toBe(false);
        });

        test('should allow custom options', () => {
            const customApp = new SolarSystemApp({
                enableBloom: false,
                qualityLevel: 'low',
                performanceMode: true,
                enableAtmospheres: false
            });

            expect(customApp.options.enableBloom).toBe(false);
            expect(customApp.options.qualityLevel).toBe('low');
            expect(customApp.options.performanceMode).toBe(true);
            expect(customApp.options.enableAtmospheres).toBe(false);
        });

        test('should initialize all components successfully', async () => {
            const success = await app.init();

            expect(success).toBe(true);
            expect(app.isInitialized).toBe(true);
            expect(mockSceneManager.init).toHaveBeenCalled();
            expect(mockLightingSystem.init).toHaveBeenCalled();
            expect(mockPlanetFactory.init).toHaveBeenCalled();
            expect(global.window.LoadingManager.updateProgress).toHaveBeenCalledWith('Complete!', 100);
        });

        test('should handle initialization errors', async () => {
            mockSceneManager.init.mockRejectedValue(new Error('Scene init failed'));

            await expect(app.init()).rejects.toThrow('Scene init failed');
            expect(app.isInitialized).toBe(false);
            expect(global.window.Helpers.handleError).toHaveBeenCalled();
        });
    });

    describe('Component Initialization', () => {
        test('should initialize scene manager with correct options', async () => {
            await app.initSceneManager();

            expect(global.window.SceneManager.create).toHaveBeenCalledWith({
                ...app.options,
                antialias: true,
                enableShadows: true,
                shadowMapSize: 2048,
                logarithmicDepthBuffer: true
            });
            expect(mockSceneManager.setQuality).toHaveBeenCalled();
        });

        test('should initialize lighting system with advanced options', async () => {
            app.sceneManager = mockSceneManager;
            await app.initLightingSystem();

            expect(global.window.LightingSystem.create).toHaveBeenCalledWith({
                enableSunLight: true,
                enableAmbientLight: true,
                enableBloom: true,
                enableAtmosphere: true,
                sunIntensity: 1.8,
                ambientIntensity: 0.2,
                bloomStrength: 0.9,
                bloomRadius: 0.5,
                bloomThreshold: 0.8
            });
            expect(mockLightingSystem.init).toHaveBeenCalledWith(
                mockSceneManager.Scene,
                mockSceneManager.Camera,
                mockSceneManager.Renderer
            );
        });

        test('should handle missing LightingSystem gracefully', async () => {
            const originalLightingSystem = global.window.LightingSystem;
            delete global.window.LightingSystem;

            await app.initLightingSystem();

            expect(global.window.Helpers.log).toHaveBeenCalledWith(
                'LightingSystem not available, using basic lighting',
                'warn'
            );

            // Restore
            global.window.LightingSystem = originalLightingSystem;
        });

        test('should initialize planet factory with quality settings', async () => {
            await app.initPlanetFactory();

            expect(global.window.PlanetFactory.create).toHaveBeenCalledWith({
                enableTextures: true,
                enableNormalMaps: true,
                enableSpecularMaps: true,
                enableAtmosphere: true,
                enableRings: true,
                quality: 'high'
            });
            expect(mockPlanetFactory.init).toHaveBeenCalled();
        });

        test('should prefer EnhancedParticleSystems over basic ParticleSystems', async () => {
            // Setup scene manager first
            app.sceneManager = mockSceneManager;

            await app.initEnhancedParticleSystems();

            expect(global.window.EnhancedParticleSystems.create).toHaveBeenCalledWith({
                enableRealisticStarfield: true,
                enableProceduralNebulae: true,
                enableRealisticAsteroids: true,
                qualityLevel: 'high',
                performanceMode: false
            });
        });

        test('should fallback to basic ParticleSystems when enhanced not available', async () => {
            const originalEnhanced = global.window.EnhancedParticleSystems;
            delete global.window.EnhancedParticleSystems;

            // Setup scene manager first
            app.sceneManager = mockSceneManager;

            await app.initEnhancedParticleSystems();

            expect(global.window.ParticleSystems.create).toHaveBeenCalled();

            // Restore
            global.window.EnhancedParticleSystems = originalEnhanced;
        });
    });

    describe('Data Loading and Planet Creation', () => {
        beforeEach(async () => {
            app.sceneManager = mockSceneManager;
            app.lightingSystem = mockLightingSystem;
            app.planetFactory = mockPlanetFactory;
        });

        test('should load planet data from API successfully', async () => {
            await app.loadPlanetData();

            expect(global.window.ApiClient.getPlanets).toHaveBeenCalled();
            expect(global.window.ApiClient.getSystemInfo).toHaveBeenCalled();
            expect(app.planets).toHaveLength(2);
            expect(app.systemInfo.total_planets).toBe(10);
        });

        test('should fallback to enhanced fallback data on API failure', async () => {
            global.window.ApiClient.getPlanets.mockRejectedValue(new Error('API Error'));

            await app.loadPlanetData();

            expect(global.window.Helpers.log).toHaveBeenCalledWith(
                'Failed to load data from API, using enhanced fallback',
                'warn'
            );
            expect(app.planets).toHaveLength(10); // Fallback data has 10 planets
        });

        test('should create all planets with correct positioning', async () => {
            // Set up test data - use only 2 planets for this test
            app.planets = [
                { name: 'Sun', distance_from_sun: 0, has_rings: false },
                { name: 'Earth', distance_from_sun: 1.0, has_rings: false }
            ];

            await app.createAllPlanets();

            expect(mockPlanetFactory.createPlanet).toHaveBeenCalledTimes(2);
            expect(mockSceneManager.addObject).toHaveBeenCalledTimes(2);
            expect(app.planetInstances.size).toBe(2);
        });

        test('should set sun reference in lighting system', async () => {
            app.planets = [{ name: 'Sun', distance_from_sun: 0, has_rings: false }];

            await app.createAllPlanets();

            expect(mockLightingSystem.setSunReference).toHaveBeenCalled();
        });

        test('should handle planet creation errors gracefully', async () => {
            app.planets = [{ name: 'FailPlanet', distance_from_sun: 1.0, has_rings: false }];
            mockPlanetFactory.createPlanet.mockRejectedValue(new Error('Planet creation failed'));

            await app.createAllPlanets();

            expect(global.window.Helpers.handleError).toHaveBeenCalledWith(
                expect.any(Error),
                'Creating planet FailPlanet'
            );
        });
    });

    describe('Animation and Speed Control', () => {
        beforeEach(async () => {
            app.sceneManager = mockSceneManager;
            app.orbitalMechanics = createMockOrbitalMechanics();
            app.lightingSystem = mockLightingSystem;
            app.particleManager = createMockParticleManager();

            // Setup event listeners first
            app.setupEventListeners();
        });

        test('should start render loop and request animation frames', () => {
            app.startRenderLoop();

            expect(global.requestAnimationFrame).toHaveBeenCalled();
            expect(global.window.Helpers.log).toHaveBeenCalledWith(
                'Enhanced render loop started with speed-based animation',
                'debug'
            );
        });

        test('should handle speed change events', () => {
            const speedEvent = new CustomEvent('speedChanged', { detail: { speed: 2.5 } });
            // Manually trigger the event handler
            if (global.document._eventListeners && global.document._eventListeners['speedChanged']) {
                global.document._eventListeners['speedChanged'].forEach(handler => {
                    handler(speedEvent);
                });
            }

            expect(app.animationSpeed).toBe(2.5);
            expect(app.orbitalMechanics.setSpeed).toHaveBeenCalledWith(2.5);
        });

        test('should handle legacy toggleAnimation events', () => {
            const toggleEvent = new CustomEvent('toggleAnimation', { detail: { playing: false } });
            // Manually trigger the event handler
            if (global.document._eventListeners && global.document._eventListeners['toggleAnimation']) {
                global.document._eventListeners['toggleAnimation'].forEach(handler => {
                    handler(toggleEvent);
                });
            }

            expect(app.animationSpeed).toBe(0);
            expect(app.orbitalMechanics.setSpeed).toHaveBeenCalledWith(0);
        });

        test('should update all systems with speed multiplier', () => {
            jest.useFakeTimers();
            app.animationSpeed = 2.0;

            app.updateSystems(0.016);

            expect(app.orbitalMechanics.update).toHaveBeenCalledWith(0.016, 2.0);
            expect(app.particleManager.update).toHaveBeenCalledWith(0.016);
            expect(app.lightingSystem.update).toHaveBeenCalledWith(0.016);

            jest.useRealTimers();
        });

        test('should always report as animating but track speed separately', () => {
            app.animationSpeed = 0;

            expect(app.IsAnimating).toBe(true);
            expect(app.IsAtZeroSpeed).toBe(true);
            expect(app.AnimationSpeed).toBe(0);

            app.animationSpeed = 1.5;
            expect(app.IsAnimating).toBe(true);
            expect(app.IsAtZeroSpeed).toBe(false);
            expect(app.AnimationSpeed).toBe(1.5);
        });
    });

    describe('Camera and View Controls', () => {
        beforeEach(async () => {
            app.cameraControls = createMockCameraControls();
            app.interactionManager = createMockInteractionManager();
            app.planets = [{ name: 'Earth' }];

            // Setup event listeners for tests that need them
            app.setupEventListeners();
        });

        test('should focus on planet through interaction manager', () => {
            app.focusOnPlanet('Earth');

            expect(app.interactionManager.focusAndFollowPlanet).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Earth' })
            );
        });

        test('should stop following planet', () => {
            app.cameraControls.IsFollowing = true;

            app.stopFollowingPlanet();

            expect(app.cameraControls.stopFollowing).toHaveBeenCalled();
            expect(global.window.NotificationSystem.showInfo).toHaveBeenCalledWith(
                '📹 Stopped following planet'
            );
        });

        test('should reset camera view', () => {
            app.resetCameraView();

            expect(app.cameraControls.stopFollowing).toHaveBeenCalled();
            expect(app.cameraControls.setPosition).toHaveBeenCalledWith(0, 30, 80);
            expect(app.cameraControls.lookAt).toHaveBeenCalledWith(0, 0, 0);
            expect(global.window.NotificationSystem.showInfo).toHaveBeenCalledWith(
                '📷 Camera reset to overview'
            );
        });

        test('should toggle planet following when planet is selected', () => {
            // Set up the conditions for the toggle to work
            app.interactionManager.SelectedPlanet = { name: 'Mars' };
            app.cameraControls.IsFollowing = false; // Not currently following

            // Need to find the planet in the planets array for focusOnPlanet to work
            app.planets = [{ name: 'Mars' }];

            app.togglePlanetFollowing();

            expect(app.interactionManager.focusAndFollowPlanet).toHaveBeenCalled();
        });

        test('should show warning when no planet selected for following', () => {
            app.interactionManager.SelectedPlanet = null;

            app.togglePlanetFollowing();

            expect(global.window.NotificationSystem.showWarning).toHaveBeenCalledWith(
                'No planet selected to follow'
            );
        });

        test('should return correct camera status', () => {
            app.cameraControls.IsFollowing = true;
            app.cameraControls.FollowedPlanet = {
                userData: { planetData: { name: 'Jupiter' } }
            };
            app.cameraControls.followDistance = 25;

            const status = app.getCameraStatus();

            expect(status).toEqual({
                isFollowing: true,
                followedPlanet: 'Jupiter',
                followDistance: 25
            });
        });
    });

    describe('Feature Toggles', () => {
        beforeEach(async () => {
            app.particleManager = createMockParticleManager();
            app.lightingSystem = mockLightingSystem;
            app.orbitalMechanics = createMockOrbitalMechanics();
            app.planetLabels = createMockPlanetLabels();
            app.planetInstances = new Map();

            // Add mock planet instances
            const mockPlanetGroup = new THREE.Group();
            mockPlanetGroup.getObjectByName = jest.fn((name) =>
                name.includes('_atmosphere') || name.includes('_rings') ? { visible: true } : null
            );
            app.planetInstances.set('Earth', mockPlanetGroup);
        });

        test('should toggle starfield visibility', () => {
            app.toggleFeature('stars', false);

            expect(app.particleManager.setSystemVisible).toHaveBeenCalledWith('starfield', false);
        });

        test('should toggle asteroid belt visibility', () => {
            app.toggleFeature('asteroids', true);

            expect(app.particleManager.setSystemVisible).toHaveBeenCalledWith('asteroidBelt', true);
        });

        test('should toggle nebulae visibility', () => {
            app.toggleFeature('nebulae', false);

            expect(app.particleManager.setSystemVisible).toHaveBeenCalledWith('nebula', false);
        });

        test('should toggle atmosphere visibility', () => {
            app.toggleFeature('atmospheres', false);

            const earthGroup = app.planetInstances.get('Earth');
            expect(earthGroup.getObjectByName).toHaveBeenCalledWith('Earth_atmosphere');
        });

        test('should toggle rings visibility', () => {
            app.toggleFeature('rings', true);

            const earthGroup = app.planetInstances.get('Earth');
            expect(earthGroup.getObjectByName).toHaveBeenCalledWith('Earth_rings');
        });

        test('should toggle bloom effect', () => {
            app.toggleFeature('bloom', false);

            expect(mockLightingSystem.setBloomEnabled).toHaveBeenCalledWith(false);
        });

        test('should toggle orbital paths', () => {
            app.toggleFeature('orbits', true);

            expect(app.orbitalMechanics.setOrbitalPathsVisible).toHaveBeenCalledWith(true);
        });

        test('should toggle planet labels', () => {
            app.toggleFeature('labels', false);

            expect(app.planetLabels.setVisible).toHaveBeenCalledWith(false);
        });
    });

    describe('Quality and Performance Settings', () => {
        beforeEach(async () => {
            app.sceneManager = mockSceneManager;
            app.lightingSystem = mockLightingSystem;
            app.planetFactory = mockPlanetFactory;
            app.particleManager = createMockParticleManager();
            app.particleManager.setQuality = jest.fn();
        });

        test('should set quality level across all systems', () => {
            app.setQualityLevel('medium');

            expect(app.options.qualityLevel).toBe('medium');
            expect(mockSceneManager.setQuality).toHaveBeenCalled();
            expect(mockLightingSystem.setQuality).toHaveBeenCalledWith('medium');
            expect(mockPlanetFactory.setQuality).toHaveBeenCalledWith('medium');
            expect(app.particleManager.setQuality).toHaveBeenCalledWith('medium');
        });

        test('should enable performance mode', () => {
            app.setPerformanceMode(true);

            expect(app.options.performanceMode).toBe(true);
            expect(app.options.qualityLevel).toBe('low');
            expect(mockLightingSystem.setBloomEnabled).toHaveBeenCalledWith(false);
        });

        test('should disable performance mode', () => {
            app.setPerformanceMode(false);

            expect(app.options.performanceMode).toBe(false);
            expect(app.options.qualityLevel).toBe('medium');
        });

        test('should return correct quality multiplier', () => {
            expect(app.getQualityMultiplier()).toBe(1.3); // high quality

            app.options.qualityLevel = 'medium';
            expect(app.getQualityMultiplier()).toBe(1.0);

            app.options.qualityLevel = 'low';
            expect(app.getQualityMultiplier()).toBe(0.7);

            app.options.qualityLevel = 'unknown';
            expect(app.getQualityMultiplier()).toBe(1.0); // default
        });
    });

    describe('Screenshots and Utilities', () => {
        beforeEach(() => {
            app.sceneManager = mockSceneManager;
        });

        test('should take screenshot with timestamp', () => {
            const originalDate = Date;
            const mockDate = new Date('2024-01-15T10:30:45.123Z');
            global.Date = jest.fn(() => mockDate);
            global.Date.prototype.toISOString = () => mockDate.toISOString();

            app.takeScreenshot();

            expect(mockSceneManager.takeScreenshot).toHaveBeenCalledWith(
                'solar-system-2024-01-15T10-30-45-123Z.png'
            );
            expect(global.window.NotificationSystem.showSuccess).toHaveBeenCalledWith(
                'Screenshot saved!'
            );

            global.Date = originalDate;
        });

        test('should calculate scaled distance correctly', () => {
            const earthData = { name: 'Earth', distance_from_sun: 1.0 };
            const sunData = { name: 'Sun', distance_from_sun: 0.0 };
            const jupiterData = { name: 'Jupiter', distance_from_sun: 5.2 };

            expect(app.calculateScaledDistance(sunData)).toBe(0);
            expect(app.calculateScaledDistance(earthData)).toBe(75); // 1.0 * 25 * 3.0
            expect(app.calculateScaledDistance(jupiterData)).toBe(325); // 5.2 * 25 * 2.5
        });

        test('should handle unknown planet names in distance calculation', () => {
            const unknownPlanet = { name: 'Unknown', distance_from_sun: 2.0 };
            const distance = app.calculateScaledDistance(unknownPlanet);

            expect(distance).toBe(50); // 2.0 * 25 * 1.0 (default multiplier)
        });
    });

    describe('Performance Monitoring', () => {
        beforeEach(() => {
            app.sceneManager = mockSceneManager;
            app.particleManager = createMockParticleManager();
            app.lightingSystem = mockLightingSystem;
            app.planetFactory = mockPlanetFactory;
            app.planetLabels = createMockPlanetLabels();
            app.orbitalMechanics = createMockOrbitalMechanics();
        });

        test('should update performance stats', () => {
            app.updatePerformanceStats(1000);

            expect(mockSceneManager.getStats).toHaveBeenCalled();
            expect(app.performanceStats.fps).toBe(60);
            expect(app.performanceStats.triangles).toBe(1000);
        });

        test('should update simulation time display', () => {
            app.updateSimulationTime(1000);

            expect(app.orbitalMechanics.getFormattedTime).toHaveBeenCalled();
            expect(global.window.ControlPanel.updateSimulationTime).toHaveBeenCalledWith(
                'Year 2024, Day 365'
            );
        });

        test('should update performance display elements', () => {
            // Mock document.getElementById as a jest function
            global.document.getElementById = jest.fn((id) => {
                const element = { textContent: '' };
                Object.defineProperty(element, 'textContent', {
                    value: '',
                    writable: true
                });
                return element;
            });

            app.performanceStats = { fps: 58, triangles: 1500 };

            app.updatePerformanceDisplay();

            expect(global.document.getElementById).toHaveBeenCalledWith('fps-counter');
            expect(global.document.getElementById).toHaveBeenCalledWith('triangle-counter');
        });

        test('should return comprehensive performance stats', () => {
            const stats = app.getPerformanceStats();

            expect(stats).toEqual({
                isInitialized: false,
                isAnimating: true,
                animationSpeed: 1.0,
                isAtZeroSpeed: false,
                qualityLevel: 'high',
                performanceMode: false,
                planetCount: 0,
                fps: 60,
                frameTime: 0,
                triangles: 0,
                drawCalls: 0,
                fps: 60,
                frameTime: 16,
                triangles: 1000,
                drawCalls: 10,
                particleSystems: {
                    activeParticles: 5000,
                    systemsActive: 3
                },
                lighting: {
                    isInitialized: true,
                    bloomEnabled: true,
                    lightsCount: 4
                },
                planets: {
                    planetsCreated: 10,
                    texturesLoaded: 15
                },
                labels: {
                    labelsVisible: 10,
                    labelsEnabled: true
                }
            });
        });
    });

    describe('Event Handling', () => {
        beforeEach(() => {
            // Setup all required components
            app.particleManager = createMockParticleManager();
            app.cameraControls = createMockCameraControls();
            app.interactionManager = createMockInteractionManager();
            app.sceneManager = mockSceneManager;
            app.lightingSystem = mockLightingSystem;
            app.planets = [{ name: 'Mars' }];

            // Setup event listeners BEFORE dispatching events
            app.setupEventListeners();
        });

        test('should handle feature toggle events', () => {
            const featureEvent = new CustomEvent('toggleFeature', {
                detail: { feature: 'stars', enabled: false }
            });
            // Manually trigger the event handler
            if (global.document._eventListeners && global.document._eventListeners['toggleFeature']) {
                global.document._eventListeners['toggleFeature'].forEach(handler => {
                    handler(featureEvent);
                });
            }

            expect(app.particleManager.setSystemVisible).toHaveBeenCalledWith('starfield', false);
        });

        test('should handle reset view events', () => {
            const resetEvent = new CustomEvent('resetView');
            // Manually trigger the event handler
            if (global.document._eventListeners && global.document._eventListeners['resetView']) {
                global.document._eventListeners['resetView'].forEach(handler => {
                    handler(resetEvent);
                });
            }

            expect(app.cameraControls.setPosition).toHaveBeenCalledWith(0, 30, 80);
        });

        test('should handle focus planet events', () => {
            // Make sure the planet exists in the planets array
            app.planets = [{ name: 'Mars' }];

            const focusEvent = new CustomEvent('focusPlanet', {
                detail: { planet: 'Mars' }
            });
            // Manually trigger the event handler
            if (global.document._eventListeners && global.document._eventListeners['focusPlanet']) {
                global.document._eventListeners['focusPlanet'].forEach(handler => {
                    handler(focusEvent);
                });
            }

            expect(app.interactionManager.focusAndFollowPlanet).toHaveBeenCalled();
        });

        test('should handle quality change events', () => {
            const qualityEvent = new CustomEvent('qualityChanged', {
                detail: { quality: 'low' }
            });
            // Manually trigger the event handler
            if (global.document._eventListeners && global.document._eventListeners['qualityChanged']) {
                global.document._eventListeners['qualityChanged'].forEach(handler => {
                    handler(qualityEvent);
                });
            }

            expect(app.options.qualityLevel).toBe('low');
        });

        test('should handle screenshot events', () => {
            const screenshotEvent = new CustomEvent('takeScreenshot');
            // Manually trigger the event handler
            if (global.document._eventListeners && global.document._eventListeners['takeScreenshot']) {
                global.document._eventListeners['takeScreenshot'].forEach(handler => {
                    handler(screenshotEvent);
                });
            }

            expect(mockSceneManager.takeScreenshot).toHaveBeenCalled();
        });

        test('should handle performance mode toggle events', () => {
            const performanceEvent = new CustomEvent('togglePerformanceMode', {
                detail: { enabled: true }
            });
            // Manually trigger the event handler
            if (global.document._eventListeners && global.document._eventListeners['togglePerformanceMode']) {
                global.document._eventListeners['togglePerformanceMode'].forEach(handler => {
                    handler(performanceEvent);
                });
            }

            expect(app.options.performanceMode).toBe(true);
        });
    });

    describe('Resize and Visibility Handling', () => {
        beforeEach(() => {
            app.sceneManager = mockSceneManager;
            app.lightingSystem = mockLightingSystem;
        });

        test('should handle resize correctly', () => {
            app.handleResize();

            expect(mockSceneManager.updateSize).toHaveBeenCalled();
            expect(mockLightingSystem.handleResize).toHaveBeenCalledWith(1024, 768);
        });

        test('should handle resize errors gracefully', () => {
            mockSceneManager.updateSize.mockImplementation(() => {
                throw new Error('Resize error');
            });

            expect(() => {
                app.handleResize();
            }).not.toThrow();
        });

        test('should handle visibility changes', () => {
            app.handleVisibilityChange(true);

            expect(global.window.Helpers.log).toHaveBeenCalledWith(
                'Page visibility changed: hidden',
                'debug'
            );

            app.handleVisibilityChange(false);

            expect(global.window.Helpers.log).toHaveBeenCalledWith(
                'Page visibility changed: visible',
                'debug'
            );
        });

        test('should handle key press events', () => {
            const mockEvent = { key: 'Space', preventDefault: jest.fn() };

            app.handleKeyPress(mockEvent);

            expect(global.window.ControlPanel.handleKeyPress).toHaveBeenCalledWith(mockEvent);
        });
    });

    describe('Fallback Data', () => {
        test('should provide enhanced fallback planet data', () => {
            const fallbackData = app.getEnhancedFallbackPlanetData();

            expect(fallbackData).toHaveLength(10);
            expect(fallbackData[0].name).toBe('Sun');
            expect(fallbackData[3].name).toBe('Earth');
            expect(fallbackData[9].name).toBe('Pluto');
            expect(fallbackData[9].is_dwarf_planet).toBe(true);
        });

        test('should provide fallback system info', () => {
            const systemInfo = app.getFallbackSystemInfo();

            expect(systemInfo).toEqual({
                total_planets: 10,
                total_moons: 200,
                system_age: '4.6 billion years'
            });
        });

        test('should use fallback data when API fails', async () => {
            global.window.ApiClient.getPlanets.mockRejectedValue(new Error('Network error'));

            await app.loadPlanetData();

            expect(app.planets).toHaveLength(10);
            expect(app.planets[0].name).toBe('Sun');
            expect(app.systemInfo.total_planets).toBe(10);
        });
    });

    describe('Rendering and Animation Loop', () => {
        beforeEach(() => {
            app.sceneManager = mockSceneManager;
            app.lightingSystem = mockLightingSystem;
            app.orbitalMechanics = createMockOrbitalMechanics();
            app.particleManager = createMockParticleManager();
            app.cameraControls = createMockCameraControls();
            app.interactionManager = createMockInteractionManager();
            app.planetFactory = mockPlanetFactory;
        });

        test('should render with bloom when available', () => {
            mockLightingSystem.BloomEnabled = true;

            app.render();

            expect(mockLightingSystem.render).toHaveBeenCalled();
            expect(mockSceneManager.render).not.toHaveBeenCalled();
        });

        test('should fallback to scene manager render when bloom disabled', () => {
            mockLightingSystem.BloomEnabled = false;

            app.render();

            expect(mockSceneManager.render).toHaveBeenCalled();
            expect(mockLightingSystem.render).not.toHaveBeenCalled();
        });

        test('should update all systems in correct order', () => {
            jest.useFakeTimers();

            app.updateSystems(0.016);

            expect(app.particleManager.update).toHaveBeenCalledWith(0.016);
            expect(app.orbitalMechanics.update).toHaveBeenCalledWith(0.016, 1.0);
            expect(app.planetFactory.update).toHaveBeenCalledWith(0.016);
            expect(app.lightingSystem.update).toHaveBeenCalledWith(0.016);
            expect(app.cameraControls.update).toHaveBeenCalled();
            expect(app.interactionManager.update).toHaveBeenCalledWith(0.016);
            expect(mockSceneManager.render).toHaveBeenCalled();

            jest.useRealTimers();
        });

        test('should handle missing systems gracefully in update', () => {
            app.particleManager = null;
            app.orbitalMechanics = null;

            expect(() => {
                app.updateSystems(0.016);
            }).not.toThrow();
        });
    });

    describe('Planet Labels Integration', () => {
        test('should initialize planet labels when available', async () => {
            app.sceneManager = mockSceneManager;
            app.planetInstances = new Map();

            await app.initPlanetLabels();

            expect(global.window.PlanetLabels.create).toHaveBeenCalledWith({
                enabled: true,
                fontSize: '13px',
                fontFamily: 'Orbitron, monospace',
                backgroundColor: 'rgba(16, 22, 58, 0.9)',
                borderColor: 'rgba(74, 158, 255, 0.7)',
                textColor: '#ffffff',
                fadeDistance: 180,
                minDistance: 8,
                maxDistance: 400
            });
        });

        test('should handle missing PlanetLabels gracefully', async () => {
            const originalPlanetLabels = global.window.PlanetLabels;
            delete global.window.PlanetLabels;

            await app.initPlanetLabels();

            expect(global.window.Helpers.log).toHaveBeenCalledWith(
                'PlanetLabels not available',
                'warn'
            );

            // Restore
            global.window.PlanetLabels = originalPlanetLabels;
        });
    });

    describe('Disposal and Cleanup', () => {
        beforeEach(async () => {
            app.sceneManager = mockSceneManager;
            app.lightingSystem = mockLightingSystem;
            app.planetFactory = mockPlanetFactory;
            app.particleManager = createMockParticleManager();
            app.orbitalMechanics = createMockOrbitalMechanics();
            app.cameraControls = createMockCameraControls();
            app.interactionManager = createMockInteractionManager();
            app.planetLabels = createMockPlanetLabels();
            app.isInitialized = true;
            app.animationId = 123;

            // Mock event listeners
            app.eventListeners = [
                { type: 'resize', handler: jest.fn() },
                { type: 'keydown', handler: jest.fn() }
            ];
        });

        test('should dispose all resources correctly', () => {
            // Mock document.removeEventListener as a jest function
            global.document.removeEventListener = jest.fn();

            app.dispose();

            expect(global.cancelAnimationFrame).toHaveBeenCalledWith(123);
            expect(global.document.removeEventListener).toHaveBeenCalledTimes(2);

            expect(app.interactionManager.dispose).toHaveBeenCalled();
            expect(app.planetLabels.dispose).toHaveBeenCalled();
            expect(app.cameraControls.dispose).toHaveBeenCalled();
            expect(app.orbitalMechanics.dispose).toHaveBeenCalled();
            expect(mockPlanetFactory.dispose).toHaveBeenCalled();
            expect(app.particleManager.dispose).toHaveBeenCalled();
            expect(mockLightingSystem.dispose).toHaveBeenCalled();
            expect(mockSceneManager.dispose).toHaveBeenCalled();

            expect(app.planetInstances.size).toBe(0);
            expect(app.isInitialized).toBe(false);
            expect(app.eventListeners).toHaveLength(0);
        });

        test('should handle disposal when not fully initialized', () => {
            const partialApp = new SolarSystemApp();
            partialApp.sceneManager = mockSceneManager;

            expect(() => {
                partialApp.dispose();
            }).not.toThrow();
        });

        test('should handle missing components during disposal', () => {
            app.lightingSystem = null;
            app.particleManager = null;

            expect(() => {
                app.dispose();
            }).not.toThrow();

            expect(mockSceneManager.dispose).toHaveBeenCalled();
        });
    });

    describe('Public Getters', () => {
        beforeEach(() => {
            app.sceneManager = mockSceneManager;
            app.planets = [{ name: 'Earth' }, { name: 'Mars' }];
            app.planetInstances = new Map([['Earth', {}], ['Mars', {}]]);
            app.systemInfo = { total_planets: 2 };
            app.isInitialized = true;
            app.animationSpeed = 2.5;
        });

        test('should return correct scene manager properties', () => {
            expect(app.Scene).toBe(mockSceneManager.Scene);
            expect(app.Camera).toBe(mockSceneManager.Camera);
            expect(app.Renderer).toBe(mockSceneManager.Renderer);
        });

        test('should return correct data properties', () => {
            expect(app.Planets).toHaveLength(2);
            expect(app.PlanetInstances.size).toBe(2);
            expect(app.SystemInfo.total_planets).toBe(2);
        });

        test('should return correct state properties', () => {
            expect(app.IsInitialized).toBe(true);
            expect(app.AnimationSpeed).toBe(2.5);
            expect(app.IsAnimating).toBe(true);
            expect(app.IsAtZeroSpeed).toBe(false);
            expect(app.QualityLevel).toBe('high');
            expect(app.PerformanceMode).toBe(false);
        });

        test('should handle null scene manager gracefully', () => {
            app.sceneManager = null;

            expect(app.Scene).toBeUndefined();
            expect(app.Camera).toBeUndefined();
            expect(app.Renderer).toBeUndefined();
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle missing components during initialization', async () => {
            const originalPlanetFactory = global.window.PlanetFactory;
            delete global.window.PlanetFactory;

            await expect(app.initPlanetFactory()).rejects.toThrow('PlanetFactory not available');

            // Restore
            global.window.PlanetFactory = originalPlanetFactory;
        });

        test('should handle orbital mechanics initialization failure', async () => {
            const originalOrbitalMechanics = global.window.OrbitalMechanics;
            delete global.window.OrbitalMechanics;

            await app.initOrbitalMechanics();

            expect(global.window.Helpers.log).toHaveBeenCalledWith(
                'OrbitalMechanics not available',
                'warn'
            );

            // Restore
            global.window.OrbitalMechanics = originalOrbitalMechanics;
        });

        test('should handle camera controls initialization failure', async () => {
            const originalCameraControls = global.window.CameraControls;
            delete global.window.CameraControls;

            await app.initCameraControls();

            expect(global.window.Helpers.log).toHaveBeenCalledWith(
                'CameraControls not available',
                'warn'
            );

            // Restore
            global.window.CameraControls = originalCameraControls;
        });

        test('should handle interaction manager initialization failure', async () => {
            const originalInteractionManager = global.window.InteractionManager;
            delete global.window.InteractionManager;

            await app.initInteractionManager();

            expect(global.window.Helpers.log).toHaveBeenCalledWith(
                'InteractionManager not available',
                'warn'
            );

            // Restore
            global.window.InteractionManager = originalInteractionManager;
        });

        test('should handle focus on non-existent planet', () => {
            app.interactionManager = createMockInteractionManager();
            app.planets = [{ name: 'Earth' }];

            app.focusOnPlanet('NonExistentPlanet');

            expect(app.interactionManager.focusAndFollowPlanet).not.toHaveBeenCalled();
        });

        test('should handle stop following when not following', () => {
            app.cameraControls = createMockCameraControls();
            app.cameraControls.IsFollowing = false;

            app.stopFollowingPlanet();

            expect(app.cameraControls.stopFollowing).not.toHaveBeenCalled();
        });

        test('should handle camera status when no camera controls', () => {
            app.cameraControls = null;

            const status = app.getCameraStatus();

            // Looking at the source code: when cameraControls is null, it returns:
            // { isFollowing: false, followedPlanet: null }
            // followDistance is only included when cameraControls exists
            expect(status).toEqual({
                isFollowing: false,
                followedPlanet: null
            });
        });
    });

    describe('Integration Tests', () => {
        test('should complete full initialization cycle', async () => {
            // Mock API client to return 2 planets for this test
            global.window.ApiClient.getPlanets.mockResolvedValueOnce([
                {
                    name: 'Sun', display_order: 0, color_hex: '#FDB813',
                    distance_from_sun: 0.0, diameter: 1392700,
                    planet_type: 'star', has_rings: false, has_moons: false,
                    orbital_period: 0, rotation_period: 609.12
                },
                {
                    name: 'Earth', display_order: 3, color_hex: '#4F94CD',
                    distance_from_sun: 1.0, diameter: 12756,
                    planet_type: 'terrestrial', has_rings: false, has_moons: true,
                    orbital_period: 365.25, rotation_period: 23.93, moon_count: 1
                }
            ]);

            const success = await app.init();

            expect(success).toBe(true);
            expect(app.isInitialized).toBe(true);
            expect(app.planets).toHaveLength(2);
            expect(app.planetInstances.size).toBe(2);
            expect(global.requestAnimationFrame).toHaveBeenCalled();
        });

        test('should handle complete speed control workflow', async () => {
            await app.init();

            // Start with normal speed
            expect(app.AnimationSpeed).toBe(1.0);
            expect(app.IsAtZeroSpeed).toBe(false);

            // Change to faster speed - use real document dispatch
            const speedUpEvent = new CustomEvent('speedChanged', { detail: { speed: 3.0 } });
            if (global.document._eventListeners && global.document._eventListeners['speedChanged']) {
                global.document._eventListeners['speedChanged'].forEach(handler => {
                    handler(speedUpEvent);
                });
            }

            expect(app.AnimationSpeed).toBe(3.0);
            expect(app.IsAtZeroSpeed).toBe(false);

            // Pause (speed to zero)
            const pauseEvent = new CustomEvent('speedChanged', { detail: { speed: 0 } });
            if (global.document._eventListeners && global.document._eventListeners['speedChanged']) {
                global.document._eventListeners['speedChanged'].forEach(handler => {
                    handler(pauseEvent);
                });
            }

            expect(app.AnimationSpeed).toBe(0);
            expect(app.IsAtZeroSpeed).toBe(true);
            expect(app.IsAnimating).toBe(true); // Still animating, just at zero speed
        });

        test('should handle quality changes with full system updates', async () => {
            await app.init();

            app.setQualityLevel('low');

            expect(app.QualityLevel).toBe('low');
            expect(mockSceneManager.setQuality).toHaveBeenCalledWith(0.7);
            expect(mockLightingSystem.setQuality).toHaveBeenCalledWith('low');
        });

        test('should handle feature toggle workflow', async () => {
            await app.init();

            // Toggle multiple features
            app.toggleFeature('bloom', false);
            app.toggleFeature('stars', false);
            app.toggleFeature('orbits', true);

            expect(mockLightingSystem.setBloomEnabled).toHaveBeenCalledWith(false);
            expect(app.particleManager.setSystemVisible).toHaveBeenCalledWith('starfield', false);
            expect(app.orbitalMechanics.setOrbitalPathsVisible).toHaveBeenCalledWith(true);
        });
    });

    describe('Console Logging', () => {
        beforeEach(() => {
            jest.clearAllMocks();

            // Setup required components and event listeners
            app.orbitalMechanics = createMockOrbitalMechanics();
            app.setupEventListeners();
        });

        test('should log successful initialization', async () => {
            await app.init();

            expect(global.window.Helpers.log).toHaveBeenCalledWith(
                'Enhanced Solar System App initialized successfully',
                'debug'
            );
        });

        test('should log render loop start', () => {
            app.sceneManager = mockSceneManager;
            app.startRenderLoop();

            expect(global.window.Helpers.log).toHaveBeenCalledWith(
                'Enhanced render loop started with speed-based animation',
                'debug'
            );
        });

        test('should log speed changes', () => {
            const speedEvent = new CustomEvent('speedChanged', { detail: { speed: 2.0 } });
            // Manually trigger the event handler
            if (global.document._eventListeners && global.document._eventListeners['speedChanged']) {
                global.document._eventListeners['speedChanged'].forEach(handler => {
                    handler(speedEvent);
                });
            }

            expect(global.window.Helpers.log).toHaveBeenCalledWith(
                'Animation speed updated to: 2',
                'debug'
            );
        });

        test('should log disposal', () => {
            app.dispose();

            expect(global.window.Helpers.log).toHaveBeenCalledWith(
                'Enhanced Solar System App disposed',
                'debug'
            );
        });
    });
});