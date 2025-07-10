// static/js/__mocks__/three.js

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

// Export as both named exports and default export to cover different import styles
const THREE = {
    Vector2: MockVector2,
    Vector3: MockVector3,
    Spherical: MockSpherical,
    PerspectiveCamera: MockPerspectiveCamera,
    MathUtils: {
        clamp: jest.fn((value, min, max) => Math.max(min, Math.min(max, value)))
    }
};

// For default import
module.exports = THREE;

// For named exports
module.exports.Vector2 = MockVector2;
module.exports.Vector3 = MockVector3;
module.exports.Spherical = MockSpherical;
module.exports.PerspectiveCamera = MockPerspectiveCamera;
module.exports.MathUtils = THREE.MathUtils;