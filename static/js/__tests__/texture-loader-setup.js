// static/js/__tests__/texture-loader-setup.js
// Extended setup specifically for texture loader tests

// Enhanced Three.js mocks for texture testing
global.THREE = {
    ...global.THREE,

    // Texture constants
    RepeatWrapping: 1000,
    ClampToEdgeWrapping: 1001,
    MirroredRepeatWrapping: 1002,
    LinearFilter: 1006,
    LinearMipMapLinearFilter: 1008,
    NearestFilter: 1003,

    // Material types
    MeshStandardMaterial: jest.fn(function(options = {}) {
        return {
            ...options,
            dispose: jest.fn(),
            type: 'MeshStandardMaterial'
        };
    }),

    MeshBasicMaterial: jest.fn(function(options = {}) {
        return {
            ...options,
            dispose: jest.fn(),
            type: 'MeshBasicMaterial'
        };
    }),

    // Enhanced texture mock
    TextureLoader: jest.fn(function() {
        return {
            load: jest.fn((url, onLoad, onProgress, onError) => {
                // Simulate async loading
                setTimeout(() => {
                    if (url.includes('nonexistent') || url.includes('invalid')) {
                        onError && onError(new Error('Texture not found'));
                    } else {
                        const mockTexture = {
                            image: { width: 512, height: 512 },
                            wrapS: null,
                            wrapT: null,
                            magFilter: null,
                            minFilter: null,
                            flipY: true,
                            generateMipmaps: true,
                            anisotropy: 1,
                            dispose: jest.fn(),
                            uuid: Math.random().toString(36),
                            source: { data: new ImageData(512, 512) }
                        };
                        onLoad && onLoad(mockTexture);
                    }
                }, 0);
            })
        };
    }),

    CanvasTexture: jest.fn(function(canvas) {
        return {
            image: canvas,
            wrapS: null,
            wrapT: null,
            magFilter: null,
            minFilter: null,
            flipY: true,
            generateMipmaps: true,
            anisotropy: 1,
            dispose: jest.fn(),
            uuid: Math.random().toString(36),
            needsUpdate: true
        };
    }),

    Vector3: jest.fn(function(x = 0, y = 0, z = 0) {
        return {
            x, y, z,
            set: jest.fn(function(x, y, z) {
                this.x = x;
                this.y = y;
                this.z = z;
                return this;
            }),
            copy: jest.fn(function(v) {
                this.x = v.x;
                this.y = v.y;
                this.z = v.z;
                return this;
            }),
            normalize: jest.fn(function() {
                const length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
                if (length > 0) {
                    this.x /= length;
                    this.y /= length;
                    this.z /= length;
                }
                return this;
            }),
            multiplyScalar: jest.fn(function(scalar) {
                this.x *= scalar;
                this.y *= scalar;
                this.z *= scalar;
                return this;
            }),
            length: jest.fn(function() {
                return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
            })
        };
    })
};

