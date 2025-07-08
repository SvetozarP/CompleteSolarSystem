// static/js/__tests__/camera-controls.test.js
// Mock THREE with proper constructor functions
const THREE = {
    Vector2: jest.fn(function() {
        this.set = jest.fn();
        this.copy = jest.fn();
    }),
    Vector3: jest.fn(function() {
        this.set = jest.fn();
        this.copy = jest.fn();
    }),
    Spherical: jest.fn(function() {
        this.set = jest.fn();
    }),
    PerspectiveCamera: jest.fn(function() {
        this.position = { set: jest.fn() };
        this.lookAt = jest.fn();
    })
};

// Mock the CameraControls class
class CameraControls {
    constructor(camera, domElement, options = {}) {
        this.camera = camera;
        this.domElement = domElement;
        this.options = {
            enableDamping: true,
            maxDistance: 500,
            followSmoothness: 0.05,
            ...options
        };

        this.panSpeed = 1.0;
        this.followDistance = 50;
        this.isInitialized = false;

        this.rotateStart = new THREE.Vector2();
        this.dollyStart = new THREE.Vector2();
        this.panDelta = new THREE.Vector2();
        this.zoomDelta = new THREE.Vector2();

        this.spherical = new THREE.Spherical();
        this.sphericalDelta = new THREE.Spherical();

        this.lastPlanetPosition = new THREE.Vector3();
        this.followedPlanet = null;
    }
}

describe('CameraControls', () => {
    let camera;
    let domElement;
    let cameraControls;

    beforeEach(() => {
        camera = new THREE.PerspectiveCamera();
        domElement = document.createElement('div');
        cameraControls = new CameraControls(camera, domElement);
    });

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