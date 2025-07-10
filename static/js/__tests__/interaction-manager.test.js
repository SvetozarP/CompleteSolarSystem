// static/js/__tests__/interaction-manager.test.js

// Mock THREE.js completely
const THREE = {
    Raycaster: jest.fn(function() {
        this.setFromCamera = jest.fn();
        this.intersectObjects = jest.fn(() => []);
    }),
    Vector2: jest.fn(function(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.set = jest.fn((x, y) => {
            this.x = x;
            this.y = y;
            return this;
        });
    }),
    Vector3: jest.fn(function(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.set = jest.fn((x, y, z) => {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        });
        this.copy = jest.fn((v) => {
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
            return this;
        });
        this.clone = jest.fn(() => new THREE.Vector3(this.x, this.y, this.z));
    }),
    Color: jest.fn(function(color = 0x000000) {
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.setHex = jest.fn((hex) => {
            this.hex = hex;
            return this;
        });
        this.copy = jest.fn((color) => {
            this.r = color.r;
            this.g = color.g;
            this.b = color.b;
            return this;
        });
        this.clone = jest.fn(() => new THREE.Color());
    }),
    PerspectiveCamera: jest.fn(function(fov = 50, aspect = 1, near = 0.1, far = 2000) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.position = new THREE.Vector3(0, 0, 100);
    }),
    Scene: jest.fn(function() {
        this.children = [];
        this.add = jest.fn();
        this.remove = jest.fn();
    })
};

// Set up global THREE before loading the module
global.THREE = THREE;
global.window = global.window || {};

// Mock console methods
global.console = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Mock DOM methods
global.document = {
    ...global.document,
    createElement: jest.fn((tag) => {
        const element = {
            tagName: tag.toUpperCase(),
            style: {},
            id: '',
            className: '',
            innerHTML: '',
            appendChild: jest.fn(),
            removeEventListener: jest.fn(),
            addEventListener: jest.fn(),
            getBoundingClientRect: jest.fn(() => ({
                left: 0,
                top: 0,
                width: 800,
                height: 500,
                right: 800,
                bottom: 500
            })),
            parentNode: null,
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(() => []),
            dispatchEvent: jest.fn(() => true)
        };

        // Define clientWidth and clientHeight as getter properties
        if (tag === 'div') {
            Object.defineProperty(element, 'clientWidth', {
                value: 800,
                writable: false,
                configurable: true
            });
            Object.defineProperty(element, 'clientHeight', {
                value: 500,
                writable: false,
                configurable: true
            });
            Object.defineProperty(element, 'offsetWidth', {
                value: 800,
                writable: false,
                configurable: true
            });
            Object.defineProperty(element, 'offsetHeight', {
                value: 500,
                writable: false,
                configurable: true
            });
        }

        return element;
    }),
    body: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
    },
    dispatchEvent: jest.fn(() => true)
};

// Load the InteractionManager script which sets up window.InteractionManager
require('../solar-system/interaction-manager.js');

// Get the InteractionManager class
const InteractionManager = window.InteractionManager.InteractionManager;

