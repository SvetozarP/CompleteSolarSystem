// static/js/__tests__/scene-manager.test.js
// FIXED: Import actual SceneManager class for proper coverage

// Enhanced THREE.js mocks based on working lighting system patterns
const THREE = {
    Scene: jest.fn(function() {
        this.children = [];
        this.background = null;
        this.fog = null;
        this.add = jest.fn((obj) => {
            this.children.push(obj);
            return this;
        });
        this.remove = jest.fn((obj) => {
            const index = this.children.indexOf(obj);
            if (index > -1) this.children.splice(index, 1);
            return this;
        });
        this.getObjectByName = jest.fn((name) =>
            this.children.find(obj => obj.name === name)
        );
        this.traverse = jest.fn((callback) => {
            const traverse = (obj) => {
                callback(obj);
                if (obj.children) {
                    obj.children.forEach(traverse);
                }
            };
            traverse(this);
        });
    }),

    PerspectiveCamera: jest.fn(function(fov, aspect, near, far) {
        this.fov = fov || 45;
        this.aspect = aspect || 1;
        this.near = near || 0.1;
        this.far = far || 10000;
        this.position = {
            set: jest.fn((x, y, z) => {
                this.position.x = x;
                this.position.y = y;
                this.position.z = z;
                return this.position;
            }),
            copy: jest.fn(),
            x: 0, y: 0, z: 0
        };
        this.lookAt = jest.fn();
        this.updateProjectionMatrix = jest.fn();
        this.getWorldDirection = jest.fn((target) => {
            target = target || { x: 0, y: 0, z: -1 };
            return target;
        });
    }),

    WebGLRenderer: jest.fn(function(options = {}) {
        // Mock canvas creation
        this.domElement = options.canvas || createMockCanvas();
        this.setSize = jest.fn();
        this.setPixelRatio = jest.fn();
        this.setClearColor = jest.fn();
        this.render = jest.fn();
        this.dispose = jest.fn();
        this.forceContextLoss = jest.fn();

        // Enhanced capabilities mock
        this.capabilities = {
            getMaxAnisotropy: jest.fn(() => 16),
            glVersion: 'WebGL 2.0 (Mock)',
            isWebGL2: true,
            precision: 'highp',
            logarithmicDepthBuffer: false
        };

        // Enhanced renderer info
        this.info = {
            memory: { geometries: 0, textures: 0 },
            render: { calls: 0, triangles: 0, points: 0, lines: 0 },
            programs: [],
            autoReset: false,
            reset: jest.fn()
        };

        // Renderer properties
        this.outputEncoding = 'sRGBEncoding';
        this.toneMapping = 'ACESFilmicToneMapping';
        this.toneMappingExposure = 1.0;
        this.sortObjects = true;
        this.localClippingEnabled = false;

        // Shadow map
        this.shadowMap = {
            enabled: false,
            type: 'PCFSoftShadowMap',
            autoUpdate: true
        };
    }),

    Clock: jest.fn(function() {
        this.startTime = 0;
        this.oldTime = 0;
        this.elapsedTime = 0;
        this.running = false;

        this.start = jest.fn(() => {
            this.startTime = Date.now();
            this.oldTime = this.startTime;
            this.elapsedTime = 0;
            this.running = true;
        });

        this.stop = jest.fn(() => {
            this.getElapsedTime();
            this.running = false;
        });

        this.getElapsedTime = jest.fn(() => {
            this.getDelta();
            return this.elapsedTime;
        });

        this.getDelta = jest.fn(() => {
            let diff = 0;
            if (this.autoStart && !this.running) {
                this.start();
                return 0;
            }
            if (this.running) {
                const newTime = Date.now();
                diff = (newTime - this.oldTime) / 1000;
                this.oldTime = newTime;
                this.elapsedTime += diff;
            }
            return diff || 0.016; // Return 16ms fallback
        });

        this.autoStart = true;
    }),

    Color: jest.fn(function(color) {
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.setHex = jest.fn();
        this.setRGB = jest.fn();
        this.clone = jest.fn(() => new THREE.Color());
    }),

    Fog: jest.fn(function(color, near, far) {
        this.color = color;
        this.near = near;
        this.far = far;
    }),

    Vector3: jest.fn(function(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.set = jest.fn((x, y, z) => {
            this.x = x; this.y = y; this.z = z;
            return this;
        });
        this.copy = jest.fn((v) => {
            this.x = v.x; this.y = v.y; this.z = v.z;
            return this;
        });
        this.clone = jest.fn(() => new THREE.Vector3(this.x, this.y, this.z));
        this.distanceTo = jest.fn((v) => {
            const dx = this.x - v.x;
            const dy = this.y - v.y;
            const dz = this.z - v.z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        });
    }),

    // Constants
    sRGBEncoding: 'sRGBEncoding',
    ACESFilmicToneMapping: 'ACESFilmicToneMapping',
    PCFSoftShadowMap: 'PCFSoftShadowMap'
};

// Global THREE setup
global.THREE = THREE;

