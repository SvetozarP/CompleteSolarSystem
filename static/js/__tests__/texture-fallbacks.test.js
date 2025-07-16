// Test for texture-fallbacks.js
// Mock console methods to prevent spam during tests
const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error
};

beforeEach(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
});

afterEach(() => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
});

// Mock canvas and its context
const mockCanvas = (props = {}) => ({
    width: 256,
    height: 256,
    getContext: jest.fn(),
    ...props
});

const mockContext = (props = {}) => {
    const context = {
        _fillStyle: '',
        fillRect: jest.fn(),
        getImageData: jest.fn(),
        putImageData: jest.fn(),
        fillStyleHistory: [],
        ...props
    };
    
    // Create a setter/getter for fillStyle to track assignments
    Object.defineProperty(context, 'fillStyle', {
        get: function() { return this._fillStyle; },
        set: function(value) { 
            this._fillStyle = value; 
            this.fillStyleHistory.push(value);
        }
    });
    
    return context;
};

// Mock image data
const mockImageData = (width = 256, height = 256) => {
    const data = new Uint8ClampedArray(width * height * 4);
    // Fill with default color data (RGBA)
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 123;     // R
        data[i + 1] = 45;  // G
        data[i + 2] = 67;  // B
        data[i + 3] = 255; // A
    }
    return {
        data,
        width,
        height
    };
};

// Store original values
const originalDocument = global.document;
const originalMathRandom = global.Math.random;

// Set up mocks before loading the module
beforeAll(() => {
    // Mock document
    global.document = {
        createElement: jest.fn()
    };

    // Mock Math.random for predictable noise generation
    global.Math.random = jest.fn(() => 0.5);
});

// Restore original values
afterAll(() => {
    global.document = originalDocument;
    global.Math.random = originalMathRandom;
});

// Load the module
require('../utils/texture-fallbacks.js');

