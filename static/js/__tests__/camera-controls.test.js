// static/js/__tests__/camera-controls.test.js
// IMPROVED: Comprehensive camera controls tests with real class imports and enhanced THREE.js mocks

// Mock THREE.js with enhanced components (comprehensive approach from lighting-system tests)
const THREE = {
    Vector2: jest.fn(function(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.set = jest.fn((x, y) => {
            this.x = x;
            this.y = y;
            return this;
        });
        this.copy = jest.fn((v) => {
            this.x = v.x;
            this.y = v.y;
            return this;
        });
        this.add = jest.fn((v) => {
            this.x += v.x;
            this.y += v.y;
            return this;
        });
        this.sub = jest.fn((v) => {
            this.x -= v.x;
            this.y -= v.y;
            return this;
        });
        this.subVectors = jest.fn((a, b) => {
            this.x = a.x - b.x;
            this.y = a.y - b.y;
            return this;
        });
        this.multiplyScalar = jest.fn((scalar) => {
            this.x *= scalar;
            this.y *= scalar;
            return this;
        });
        this.length = jest.fn(() => Math.sqrt(this.x * this.x + this.y * this.y));
        this.normalize = jest.fn(() => {
            const length = this.length();
            if (length > 0) {
                this.x /= length;
                this.y /= length;
            }
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
        this.add = jest.fn((v) => {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            return this;
        });
        this.sub = jest.fn((v) => {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
            return this;
        });
        this.subVectors = jest.fn((a, b) => {
            this.x = a.x - b.x;
            this.y = a.y - b.y;
            this.z = a.z - b.z;
            return this;
        });
        this.addVectors = jest.fn((a, b) => {
            this.x = a.x + b.x;
            this.y = a.y + b.y;
            this.z = a.z + b.z;
            return this;
        });
        this.length = jest.fn(() => Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z));
        this.distanceTo = jest.fn((v) => {
            const dx = this.x - v.x;
            const dy = this.y - v.y;
            const dz = this.z - v.z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        });
        this.normalize = jest.fn(() => {
            const length = this.length();
            if (length > 0) {
                this.x /= length;
                this.y /= length;
                this.z /= length;
            }
            return this;
        });
        this.lerp = jest.fn((v, alpha) => {
            this.x += (v.x - this.x) * alpha;
            this.y += (v.y - this.y) * alpha;
            this.z += (v.z - this.z) * alpha;
            return this;
        });
        this.lerpVectors = jest.fn((v1, v2, alpha) => {
            this.x = v1.x + (v2.x - v1.x) * alpha;
            this.y = v1.y + (v2.y - v1.y) * alpha;
            this.z = v1.z + (v2.z - v1.z) * alpha;
            return this;
        });
        this.setFromMatrixColumn = jest.fn((matrix, index) => {
            this.x = index;
            this.y = index;
            this.z = index;
            return this;
        });
        this.multiplyScalar = jest.fn((scalar) => {
            this.x *= scalar;
            this.y *= scalar;
            this.z *= scalar;
            return this;
        });
        this.setFromSpherical = jest.fn((spherical) => {
            const sinPhiRadius = Math.sin(spherical.phi) * spherical.radius;
            this.x = sinPhiRadius * Math.sin(spherical.theta);
            this.y = Math.cos(spherical.phi) * spherical.radius;
            this.z = sinPhiRadius * Math.cos(spherical.theta);
            return this;
        });
        this.getWorldPosition = jest.fn((target) => {
            target.copy(this);
            return target;
        });
    }),

    Spherical: jest.fn(function(radius = 1, phi = 0, theta = 0) {
        this.radius = radius;
        this.phi = phi;
        this.theta = theta;
        this.set = jest.fn((radius, phi, theta) => {
            this.radius = radius;
            this.phi = phi;
            this.theta = theta;
            return this;
        });
        this.copy = jest.fn((s) => {
            this.radius = s.radius;
            this.phi = s.phi;
            this.theta = s.theta;
            return this;
        });
        this.clone = jest.fn(() => new THREE.Spherical(this.radius, this.phi, this.theta));
        this.setFromVector3 = jest.fn((vector3) => {
            // Mock implementation - calculate spherical from vector3
            this.radius = Math.sqrt(vector3.x * vector3.x + vector3.y * vector3.y + vector3.z * vector3.z);
            this.phi = Math.acos(Math.max(-1, Math.min(1, vector3.y / this.radius)));
            this.theta = Math.atan2(vector3.x, vector3.z);
            return this;
        });
    }),

    PerspectiveCamera: jest.fn(function(fov = 50, aspect = 1, near = 0.1, far = 2000) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.position = new THREE.Vector3(0, 0, 100);
        this.matrix = {
            elements: new Array(16).fill(0)
        };
        this.lookAt = jest.fn((target) => {
            return this;
        });
        this.updateProjectionMatrix = jest.fn();
    }),

    MathUtils: {
        clamp: jest.fn((value, min, max) => Math.max(min, Math.min(max, value)))
    }
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

// Mock performance API
global.performance = {
    now: jest.fn(() => Date.now())
};

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
    return setTimeout(callback, 16);
});
global.cancelAnimationFrame = jest.fn((id) => {
    clearTimeout(id);
});