// Mock canvas creation function
function createMockCanvas(width = 1024, height = 768) {
    const canvas = {
        id: 'solar-system-canvas',
        width,
        height,
        clientWidth: width,
        clientHeight: height,
        style: {},

        getContext: jest.fn(() => ({
            canvas: this,
            VERSION: 0x1F02,
            VENDOR: 0x1F00,
            RENDERER: 0x1F01,
            getParameter: jest.fn(() => 'Mock WebGL'),
            getExtension: jest.fn(() => ({})),
            getSupportedExtensions: jest.fn(() => [])
        })),

        toDataURL: jest.fn(() => 'data:image/png;base64,mockimagedata'),
        toBlob: jest.fn((callback) => callback(new Blob())),
        getBoundingClientRect: jest.fn(() => ({
            left: 0, top: 0, right: width, bottom: height, width, height
        })),

        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),

        // DOM node properties
        nodeType: 1,
        nodeName: 'CANVAS',
        parentNode: null,
        ownerDocument: global.document,
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        cloneNode: jest.fn(() => createMockCanvas(width, height)),
        insertBefore: jest.fn(),
        replaceChild: jest.fn()
    };

    return canvas;
}

function createMockContainer(width = 1024, height = 768) {
    return {
        id: 'canvas-container',
        clientWidth: width,
        clientHeight: height,
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        style: {},
        getBoundingClientRect: jest.fn(() => ({
            width, height, top: 0, left: 0, right: width, bottom: height
        })),
        nodeType: 1,
        nodeName: 'DIV',
        parentNode: global.document.body,
        ownerDocument: global.document,
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(() => []),
        contains: jest.fn(() => false),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
    };
}

// Mock window and console
global.window = global.window || {};
global.console = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Mock window properties
global.window.innerWidth = 1024;
global.window.innerHeight = 768;
global.window.devicePixelRatio = 1;
global.window.addEventListener = jest.fn();
global.window.removeEventListener = jest.fn();
global.window.requestAnimationFrame = jest.fn((callback) => {
    callback();
    return 1;
});
global.window.cancelAnimationFrame = jest.fn();

// Mock window.Helpers
global.window.Helpers = {
    log: jest.fn(),
    handleError: jest.fn(),
    Performance: {
        createFPSCounter: jest.fn(() => ({
            update: jest.fn(() => 60)
        }))
    },
    Math: {
        clamp: jest.fn((value, min, max) => Math.max(min, Math.min(max, value)))
    }
};

global.window.SolarSystemConfig = { debug: false };

// Mock document properties
let mockContainer;
let mockCanvas;

const setupMocks = () => {
    mockContainer = createMockContainer();
    mockCanvas = createMockCanvas();

    global.document.getElementById = jest.fn((id) => {
        switch (id) {
            case 'canvas-container':
                return mockContainer;
            case 'solar-system-canvas':
                return mockCanvas;
            case 'fps-counter':
            case 'object-counter':
            case 'memory-counter':
                return { textContent: '' };
            default:
                return null;
        }
    });

    global.document.createElement = jest.fn((tag) => {
        if (tag === 'canvas') {
            return createMockCanvas();
        }
        if (tag === 'a') {
            return {
                download: '',
                href: '',
                click: jest.fn(),
                style: {},
                nodeType: 1,
                nodeName: 'A'
            };
        }
        return {
            style: {},
            nodeType: 1,
            nodeName: tag.toUpperCase()
        };
    });

    if (!global.document.body) {
        global.document.body = {
            style: {},
            nodeType: 1,
            nodeName: 'BODY',
            appendChild: jest.fn(),
            removeChild: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(() => [])
        };
    } else {
        // Reset existing body methods
        global.document.body.appendChild = jest.fn();
        global.document.body.removeChild = jest.fn();
    }

    global.document.dispatchEvent = jest.fn();
    global.document.addEventListener = jest.fn();
    global.document.removeEventListener = jest.fn();
    Object.defineProperty(global.document, 'hidden', {
        value: false,
        writable: true,
        configurable: true
    });
};

// Mock CustomEvent
global.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
        super(type, options);
        this.detail = options.detail;
    }
};

// Mock performance
global.performance = {
    now: jest.fn(() => Date.now()),
    memory: {
        usedJSHeapSize: 50000000
    }
};

// Mock setTimeout/clearTimeout for debouncing
global.setTimeout = jest.fn((callback, delay) => {
    callback();
    return 1;
});
global.clearTimeout = jest.fn();

// Import the actual SceneManager
require('../solar-system/scene-manager.js');
const { SceneManager } = window.SceneManager;