// Enhanced canvas mock with more realistic behavior
const createEnhancedCanvasMock = () => {
    const canvas = {
        width: 512,
        height: 512,
        style: {},

        getContext: jest.fn((type) => {
            if (type === '2d') {
                return {
                    canvas: canvas,
                    fillStyle: '#000000',
                    strokeStyle: '#000000',
                    lineWidth: 1,
                    font: '10px sans-serif',
                    textAlign: 'start',
                    textBaseline: 'alphabetic',

                    // Drawing methods
                    fillRect: jest.fn(),
                    strokeRect: jest.fn(),
                    clearRect: jest.fn(),
                    beginPath: jest.fn(),
                    closePath: jest.fn(),
                    moveTo: jest.fn(),
                    lineTo: jest.fn(),
                    arc: jest.fn(),
                    arcTo: jest.fn(),
                    quadraticCurveTo: jest.fn(),
                    bezierCurveTo: jest.fn(),
                    rect: jest.fn(),
                    fill: jest.fn(),
                    stroke: jest.fn(),
                    clip: jest.fn(),

                    // Text methods
                    fillText: jest.fn(),
                    strokeText: jest.fn(),
                    measureText: jest.fn(() => ({ width: 100 })),

                    // Image data methods
                    createImageData: jest.fn((width, height) => {
                        const data = new Uint8ClampedArray(width * height * 4);
                        // Fill with some test data
                        for (let i = 0; i < data.length; i += 4) {
                            data[i] = 128;     // Red
                            data[i + 1] = 128; // Green
                            data[i + 2] = 128; // Blue
                            data[i + 3] = 255; // Alpha
                        }
                        return { data, width, height };
                    }),

                    getImageData: jest.fn((x, y, width, height) => {
                        const data = new Uint8ClampedArray(width * height * 4);
                        // Fill with test data
                        for (let i = 0; i < data.length; i += 4) {
                            data[i] = Math.floor(Math.random() * 256);
                            data[i + 1] = Math.floor(Math.random() * 256);
                            data[i + 2] = Math.floor(Math.random() * 256);
                            data[i + 3] = 255;
                        }
                        return { data, width, height };
                    }),

                    putImageData: jest.fn(),

                    // Transform methods
                    save: jest.fn(),
                    restore: jest.fn(),
                    scale: jest.fn(),
                    rotate: jest.fn(),
                    translate: jest.fn(),
                    transform: jest.fn(),
                    setTransform: jest.fn(),
                    resetTransform: jest.fn(),

                    // Gradient and pattern methods
                    createLinearGradient: jest.fn(),
                    createRadialGradient: jest.fn(),
                    createPattern: jest.fn(),

                    // Shadow methods
                    shadowColor: '#000000',
                    shadowBlur: 0,
                    shadowOffsetX: 0,
                    shadowOffsetY: 0,

                    // Compositing
                    globalAlpha: 1.0,
                    globalCompositeOperation: 'source-over'
                };
            }
            return null;
        }),

        // DOM methods
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),

        // Size methods
        getBoundingClientRect: jest.fn(() => ({
            top: 0,
            left: 0,
            bottom: 512,
            right: 512,
            width: 512,
            height: 512
        })),

        // Export methods
        toDataURL: jest.fn(() => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),
        toBlob: jest.fn((callback) => {
            const blob = new Blob(['fake-image-data'], { type: 'image/png' });
            callback(blob);
        })
    };

    return canvas;
};

// Override document.createElement for enhanced canvas support
const originalCreateElement = global.document.createElement;
global.document.createElement = jest.fn((tagName) => {
    if (tagName === 'canvas') {
        return createEnhancedCanvasMock();
    }
    return originalCreateElement.call(global.document, tagName);
});

// Enhanced window globals with more realistic implementations
global.window.Helpers = {
    log: jest.fn((message, level = 'info') => {
        if (process.env.NODE_ENV === 'test' && process.env.VERBOSE_TESTS) {
            console.log(`[${level.toUpperCase()}] ${message}`);
        }
    }),

    Color: {
        hexToRgb: jest.fn((hex) => {
            // More comprehensive hex to RGB conversion
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (result) {
                return {
                    r: parseInt(result[1], 16) / 255,
                    g: parseInt(result[2], 16) / 255,
                    b: parseInt(result[3], 16) / 255
                };
            }
            // Fallback for invalid hex
            return { r: 0.5, g: 0.5, b: 0.5 };
        }),

        rgbToHex: jest.fn((r, g, b) => {
            const toHex = (c) => {
                const hex = Math.round(c * 255).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            };
            return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        })
    },

    handleError: jest.fn((error, context) => {
        console.error(`[${context}] ${error.message}`);
    })
};

global.window.LoadingManager = {
    updateProgress: jest.fn((message, percentage) => {
        if (process.env.VERBOSE_TESTS) {
            console.log(`Loading: ${message} (${percentage}%)`);
        }
    }),

    complete: jest.fn(),
    init: jest.fn(),
    setStatus: jest.fn()
};

global.window.MathUtils = {
    Noise: {
        fractalNoise2D: jest.fn((x, y, octaves = 4, persistence = 0.5) => {
            let total = 0;
            let frequency = 1;
            let amplitude = 1;
            let maxValue = 0;

            for (let i = 0; i < octaves; i++) {
                total += Math.sin(x * frequency) * Math.cos(y * frequency) * amplitude;
                maxValue += amplitude;
                amplitude *= persistence;
                frequency *= 2;
            }

            return total / maxValue;
        }),

        noise2D: jest.fn((x, y) => {
            // Simple noise implementation for testing
            return Math.sin(x * 0.1 + y * 0.1) * 0.5 + 0.5;
        }),

        perlinNoise2D: jest.fn((x, y) => {
            // Simplified Perlin noise for testing
            return Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5;
        })
    },

    Random: {
        range: jest.fn((min, max) => Math.random() * (max - min) + min),
        choice: jest.fn((array) => array[Math.floor(Math.random() * array.length)]),
        gaussian: jest.fn(() => {
            // Box-Muller transform for Gaussian distribution
            let u = 0, v = 0;
            while(u === 0) u = Math.random();
            while(v === 0) v = Math.random();
            return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        })
    }
};

