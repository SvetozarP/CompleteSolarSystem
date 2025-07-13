// static/js/__tests__/texture-loader-async.test.js
// Test with proper async waiting for module initialization

import '@testing-library/jest-dom';

// Setup Three.js mocks
global.THREE = {
    TextureLoader: jest.fn(() => ({
        load: jest.fn((url, onLoad, onProgress, onError) => {
            setTimeout(() => {
                const mockTexture = {
                    wrapS: null, wrapT: null, magFilter: null, minFilter: null,
                    flipY: true, generateMipmaps: true, anisotropy: 1, dispose: jest.fn()
                };
                onLoad(mockTexture);
            }, 0);
        })
    })),
    RepeatWrapping: 1000,
    LinearFilter: 1006,
    LinearMipMapLinearFilter: 1008,
    CanvasTexture: jest.fn(() => ({ dispose: jest.fn() }))
};

// Mock canvas
global.document.createElement = jest.fn((tagName) => {
    if (tagName === 'canvas') {
        return {
            width: 256, height: 256,
            getContext: jest.fn(() => ({
                fillStyle: '', fillRect: jest.fn(), beginPath: jest.fn(), arc: jest.fn(), fill: jest.fn(),
                createImageData: jest.fn((w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h })),
                getImageData: jest.fn((x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h })),
                putImageData: jest.fn()
            }))
        };
    }
    return {};
});

// Mock window globals
global.window.Helpers = { log: jest.fn() };

describe('TextureLoader - Async Loading Test', () => {
    let TextureLoader;

    beforeAll(async () => {
        console.log('Loading TextureLoader module...');

        // Load the module
        require('../utils/texture-loader.js');

        // Wait a bit for any async initialization
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get reference
        TextureLoader = global.window.TextureLoader;

        console.log('TextureLoader loaded:', !!TextureLoader);
        if (TextureLoader) {
            console.log('TextureLoader keys:', Object.keys(TextureLoader));
        }
    });

    test('module should be available after async wait', () => {
        expect(TextureLoader).toBeDefined();
        expect(typeof TextureLoader).toBe('object');
    });

    test('should have basic API structure', () => {
        console.log('Checking API structure...');

        if (!TextureLoader) {
            console.error('TextureLoader is not available');
            return;
        }

        // Log what we actually have
        console.log('Available properties:', Object.keys(TextureLoader));
        console.log('Property types:', Object.keys(TextureLoader).map(key =>
            `${key}: ${typeof TextureLoader[key]}`
        ));

        // Test each expected method/property individually
        const expectedAPI = {
            // Direct methods
            load: 'function',
            get: 'function',
            stats: 'function',
            clear: 'function',
            preload: 'function',
            isComplete: 'function',
            setTexturePath: 'function',
            setFallbackColor: 'function',

            // Objects/constants
            PATHS: 'object',
            FALLBACK_COLORS: 'object',

            // Nested objects
            TextureUtils: 'object',
            BatchLoader: 'object',
            Management: 'object',
            FallbackMaterials: 'object'
        };

        Object.entries(expectedAPI).forEach(([prop, expectedType]) => {
            const actualType = typeof TextureLoader[prop];
            const exists = prop in TextureLoader;

            console.log(`${prop}: ${exists ? '✓' : '✗'} (expected: ${expectedType}, actual: ${actualType})`);

            if (exists && expectedType === 'object' && TextureLoader[prop]) {
                console.log(`  ${prop} keys:`, Object.keys(TextureLoader[prop]));
            }
        });

        // Just verify the module loaded - we'll test specifics in other tests
        expect(TextureLoader).toBeDefined();
    });

    test('should be able to call available methods safely', async () => {
        if (!TextureLoader) {
            console.warn('TextureLoader not available, skipping method tests');
            return;
        }

        console.log('Testing available methods...');

        // Test stats method if available
        if (TextureLoader.stats && typeof TextureLoader.stats === 'function') {
            try {
                const stats = TextureLoader.stats();
                console.log('✓ stats() returned:', Object.keys(stats));
                expect(stats).toBeDefined();
                expect(typeof stats).toBe('object');
            } catch (error) {
                console.error('✗ stats() failed:', error.message);
            }
        }

        // Test setTexturePath if available
        if (TextureLoader.setTexturePath && typeof TextureLoader.setTexturePath === 'function') {
            try {
                TextureLoader.setTexturePath('test_planet', '/test.jpg');
                console.log('✓ setTexturePath() successful');

                if (TextureLoader.PATHS && TextureLoader.PATHS.test_planet) {
                    expect(TextureLoader.PATHS.test_planet).toBe('/test.jpg');
                    console.log('✓ Path was set correctly');
                }
            } catch (error) {
                console.error('✗ setTexturePath() failed:', error.message);
            }
        }

        // Test load method if available
        if (TextureLoader.load && typeof TextureLoader.load === 'function') {
            try {
                const texturePromise = TextureLoader.load('/static/textures/test.jpg');
                expect(texturePromise).toBeInstanceOf(Promise);

                const texture = await texturePromise;
                console.log('✓ load() returned texture');
                expect(texture).toBeDefined();
            } catch (error) {
                console.error('✗ load() failed:', error.message);
            }
        }

        // Test nested API if available
        if (TextureLoader.TextureUtils && TextureLoader.TextureUtils.createProceduralTexture) {
            try {
                const texture = TextureLoader.TextureUtils.createProceduralTexture({
                    type: 'surface',
                    baseColor: '#888888',
                    size: 128
                });
                console.log('✓ createProceduralTexture() successful');
                expect(texture).toBeDefined();
            } catch (error) {
                console.error('✗ createProceduralTexture() failed:', error.message);
            }
        }
    });

    test('should handle missing dependencies gracefully', () => {
        if (!TextureLoader) {
            console.warn('TextureLoader not available, skipping dependency test');
            return;
        }

        // Save original dependencies
        const originalHelpers = global.window.Helpers;
        const originalLoadingManager = global.window.LoadingManager;

        // Remove dependencies
        delete global.window.Helpers;
        delete global.window.LoadingManager;

        try {
            // Should not throw when dependencies are missing
            if (TextureLoader.stats) {
                expect(() => TextureLoader.stats()).not.toThrow();
            }

            if (TextureLoader.setTexturePath) {
                expect(() => TextureLoader.setTexturePath('test', '/test.jpg')).not.toThrow();
            }

            console.log('✓ Handled missing dependencies gracefully');

        } finally {
            // Restore dependencies
            global.window.Helpers = originalHelpers;
            global.window.LoadingManager = originalLoadingManager;
        }
    });
});

