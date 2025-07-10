// static/js/__tests__/camera-controls.test.js
import * as THREE from 'three';
import { CameraControls } from '../solar-system/camera-controls.js';

// Mock THREE.js methods that aren't available in jsdom
jest.mock('three', () => {
    const actualTHREE = jest.requireActual('three');

    // Create mock constructor functions that behave like THREE.js classes
    const MockVector2 = jest.fn(function(x = 0, y = 0) {
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
        this.length = jest.fn(() => Math.sqrt(this.x * this.x + this.y * this.y));
    });

    const MockVector3 = jest.fn(function(x = 0, y = 0, z = 0) {
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
        this.clone = jest.fn(() => new MockVector3(this.x, this.y, this.z));
        this.length = jest.fn(() => Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z));
        this.lerp = jest.fn((v, alpha) => {
            this.x += (v.x - this.x) * alpha;
            this.y += (v.y - this.y) * alpha;
            this.z += (v.z - this.z) * alpha;
            return this;
        });
        this.setFromMatrixColumn = jest.fn((matrix, index) => {
            // Mock implementation - just set some values
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
            // Mock implementation
            this.x = spherical.radius;
            this.y = spherical.phi;
            this.z = spherical.theta;
            return this;
        });
        this.getWorldPosition = jest.fn((target) => {
            target.copy(this);
            return target;
        });
    });

    const MockSpherical = jest.fn(function(radius = 1, phi = 0, theta = 0) {
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
    });

    const MockPerspectiveCamera = jest.fn(function(fov = 50, aspect = 1, near = 0.1, far = 2000) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.position = new MockVector3(0, 0, 100);
        this.matrix = {
            elements: new Array(16).fill(0)
        };
        this.lookAt = jest.fn((target) => {
            // Mock implementation
            return this;
        });
        this.updateProjectionMatrix = jest.fn();
    });

    return {
        ...actualTHREE,
        Vector2: MockVector2,
        Vector3: MockVector3,
        Spherical: MockSpherical,
        PerspectiveCamera: MockPerspectiveCamera
    };
});