// Mock NotificationSystem for testing
global.window.NotificationSystem = {
    showInfo: jest.fn(),
    showWarning: jest.fn(),
    showError: jest.fn(),
    showSuccess: jest.fn(),
    init: jest.fn(),
    dispose: jest.fn()
};

// Mock performance API
global.performance = global.performance || {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => [])
};

// Mock Image constructor for texture loading tests
global.Image = jest.fn(function() {
    const img = {
        src: '',
        width: 512,
        height: 512,
        complete: false,
        naturalWidth: 512,
        naturalHeight: 512,

        addEventListener: jest.fn((event, callback) => {
            if (event === 'load') {
                setTimeout(() => {
                    img.complete = true;
                    callback();
                }, 0);
            }
        }),

        removeEventListener: jest.fn()
    };

    Object.defineProperty(img, 'src', {
        get() { return this._src; },
        set(value) {
            this._src = value;
            // Simulate async loading
            setTimeout(() => {
                img.complete = true;
                img.dispatchEvent(new Event('load'));
            }, 0);
        }
    });

    img.dispatchEvent = jest.fn();

    return img;
});

// Mock Blob and URL for testing file operations
global.Blob = jest.fn(function(parts, options) {
    return {
        size: parts.reduce((total, part) => total + part.length, 0),
        type: options?.type || '',
        arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
        text: jest.fn(() => Promise.resolve('')),
        slice: jest.fn()
    };
});

global.URL = {
    createObjectURL: jest.fn(() => 'blob:mock-url'),
    revokeObjectURL: jest.fn()
};

// Mock FileReader for testing
global.FileReader = jest.fn(function() {
    return {
        readAsDataURL: jest.fn(function(file) {
            setTimeout(() => {
                this.result = 'data:image/png;base64,mock-data';
                this.onload?.();
            }, 0);
        }),
        readAsArrayBuffer: jest.fn(),
        readAsText: jest.fn(),
        result: null,
        onload: null,
        onerror: null
    };
});

// Enhanced console mocking for test output control
if (process.env.NODE_ENV === 'test' && !process.env.VERBOSE_TESTS) {
    const originalConsole = { ...console };
    global.console = {
        ...originalConsole,
        log: jest.fn(),
        warn: jest.fn(),
        error: originalConsole.error, // Keep errors visible
        info: jest.fn(),
        debug: jest.fn()
    };
}

// Mock requestAnimationFrame and cancelAnimationFrame
let rafId = 0;
global.requestAnimationFrame = jest.fn((callback) => {
    return setTimeout(callback, 16); // ~60fps
});

global.cancelAnimationFrame = jest.fn((id) => {
    clearTimeout(id);
});

// Test utilities for texture loader
global.TextureLoaderTestUtils = {
    /**
     * Create a mock planet data object for testing
     */
    createMockPlanetData: (overrides = {}) => ({
        name: 'TestPlanet',
        texture_filename: 'test_texture.jpg',
        color_hex: '#888888',
        planet_type: 'terrestrial',
        has_rings: false,
        has_moons: false,
        ...overrides
    }),

    /**
     * Wait for texture loading to complete
     */
    waitForTextureLoad: async (timeout = 1000) => {
        return new Promise((resolve) => {
            setTimeout(resolve, timeout);
        });
    },

    /**
     * Simulate texture loading error
     */
    simulateTextureError: (textureLoader) => {
        textureLoader.load.mockImplementation((url, onLoad, onProgress, onError) => {
            setTimeout(() => onError(new Error('Simulated texture error')), 0);
        });
    },

    /**
     * Simulate successful texture loading
     */
    simulateTextureSuccess: (textureLoader) => {
        textureLoader.load.mockImplementation((url, onLoad, onProgress, onError) => {
            setTimeout(() => {
                const mockTexture = {
                    image: { width: 512, height: 512 },
                    dispose: jest.fn(),
                    uuid: Math.random().toString(36)
                };
                onLoad(mockTexture);
            }, 0);
        });
    }
};

console.log('🔧 Enhanced texture loader test setup completed');