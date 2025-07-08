// static/js/__tests__/setup.js
// Mock window properties and functions
global.requestAnimationFrame = callback => setTimeout(callback, 0);
global.cancelAnimationFrame = id => clearTimeout(id);

// Mock WebGL context and canvas
global.WebGLRenderingContext = {};
global.HTMLCanvasElement.prototype.getContext = () => ({});

// Mock window properties commonly used in Three.js
global.innerWidth = 1024;
global.innerHeight = 768;

// Mock performance API
if (!global.performance) {
    global.performance = {
        now: () => Date.now()
    };
}

// Mock Three.js textures and loaders
global.TextureLoader = jest.fn(() => ({
    load: jest.fn()
}));

// Import testing library matchers
import '@testing-library/jest-dom';