describe('CameraControls', () => {
    let camera;
    let domElement;
    let cameraControls;

    beforeEach(() => {
        camera = new THREE.PerspectiveCamera();

        // Create a mock DOM element with writable clientHeight and clientWidth
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

        cameraControls = new CameraControls(camera, domElement);
    });

    describe('Constructor', () => {
        test('initializes with default options', () => {
            expect(cameraControls.options.enableDamping).toBe(true);
            expect(cameraControls.options.maxDistance).toBe(500);
            expect(cameraControls.options.followSmoothness).toBe(0.05);
        });

        test('allows custom options', () => {
            const customOptions = {
                enableDamping: false,
                maxDistance: 1000,
                followSmoothness: 0.1
            };
            const customControls = new CameraControls(camera, domElement, customOptions);

            expect(customControls.options.enableDamping).toBe(false);
            expect(customControls.options.maxDistance).toBe(1000);
            expect(customControls.options.followSmoothness).toBe(0.1);
        });

        test('initializes required properties', () => {
            expect(cameraControls.camera).toBeDefined();
            expect(cameraControls.domElement).toBeDefined();
            expect(cameraControls.panSpeed).toBe(1.0);
            expect(cameraControls.followDistance).toBe(50);
            expect(cameraControls.isInitialized).toBe(false);
        });

        test('initializes vector properties', () => {
            expect(cameraControls.rotateStart).toBeInstanceOf(THREE.Vector2);
            expect(cameraControls.dollyStart).toBeInstanceOf(THREE.Vector2);
            expect(cameraControls.panDelta).toBeInstanceOf(THREE.Vector2);
            expect(cameraControls.zoomDelta).toBeInstanceOf(THREE.Vector2);
        });

        test('initializes spherical coordinates', () => {
            expect(cameraControls.spherical).toBeInstanceOf(THREE.Spherical);
            expect(cameraControls.sphericalDelta).toBeInstanceOf(THREE.Spherical);
        });

        test('initializes planet following properties', () => {
            expect(cameraControls.lastPlanetPosition).toBeInstanceOf(THREE.Vector3);
            expect(cameraControls.followedPlanet).toBeNull();
        });
    });

    describe('Methods', () => {
        test('pan method updates target position', () => {
            // Initialize target if it doesn't exist
            if (!cameraControls.target) {
                cameraControls.target = new THREE.Vector3(0, 0, 0);
            }

            const initialTargetX = cameraControls.target.x;
            const initialTargetY = cameraControls.target.y;

            cameraControls.pan(10, 5);

            // Target should have been modified
            expect(cameraControls.target.add).toHaveBeenCalled();
        });

        test('dollyIn decreases spherical radius', () => {
            const initialRadius = cameraControls.spherical.radius;
            const dollyScale = 1.2;

            cameraControls.dollyIn(dollyScale);

            expect(cameraControls.spherical.radius).toBe(initialRadius / dollyScale);
        });

        test('dollyOut increases spherical radius', () => {
            const initialRadius = cameraControls.spherical.radius;
            const dollyScale = 1.2;

            cameraControls.dollyOut(dollyScale);

            expect(cameraControls.spherical.radius).toBe(initialRadius * dollyScale);
        });

        test('getZoomScale returns expected value', () => {
            // Set zoom speed if it doesn't exist
            cameraControls.zoomSpeed = 1;

            const scale = cameraControls.getZoomScale();

            expect(scale).toBe(Math.pow(0.95, cameraControls.zoomSpeed));
        });

        test('update method returns false when camera or domElement is missing', () => {
            const controlsWithoutCamera = new CameraControls(null, domElement);
            expect(controlsWithoutCamera.update()).toBe(false);

            const controlsWithoutDomElement = new CameraControls(camera, null);
            expect(controlsWithoutDomElement.update()).toBe(false);
        });

        test('update method handles planet following', () => {
            // Set up required properties that aren't initialized in constructor
            cameraControls.target = new THREE.Vector3(0, 0, 0);
            cameraControls.followOffset = new THREE.Vector3(0, 0, 50);
            cameraControls.updateSphericalFromCamera = jest.fn();

            // Set up planet following state
            cameraControls.isFollowing = true;
            cameraControls.followedPlanet = {
                getWorldPosition: jest.fn((target) => {
                    target.set(10, 0, 0);
                    return target;
                })
            };
            cameraControls.isAnimating = false;

            // Set initial planet position different from current to trigger movement
            cameraControls.lastPlanetPosition.set(0, 0, 0);

            const result = cameraControls.update();

            expect(result).toBe(true);
            expect(cameraControls.followedPlanet.getWorldPosition).toHaveBeenCalled();
        });

        test('updatePlanetFollowing handles planet movement', () => {
            // Set up required properties that aren't initialized in constructor
            cameraControls.target = new THREE.Vector3(0, 0, 0);
            cameraControls.followOffset = new THREE.Vector3(0, 0, 50);
            cameraControls.updateSphericalFromCamera = jest.fn();

            // Set up followed planet
            cameraControls.followedPlanet = {
                getWorldPosition: jest.fn((target) => {
                    target.set(10, 5, 0);
                    return target;
                })
            };

            // Set initial planet position different from current to trigger movement
            cameraControls.lastPlanetPosition.set(0, 0, 0);

            cameraControls.updatePlanetFollowing();

            expect(cameraControls.followedPlanet.getWorldPosition).toHaveBeenCalled();
            expect(cameraControls.target.lerp).toHaveBeenCalled();
            expect(cameraControls.camera.position.lerp).toHaveBeenCalled();
            expect(cameraControls.camera.lookAt).toHaveBeenCalled();
        });
    });
});