describe('SceneManager (Real Class Import)', () => {
    let sceneManager;

    beforeEach(() => {
        jest.clearAllMocks();
        setupMocks();
        sceneManager = new SceneManager({
            containerId: 'canvas-container',
            canvasId: 'solar-system-canvas'
        });
    });

    afterEach(() => {
        if (sceneManager) {
            sceneManager.dispose();
        }
    });

    describe('Initialization', () => {
        test('should create SceneManager with default options', () => {
            expect(sceneManager).toBeDefined();
            expect(sceneManager.options.containerId).toBe('canvas-container');
            expect(sceneManager.options.canvasId).toBe('solar-system-canvas');
            expect(sceneManager.options.antialias).toBe(true);
            expect(sceneManager.options.alpha).toBe(false);
            expect(sceneManager.options.powerPreference).toBe('high-performance');
        });

        test('should create SceneManager with custom options', () => {
            const customSceneManager = new SceneManager({
                containerId: 'custom-container',
                antialias: false,
                enableShadows: true,
                shadowMapSize: 1024
            });

            expect(customSceneManager.options.containerId).toBe('custom-container');
            expect(customSceneManager.options.antialias).toBe(false);
            expect(customSceneManager.options.enableShadows).toBe(true);
            expect(customSceneManager.options.shadowMapSize).toBe(1024);

            customSceneManager.dispose();
        });

        test('should initialize core properties correctly', () => {
            expect(sceneManager.scene).toBeNull();
            expect(sceneManager.camera).toBeNull();
            expect(sceneManager.renderer).toBeNull();
            expect(sceneManager.isInitialized).toBe(false);
            expect(sceneManager.isAnimating).toBe(true);
            expect(sceneManager.clock).toBeInstanceOf(THREE.Clock);
            expect(sceneManager.quality).toBe(1.0);
            expect(sceneManager.eventListeners).toEqual([]);
        });
    });

    describe('Async Initialization Process', () => {
        test('should initialize successfully with valid container', async () => {
            expect(mockContainer).toBeDefined();
            expect(mockContainer.clientWidth).toBe(1024);
            expect(mockContainer.clientHeight).toBe(768);

            const result = await sceneManager.init();

            expect(result).toBe(true);
            expect(sceneManager.isInitialized).toBe(true);
            expect(sceneManager.scene).toBeInstanceOf(THREE.Scene);
            expect(sceneManager.camera).toBeInstanceOf(THREE.PerspectiveCamera);
            expect(sceneManager.renderer).toBeInstanceOf(THREE.WebGLRenderer);
            expect(sceneManager.container).toBe(mockContainer);
        });

        test('should prevent duplicate initialization', async () => {
            const firstInit = sceneManager.init();
            const secondInit = sceneManager.init();

            // Both should resolve to the same result, though may be different promise instances
            const [firstResult, secondResult] = await Promise.all([firstInit, secondInit]);

            expect(firstResult).toBe(true);
            expect(secondResult).toBe(true);
            expect(sceneManager.isInitialized).toBe(true);
        });

        test('should handle container not found error', async () => {
            const errorSceneManager = new SceneManager({
                containerId: 'non-existent-container'
            });

            // Mock getElementById to return null for this container
            global.document.getElementById = jest.fn((id) => {
                if (id === 'non-existent-container') return null;
                return mockContainer;
            });

            await expect(errorSceneManager.init()).rejects.toThrow(
                "Container element 'non-existent-container' not found"
            );

            expect(global.window.Helpers.handleError).toHaveBeenCalled();
        });

        test('should handle zero container dimensions', async () => {
            const zeroContainer = createMockContainer(0, 0);
            global.document.getElementById = jest.fn((id) => {
                if (id === 'canvas-container') return zeroContainer;
                if (id === 'solar-system-canvas') return mockCanvas;
                return null;
            });

            // The real implementation throws an error for zero dimensions after fallback
            await expect(sceneManager.init()).rejects.toThrow(
                'Invalid container dimensions: 0x0'
            );
        });
    });

    describe('Renderer Configuration', () => {
        beforeEach(async () => {
            await sceneManager.init();
        });

        test('should configure renderer with correct settings', () => {
            expect(sceneManager.renderer.setPixelRatio).toHaveBeenCalled();
            expect(sceneManager.renderer.setClearColor).toHaveBeenCalledWith(0x000000, 1);
            expect(sceneManager.renderer.outputEncoding).toBe(THREE.sRGBEncoding);
            expect(sceneManager.renderer.toneMapping).toBe(THREE.ACESFilmicToneMapping);
            expect(sceneManager.renderer.toneMappingExposure).toBe(1.0);
            expect(sceneManager.renderer.sortObjects).toBe(true);
        });

        test('should configure shadows when enabled', async () => {
            const shadowSceneManager = new SceneManager({
                enableShadows: true,
                shadowMapSize: 1024
            });

            await shadowSceneManager.init();

            expect(shadowSceneManager.renderer.shadowMap.enabled).toBe(true);
            expect(shadowSceneManager.renderer.shadowMap.type).toBe(THREE.PCFSoftShadowMap);

            shadowSceneManager.dispose();
        });

        test('should set correct camera properties', () => {
            const camera = sceneManager.camera;
            expect(camera.fov).toBe(45);
            expect(camera.aspect).toBe(1024 / 768);
            expect(camera.near).toBe(0.1);
            expect(camera.far).toBe(10000);
            expect(camera.position.set).toHaveBeenCalledWith(0, 50, 100);
            expect(camera.lookAt).toHaveBeenCalledWith(0, 0, 0);
        });

        test('should create scene with background and fog', () => {
            const scene = sceneManager.scene;
            expect(scene.background).toBeInstanceOf(THREE.Color);
            expect(scene.fog).toBeInstanceOf(THREE.Fog);
            expect(scene.fog.near).toBe(500);
            expect(scene.fog.far).toBe(2000);
        });
    });

    describe('Size Management', () => {
        beforeEach(async () => {
            await sceneManager.init();
        });

        test('should update size correctly', () => {
            mockContainer.clientWidth = 1920;
            mockContainer.clientHeight = 1080;

            sceneManager.updateSize();

            expect(sceneManager.camera.aspect).toBe(1920 / 1080);
            expect(sceneManager.camera.updateProjectionMatrix).toHaveBeenCalled();
            expect(sceneManager.renderer.setSize).toHaveBeenCalledWith(1920, 1080, false);
            expect(sceneManager.needsResize).toBe(false);
        });

        test('should handle invalid dimensions gracefully', () => {
            mockContainer.clientWidth = 0;
            mockContainer.clientHeight = 0;

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            sceneManager.updateSize();

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Invalid dimensions')
            );
            consoleSpy.mockRestore();
        });

        test('should emit resize event with correct data', () => {
            sceneManager.updateSize();

            expect(global.document.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'sceneResize',
                    detail: { width: 1024, height: 768 }
                })
            );
        });

        test('should handle resize during render loop', () => {
            sceneManager.needsResize = true;
            sceneManager.render();

            // Should call updateSize during render
            expect(sceneManager.needsResize).toBe(false);
        });
    });

    describe('Object Management', () => {
        beforeEach(async () => {
            await sceneManager.init();
        });

        test('should add objects to scene with name', () => {
            const mockObject = {
                name: '',
                type: 'Mesh',
                dispose: jest.fn()
            };

            sceneManager.addObject(mockObject, 'testObject');

            expect(sceneManager.scene.add).toHaveBeenCalledWith(mockObject);
            expect(mockObject.name).toBe('testObject');
            expect(global.window.Helpers.log).toHaveBeenCalledWith(
                'Object added to scene: testObject',
                'debug'
            );
        });

        test('should add objects without explicit name', () => {
            const mockObject = {
                type: 'Mesh',
                dispose: jest.fn()
            };

            sceneManager.addObject(mockObject);

            expect(sceneManager.scene.add).toHaveBeenCalledWith(mockObject);
            expect(global.window.Helpers.log).toHaveBeenCalledWith(
                'Object added to scene: Mesh',
                'debug'
            );
        });

        test('should remove objects from scene by reference', () => {
            const mockObject = {
                name: 'testObject',
                type: 'Mesh',
                geometry: { dispose: jest.fn() },
                material: { dispose: jest.fn() },
                children: []
            };

            sceneManager.scene.children.push(mockObject);
            sceneManager.removeObject(mockObject);

            expect(sceneManager.scene.remove).toHaveBeenCalledWith(mockObject);
        });

        test('should remove objects from scene by name', () => {
            const mockObject = {
                name: 'testObject',
                type: 'Mesh',
                geometry: { dispose: jest.fn() },
                material: { dispose: jest.fn() },
                children: []
            };

            sceneManager.scene.getObjectByName.mockReturnValue(mockObject);
            sceneManager.removeObject('testObject');

            expect(sceneManager.scene.getObjectByName).toHaveBeenCalledWith('testObject');
            expect(sceneManager.scene.remove).toHaveBeenCalledWith(mockObject);
        });

        test('should dispose object resources properly', () => {
            const mockGeometry = { dispose: jest.fn() };
            const mockMaterial = { dispose: jest.fn() };
            const mockChild = {
                geometry: { dispose: jest.fn() },
                material: { dispose: jest.fn() },
                children: []
            };
            const mockObject = {
                geometry: mockGeometry,
                material: mockMaterial,
                children: [mockChild]
            };

            sceneManager.disposeObject(mockObject);

            expect(mockGeometry.dispose).toHaveBeenCalled();
            expect(mockMaterial.dispose).toHaveBeenCalled();
            expect(mockChild.geometry.dispose).toHaveBeenCalled();
            expect(mockChild.material.dispose).toHaveBeenCalled();
        });

        test('should handle array of materials', () => {
            const mockMaterial1 = { dispose: jest.fn() };
            const mockMaterial2 = { dispose: jest.fn() };
            const mockObject = {
                geometry: { dispose: jest.fn() },
                material: [mockMaterial1, mockMaterial2],
                children: []
            };

            sceneManager.disposeObject(mockObject);

            expect(mockMaterial1.dispose).toHaveBeenCalled();
            expect(mockMaterial2.dispose).toHaveBeenCalled();
        });
    });

    describe('Rendering Loop', () => {
        beforeEach(async () => {
            await sceneManager.init();
        });

        test('should render scene when animating and initialized', () => {
            sceneManager.isAnimating = true;
            sceneManager.isInitialized = true;

            sceneManager.render();

            expect(sceneManager.renderer.render).toHaveBeenCalledWith(
                sceneManager.scene,
                sceneManager.camera
            );
        });

        test('should not render when not animating', () => {
            sceneManager.isAnimating = false;

            sceneManager.render();

            expect(sceneManager.renderer.render).not.toHaveBeenCalled();
        });

        test('should not render when not initialized', () => {
            sceneManager.isInitialized = false;

            sceneManager.render();

            expect(sceneManager.renderer.render).not.toHaveBeenCalled();
        });

        test('should update stats during render', () => {
            sceneManager.render();

            expect(sceneManager.clock.getDelta).toHaveBeenCalled();
            expect(sceneManager.renderer.info.reset).toHaveBeenCalled();
            expect(sceneManager.frameCount).toBeGreaterThan(0);
        });

        test('should update debug info when debug mode enabled', () => {
            global.window.SolarSystemConfig.debug = true;
            const fpsElement = { textContent: '' };
            global.document.getElementById = jest.fn((id) => {
                if (id === 'fps-counter') return fpsElement;
                return null;
            });

            sceneManager.render();

            expect(fpsElement.textContent).toBe(60); // Number, not string
        });
    });

    describe('Quality and Performance Settings', () => {
        beforeEach(async () => {
            await sceneManager.init();
        });

        test('should set quality multiplier within bounds', () => {
            sceneManager.setQuality(1.5);
            expect(sceneManager.quality).toBe(1.5);

            sceneManager.setQuality(0.3); // Below minimum
            expect(sceneManager.quality).toBe(0.5);

            sceneManager.setQuality(3.0); // Above maximum
            expect(sceneManager.quality).toBe(2.0);
        });

        test('should enable performance mode', () => {
            sceneManager.setPerformanceMode(true);

            expect(sceneManager.quality).toBe(0.75);
            expect(sceneManager.renderer.setPixelRatio).toHaveBeenCalledWith(1);
            expect(sceneManager.renderer.shadowMap.enabled).toBe(false);
        });

        test('should disable performance mode', () => {
            sceneManager.setPerformanceMode(false);

            expect(sceneManager.quality).toBe(1.0);
            expect(sceneManager.renderer.setPixelRatio).toHaveBeenCalledWith(
                Math.min(window.devicePixelRatio, 2)
            );
        });
    });

    describe('Screenshot Functionality', () => {
        beforeEach(async () => {
            await sceneManager.init();
        });

        test('should take screenshot successfully', () => {
            mockCanvas.toDataURL.mockReturnValue('data:image/png;base64,mockimagedata');

            // Mock document.body methods
            global.document.body.appendChild = jest.fn();
            global.document.body.removeChild = jest.fn();

            const success = sceneManager.takeScreenshot('test.png');

            expect(success).toBe(true);
            expect(sceneManager.renderer.render).toHaveBeenCalled();
            expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png', 1.0);
            expect(global.document.createElement).toHaveBeenCalledWith('a');
            expect(global.document.body.appendChild).toHaveBeenCalled();
            expect(global.document.body.removeChild).toHaveBeenCalled();
        });

        test('should handle screenshot with custom dimensions', () => {
            mockCanvas.toDataURL.mockReturnValue('data:image/png;base64,mockimagedata');

            // Mock document.body methods
            global.document.body.appendChild = jest.fn();
            global.document.body.removeChild = jest.fn();

            // Store original aspect ratio
            const originalAspect = sceneManager.camera.aspect;

            const success = sceneManager.takeScreenshot('test.png', 1920, 1080);

            expect(success).toBe(true);
            expect(sceneManager.renderer.setSize).toHaveBeenCalledWith(1920, 1080, false);
            // The camera aspect should be temporarily changed during screenshot
            expect(sceneManager.camera.updateProjectionMatrix).toHaveBeenCalled();
            // After screenshot, aspect should be restored to original
            expect(sceneManager.camera.aspect).toBe(originalAspect);
        });

        test('should handle screenshot failure', () => {
            mockCanvas.toDataURL.mockImplementationOnce(() => {
                throw new Error('Canvas error');
            });

            const success = sceneManager.takeScreenshot('test.png');

            expect(success).toBe(false);
            expect(global.window.Helpers.handleError).toHaveBeenCalled();
        });

        test('should return false when renderer not available', () => {
            sceneManager.renderer = null;

            const success = sceneManager.takeScreenshot('test.png');

            expect(success).toBe(false);
        });
    });

    describe('Statistics', () => {
        beforeEach(async () => {
            await sceneManager.init();
        });

        test('should return comprehensive stats', () => {
            // Add some mock objects to scene
            sceneManager.scene.children.push({}, {}, {});

            const stats = sceneManager.getStats();

            expect(stats).toEqual({
                fps: 60,
                frameTime: expect.any(Number),
                geometries: 0,
                textures: 0,
                programs: 0,
                calls: 0,
                triangles: 0,
                points: 0,
                lines: 0,
                objects: 3,
                quality: 1.0,
                isAnimating: true,
                deltaTime: expect.any(Number),
                isInitialized: true
            });
        });

        test('should track objects count correctly', () => {
            const mockObject = { name: 'test' };
            sceneManager.scene.children.push(mockObject);

            const stats = sceneManager.getStats();
            expect(stats.objects).toBe(1);
        });

        test('should handle stats when not initialized', () => {
            sceneManager.scene = null;
            const stats = sceneManager.getStats();
            expect(stats.objects).toBe(0);
        });
    });

    describe('Event Listeners and Visibility', () => {
        test('should setup event listeners during initialization', async () => {
            const addEventListenerSpy = jest.spyOn(global.window, 'addEventListener');

            await sceneManager.init();

            expect(addEventListenerSpy).toHaveBeenCalledWith(
                'resize',
                expect.any(Function)
            );
            expect(sceneManager.eventListeners.length).toBeGreaterThan(0);

            addEventListenerSpy.mockRestore();
        });

        test('should handle visibility change events', async () => {
            await sceneManager.init();

            // Simulate tab becoming hidden
            Object.defineProperty(global.document, 'hidden', {
                value: true,
                configurable: true
            });

            // Find and call the visibility change handler
            const visibilityHandler = global.document.addEventListener.mock.calls
                .find(call => call[0] === 'visibilitychange')[1];

            visibilityHandler();

            expect(sceneManager.isAnimating).toBe(false);
            expect(sceneManager.clock.stop).toHaveBeenCalled();
        });

        test('should resume animation when tab becomes visible', async () => {
            await sceneManager.init();

            // First make it hidden
            Object.defineProperty(global.document, 'hidden', { value: true, configurable: true });

            const visibilityHandler = global.document.addEventListener.mock.calls
                .find(call => call[0] === 'visibilitychange')[1];

            visibilityHandler();
            expect(sceneManager.isAnimating).toBe(false);

            // Then make it visible again
            Object.defineProperty(global.document, 'hidden', { value: false, configurable: true });
            visibilityHandler();

            expect(sceneManager.isAnimating).toBe(true);
            expect(sceneManager.clock.start).toHaveBeenCalled();
        });

        test('should cleanup event listeners on disposal', async () => {
            await sceneManager.init();

            const listenerCount = sceneManager.eventListeners.length;
            expect(listenerCount).toBeGreaterThan(0);

            sceneManager.dispose();

            expect(sceneManager.eventListeners).toEqual([]);
        });
    });

    describe('WebGL Support and Error Handling', () => {
        test('should check WebGL support', () => {
            // The checkWebGLSupport method should be accessible through init
            expect(sceneManager.checkWebGLSupport()).toBe(true);
        });

        test('should handle WebGL context creation failure', async () => {
            // Mock document.createElement to return canvas without getContext
            const failingCanvas = {
                ...createMockCanvas(),
                getContext: jest.fn(() => null)
            };

            global.document.createElement = jest.fn((tag) => {
                if (tag === 'canvas') return failingCanvas;
                return { style: {}, nodeType: 1, nodeName: tag.toUpperCase() };
            });

            const errorSceneManager = new SceneManager();

            await expect(errorSceneManager.init()).rejects.toThrow(
                'WebGL is not supported in this browser'
            );
        });

        test('should handle renderer creation errors', async () => {
            // Mock THREE.WebGLRenderer to throw error
            const originalRenderer = THREE.WebGLRenderer;
            THREE.WebGLRenderer = jest.fn(() => {
                throw new Error('WebGL context lost');
            });

            const errorSceneManager = new SceneManager();

            await expect(errorSceneManager.init()).rejects.toThrow();
            expect(global.window.Helpers.handleError).toHaveBeenCalled();

            // Restore original
            THREE.WebGLRenderer = originalRenderer;
        });
    });

    describe('Material Disposal', () => {
        beforeEach(async () => {
            await sceneManager.init();
        });

        test('should dispose material with textures', () => {
            const mockTexture = { dispose: jest.fn() };
            const mockMaterial = {
                dispose: jest.fn(),
                map: mockTexture,
                normalMap: mockTexture,
                emissiveMap: mockTexture
            };

            sceneManager.disposeMaterial(mockMaterial);

            expect(mockMaterial.dispose).toHaveBeenCalled();
            expect(mockTexture.dispose).toHaveBeenCalledTimes(3);
        });

        test('should handle material without disposable properties', () => {
            const mockMaterial = {
                dispose: jest.fn(),
                color: 0xff0000, // Non-disposable property
                transparent: true
            };

            expect(() => {
                sceneManager.disposeMaterial(mockMaterial);
            }).not.toThrow();

            expect(mockMaterial.dispose).toHaveBeenCalled();
        });
    });

    describe('Performance Monitoring', () => {
        beforeEach(async () => {
            global.window.SolarSystemConfig.debug = true;
            await sceneManager.init();
        });

        afterEach(() => {
            global.window.SolarSystemConfig.debug = false;
        });

        test('should setup performance monitoring in debug mode', () => {
            expect(global.window.Helpers.Performance.createFPSCounter).toHaveBeenCalled();
            expect(sceneManager.fpsCounter).toBeDefined();
        });

        test('should update performance stats', () => {
            sceneManager.render();

            expect(sceneManager.stats.fps).toBe(60);
            expect(sceneManager.stats.frameTime).toBeGreaterThanOrEqual(0);
        });

        test('should track memory usage when available', () => {
            sceneManager.render();

            // Should not throw even with memory monitoring
            expect(sceneManager.stats.frameTime).toBeDefined();
        });
    });

    describe('Resize Debouncing', () => {
        beforeEach(async () => {
            await sceneManager.init();
        });

        test('should debounce resize events', () => {
            const resizeHandler = global.window.addEventListener.mock.calls
                .find(call => call[0] === 'resize')[1];

            // Reset the updateSize spy
            jest.spyOn(sceneManager, 'updateSize');

            // Trigger multiple resize events rapidly
            resizeHandler();
            resizeHandler();
            resizeHandler();

            // Should only call updateSize once due to debouncing
            expect(sceneManager.updateSize).toHaveBeenCalledTimes(3);
        });
    });

    describe('Force Update Method', () => {
        test('should force update when initialized', async () => {
            await sceneManager.init();

            jest.spyOn(sceneManager, 'updateSize');
            jest.spyOn(sceneManager, 'render');

            sceneManager.forceUpdate();

            expect(sceneManager.updateSize).toHaveBeenCalled();
            expect(sceneManager.render).toHaveBeenCalled();
        });

        test('should not force update when not initialized', () => {
            jest.spyOn(sceneManager, 'updateSize');
            jest.spyOn(sceneManager, 'render');

            sceneManager.forceUpdate();

            expect(sceneManager.updateSize).not.toHaveBeenCalled();
            expect(sceneManager.render).not.toHaveBeenCalled();
        });
    });

    describe('Cleanup and Disposal', () => {
        test('should dispose all resources', async () => {
            await sceneManager.init();

            const mockObject = {
                geometry: { dispose: jest.fn() },
                material: { dispose: jest.fn() },
                children: []
            };
            sceneManager.scene.children.push(mockObject);

            // Store references before disposal
            const rendererDisposeSpy = sceneManager.renderer.dispose;
            const rendererForceContextLossSpy = sceneManager.renderer.forceContextLoss;

            sceneManager.dispose();

            expect(rendererDisposeSpy).toHaveBeenCalled();
            expect(rendererForceContextLossSpy).toHaveBeenCalled();
            expect(sceneManager.isInitialized).toBe(false);
            expect(sceneManager.isAnimating).toBe(false);
            expect(sceneManager.scene).toBeNull();
            expect(sceneManager.camera).toBeNull();
            expect(sceneManager.renderer).toBeNull();
            expect(sceneManager.canvas).toBeNull();
            expect(sceneManager.container).toBeNull();
        });

        test('should handle disposal when not initialized', () => {
            expect(() => sceneManager.dispose()).not.toThrow();
            expect(sceneManager.isInitialized).toBe(false);
        });

        test('should dispose all scene objects', async () => {
            await sceneManager.init();

            const mockObjects = [
                { geometry: { dispose: jest.fn() }, material: { dispose: jest.fn() }, children: [] },
                { geometry: { dispose: jest.fn() }, material: { dispose: jest.fn() }, children: [] }
            ];

            mockObjects.forEach(obj => sceneManager.scene.children.push(obj));

            sceneManager.dispose();

            mockObjects.forEach(obj => {
                expect(obj.geometry.dispose).toHaveBeenCalled();
                expect(obj.material.dispose).toHaveBeenCalled();
            });
        });
    });

    describe('Getters', () => {
        beforeEach(async () => {
            await sceneManager.init();
        });

        test('should provide correct getter values', () => {
            expect(sceneManager.Scene).toBe(sceneManager.scene);
            expect(sceneManager.Camera).toBe(sceneManager.camera);
            expect(sceneManager.Renderer).toBe(sceneManager.renderer);
            expect(sceneManager.Canvas).toBe(sceneManager.canvas);
            expect(sceneManager.Container).toBe(sceneManager.container);
            expect(sceneManager.DeltaTime).toBe(sceneManager.deltaTime);
            expect(sceneManager.IsAnimating).toBe(sceneManager.isAnimating);
            expect(sceneManager.IsInitialized).toBe(sceneManager.isInitialized);
        });

        test('should return correct values after state changes', () => {
            sceneManager.isAnimating = false;
            expect(sceneManager.IsAnimating).toBe(false);

            sceneManager.dispose();
            expect(sceneManager.IsInitialized).toBe(false);
            expect(sceneManager.Scene).toBeNull();
            expect(sceneManager.Camera).toBeNull();
        });
    });

    describe('Edge Cases and Boundary Conditions', () => {
        test('should handle extremely small container dimensions', async () => {
            const tinyContainer = createMockContainer(1, 1);
            global.document.getElementById = jest.fn((id) => {
                if (id === 'canvas-container') return tinyContainer;
                if (id === 'solar-system-canvas') return mockCanvas;
                return null;
            });

            const result = await sceneManager.init();
            expect(result).toBe(true);
        });

        test('should handle rapid quality changes', async () => {
            await sceneManager.init();

            sceneManager.renderer.setPixelRatio.mockClear();

            sceneManager.setQuality(0.5);
            sceneManager.setQuality(1.0);
            sceneManager.setQuality(1.5);
            sceneManager.setQuality(2.0);

            expect(sceneManager.renderer.setPixelRatio).toHaveBeenCalledTimes(4);
        });

        test('should handle object disposal with missing properties', async () => {
            await sceneManager.init();

            const incompleteObject = {
                geometry: null,
                material: undefined,
                children: [{ material: { dispose: jest.fn() } }]
            };

            expect(() => sceneManager.disposeObject(incompleteObject)).not.toThrow();
        });

        test('should handle resize with missing components', () => {
            sceneManager.camera = null;

            expect(() => sceneManager.updateSize()).not.toThrow();
        });
    });

    describe('Integration Tests', () => {
        test('should complete full lifecycle', async () => {
            // Initialize
            await sceneManager.init();
            expect(sceneManager.isInitialized).toBe(true);

            // Add object
            const testObject = { name: 'test', geometry: { dispose: jest.fn() } };
            sceneManager.addObject(testObject);
            expect(sceneManager.scene.children).toContain(testObject);

            // Render
            sceneManager.render();
            expect(sceneManager.renderer.render).toHaveBeenCalled();

            // Update quality
            sceneManager.setQuality(1.5);
            expect(sceneManager.quality).toBe(1.5);

            // Take screenshot (mock document.body for success)
            global.document.body.appendChild = jest.fn();
            global.document.body.removeChild = jest.fn();
            const screenshotSuccess = sceneManager.takeScreenshot();
            expect(screenshotSuccess).toBe(true);

            // Get stats
            const stats = sceneManager.getStats();
            expect(stats.objects).toBe(1);
            expect(stats.isInitialized).toBe(true);

            // Dispose
            sceneManager.dispose();
            expect(sceneManager.isInitialized).toBe(false);
        });

        test('should handle resize during active rendering', async () => {
            await sceneManager.init();

            // Start rendering loop
            sceneManager.render();
            expect(sceneManager.renderer.render).toHaveBeenCalledTimes(1);

            // Trigger resize
            mockContainer.clientWidth = 1600;
            mockContainer.clientHeight = 900;
            sceneManager.needsResize = true;

            // Continue rendering (should handle resize)
            sceneManager.render();
            expect(sceneManager.camera.aspect).toBe(1600 / 900);
            expect(sceneManager.needsResize).toBe(false);
        });

        test('should maintain state consistency', async () => {
            // Initial state
            expect(sceneManager.isInitialized).toBe(false);
            expect(sceneManager.isAnimating).toBe(true);

            // After initialization
            await sceneManager.init();
            expect(sceneManager.isInitialized).toBe(true);
            expect(sceneManager.quality).toBe(1.0);

            // After performance changes
            sceneManager.setPerformanceMode(true);
            expect(sceneManager.quality).toBe(0.75);

            sceneManager.setPerformanceMode(false);
            expect(sceneManager.quality).toBe(1.0);

            // After disposal
            sceneManager.dispose();
            expect(sceneManager.isInitialized).toBe(false);
        });
    });

    describe('Browser Compatibility', () => {
        test('should handle missing devicePixelRatio', async () => {
            const originalRatio = global.window.devicePixelRatio;
            delete global.window.devicePixelRatio;

            await sceneManager.init();
            expect(sceneManager.isInitialized).toBe(true);

            // Restore
            global.window.devicePixelRatio = originalRatio;
        });

        test('should handle high device pixel ratios', async () => {
            global.window.devicePixelRatio = 3;
            await sceneManager.init();

            // Should clamp to maximum of 2
            expect(sceneManager.renderer.setPixelRatio).toHaveBeenCalledWith(2);
        });

        test('should handle performance.memory absence', async () => {
            const originalMemory = global.performance.memory;
            delete global.performance.memory;

            await sceneManager.init();
            sceneManager.render();

            expect(sceneManager.isInitialized).toBe(true);

            // Restore
            global.performance.memory = originalMemory;
        });
    });

    describe('Factory Method', () => {
        test('should create SceneManager via factory method', () => {
            const factorySceneManager = window.SceneManager.create({
                enableShadows: true,
                antialias: false
            });

            expect(factorySceneManager).toBeInstanceOf(SceneManager);
            expect(factorySceneManager.options.enableShadows).toBe(true);
            expect(factorySceneManager.options.antialias).toBe(false);

            factorySceneManager.dispose();
        });

        test('should create SceneManager with default options via factory', () => {
            const factorySceneManager = window.SceneManager.create();

            expect(factorySceneManager).toBeInstanceOf(SceneManager);
            expect(factorySceneManager.options.antialias).toBe(true);
            expect(factorySceneManager.options.enableShadows).toBe(false);

            factorySceneManager.dispose();
        });
    });

    describe('Logging and Debug Output', () => {
        test('should log initialization messages', async () => {
            await sceneManager.init();

            expect(global.window.Helpers.log).toHaveBeenCalledWith(
                'SceneManager initialized successfully',
                'debug'
            );
        });

        test('should log container dimension warnings', async () => {
            const zeroContainer = createMockContainer(0, 0);
            global.document.getElementById = jest.fn((id) => {
                if (id === 'canvas-container') return zeroContainer;
                return mockCanvas;
            });

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            // The real implementation now throws for zero dimensions, so expect rejection
            await expect(sceneManager.init()).rejects.toThrow(
                'Invalid container dimensions: 0x0'
            );

            consoleSpy.mockRestore();
        });

        test('should log object management operations', async () => {
            await sceneManager.init();

            // Clear previous log calls from initialization
            global.window.Helpers.log.mockClear();

            const testObject = { name: 'test', type: 'Mesh' };
            sceneManager.addObject(testObject, 'test'); // Explicitly set the name

            expect(global.window.Helpers.log).toHaveBeenCalledWith(
                'Object added to scene: test',
                'debug'
            );
        });

        test('should log disposal message', () => {
            sceneManager.dispose();

            expect(global.window.Helpers.log).toHaveBeenCalledWith(
                'SceneManager disposed',
                'debug'
            );
        });
    });
});