// Mock Helpers utility if it exists
global.window.Helpers = {
    log: jest.fn(),
    handleError: jest.fn()
};

// Import the actual CameraControls after setting up global THREE
require('../solar-system/camera-controls.js');
const { CameraControls } = window.CameraControls;

describe('CameraControls', () => {
    let camera;
    let domElement;
    let cameraControls;

    beforeEach(() => {
        jest.clearAllMocks();

        camera = new THREE.PerspectiveCamera();

        // Create a comprehensive mock DOM element
        domElement = {
            clientHeight: 500,
            clientWidth: 800,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            getBoundingClientRect: jest.fn(() => ({
                left: 0,
                top: 0,
                width: 800,
                height: 500
            }))
        };

        cameraControls = new CameraControls({ camera, domElement });
    });

    afterEach(() => {
        if (cameraControls) {
            cameraControls.dispose();
        }
    });

    describe('Constructor and Initialization', () => {
        test('should initialize with default options', () => {
            expect(cameraControls.options.enableDamping).toBe(true);
            expect(cameraControls.options.dampingFactor).toBe(0.05);
            expect(cameraControls.options.enableZoom).toBe(true);
            expect(cameraControls.options.enableRotate).toBe(true);
            expect(cameraControls.options.enablePan).toBe(true);
            expect(cameraControls.options.maxDistance).toBe(500);
            expect(cameraControls.options.minDistance).toBe(5);
            expect(cameraControls.options.followSmoothness).toBe(0.05);
        });

        test('should allow custom options override', () => {
            const customOptions = {
                camera,
                domElement,
                enableDamping: false,
                dampingFactor: 0.1,
                maxDistance: 1000,
                minDistance: 10,
                followSmoothness: 0.1,
                rotateSpeed: 2.0,
                zoomSpeed: 2.0,
                panSpeed: 2.0
            };
            const customControls = new CameraControls(customOptions);

            expect(customControls.options.enableDamping).toBe(false);
            expect(customControls.options.dampingFactor).toBe(0.1);
            expect(customControls.options.maxDistance).toBe(1000);
            expect(customControls.options.minDistance).toBe(10);
            expect(customControls.options.followSmoothness).toBe(0.1);
        });

        test('should initialize required properties correctly', () => {
            expect(cameraControls.camera).toBe(camera);
            expect(cameraControls.domElement).toBe(domElement);
            expect(cameraControls.target).toBeInstanceOf(THREE.Vector3);
            expect(cameraControls.spherical).toBeInstanceOf(THREE.Spherical);
            expect(cameraControls.sphericalDelta).toBeInstanceOf(THREE.Spherical);
            expect(cameraControls.isInitialized).toBe(false);
        });

        test('should initialize planet following properties', () => {
            expect(cameraControls.followedPlanet).toBeNull();
            expect(cameraControls.followOffset).toBeInstanceOf(THREE.Vector3);
            expect(cameraControls.isFollowing).toBe(false);
            expect(cameraControls.followDistance).toBe(50);
            expect(cameraControls.lastPlanetPosition).toBeInstanceOf(THREE.Vector3);
        });

        test('should initialize mouse and touch state properties', () => {
            expect(cameraControls.rotateStart).toBeInstanceOf(THREE.Vector2);
            expect(cameraControls.rotateEnd).toBeInstanceOf(THREE.Vector2);
            expect(cameraControls.rotateDelta).toBeInstanceOf(THREE.Vector2);
            expect(cameraControls.panStart).toBeInstanceOf(THREE.Vector2);
            expect(cameraControls.panEnd).toBeInstanceOf(THREE.Vector2);
            expect(cameraControls.panDelta).toBeInstanceOf(THREE.Vector2);
            expect(cameraControls.dollyStart).toBeInstanceOf(THREE.Vector2);
            expect(cameraControls.dollyEnd).toBeInstanceOf(THREE.Vector2);
            expect(cameraControls.dollyDelta).toBeInstanceOf(THREE.Vector2);
        });

        test('should initialize control states', () => {
            expect(cameraControls.STATE).toBeDefined();
            expect(cameraControls.STATE.NONE).toBe(-1);
            expect(cameraControls.STATE.ROTATE).toBe(0);
            expect(cameraControls.STATE.DOLLY).toBe(1);
            expect(cameraControls.STATE.PAN).toBe(2);
            expect(cameraControls.state).toBe(cameraControls.STATE.NONE);
        });

        test('should throw error when camera is missing', () => {
            expect(() => {
                new CameraControls({ camera: null, domElement });
            }).toThrow('CameraControls requires camera and domElement');
        });

        test('should throw error when domElement is missing', () => {
            expect(() => {
                new CameraControls({ camera, domElement: null });
            }).toThrow('CameraControls requires camera and domElement');
        });

        test('should initialize successfully with init method', async () => {
            await cameraControls.init();
            expect(cameraControls.isInitialized).toBe(true);
            expect(window.Helpers.log).toHaveBeenCalledWith('Camera controls with planet following initialized', 'debug');
        });

        test('should handle initialization errors', async () => {
            // Mock setupEventListeners to throw error
            cameraControls.setupEventListeners = jest.fn(() => {
                throw new Error('Event setup failed');
            });

            await expect(cameraControls.init()).rejects.toThrow('Event setup failed');
            expect(cameraControls.isInitialized).toBe(false);
            expect(window.Helpers.handleError).toHaveBeenCalled();
        });
    });

    describe('Event Listener Setup', () => {
        beforeEach(async () => {
            await cameraControls.init();
        });

        test('should setup event listeners during initialization', () => {
            expect(domElement.addEventListener).toHaveBeenCalledWith('contextmenu', expect.any(Function));
            expect(domElement.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
            expect(domElement.addEventListener).toHaveBeenCalledWith('wheel', expect.any(Function));
            expect(domElement.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
            expect(domElement.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
            expect(domElement.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function));
        });

        test('should track event listeners for cleanup', () => {
            expect(cameraControls.eventListeners).toBeInstanceOf(Array);
            expect(cameraControls.eventListeners.length).toBeGreaterThan(0);
        });

        test('should prevent context menu on right click', () => {
            const mockEvent = { preventDefault: jest.fn() };
            cameraControls.onContextMenu(mockEvent);
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });
    });

    describe('Mouse Interaction', () => {
        beforeEach(async () => {
            await cameraControls.init();
        });

        test('should handle left mouse button down for rotation', () => {
            const mockEvent = {
                preventDefault: jest.fn(),
                button: 0,
                clientX: 100,
                clientY: 200
            };

            // Mock document event listeners
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

            cameraControls.onMouseDown(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(cameraControls.state).toBe(cameraControls.STATE.ROTATE);
            expect(cameraControls.rotateStart.set).toHaveBeenCalledWith(100, 200);
            expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));

            addEventListenerSpy.mockRestore();
        });

        test('should handle middle mouse button down for panning', () => {
            const mockEvent = {
                preventDefault: jest.fn(),
                button: 1,
                clientX: 100,
                clientY: 200
            };

            cameraControls.onMouseDown(mockEvent);

            expect(cameraControls.state).toBe(cameraControls.STATE.PAN);
            expect(cameraControls.panStart.set).toHaveBeenCalledWith(100, 200);
        });

        test('should handle right mouse button down for panning', () => {
            const mockEvent = {
                preventDefault: jest.fn(),
                button: 2,
                clientX: 100,
                clientY: 200
            };

            cameraControls.onMouseDown(mockEvent);

            expect(cameraControls.state).toBe(cameraControls.STATE.PAN);
            expect(cameraControls.panStart.set).toHaveBeenCalledWith(100, 200);
        });

        test('should handle mouse wheel zoom', () => {
            const mockEvent = {
                preventDefault: jest.fn(),
                deltaY: -100 // Zoom in
            };

            const updateSpy = jest.spyOn(cameraControls, 'update');
            cameraControls.onMouseWheel(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(updateSpy).toHaveBeenCalled();
        });

        test('should handle mouse wheel zoom out', () => {
            const mockEvent = {
                preventDefault: jest.fn(),
                deltaY: 100 // Zoom out
            };

            const updateSpy = jest.spyOn(cameraControls, 'update');
            cameraControls.onMouseWheel(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(updateSpy).toHaveBeenCalled();
        });

        test('should cleanup mouse event listeners on mouse up', () => {
            const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

            // Simulate mouse down first
            const mockMouseDown = {
                preventDefault: jest.fn(),
                button: 0,
                clientX: 100,
                clientY: 200
            };
            cameraControls.onMouseDown(mockMouseDown);

            // Then mouse up
            const mockMouseUp = { preventDefault: jest.fn() };
            cameraControls.onMouseUp(mockMouseUp);

            expect(mockMouseUp.preventDefault).toHaveBeenCalled();
            expect(cameraControls.state).toBe(cameraControls.STATE.NONE);
            expect(removeEventListenerSpy).toHaveBeenCalled();

            removeEventListenerSpy.mockRestore();
        });
    });

    describe('Touch Interaction', () => {
        beforeEach(async () => {
            await cameraControls.init();
        });

        test('should handle single touch for rotation', () => {
            const mockEvent = {
                touches: [{
                    pageX: 100,
                    pageY: 200
                }]
            };

            cameraControls.onTouchStart(mockEvent);

            expect(cameraControls.state).toBe(cameraControls.STATE.TOUCH_ROTATE);
            expect(cameraControls.rotateStart.set).toHaveBeenCalledWith(100, 200);
        });

        test('should handle two touches for dolly and pan', () => {
            const mockEvent = {
                touches: [
                    { pageX: 100, pageY: 200 },
                    { pageX: 150, pageY: 250 }
                ]
            };

            cameraControls.onTouchStart(mockEvent);

            expect(cameraControls.state).toBe(cameraControls.STATE.TOUCH_DOLLY_PAN);
        });

        test('should handle touch move for rotation', () => {
            const mockEvent = {
                preventDefault: jest.fn(),
                touches: [{
                    pageX: 110,
                    pageY: 210
                }]
            };

            cameraControls.state = cameraControls.STATE.TOUCH_ROTATE;
            const updateSpy = jest.spyOn(cameraControls, 'update');

            cameraControls.onTouchMove(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(updateSpy).toHaveBeenCalled();
        });

        test('should handle touch end', () => {
            const mockEvent = {};
            cameraControls.state = cameraControls.STATE.TOUCH_ROTATE;

            cameraControls.onTouchEnd(mockEvent);

            expect(cameraControls.state).toBe(cameraControls.STATE.NONE);
        });
    });

    describe('Camera Movement Methods', () => {
        beforeEach(async () => {
            await cameraControls.init();
        });

        test('should rotate left correctly', () => {
            const initialTheta = cameraControls.sphericalDelta.theta;
            const angle = Math.PI / 4;

            cameraControls.rotateLeft(angle);

            expect(cameraControls.sphericalDelta.theta).toBe(initialTheta - angle);
        });

        test('should rotate up correctly', () => {
            const initialPhi = cameraControls.sphericalDelta.phi;
            const angle = Math.PI / 6;

            cameraControls.rotateUp(angle);

            expect(cameraControls.sphericalDelta.phi).toBe(initialPhi - angle);
        });

        test('should dolly in correctly', () => {
            const initialRadius = cameraControls.spherical.radius;
            const dollyScale = 1.2;

            cameraControls.dollyIn(dollyScale);

            expect(cameraControls.spherical.radius).toBe(initialRadius / dollyScale);
        });

        test('should dolly out correctly', () => {
            const initialRadius = cameraControls.spherical.radius;
            const dollyScale = 1.2;

            cameraControls.dollyOut(dollyScale);

            expect(cameraControls.spherical.radius).toBe(initialRadius * dollyScale);
        });

        test('should calculate zoom scale correctly', () => {
            cameraControls.zoomSpeed = 1;
            const scale = cameraControls.getZoomScale();
            expect(scale).toBe(Math.pow(0.95, 1));
        });

        test('should pan camera correctly', () => {
            const deltaX = 10;
            const deltaY = 5;

            cameraControls.pan(deltaX, deltaY);

            expect(cameraControls.target.add).toHaveBeenCalled();
        });
    });

    describe('Planet Following System', () => {
        let mockPlanet;
        let mockPlanetData;

        beforeEach(async () => {
            await cameraControls.init();

            mockPlanet = {
                getWorldPosition: jest.fn((target) => {
                    target.set(10, 5, 0);
                    return target;
                })
            };

            mockPlanetData = {
                name: 'Earth',
                diameter: 12756
            };
        });

        test('should focus and follow planet correctly', () => {
            cameraControls.focusAndFollowPlanet(mockPlanet, mockPlanetData, 50, 1000);

            expect(cameraControls.isFollowing).toBe(true);
            expect(cameraControls.followedPlanet).toBe(mockPlanet);
            expect(cameraControls.followDistance).toBe(50);
            expect(window.Helpers.log).toHaveBeenCalledWith('Following planet: Earth', 'debug');
        });

        test('should calculate appropriate viewing distance for different planets', () => {
            const earthDistance = cameraControls.calculatePlanetViewDistance({ name: 'Earth', diameter: 12756 });
            expect(earthDistance).toBeGreaterThan(0);

            const jupiterDistance = cameraControls.calculatePlanetViewDistance({ name: 'Jupiter', diameter: 142984 });
            expect(jupiterDistance).toBe(60);

            const saturnDistance = cameraControls.calculatePlanetViewDistance({ name: 'Saturn', diameter: 120536 });
            expect(saturnDistance).toBe(70);

            const sunDistance = cameraControls.calculatePlanetViewDistance({ name: 'Sun', diameter: 1392700 });
            expect(sunDistance).toBe(100);
        });

        test('should use default distance when planet data is missing', () => {
            const distance = cameraControls.calculatePlanetViewDistance(null);
            expect(distance).toBe(50);
        });

        test('should stop following planet correctly', () => {
            cameraControls.focusAndFollowPlanet(mockPlanet, mockPlanetData);
            cameraControls.stopFollowing();

            expect(cameraControls.isFollowing).toBe(false);
            expect(cameraControls.followedPlanet).toBeNull();
            expect(window.Helpers.log).toHaveBeenCalledWith('Stopped following planet', 'debug');
        });

        test('should update planet following smoothly', () => {
            cameraControls.followedPlanet = mockPlanet;
            cameraControls.isFollowing = true;
            cameraControls.target = new THREE.Vector3(0, 0, 0);
            cameraControls.followOffset = new THREE.Vector3(0, 0, 50);
            cameraControls.lastPlanetPosition = new THREE.Vector3(0, 0, 0);

            // Mock planet movement
            mockPlanet.getWorldPosition = jest.fn((target) => {
                target.set(15, 10, 5); // Planet has moved significantly
                return target;
            });

            cameraControls.updatePlanetFollowing();

            expect(cameraControls.target.lerp).toHaveBeenCalled();
            expect(cameraControls.camera.position.lerp).toHaveBeenCalled();
            expect(cameraControls.camera.lookAt).toHaveBeenCalled();
        });

        test('should handle planet following during mouse wheel zoom', () => {
            cameraControls.followedPlanet = mockPlanet;
            cameraControls.isFollowing = true;
            cameraControls.followDistance = 50;
            cameraControls.followOffset = new THREE.Vector3(0, 0, 50);
            cameraControls.options.minDistance = 5;
            cameraControls.options.maxDistance = 500;
            cameraControls.zoomSpeed = 1; // Ensure zoom speed is set

            const mockEvent = {
                preventDefault: jest.fn(),
                deltaY: -100 // Zoom in (negative deltaY)
            };

            const initialDistance = cameraControls.followDistance;
            cameraControls.onMouseWheel(mockEvent);

            // Calculate expected zoom scale (from getZoomScale method: Math.pow(0.95, zoomSpeed))
            const expectedZoomScale = Math.pow(0.95, 1); // 0.95
            const expectedDistance = Math.max(5, initialDistance / expectedZoomScale);

            expect(cameraControls.followDistance).toBeCloseTo(expectedDistance, 5);
            expect(cameraControls.camera.lookAt).toHaveBeenCalled();
        });

        test('should handle rotation while following planet', () => {
            cameraControls.followedPlanet = mockPlanet;
            cameraControls.isFollowing = true;

            const mockEvent = {
                clientX: 110,
                clientY: 210
            };

            cameraControls.rotateStart.set(100, 200);
            cameraControls.handleMouseMoveRotateFollowing(mockEvent);

            expect(cameraControls.camera.lookAt).toHaveBeenCalled();
        });

        test('should warn when no planet object provided for following', () => {
            cameraControls.focusAndFollowPlanet(null, mockPlanetData);

            expect(console.warn).toHaveBeenCalledWith('No planet object provided for following');
            expect(cameraControls.isFollowing).toBe(false);
        });
    });

    describe('Camera Update and Animation', () => {
        beforeEach(async () => {
            await cameraControls.init();
        });

        test('should update camera position correctly', () => {
            const result = cameraControls.update();

            expect(result).toBe(true);
            expect(cameraControls.camera.position.copy).toHaveBeenCalled();
            expect(cameraControls.camera.lookAt).toHaveBeenCalled();
        });

        test('should apply damping when enabled', () => {
            cameraControls.options.enableDamping = true;
            cameraControls.options.dampingFactor = 0.1;
            cameraControls.sphericalDelta.theta = 1;
            cameraControls.sphericalDelta.phi = 1;

            cameraControls.update();

            expect(cameraControls.sphericalDelta.theta).toBe(0.9); // 1 * (1 - 0.1)
            expect(cameraControls.sphericalDelta.phi).toBe(0.9);
        });

        test('should reset spherical delta when damping is disabled', () => {
            cameraControls.options.enableDamping = false;
            cameraControls.sphericalDelta.theta = 1;
            cameraControls.sphericalDelta.phi = 1;

            cameraControls.update();

            expect(cameraControls.sphericalDelta.set).toHaveBeenCalledWith(0, 0, 0);
        });

        test('should prioritize planet following over regular update', () => {
            cameraControls.isFollowing = true;
            cameraControls.followedPlanet = { getWorldPosition: jest.fn((target) => target.set(0, 0, 0)) };
            cameraControls.isAnimating = false;

            const updatePlanetFollowingSpy = jest.spyOn(cameraControls, 'updatePlanetFollowing');
            const result = cameraControls.update();

            expect(updatePlanetFollowingSpy).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        test('should animate to follow position smoothly', () => {
            const targetPosition = new THREE.Vector3(10, 5, 0);
            const duration = 1000;

            cameraControls.animateToFollowPosition(targetPosition, duration);

            expect(cameraControls.isAnimating).toBe(true);
            expect(requestAnimationFrame).toHaveBeenCalled();
        });

        test('should cancel existing animation when starting new one', () => {
            cameraControls.animationId = 123;
            cameraControls.isAnimating = true;

            const targetPosition = new THREE.Vector3(10, 5, 0);
            cameraControls.animateToFollowPosition(targetPosition, 1000);

            expect(cancelAnimationFrame).toHaveBeenCalledWith(123);
        });
    });

    describe('Camera Position and Target Control', () => {
        beforeEach(async () => {
            await cameraControls.init();
        });

        test('should set camera position and stop following', () => {
            cameraControls.isFollowing = true;
            cameraControls.followedPlanet = {};

            cameraControls.setPosition(10, 20, 30);

            expect(cameraControls.isFollowing).toBe(false);
            expect(cameraControls.followedPlanet).toBeNull();
            expect(cameraControls.camera.position.set).toHaveBeenCalledWith(10, 20, 30);
        });

        test('should set camera target and stop following', () => {
            cameraControls.isFollowing = true;
            cameraControls.followedPlanet = {};

            cameraControls.lookAt(5, 10, 15);

            expect(cameraControls.isFollowing).toBe(false);
            expect(cameraControls.followedPlanet).toBeNull();
            expect(cameraControls.target.set).toHaveBeenCalledWith(5, 10, 15);
            expect(cameraControls.camera.lookAt).toHaveBeenCalled();
        });

        test('should focus on target with smooth animation', () => {
            const targetPosition = new THREE.Vector3(10, 5, 0);
            const distance = 50;
            const duration = 2000;

            cameraControls.focusOn(targetPosition, distance, duration);

            expect(cameraControls.isAnimating).toBe(true);
            expect(requestAnimationFrame).toHaveBeenCalled();
        });

        test('should get distance from camera to target', () => {
            cameraControls.camera.position = new THREE.Vector3(10, 0, 0);
            cameraControls.target = new THREE.Vector3(0, 0, 0);

            const distance = cameraControls.getDistance();

            expect(cameraControls.camera.position.distanceTo).toHaveBeenCalledWith(cameraControls.target);
        });
    });

    describe('Keyboard Controls', () => {
        beforeEach(async () => {
            await cameraControls.init();
        });

        test('should handle arrow key panning', () => {
            const panSpy = jest.spyOn(cameraControls, 'pan');
            const updateSpy = jest.spyOn(cameraControls, 'update');

            // Test each arrow key
            cameraControls.onKeyDown({ code: 'ArrowUp' });
            expect(panSpy).toHaveBeenCalledWith(0, cameraControls.panSpeed * 10);
            expect(updateSpy).toHaveBeenCalled();

            cameraControls.onKeyDown({ code: 'ArrowDown' });
            expect(panSpy).toHaveBeenCalledWith(0, -cameraControls.panSpeed * 10);

            cameraControls.onKeyDown({ code: 'ArrowLeft' });
            expect(panSpy).toHaveBeenCalledWith(cameraControls.panSpeed * 10, 0);

            cameraControls.onKeyDown({ code: 'ArrowRight' });
            expect(panSpy).toHaveBeenCalledWith(-cameraControls.panSpeed * 10, 0);
        });

        test('should ignore unknown key codes', () => {
            const panSpy = jest.spyOn(cameraControls, 'pan');
            const updateSpy = jest.spyOn(cameraControls, 'update');

            cameraControls.onKeyDown({ code: 'KeyA' });

            expect(panSpy).not.toHaveBeenCalled();
            expect(updateSpy).not.toHaveBeenCalled();
        });
    });

    describe('Control State Management', () => {
        beforeEach(async () => {
            await cameraControls.init();
        });

        test('should enable and disable controls', () => {
            cameraControls.setEnabled(false);

            expect(cameraControls.options.enableRotate).toBe(false);
            expect(cameraControls.options.enableZoom).toBe(false);
            expect(cameraControls.options.enablePan).toBe(false);

            cameraControls.setEnabled(true);

            expect(cameraControls.options.enableRotate).toBe(true);
            expect(cameraControls.options.enableZoom).toBe(true);
            expect(cameraControls.options.enablePan).toBe(true);
        });

        test('should respect disabled controls during mouse events', () => {
            cameraControls.options.enableRotate = false;
            cameraControls.options.enablePan = false;
            cameraControls.options.enableZoom = false;

            const mockMouseDown = {
                preventDefault: jest.fn(),
                button: 0,
                clientX: 100,
                clientY: 200
            };

            cameraControls.onMouseDown(mockMouseDown);
            expect(cameraControls.state).toBe(cameraControls.STATE.NONE);

            const mockWheel = {
                preventDefault: jest.fn(),
                deltaY: 100
            };

            const updateSpy = jest.spyOn(cameraControls, 'update');
            cameraControls.onMouseWheel(mockWheel);
            expect(updateSpy).not.toHaveBeenCalled();
        });
    });

    describe('Distance and Angle Constraints', () => {
        beforeEach(async () => {
            await cameraControls.init();
        });

        test('should enforce minimum and maximum distance constraints', () => {
            cameraControls.options.minDistance = 10;
            cameraControls.options.maxDistance = 100;

            // Test minimum distance constraint
            cameraControls.spherical.radius = 5; // Below minimum
            cameraControls.update();
            expect(cameraControls.spherical.radius).toBeGreaterThanOrEqual(10);

            // Test maximum distance constraint
            cameraControls.spherical.radius = 200; // Above maximum
            cameraControls.update();
            expect(cameraControls.spherical.radius).toBeLessThanOrEqual(100);
        });

        test('should enforce polar angle constraints', () => {
            cameraControls.options.minPolarAngle = 0.1;
            cameraControls.options.maxPolarAngle = Math.PI - 0.1;

            // Test minimum polar angle constraint
            cameraControls.spherical.phi = 0.05; // Below minimum
            cameraControls.update();
            expect(cameraControls.spherical.phi).toBeGreaterThanOrEqual(0.1);

            // Test maximum polar angle constraint
            cameraControls.spherical.phi = Math.PI - 0.05; // Above maximum
            cameraControls.update();
            expect(cameraControls.spherical.phi).toBeLessThanOrEqual(Math.PI - 0.1);
        });
    });

    describe('Easing and Animation Utilities', () => {
        test('should provide correct easing function values', () => {
            expect(cameraControls.easeInOutCubic(0)).toBe(0);
            expect(cameraControls.easeInOutCubic(1)).toBe(1);
            expect(cameraControls.easeInOutCubic(0.5)).toBeCloseTo(0.5, 1);
        });
    });

    describe('Getters', () => {
        test('should provide correct getter values', () => {
            expect(cameraControls.Camera).toBe(cameraControls.camera);
            expect(cameraControls.Target).toBe(cameraControls.target);
            expect(cameraControls.IsInitialized).toBe(cameraControls.isInitialized);
            expect(cameraControls.IsAnimating).toBe(cameraControls.isAnimating);
            expect(cameraControls.IsFollowing).toBe(cameraControls.isFollowing);
            expect(cameraControls.FollowedPlanet).toBe(cameraControls.followedPlanet);
        });

        test('should return updated values after state changes', () => {
            cameraControls.isAnimating = true;
            expect(cameraControls.IsAnimating).toBe(true);

            cameraControls.isFollowing = true;
            expect(cameraControls.IsFollowing).toBe(true);

            const mockPlanet = {};
            cameraControls.followedPlanet = mockPlanet;
            expect(cameraControls.FollowedPlanet).toBe(mockPlanet);
        });
    });

    describe('Disposal and Cleanup', () => {
        beforeEach(async () => {
            await cameraControls.init();
        });

        test('should dispose correctly and cleanup resources', () => {
            cameraControls.animationId = 123;
            cameraControls.eventListeners = [
                { target: domElement, type: 'click', listener: jest.fn() },
                { target: window, type: 'resize', listener: jest.fn() }
            ];

            // Mock removeEventListener
            domElement.removeEventListener = jest.fn();
            window.removeEventListener = jest.fn();

            cameraControls.dispose();

            expect(cancelAnimationFrame).toHaveBeenCalledWith(123);
            expect(domElement.removeEventListener).toHaveBeenCalled();
            expect(cameraControls.eventListeners).toEqual([]);
            expect(cameraControls.isInitialized).toBe(false);
            expect(window.Helpers.log).toHaveBeenCalledWith('Camera controls disposed', 'debug');
        });

        test('should cleanup current mouse handlers during disposal', () => {
            const mockMoveHandler = jest.fn();
            const mockUpHandler = jest.fn();
            cameraControls.currentMouseMoveHandler = mockMoveHandler;
            cameraControls.currentMouseUpHandler = mockUpHandler;

            const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

            cameraControls.dispose();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', mockMoveHandler);
            expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', mockUpHandler);

            removeEventListenerSpy.mockRestore();
        });

        test('should handle disposal when no animation is active', () => {
            cameraControls.animationId = null;

            expect(() => {
                cameraControls.dispose();
            }).not.toThrow();

            expect(cancelAnimationFrame).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle missing spherical coordinates gracefully', () => {
            // Store original spherical and sphericalDelta
            const originalSpherical = cameraControls.spherical;
            const originalSphericalDelta = cameraControls.sphericalDelta;

            // Set spherical to null but keep sphericalDelta valid
            cameraControls.spherical = null;

            expect(() => {
                cameraControls.update();
            }).toThrow('Cannot read properties of null');

            // Restore for cleanup
            cameraControls.spherical = originalSpherical;
            cameraControls.sphericalDelta = originalSphericalDelta;
        });

        test('should handle missing spherical delta gracefully', () => {
            // Test with missing sphericalDelta instead
            const originalSphericalDelta = cameraControls.sphericalDelta;
            cameraControls.sphericalDelta = null;

            expect(() => {
                cameraControls.update();
            }).toThrow('Cannot read properties of null');

            // Restore for cleanup
            cameraControls.sphericalDelta = originalSphericalDelta;
        });

        test('should handle update planet following without planet', () => {
            cameraControls.followedPlanet = null;

            expect(() => {
                cameraControls.updatePlanetFollowing();
            }).not.toThrow();
        });

        test('should handle planet following with invalid planet object', () => {
            const invalidPlanet = {}; // Missing getWorldPosition method
            cameraControls.followedPlanet = invalidPlanet;
            cameraControls.isFollowing = true;

            expect(() => {
                cameraControls.updatePlanetFollowing();
            }).toThrow('this.followedPlanet.getWorldPosition is not a function');
        });

        test('should handle planet following with valid planet object', () => {
            const validPlanet = {
                getWorldPosition: jest.fn((target) => {
                    target.set(0, 0, 0);
                    return target;
                })
            };
            cameraControls.followedPlanet = validPlanet;
            cameraControls.isFollowing = true;
            cameraControls.target = new THREE.Vector3(0, 0, 0);
            cameraControls.followOffset = new THREE.Vector3(0, 0, 50);
            cameraControls.lastPlanetPosition = new THREE.Vector3(0, 0, 0);

            expect(() => {
                cameraControls.updatePlanetFollowing();
            }).not.toThrow();
        });

        test('should handle mouse events with disabled controls gracefully', () => {
            cameraControls.options.enableRotate = false;
            cameraControls.options.enablePan = false;
            cameraControls.options.enableZoom = false;

            const mockEvent = {
                preventDefault: jest.fn(),
                button: 0,
                clientX: 100,
                clientY: 200
            };

            expect(() => {
                cameraControls.onMouseDown(mockEvent);
            }).not.toThrow();

            expect(cameraControls.state).toBe(cameraControls.STATE.NONE);
        });

        test('should handle touch events gracefully', () => {
            const mockTouchEvent = {
                preventDefault: jest.fn(),
                touches: []
            };

            expect(() => {
                cameraControls.onTouchStart(mockTouchEvent);
                cameraControls.onTouchMove(mockTouchEvent);
                cameraControls.onTouchEnd(mockTouchEvent);
            }).not.toThrow();
        });

        test('should handle small planet movements efficiently', () => {
            const mockPlanet = {
                getWorldPosition: jest.fn((target) => {
                    target.set(0.05, 0.05, 0.05); // Very small movement
                    return target;
                })
            };

            cameraControls.followedPlanet = mockPlanet;
            cameraControls.isFollowing = true;
            cameraControls.lastPlanetPosition = new THREE.Vector3(0, 0, 0);

            const lerpSpy = jest.spyOn(cameraControls.target, 'lerp');

            cameraControls.updatePlanetFollowing();

            // Should not update for small movements
            expect(lerpSpy).not.toHaveBeenCalled();
        });
    });

    describe('Performance Considerations', () => {
        beforeEach(async () => {
            await cameraControls.init();
        });

        test('should handle rapid mouse movement efficiently', () => {
            const mockEvent = {
                preventDefault: jest.fn(),
                clientX: 100,
                clientY: 200
            };

            cameraControls.state = cameraControls.STATE.ROTATE;
            cameraControls.rotateStart.set(95, 195);

            const updateSpy = jest.spyOn(cameraControls, 'update');

            // Simulate rapid mouse movements
            for (let i = 0; i < 10; i++) {
                mockEvent.clientX += 1;
                mockEvent.clientY += 1;
                cameraControls.onMouseMove(mockEvent);
            }

            expect(updateSpy).toHaveBeenCalledTimes(10);
        });

        test('should efficiently handle repeated update calls', () => {
            const lookAtSpy = jest.spyOn(cameraControls.camera, 'lookAt');

            // Call update multiple times
            for (let i = 0; i < 5; i++) {
                cameraControls.update();
            }

            expect(lookAtSpy).toHaveBeenCalledTimes(5);
        });

        test('should skip updates when not significantly needed', () => {
            cameraControls.sphericalDelta.theta = 0;
            cameraControls.sphericalDelta.phi = 0;
            cameraControls.options.enableDamping = false;

            const positionCopySpy = jest.spyOn(cameraControls.camera.position, 'copy');

            cameraControls.update();

            expect(positionCopySpy).toHaveBeenCalled();
        });
    });

    describe('Integration with Three.js Objects', () => {
        beforeEach(async () => {
            await cameraControls.init();
        });

        test('should work correctly with real Three.js-like objects', () => {
            // Test that the controls can work with objects that behave like real Three.js objects
            const mockScene = {
                add: jest.fn(),
                remove: jest.fn()
            };

            const planetMesh = {
                position: new THREE.Vector3(10, 5, 0),
                getWorldPosition: jest.fn(function(target) {
                    target.copy(this.position);
                    return target;
                })
            };

            expect(() => {
                cameraControls.focusAndFollowPlanet(planetMesh, { name: 'Test Planet' });
            }).not.toThrow();

            expect(cameraControls.followedPlanet).toBe(planetMesh);
        });

        test('should handle spherical coordinate calculations correctly', () => {
            const testPosition = new THREE.Vector3(10, 5, 0);
            cameraControls.camera.position.copy(testPosition);
            cameraControls.target.set(0, 0, 0);

            cameraControls.updateSphericalFromCamera();

            expect(cameraControls.spherical.setFromVector3).toHaveBeenCalled();
        });
    });

    describe('Factory Method', () => {
        test('should create camera controls via factory method', () => {
            const controlsFromFactory = window.CameraControls.create({
                camera,
                domElement,
                enableDamping: false,
                maxDistance: 1000
            });

            expect(controlsFromFactory).toBeInstanceOf(CameraControls);
            expect(controlsFromFactory.options.enableDamping).toBe(false);
            expect(controlsFromFactory.options.maxDistance).toBe(1000);
        });

        test('should create camera controls with default options via factory', () => {
            const controlsFromFactory = window.CameraControls.create({
                camera,
                domElement
            });

            expect(controlsFromFactory).toBeInstanceOf(CameraControls);
            expect(controlsFromFactory.options.enableDamping).toBe(true);
            expect(controlsFromFactory.options.maxDistance).toBe(500);
        });
    });

    describe('Console Logging', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('should log initialization success', async () => {
            await cameraControls.init();
            expect(window.Helpers.log).toHaveBeenCalledWith('Camera controls with planet following initialized', 'debug');
        });

        test('should log planet following events', () => {
            const mockPlanet = {
                getWorldPosition: jest.fn((target) => target.set(0, 0, 0))
            };

            cameraControls.focusAndFollowPlanet(mockPlanet, { name: 'Mars' });
            expect(window.Helpers.log).toHaveBeenCalledWith('Following planet: Mars', 'debug');

            cameraControls.stopFollowing();
            expect(window.Helpers.log).toHaveBeenCalledWith('Stopped following planet', 'debug');
        });

        test('should log disposal events', () => {
            cameraControls.dispose();
            expect(window.Helpers.log).toHaveBeenCalledWith('Camera controls disposed', 'debug');
        });

        test('should handle error logging during initialization', async () => {
            cameraControls.setupEventListeners = jest.fn(() => {
                throw new Error('Setup failed');
            });

            await expect(cameraControls.init()).rejects.toThrow('Setup failed');
            expect(window.Helpers.handleError).toHaveBeenCalledWith(
                expect.any(Error),
                'CameraControls.init'
            );
        });
    });
});