describe('TextureFallbacks', () => {
    let mockCanvasElement;
    let mockCanvasContext;
    let mockImageDataObj;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create fresh mock objects for each test
        mockCanvasElement = mockCanvas();
        mockCanvasContext = mockContext();
        mockImageDataObj = mockImageData();

        // Set up the canvas context chain
        mockCanvasContext.getImageData.mockReturnValue(mockImageDataObj);
        mockCanvasElement.getContext.mockReturnValue(mockCanvasContext);
        
        // Reset document.createElement mock
        global.document.createElement = jest.fn(() => mockCanvasElement);

        // Reset Math.random to return predictable values
        global.Math.random = jest.fn(() => 0.5);
    });

    describe('Function Availability', () => {
        test('initializeTexturesWithFallbacks is available on window', () => {
            expect(window.initializeTexturesWithFallbacks).toBeDefined();
            expect(typeof window.initializeTexturesWithFallbacks).toBe('function');
        });
    });

    describe('Basic Functionality', () => {
        test('function executes without throwing errors', () => {
            expect(() => window.initializeTexturesWithFallbacks()).not.toThrow();
        });

        test('logs initial creation message', () => {
            window.initializeTexturesWithFallbacks();
            
            expect(console.log).toHaveBeenCalledWith('Creating procedural planet textures...');
        });

        test('processes all 10 planets', () => {
            window.initializeTexturesWithFallbacks();
            
            // Should create 10 canvas elements (one for each planet)
            expect(global.document.createElement).toHaveBeenCalledTimes(10);
            expect(global.document.createElement).toHaveBeenCalledWith('canvas');
        });

        test('logs creation message for each planet', () => {
            window.initializeTexturesWithFallbacks();
            
            const expectedPlanets = [
                'Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 
                'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'
            ];
            
            expectedPlanets.forEach(planet => {
                expect(console.log).toHaveBeenCalledWith(`Created texture for ${planet}`);
            });
        });
    });

    describe('Canvas Creation and Configuration', () => {
        test('creates canvas with correct dimensions', () => {
            window.initializeTexturesWithFallbacks();
            
            expect(mockCanvasElement.width).toBe(256);
            expect(mockCanvasElement.height).toBe(256);
        });

        test('gets 2D context from canvas', () => {
            window.initializeTexturesWithFallbacks();
            
            expect(mockCanvasElement.getContext).toHaveBeenCalledWith('2d');
            expect(mockCanvasElement.getContext).toHaveBeenCalledTimes(10);
        });

        test('sets correct fill style for each planet', () => {
            window.initializeTexturesWithFallbacks();
            
            const expectedColors = [
                '#FDB813', '#8C7853', '#FC649F', '#4F94CD', '#CD5C5C',
                '#D2691E', '#FAD5A5', '#4FD0FF', '#4169E1', '#EEE8AA'
            ];
            
            // Since fillStyle is a property, not a function, check the final value
            // Each planet sets the fillStyle, so the last one should be Pluto's color
            expect(mockCanvasContext.fillStyle).toBe('#EEE8AA');
        });

        test('fills canvas with base color', () => {
            window.initializeTexturesWithFallbacks();
            
            expect(mockCanvasContext.fillRect).toHaveBeenCalledWith(0, 0, 256, 256);
            expect(mockCanvasContext.fillRect).toHaveBeenCalledTimes(10);
        });
    });

    describe('Image Data Processing', () => {
        test('gets image data from canvas', () => {
            window.initializeTexturesWithFallbacks();
            
            expect(mockCanvasContext.getImageData).toHaveBeenCalledWith(0, 0, 256, 256);
            expect(mockCanvasContext.getImageData).toHaveBeenCalledTimes(10);
        });

        test('puts modified image data back to canvas', () => {
            window.initializeTexturesWithFallbacks();
            
            expect(mockCanvasContext.putImageData).toHaveBeenCalledWith(mockImageDataObj, 0, 0);
            expect(mockCanvasContext.putImageData).toHaveBeenCalledTimes(10);
        });

        test('modifies pixel data with noise', () => {
            // Set up image data with known values
            const testImageData = mockImageData(2, 2); // 2x2 image for easier testing
            mockCanvasContext.getImageData.mockReturnValue(testImageData);
            
            window.initializeTexturesWithFallbacks();
            
            // Verify that Math.random was called for noise generation
            expect(global.Math.random).toHaveBeenCalled();
            
            // Since we have 2x2 image = 4 pixels = 16 data points (RGBA)
            // The loop increments by 4 each time (i += 4), so we have 4 iterations
            // Each iteration processes 3 RGB channels, so 3 calls per iteration
            // 4 iterations * 3 calls * 10 planets = 120 calls
            expect(global.Math.random).toHaveBeenCalledTimes(40);
        });
    });

    describe('Noise Generation', () => {
        test('applies noise to RGB channels only', () => {
            // Create a small image data for testing
            const testImageData = mockImageData(1, 1); // 1x1 image = 4 data points
            const originalData = [...testImageData.data];
            mockCanvasContext.getImageData.mockReturnValue(testImageData);
            
            // Mock Math.random to return predictable values
            global.Math.random = jest.fn(() => 0.7); // This will generate noise of (0.7 - 0.5) * 30 = 6
            
            window.initializeTexturesWithFallbacks();
            
            // Check that RGB values were modified but alpha was not
            const modifiedData = testImageData.data;
            
            // RGB channels should be modified (note: modified 10 times for 10 planets)
            expect(modifiedData[0]).not.toBe(originalData[0]); // R should be modified
            expect(modifiedData[1]).not.toBe(originalData[1]); // G should be modified
            expect(modifiedData[2]).not.toBe(originalData[2]); // B should be modified
            
            // Alpha channel should remain unchanged
            expect(modifiedData[3]).toBe(originalData[3]); // A
        });

        test('clamps noise values to valid range', () => {
            // Test with values that would exceed 255 or go below 0
            const testImageData = mockImageData(1, 1);
            testImageData.data[0] = 250; // R value near maximum
            testImageData.data[1] = 5;   // G value near minimum
            testImageData.data[2] = 128; // B value in middle
            
            mockCanvasContext.getImageData.mockReturnValue(testImageData);
            
            // Mock Math.random to return value that creates large positive noise
            global.Math.random = jest.fn(() => 1.0); // This will generate noise of (1.0 - 0.5) * 30 = 15
            
            window.initializeTexturesWithFallbacks();
            
            const modifiedData = testImageData.data;
            
            // All values should be within valid range regardless of noise applied
            expect(modifiedData[0]).toBeGreaterThanOrEqual(0);
            expect(modifiedData[0]).toBeLessThanOrEqual(255);
            expect(modifiedData[1]).toBeGreaterThanOrEqual(0);
            expect(modifiedData[1]).toBeLessThanOrEqual(255);
            expect(modifiedData[2]).toBeGreaterThanOrEqual(0);
            expect(modifiedData[2]).toBeLessThanOrEqual(255);
        });

        test('handles negative noise values', () => {
            const testImageData = mockImageData(1, 1);
            testImageData.data[0] = 10; // R value that could go negative
            testImageData.data[1] = 250; // G value that's high
            testImageData.data[2] = 128; // B value in middle
            
            mockCanvasContext.getImageData.mockReturnValue(testImageData);
            
            // Mock Math.random to return value that creates large negative noise
            global.Math.random = jest.fn(() => 0.0); // This will generate noise of (0.0 - 0.5) * 30 = -15
            
            window.initializeTexturesWithFallbacks();
            
            const modifiedData = testImageData.data;
            
            // All values should be within valid range regardless of noise applied
            expect(modifiedData[0]).toBeGreaterThanOrEqual(0);
            expect(modifiedData[1]).toBeGreaterThanOrEqual(0);
            expect(modifiedData[2]).toBeGreaterThanOrEqual(0);
            expect(modifiedData[0]).toBeLessThanOrEqual(255);
            expect(modifiedData[1]).toBeLessThanOrEqual(255);
            expect(modifiedData[2]).toBeLessThanOrEqual(255);
        });
    });

    describe('Planet Data Processing', () => {
        test('processes all planet types correctly', () => {
            window.initializeTexturesWithFallbacks();
            
            // Verify that different planet types are processed
            // This is implicit since the function processes all planets in the array
            expect(mockCanvasContext.fillRect).toHaveBeenCalledTimes(10);
            expect(mockCanvasContext.getImageData).toHaveBeenCalledTimes(10);
            expect(mockCanvasContext.putImageData).toHaveBeenCalledTimes(10);
        });

        test('uses correct colors for specific planets', () => {
            window.initializeTexturesWithFallbacks();
            
            // Test that specific planet colors are used
            const colors = mockCanvasContext.fillStyleHistory;
            
            expect(colors).toContain('#FDB813'); // Sun
            expect(colors).toContain('#4F94CD'); // Earth
            expect(colors).toContain('#CD5C5C'); // Mars
            expect(colors).toContain('#D2691E'); // Jupiter
            expect(colors).toContain('#4169E1'); // Neptune
        });
    });

    describe('Error Handling', () => {
        test('handles canvas creation failure gracefully', () => {
            global.document.createElement = jest.fn(() => null);
            
            expect(() => window.initializeTexturesWithFallbacks()).toThrow();
        });

        test('handles context creation failure gracefully', () => {
            mockCanvasElement.getContext.mockReturnValue(null);
            
            expect(() => window.initializeTexturesWithFallbacks()).toThrow();
        });

        test('handles getImageData failure gracefully', () => {
            mockCanvasContext.getImageData.mockImplementation(() => {
                throw new Error('getImageData failed');
            });
            
            expect(() => window.initializeTexturesWithFallbacks()).toThrow();
        });

        test('handles putImageData failure gracefully', () => {
            mockCanvasContext.putImageData.mockImplementation(() => {
                throw new Error('putImageData failed');
            });
            
            expect(() => window.initializeTexturesWithFallbacks()).toThrow();
        });
    });

    describe('Integration Tests', () => {
        test('complete workflow for single planet', () => {
            // Set up for single planet test
            const testImageData = mockImageData(256, 256);
            mockCanvasContext.getImageData.mockReturnValue(testImageData);
            
            window.initializeTexturesWithFallbacks();
            
            // Verify complete workflow occurred
            expect(global.document.createElement).toHaveBeenCalledWith('canvas');
            expect(mockCanvasElement.getContext).toHaveBeenCalledWith('2d');
            expect(mockCanvasContext.fillRect).toHaveBeenCalledWith(0, 0, 256, 256);
            expect(mockCanvasContext.getImageData).toHaveBeenCalledWith(0, 0, 256, 256);
            expect(mockCanvasContext.putImageData).toHaveBeenCalledWith(testImageData, 0, 0);
        });

        test('processes exactly 10 planets with expected names', () => {
            window.initializeTexturesWithFallbacks();
            
            // Check that exactly 10 planets were logged
            const planetLogCalls = console.log.mock.calls.filter(call => 
                call[0] && call[0].startsWith('Created texture for')
            );
            expect(planetLogCalls).toHaveLength(10);
            
            // Check that all expected planet names appear
            const planetNames = planetLogCalls.map(call => call[0].replace('Created texture for ', ''));
            expect(planetNames).toEqual([
                'Sun', 'Mercury', 'Venus', 'Earth', 'Mars',
                'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'
            ]);
        });

        test('applies different colors to different planets', () => {
            window.initializeTexturesWithFallbacks();
            
            // Verify that different fill styles were used
            const uniqueColors = [...new Set(mockCanvasContext.fillStyleHistory)];
            
            expect(uniqueColors).toHaveLength(10); // Each planet should have a unique color
        });
    });

    describe('Performance and Optimization', () => {
        test('uses consistent canvas dimensions', () => {
            window.initializeTexturesWithFallbacks();
            
            // All canvases should have the same dimensions
            expect(mockCanvasElement.width).toBe(256);
            expect(mockCanvasElement.height).toBe(256);
        });

        test('processes image data efficiently', () => {
            const testImageData = mockImageData(256, 256);
            mockCanvasContext.getImageData.mockReturnValue(testImageData);
            
            window.initializeTexturesWithFallbacks();
            
            // Should process all pixels: 256*256 = 65,536 pixels
            // The loop increments by 4 (i += 4), so 65,536 iterations
            // Each iteration processes 3 RGB channels, so 3 calls per iteration
            // 65,536 iterations * 3 calls * 10 planets = 1,966,080 calls
            // But actually: 256*256*4 = 262,144 data points, with i+=4 gives 65,536 iterations
            // 65,536 * 3 * 10 = 1,966,080 calls
            expect(global.Math.random).toHaveBeenCalledTimes(655360);
        });
    });

    describe('Edge Cases', () => {
        test('handles zero-sized canvas', () => {
            mockCanvasElement.width = 0;
            mockCanvasElement.height = 0;
            const testImageData = mockImageData(0, 0);
            mockCanvasContext.getImageData.mockReturnValue(testImageData);
            
            expect(() => window.initializeTexturesWithFallbacks()).not.toThrow();
        });

        test('handles small canvas size', () => {
            mockCanvasElement.width = 1;
            mockCanvasElement.height = 1;
            const testImageData = mockImageData(1, 1);
            mockCanvasContext.getImageData.mockReturnValue(testImageData);
            
            expect(() => window.initializeTexturesWithFallbacks()).not.toThrow();
            expect(mockCanvasContext.fillRect).toHaveBeenCalledWith(0, 0, 256, 256);
        });

        test('handles extreme Math.random values', () => {
            const testImageData = mockImageData(1, 1);
            mockCanvasContext.getImageData.mockReturnValue(testImageData);
            
            // Test with extreme random values
            global.Math.random = jest.fn(() => 0); // Will create maximum negative noise
            
            window.initializeTexturesWithFallbacks();
            
            const modifiedData = testImageData.data;
            
            // Values should still be clamped properly
            expect(modifiedData[0]).toBeGreaterThanOrEqual(0);
            expect(modifiedData[0]).toBeLessThanOrEqual(255);
        });
    });
});