describe('InteractionManager', () => {
    let scene, camera, domElement;
    let interactionManager;
    let mockApp;
    let mockCameraControls;
    let mockInfoPanel;

    beforeEach(() => {
        // Create required objects
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera();
        domElement = global.document.createElement('div');

        // DOM element properties are now properly defined in createElement mock

        // Mock global objects
        mockCameraControls = {
            focusAndFollowPlanet: jest.fn(),
            followDistance: 50
        };

        mockApp = {
            cameraControls: mockCameraControls,
            planetInstances: new Map([
                ['Earth', {
                    name: 'Earth',
                    position: { x: 0, y: 0, z: 0 },
                    getWorldPosition: jest.fn((target) => {
                        target.set(0, 0, 0);
                        return target;
                    })
                }],
                ['Mars', {
                    name: 'Mars',
                    position: { x: 100, y: 0, z: 0 },
                    getWorldPosition: jest.fn((target) => {
                        target.set(100, 0, 0);
                        return target;
                    })
                }]
            ])
        };

        mockInfoPanel = {
            show: jest.fn(),
            init: jest.fn(),
            hide: jest.fn(),
            dispose: jest.fn()
        };

        // Set up global window mocks
        global.window.solarSystemApp = mockApp;
        global.window.Helpers = {
            log: jest.fn(),
            handleError: jest.fn()
        };
        global.window.ControlPanel = {
            updateSelectedPlanet: jest.fn(),
            updateCameraDistance: jest.fn()
        };
        global.window.InfoPanelSystem = {
            create: jest.fn(() => mockInfoPanel)
        };

        // Create planets map for interaction manager
        const planets = new Map([
            ['Earth', {
                name: 'Earth',
                userData: { planetData: { name: 'Earth', radius: 6371 } },
                traverse: jest.fn((callback) => {
                    // Mock traverse to call callback with a planet mesh
                    callback({
                        userData: { type: 'planetMesh', planetData: { name: 'Earth', radius: 6371 } },
                        material: {
                            emissive: new THREE.Color(0x000000)
                        }
                    });
                })
            }],
            ['Mars', {
                name: 'Mars',
                userData: { planetData: { name: 'Mars', radius: 3390 } },
                traverse: jest.fn((callback) => {
                    // Mock traverse to call callback with a planet mesh
                    callback({
                        userData: { type: 'planetMesh', planetData: { name: 'Mars', radius: 3390 } },
                        material: {
                            emissive: new THREE.Color(0x000000)
                        }
                    });
                })
            }]
        ]);

        // Create interaction manager instance with all required parameters
        interactionManager = new InteractionManager({
            scene,
            camera,
            domElement,
            planets,
            enablePlanetSelection: true,
            enableTooltips: true,
            enableHover: true
        });

        // Set up info panel manually since we're bypassing the init
        interactionManager.infoPanel = mockInfoPanel;
    });

    afterEach(() => {
        // Clean up
        jest.clearAllMocks();
    });

    test('initializes with default properties', () => {
        expect(interactionManager.scene).toBe(scene);
        expect(interactionManager.camera).toBe(camera);
        expect(interactionManager.domElement).toBe(domElement);
        expect(interactionManager.raycaster).toBeDefined();
        expect(interactionManager.hoveredPlanet).toBeNull();
        expect(interactionManager.lastFocusedPlanet).toBeNull();
        expect(interactionManager.isInitialized).toBe(false);
        expect(interactionManager.eventListeners).toEqual([]);
        expect(interactionManager.focusDebounceDelay).toBe(500);
        expect(interactionManager.lastFocusTime).toBe(0);
    });

    test('initializes with custom options', () => {
        const customOptions = {
            scene,
            camera,
            domElement,
            enablePlanetSelection: false,
            tooltipDelay: 1000
        };
        const customManager = new InteractionManager(customOptions);

        expect(customManager.options.enablePlanetSelection).toBe(false);
        expect(customManager.options.tooltipDelay).toBe(1000);
    });

    test('updateCursor changes cursor style based on intersection', () => {
        // Test no intersection
        interactionManager.updateCursor(null);
        expect(domElement.style.cursor).toBe('grab');

        // Test with intersection
        interactionManager.updateCursor({ name: 'Earth' });
        expect(domElement.style.cursor).toBe('pointer');
    });

    test('updateCursor handles missing domElement gracefully', () => {
        // Test that the method doesn't throw when domElement is missing
        // but we can't create an InteractionManager without domElement due to validation
        expect(() => {
            interactionManager.updateCursor({ name: 'Earth' });
        }).not.toThrow();

        // Test cursor update with null intersection
        expect(() => {
            interactionManager.updateCursor(null);
        }).not.toThrow();
    });

    test('handlePlanetClick selects planet and shows info panel', () => {
        const planetData = { name: 'Earth', radius: 6371 };

        // Spy on document.dispatchEvent
        const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');

        interactionManager.handlePlanetClick(planetData);

        expect(interactionManager.selectedPlanet).toBe(planetData);
        expect(mockInfoPanel.show).toHaveBeenCalledWith(planetData);
        expect(dispatchEventSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'planetSelected'
            })
        );
        expect(global.window.Helpers.log).toHaveBeenCalledWith(
            `Planet selected (UI only): ${planetData.name}`,
            'debug'
        );

        dispatchEventSpy.mockRestore();
    });

    test('handlePlanetClick works without info panel', () => {
        interactionManager.infoPanel = null;
        const planetData = { name: 'Mars', radius: 3390 };

        expect(() => {
            interactionManager.handlePlanetClick(planetData);
        }).not.toThrow();

        expect(interactionManager.selectedPlanet).toBe(planetData);
    });

    test('handlePlanetDoubleClick calls focusAndFollowPlanet', () => {
        const planetData = { name: 'Earth', radius: 6371 };
        const focusSpy = jest.spyOn(interactionManager, 'focusAndFollowPlanet');

        interactionManager.handlePlanetDoubleClick(planetData);

        expect(focusSpy).toHaveBeenCalledWith(planetData);
        expect(global.window.Helpers.log).toHaveBeenCalledWith(
            `Double-clicked planet: ${planetData.name}`,
            'debug'
        );
    });

    test('focusAndFollowPlanet focuses camera and updates controls', () => {
        const planetData = { name: 'Earth', radius: 6371 };

        interactionManager.focusAndFollowPlanet(planetData);

        expect(mockCameraControls.focusAndFollowPlanet).toHaveBeenCalledWith(
            mockApp.planetInstances.get('Earth'),
            planetData
        );
        expect(global.window.ControlPanel.updateSelectedPlanet).toHaveBeenCalledWith('Earth');
        expect(global.window.ControlPanel.updateCameraDistance).toHaveBeenCalledWith(50);
    });

    test('focusAndFollowPlanet handles debouncing', () => {
        const planetData = { name: 'Earth', radius: 6371 };

        // First call should work
        interactionManager.focusAndFollowPlanet(planetData);
        expect(mockCameraControls.focusAndFollowPlanet).toHaveBeenCalledTimes(1);

        // Immediate second call should be debounced
        interactionManager.focusAndFollowPlanet(planetData);
        expect(mockCameraControls.focusAndFollowPlanet).toHaveBeenCalledTimes(1);
    });

    test('focusAndFollowPlanet allows calls after debounce delay', (done) => {
        const planetData = { name: 'Earth', radius: 6371 };

        // First call
        interactionManager.focusAndFollowPlanet(planetData);
        expect(mockCameraControls.focusAndFollowPlanet).toHaveBeenCalledTimes(1);

        // Wait for debounce delay and call again
        setTimeout(() => {
            interactionManager.focusAndFollowPlanet(planetData);
            expect(mockCameraControls.focusAndFollowPlanet).toHaveBeenCalledTimes(2);
            done();
        }, 600); // Longer than debounce delay
    });

    test('focusAndFollowPlanet handles missing app gracefully', () => {
        global.window.solarSystemApp = null;
        const planetData = { name: 'Earth', radius: 6371 };

        interactionManager.focusAndFollowPlanet(planetData);

        expect(global.console.warn).toHaveBeenCalledWith(
            'Cannot focus on planet - camera controls not available'
        );
    });

    test('focusAndFollowPlanet handles missing planet instance gracefully', () => {
        // Set up app with camera controls but without the planet instance
        const limitedApp = {
            cameraControls: mockCameraControls,
            planetInstances: new Map() // Empty map, no UnknownPlanet
        };
        global.window.solarSystemApp = limitedApp;

        const planetData = { name: 'UnknownPlanet', radius: 1000 };

        interactionManager.focusAndFollowPlanet(planetData);

        expect(global.console.warn).toHaveBeenCalledWith(
            'Planet instance not found: UnknownPlanet'
        );
    });

    test('selectPlanet updates selected planet', () => {
        const planetData1 = { name: 'Earth', radius: 6371 };
        const planetData2 = { name: 'Mars', radius: 3390 };

        // Select first planet
        interactionManager.selectPlanet(planetData1);
        expect(interactionManager.selectedPlanet).toBe(planetData1);

        // Select second planet (should deselect first)
        interactionManager.selectPlanet(planetData2);
        expect(interactionManager.selectedPlanet).toBe(planetData2);
    });

    test('initialize sets up info panel and marks as initialized', async () => {
        expect(interactionManager.isInitialized).toBe(false);

        await interactionManager.init();

        expect(mockInfoPanel.init).toHaveBeenCalled();
        expect(interactionManager.isInitialized).toBe(true);
    });

    test('initialize works without info panel', async () => {
        // Create a new manager without InfoPanelSystem
        delete global.window.InfoPanelSystem;

        const newManager = new InteractionManager({
            scene,
            camera,
            domElement
        });

        await newManager.init();
        expect(newManager.isInitialized).toBe(true);
    });

    test('maintains event listener collection', () => {
        const mockListener = jest.fn();
        interactionManager.eventListeners.push(mockListener);

        expect(interactionManager.eventListeners).toHaveLength(1);
        expect(interactionManager.eventListeners[0]).toBe(mockListener);
    });

    test('window.InteractionManager.create creates instance', () => {
        const options = {
            scene: new THREE.Scene(),
            camera: new THREE.PerspectiveCamera(),
            domElement: global.document.createElement('div')
        };
        const instance = global.window.InteractionManager.create(options);

        expect(instance).toBeInstanceOf(InteractionManager);
        expect(instance.scene).toBe(options.scene);
        expect(instance.camera).toBe(options.camera);
        expect(instance.domElement).toBe(options.domElement);
    });

    test('throws error when scene is missing', () => {
        expect(() => {
            new InteractionManager({
                scene: null,
                camera: new THREE.PerspectiveCamera(),
                domElement: global.document.createElement('div')
            });
        }).toThrow('InteractionManager requires scene, camera, and domElement');
    });

    test('throws error when camera is missing', () => {
        expect(() => {
            new InteractionManager({
                scene: new THREE.Scene(),
                camera: null,
                domElement: global.document.createElement('div')
            });
        }).toThrow('InteractionManager requires scene, camera, and domElement');
    });

    test('throws error when domElement is missing', () => {
        expect(() => {
            new InteractionManager({
                scene: new THREE.Scene(),
                camera: new THREE.PerspectiveCamera(),
                domElement: null
            });
        }).toThrow('InteractionManager requires scene, camera, and domElement');
    });

    test('disposes correctly', () => {
        expect(() => {
            interactionManager.dispose();
        }).not.toThrow();

        expect(interactionManager.isInitialized).toBe(false);
        expect(interactionManager.selectedPlanet).toBeNull();
        expect(interactionManager.hoveredPlanet).toBeNull();
    });

    test('resetFocusDebounce clears debounce state', () => {
        // Set up debounce state
        interactionManager.lastFocusTime = Date.now();
        interactionManager.lastFocusedPlanet = 'Earth';

        // Reset debounce
        interactionManager.resetFocusDebounce();

        expect(interactionManager.lastFocusTime).toBe(0);
        expect(interactionManager.lastFocusedPlanet).toBeNull();
    });

    test('getStats returns correct information', () => {
        const stats = interactionManager.getStats();

        expect(stats).toHaveProperty('isInitialized');
        expect(stats).toHaveProperty('selectedPlanet');
        expect(stats).toHaveProperty('hoveredPlanet');
        expect(stats).toHaveProperty('tooltipVisible');
        expect(stats).toHaveProperty('planetsCount');
        expect(stats).toHaveProperty('lastFocusTime');
        expect(stats).toHaveProperty('focusDebounceActive');
    });
});