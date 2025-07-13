// static/js/__tests__/helpers.test.js
// Comprehensive test suite for helpers.js utility functions

// Mock console methods to avoid test output pollution
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

// Load the helpers module
require('../utils/helpers.js');

describe('Helpers Module', () => {
    beforeEach(() => {
        // Reset any global state
        delete window.SolarSystemConfig;
        delete window.NotificationSystem;
    });

    describe('Module Loading', () => {
        test('should load helpers module successfully', () => {
            expect(window.Helpers).toBeDefined();
            expect(typeof window.Helpers).toBe('object');
        });

        test('should have all required sub-modules', () => {
            expect(window.Helpers.MathHelper).toBeDefined();
            expect(window.Helpers.Color).toBeDefined();
            expect(window.Helpers.DOM).toBeDefined();
            expect(window.Helpers.Performance).toBeDefined();
            expect(window.Helpers.Validation).toBeDefined();
            expect(window.Helpers.Animation).toBeDefined();
            expect(window.Helpers.CONSTANTS).toBeDefined();
        });

        test('should have convenience methods', () => {
            expect(typeof window.Helpers.log).toBe('function');
            expect(typeof window.Helpers.handleError).toBe('function');
        });
    });

    describe('CONSTANTS', () => {
        test('should have all required constants', () => {
            const { CONSTANTS } = window.Helpers;
            expect(CONSTANTS.AU_TO_KM).toBe(149597870.7);
            expect(CONSTANTS.EARTH_RADIUS).toBe(6371);
            expect(CONSTANTS.DEGREES_TO_RADIANS).toBe(Math.PI / 180);
            expect(CONSTANTS.RADIANS_TO_DEGREES).toBe(180 / Math.PI);
            expect(CONSTANTS.MAX_SAFE_DISTANCE).toBe(1000000);
        });
    });

    describe('MathHelper', () => {
        const { MathHelper } = window.Helpers;

        describe('clamp', () => {
            test('should clamp values within range', () => {
                expect(MathHelper.clamp(5, 0, 10)).toBe(5);
                expect(MathHelper.clamp(-5, 0, 10)).toBe(0);
                expect(MathHelper.clamp(15, 0, 10)).toBe(10);
            });

            test('should handle edge cases', () => {
                expect(MathHelper.clamp(0, 0, 10)).toBe(0);
                expect(MathHelper.clamp(10, 0, 10)).toBe(10);
                expect(MathHelper.clamp(5, 5, 5)).toBe(5);
            });
        });

        describe('lerp', () => {
            test('should interpolate between values', () => {
                expect(MathHelper.lerp(0, 10, 0.5)).toBe(5);
                expect(MathHelper.lerp(0, 10, 0)).toBe(0);
                expect(MathHelper.lerp(0, 10, 1)).toBe(10);
            });

            test('should clamp interpolation factor', () => {
                expect(MathHelper.lerp(0, 10, -0.5)).toBe(0);
                expect(MathHelper.lerp(0, 10, 1.5)).toBe(10);
            });
        });

        describe('degToRad', () => {
            test('should convert degrees to radians', () => {
                expect(MathHelper.degToRad(0)).toBe(0);
                expect(MathHelper.degToRad(90)).toBeCloseTo(Math.PI / 2);
                expect(MathHelper.degToRad(180)).toBeCloseTo(Math.PI);
                expect(MathHelper.degToRad(360)).toBeCloseTo(2 * Math.PI);
            });
        });

        describe('radToDeg', () => {
            test('should convert radians to degrees', () => {
                expect(MathHelper.radToDeg(0)).toBe(0);
                expect(MathHelper.radToDeg(Math.PI / 2)).toBeCloseTo(90);
                expect(MathHelper.radToDeg(Math.PI)).toBeCloseTo(180);
                expect(MathHelper.radToDeg(2 * Math.PI)).toBeCloseTo(360);
            });
        });

        describe('distance3D', () => {
            test('should calculate distance between 3D points', () => {
                const point1 = { x: 0, y: 0, z: 0 };
                const point2 = { x: 3, y: 4, z: 0 };
                expect(MathHelper.distance3D(point1, point2)).toBe(5);
            });

            test('should handle negative coordinates', () => {
                const point1 = { x: -1, y: -1, z: -1 };
                const point2 = { x: 1, y: 1, z: 1 };
                expect(MathHelper.distance3D(point1, point2)).toBeCloseTo(Math.sqrt(12));
            });
        });

        describe('random', () => {
            test('should generate random numbers within range', () => {
                const result = MathHelper.random(5, 10);
                expect(result).toBeGreaterThanOrEqual(5);
                expect(result).toBeLessThanOrEqual(10);
            });

            test('should handle equal min and max', () => {
                const result = MathHelper.random(5, 5);
                expect(result).toBe(5);
            });
        });

        describe('randomInt', () => {
            test('should generate random integers within range', () => {
                const result = MathHelper.randomInt(5, 10);
                expect(Number.isInteger(result)).toBe(true);
                expect(result).toBeGreaterThanOrEqual(5);
                expect(result).toBeLessThanOrEqual(10);
            });
        });

        describe('normalize', () => {
            test('should normalize values between ranges', () => {
                expect(MathHelper.normalize(50, 0, 100, 0, 1)).toBe(0.5);
                expect(MathHelper.normalize(0, 0, 100, 0, 1)).toBe(0);
                expect(MathHelper.normalize(100, 0, 100, 0, 1)).toBe(1);
            });

            test('should handle different output ranges', () => {
                expect(MathHelper.normalize(5, 0, 10, 0, 100)).toBe(50);
                expect(MathHelper.normalize(25, 0, 100, -1, 1)).toBe(-0.5);
            });
        });
    });

    describe('Color', () => {
        const { Color } = window.Helpers;

        describe('hexToRgb', () => {
            test('should convert hex to RGB', () => {
                const result = Color.hexToRgb('#FF0000');
                expect(result).toEqual({ r: 1, g: 0, b: 0 });
            });

            test('should handle hex without hash', () => {
                const result = Color.hexToRgb('00FF00');
                expect(result).toEqual({ r: 0, g: 1, b: 0 });
            });

            test('should return null for invalid hex', () => {
                expect(Color.hexToRgb('invalid')).toBeNull();
                expect(Color.hexToRgb('#GG0000')).toBeNull();
            });
        });

        describe('rgbToHex', () => {
            test('should convert RGB to hex', () => {
                expect(Color.rgbToHex(255, 0, 0)).toBe('#ff0000');
                expect(Color.rgbToHex(0, 255, 0)).toBe('#00ff00');
                expect(Color.rgbToHex(0, 0, 255)).toBe('#0000ff');
            });
        });

        describe('randomHex', () => {
            test('should generate valid hex color', () => {
                const result = Color.randomHex();
                expect(result).toMatch(/^#[0-9a-f]{6}$/);
            });
        });

        describe('adjustBrightness', () => {
            test('should adjust brightness of hex color', () => {
                const result = Color.adjustBrightness('#808080', 50);
                expect(result).toMatch(/^#[0-9a-f]{6}$/);
            });

            test('should handle invalid hex input', () => {
                const result = Color.adjustBrightness('invalid', 50);
                expect(result).toBe('invalid');
            });
        });
    });

    describe('DOM', () => {
        const { DOM } = window.Helpers;

        describe('getElementById', () => {
            test('should get element by ID', () => {
                const element = document.createElement('div');
                element.id = 'test-element';
                document.body.appendChild(element);

                const result = DOM.getElementById('test-element');
                expect(result).toBe(element);

                document.body.removeChild(element);
            });

            test('should warn for non-existent element', () => {
                const result = DOM.getElementById('non-existent');
                expect(result).toBeNull();
                expect(console.warn).toHaveBeenCalledWith("Element with ID 'non-existent' not found");
            });
        });

        describe('createElement', () => {
            test('should create element with attributes', () => {
                const element = DOM.createElement('div', {
                    id: 'test',
                    className: 'test-class',
                    'data-test': 'value'
                }, 'Hello World');

                expect(element.tagName).toBe('DIV');
                expect(element.id).toBe('test');
                expect(element.className).toBe('test-class');
                expect(element.getAttribute('data-test')).toBe('value');
                expect(element.innerHTML).toBe('Hello World');
            });

            test('should handle dataset attributes', () => {
                const element = DOM.createElement('div', {
                    dataset: {
                        value: 'test',
                        number: '123'
                    }
                });

                expect(element.dataset.value).toBe('test');
                expect(element.dataset.number).toBe('123');
            });

            test('should create element without attributes', () => {
                const element = DOM.createElement('span');
                expect(element.tagName).toBe('SPAN');
                expect(element.innerHTML).toBe('');
            });
        });

        describe('addEventListenerWithCleanup', () => {
            test('should add event listener and return cleanup function', () => {
                const element = document.createElement('button');
                const handler = jest.fn();

                const cleanup = DOM.addEventListenerWithCleanup(element, 'click', handler);

                // Trigger event
                element.click();
                expect(handler).toHaveBeenCalled();

                // Cleanup
                cleanup();
                handler.mockClear();
                element.click();
                expect(handler).not.toHaveBeenCalled();
            });
        });

        describe('isElementVisible', () => {
            test('should check if element is visible', () => {
                const element = document.createElement('div');

                // Mock getBoundingClientRect
                element.getBoundingClientRect = jest.fn(() => ({
                    top: 10,
                    left: 10,
                    bottom: 100,
                    right: 100
                }));

                // Mock window dimensions
                Object.defineProperty(window, 'innerHeight', {
                    writable: true,
                    configurable: true,
                    value: 500
                });
                Object.defineProperty(window, 'innerWidth', {
                    writable: true,
                    configurable: true,
                    value: 500
                });

                expect(DOM.isElementVisible(element)).toBe(true);
            });
        });
    });

    describe('Performance', () => {
        const { Performance } = window.Helpers;

        describe('measure', () => {
            test('should measure function execution time', () => {
                const testFunction = (x) => x * 2;
                const result = Performance.measure(testFunction, 5);

                expect(result.result).toBe(10);
                expect(typeof result.executionTime).toBe('number');
                expect(result.executionTime).toBeGreaterThanOrEqual(0);
            });
        });

        describe('debounce', () => {
            test('should debounce function calls', (done) => {
                const mockFn = jest.fn();
                const debouncedFn = Performance.debounce(mockFn, 100);

                debouncedFn();
                debouncedFn();
                debouncedFn();

                expect(mockFn).not.toHaveBeenCalled();

                setTimeout(() => {
                    expect(mockFn).toHaveBeenCalledTimes(1);
                    done();
                }, 150);
            });
        });

        describe('throttle', () => {
            test('should throttle function calls', (done) => {
                const mockFn = jest.fn();
                const throttledFn = Performance.throttle(mockFn, 100);

                throttledFn();
                throttledFn();
                throttledFn();

                expect(mockFn).toHaveBeenCalledTimes(1);

                setTimeout(() => {
                    throttledFn();
                    expect(mockFn).toHaveBeenCalledTimes(2);
                    done();
                }, 150);
            });
        });

        describe('createFPSCounter', () => {
            test('should create FPS counter', () => {
                const counter = Performance.createFPSCounter();
                expect(typeof counter.update).toBe('function');
                expect(typeof counter.getFPS).toBe('function');
                expect(counter.getFPS()).toBe(60);
            });
        });
    });

    describe('Validation', () => {
        const { Validation } = window.Helpers;

        describe('isValidNumber', () => {
            test('should validate numbers', () => {
                expect(Validation.isValidNumber(42)).toBe(true);
                expect(Validation.isValidNumber(3.14)).toBe(true);
                expect(Validation.isValidNumber(0)).toBe(true);
                expect(Validation.isValidNumber(-5)).toBe(true);
            });

            test('should reject invalid numbers', () => {
                expect(Validation.isValidNumber(NaN)).toBe(false);
                expect(Validation.isValidNumber(Infinity)).toBe(false);
                expect(Validation.isValidNumber(-Infinity)).toBe(false);
                expect(Validation.isValidNumber('42')).toBe(false);
                expect(Validation.isValidNumber(null)).toBe(false);
                expect(Validation.isValidNumber(undefined)).toBe(false);
            });
        });

        describe('hasRequiredProperties', () => {
            test('should check for required properties', () => {
                const obj = { a: 1, b: 2, c: 3 };
                expect(Validation.hasRequiredProperties(obj, ['a', 'b'])).toBe(true);
                expect(Validation.hasRequiredProperties(obj, ['a', 'b', 'c'])).toBe(true);
                expect(Validation.hasRequiredProperties(obj, ['a', 'b', 'd'])).toBe(false);
            });

            test('should handle empty arrays', () => {
                const obj = { a: 1 };
                expect(Validation.hasRequiredProperties(obj, [])).toBe(true);
            });
        });

        describe('isValidPlanetData', () => {
            test('should validate planet data', () => {
                const validPlanet = {
                    name: 'Earth',
                    distance_from_sun: 1,
                    diameter: 12742,
                    color_hex: '#6B93D6'
                };
                expect(Validation.isValidPlanetData(validPlanet)).toBe(true);
            });

            test('should reject invalid planet data', () => {
                const invalidPlanet = {
                    name: 'Earth',
                    distance_from_sun: 'invalid',
                    diameter: 12742,
                    color_hex: '#6B93D6'
                };
                expect(Validation.isValidPlanetData(invalidPlanet)).toBe(false);
            });

            test('should reject incomplete planet data', () => {
                const incompletePlanet = {
                    name: 'Earth',
                    distance_from_sun: 1
                };
                expect(Validation.isValidPlanetData(incompletePlanet)).toBe(false);
            });
        });
    });

    describe('Animation', () => {
        const { Animation } = window.Helpers;

        describe('easing functions', () => {
            test('should have all easing functions', () => {
                expect(typeof Animation.easing.linear).toBe('function');
                expect(typeof Animation.easing.easeInQuad).toBe('function');
                expect(typeof Animation.easing.easeOutQuad).toBe('function');
                expect(typeof Animation.easing.easeInOutQuad).toBe('function');
                expect(typeof Animation.easing.easeInCubic).toBe('function');
                expect(typeof Animation.easing.easeOutCubic).toBe('function');
                expect(typeof Animation.easing.easeInOutCubic).toBe('function');
            });

            test('should return correct values for linear easing', () => {
                expect(Animation.easing.linear(0)).toBe(0);
                expect(Animation.easing.linear(0.5)).toBe(0.5);
                expect(Animation.easing.linear(1)).toBe(1);
            });
        });

        describe('animate', () => {
            test('should animate values', async () => {
                const onUpdate = jest.fn();
                const onComplete = jest.fn();

                const result = await Animation.animate({
                    from: 0,
                    to: 100,
                    duration: 100,
                    onUpdate,
                    onComplete
                });

                expect(result).toBe(100);
                expect(onUpdate).toHaveBeenCalled();
                expect(onComplete).toHaveBeenCalledWith(100);
            });

            test('should use default values', async () => {
                const result = await Animation.animate({
                    from: 0,
                    to: 10
                });

                expect(result).toBe(10);
            });
        });
    });

    describe('Convenience Methods', () => {
        describe('log', () => {
            test('should log info messages', () => {
                window.Helpers.log('Test message');
                expect(console.log).toHaveBeenCalled();
            });

            test('should log error messages', () => {
                window.Helpers.log('Error message', 'error');
                expect(console.error).toHaveBeenCalled();
            });

            test('should log warning messages', () => {
                window.Helpers.log('Warning message', 'warn');
                expect(console.warn).toHaveBeenCalled();
            });

            test('should log debug messages when debug enabled', () => {
                window.SolarSystemConfig = { debug: true };
                window.Helpers.log('Debug message', 'debug');
                expect(console.log).toHaveBeenCalled();
            });

            test('should not log debug messages when debug disabled', () => {
                window.SolarSystemConfig = { debug: false };
                window.Helpers.log('Debug message', 'debug');
                expect(console.log).not.toHaveBeenCalled();
            });
        });

        describe('handleError', () => {
            test('should handle error objects', () => {
                const error = new Error('Test error');
                const result = window.Helpers.handleError(error, 'TestContext');

                expect(result).toBe(false);
                expect(console.error).toHaveBeenCalled();
            });

            test('should handle string errors', () => {
                const result = window.Helpers.handleError('String error', 'TestContext');

                expect(result).toBe(false);
                expect(console.error).toHaveBeenCalled();
            });

            test('should call notification system if available', () => {
                const mockShowError = jest.fn();
                window.NotificationSystem = { showError: mockShowError };

                window.Helpers.handleError('Test error', 'TestContext');

                expect(mockShowError).toHaveBeenCalledWith('An error occurred in TestContext');
            });
        });
    });

    describe('Module Export', () => {
        test('should export module in CommonJS environment', () => {
            // This is tested by the fact that the module loads without errors
            // in the test environment which uses CommonJS
            expect(window.Helpers).toBeDefined();
        });
    });
});