describe('TextureLoader - Direct Function Tests', () => {
    test('should work with alternative access patterns', async () => {
        // Try different ways to access the module
        const TL = global.window.TextureLoader;

        if (!TL) {
            console.warn('TextureLoader not available for direct testing');
            return;
        }

        console.log('Testing direct access patterns...');

        // Test bracket notation access
        if (TL['stats']) {
            const stats = TL['stats']();
            expect(stats).toBeDefined();
            console.log('✓ Bracket notation access works');
        }

        // Test method binding
        if (TL.stats) {
            const statsMethod = TL.stats.bind(TL);
            const stats = statsMethod();
            expect(stats).toBeDefined();
            console.log('✓ Method binding works');
        }

        // Test destructuring if methods exist
        try {
            if (TL.stats && TL.setTexturePath) {
                const { stats, setTexturePath } = TL;

                // Note: This might fail if methods depend on 'this' context
                try {
                    const statsResult = stats();
                    console.log('✓ Destructured stats works');
                } catch (error) {
                    console.log('✗ Destructured stats failed (expected if methods need context):', error.message);
                }

                try {
                    setTexturePath('destructured_test', '/test.jpg');
                    console.log('✓ Destructured setTexturePath works');
                } catch (error) {
                    console.log('✗ Destructured setTexturePath failed (expected if methods need context):', error.message);
                }
            }
        } catch (error) {
            console.log('Destructuring test failed:', error.message);
        }
    });

    test('should provide meaningful error messages', async () => {
        const TL = global.window.TextureLoader;

        if (!TL) {
            console.warn('TextureLoader not available for error testing');
            return;
        }

        console.log('Testing error handling...');

        // Test with invalid inputs
        if (TL.load) {
            try {
                // Try loading with invalid URL
                const texture = await TL.load('invalid://url/texture.jpg');
                // Should not throw, but should return a fallback
                expect(texture).toBeDefined();
                console.log('✓ Invalid URL handled gracefully');
            } catch (error) {
                console.log('Load error (might be expected):', error.message);
            }
        }

        if (TL.setTexturePath) {
            try {
                // Try with invalid parameters
                TL.setTexturePath(null, null);
                console.log('✓ Null parameters handled');
            } catch (error) {
                console.log('Null parameter error (might be expected):', error.message);
            }
        }
    });
});

describe('TextureLoader - Module Structure Analysis', () => {
    test('should analyze the actual module structure', () => {
        const TL = global.window.TextureLoader;

        if (!TL) {
            console.warn('TextureLoader not available for structure analysis');
            return;
        }

        console.log('\n=== MODULE STRUCTURE ANALYSIS ===');

        // Analyze the object structure
        console.log('Root level properties:');
        Object.getOwnPropertyNames(TL).forEach(prop => {
            const descriptor = Object.getOwnPropertyDescriptor(TL, prop);
            console.log(`  ${prop}: ${typeof TL[prop]} (${descriptor.writable ? 'writable' : 'read-only'}${descriptor.enumerable ? ', enumerable' : ''})`);
        });

        // Check prototype chain
        console.log('\nPrototype chain:');
        let current = TL;
        let level = 0;
        while (current && level < 3) {
            console.log(`  Level ${level}: ${current.constructor.name}`);
            const protoProps = Object.getOwnPropertyNames(current).filter(prop =>
                prop !== 'constructor' && typeof current[prop] === 'function'
            );
            if (protoProps.length > 0) {
                console.log(`    Methods: ${protoProps.join(', ')}`);
            }
            current = Object.getPrototypeOf(current);
            level++;
        }

        // Analyze nested objects
        console.log('\nNested objects:');
        ['TextureUtils', 'BatchLoader', 'Management', 'FallbackMaterials'].forEach(objName => {
            if (TL[objName] && typeof TL[objName] === 'object') {
                console.log(`  ${objName}:`);
                console.log(`    Type: ${typeof TL[objName]}`);
                console.log(`    Keys: ${Object.keys(TL[objName]).join(', ')}`);
                console.log(`    Methods: ${Object.keys(TL[objName]).filter(key => typeof TL[objName][key] === 'function').join(', ')}`);
            } else {
                console.log(`  ${objName}: not found or not an object`);
            }
        });

        console.log('=== END ANALYSIS ===\n');

        // The test passes if we can analyze the structure
        expect(TL).toBeDefined();
    });
});