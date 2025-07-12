// static/js/__tests__/particle-systems.test.js
// FIXED: Tests now import the real ParticleSystems classes for proper coverage

// Mock THREE.js with enhanced particle system support
const THREE = {
    BufferGeometry: jest.fn(function() {
        this.attributes = {};
        this.setAttribute = jest.fn((name, attribute) => {
            this.attributes[name] = attribute;
        });
        this.dispose = jest.fn();
    }),

    BufferAttribute: jest.fn(function(array, itemSize) {
        this.array = array;
        this.itemSize = itemSize;
        this.needsUpdate = false;
    }),

    Points: jest.fn(function(geometry, material) {
        this.geometry = geometry;
        this.material = material;
        this.name = '';
        this.visible = true;
    }),

    PointsMaterial: jest.fn(function(options = {}) {
        this.vertexColors = options.vertexColors || false;
        this.size = options.size || 1.0;
        this.sizeAttenuation = options.sizeAttenuation || true;
        this.transparent = options.transparent || false;
        this.opacity = options.opacity || 1.0;
        this.blending = options.blending || 'NormalBlending';
        this.dispose = jest.fn();
    }),

    ShaderMaterial: jest.fn(function(options = {}) {
        this.uniforms = options.uniforms || {};
        this.vertexShader = options.vertexShader || '';
        this.fragmentShader = options.fragmentShader || '';
        this.blending = options.blending || 'NormalBlending';
        this.depthWrite = options.depthWrite !== false;
        this.transparent = options.transparent || false;
        this.vertexColors = options.vertexColors || false;
        this.dispose = jest.fn();
    }),

    Color: jest.fn(function(color) {
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.setHex = jest.fn();
    }),

    // Blending modes
    AdditiveBlending: 'AdditiveBlending',
    NormalBlending: 'NormalBlending'
};

// Global THREE setup
global.THREE = THREE;

// Mock window.Helpers
global.window = global.window || {};
global.window.Helpers = {
    log: jest.fn(),
    handleError: jest.fn()
};

// Create a mock for console.log to capture the module loading message
const mockConsoleLog = jest.fn();
const originalConsoleLog = console.log;

// Mock console BEFORE importing the module
global.console = {
    log: mockConsoleLog,
    warn: jest.fn(),
    error: jest.fn()
};

// Import the actual ParticleSystems module
require('../solar-system/particle-systems.js');
const {
    StarfieldSystem,
    NebulaSystem,
    AsteroidBeltSystem,
    ParticleSystemManager
} = window.ParticleSystems;

// Mock scene
const createMockScene = () => ({
    add: jest.fn(),
    remove: jest.fn(),
    getObjectByName: jest.fn((name) => ({ name }))
});

describe('ParticleSystems', () => {
    let mockScene;

    beforeEach(() => {
        jest.clearAllMocks();

        // Ensure window.Helpers is properly set up
        global.window = global.window || {};
        global.window.Helpers = {
            log: jest.fn(),
            handleError: jest.fn()
        };

        mockScene = createMockScene();
    });

    describe('StarfieldSystem', () => {
        let starfield;

        beforeEach(() => {
            starfield = new StarfieldSystem();
        });

        afterEach(() => {
            if (starfield) {
                starfield.dispose();
            }
        });

        test('should initialize with default options', () => {
            expect(starfield.options.starCount).toBe(5000);
            expect(starfield.options.starDistance).toBe(500);
            expect(starfield.options.starSizeMin).toBe(0.1);
            expect(starfield.options.starSizeMax).toBe(2.0);
            expect(starfield.options.twinkleSpeed).toBe(0.5);
        });

        test('should accept custom options', () => {
            const customStarfield = new StarfieldSystem({
                starCount: 1000,
                starDistance: 300,
                twinkleSpeed: 1.0
            });

            expect(customStarfield.options.starCount).toBe(1000);
            expect(customStarfield.options.starDistance).toBe(300);
            expect(customStarfield.options.twinkleSpeed).toBe(1.0);

            customStarfield.dispose();
        });

        test('should initialize successfully', async () => {
            await starfield.init(mockScene);

            expect(starfield.stars).toBeInstanceOf(THREE.Points);
            expect(starfield.starGeometry).toBeInstanceOf(THREE.BufferGeometry);
            expect(starfield.starMaterial).toBeInstanceOf(THREE.ShaderMaterial);
            expect(mockScene.add).toHaveBeenCalledWith(starfield.stars);
            expect(window.Helpers.log).toHaveBeenCalledWith(
                'Starfield created with 5000 stars',
                'debug'
            );
        });

        test('should create proper geometry attributes', async () => {
            await starfield.init(mockScene);

            expect(starfield.starGeometry.setAttribute).toHaveBeenCalledWith(
                'position',
                expect.any(THREE.BufferAttribute)
            );
            expect(starfield.starGeometry.setAttribute).toHaveBeenCalledWith(
                'color',
                expect.any(THREE.BufferAttribute)
            );
            expect(starfield.starGeometry.setAttribute).toHaveBeenCalledWith(
                'size',
                expect.any(THREE.BufferAttribute)
            );
            expect(starfield.starGeometry.setAttribute).toHaveBeenCalledWith(
                'phase',
                expect.any(THREE.BufferAttribute)
            );
        });

        test('should create shader material with uniforms', async () => {
            await starfield.init(mockScene);

            expect(starfield.twinkleUniforms).toEqual({
                time: { value: 0.0 },
                twinkleSpeed: { value: 0.5 }
            });

            expect(starfield.starMaterial.blending).toBe(THREE.AdditiveBlending);
            expect(starfield.starMaterial.transparent).toBe(true);
            expect(starfield.starMaterial.depthWrite).toBe(false);
        });

        test('should update time uniform during animation', () => {
            starfield.twinkleUniforms = {
                time: { value: 0.0 },
                twinkleSpeed: { value: 0.5 }
            };

            starfield.update(0.016);
            expect(starfield.time).toBe(0.016);
            expect(starfield.twinkleUniforms.time.value).toBe(0.016);

            starfield.update(0.016);
            expect(starfield.time).toBe(0.032);
            expect(starfield.twinkleUniforms.time.value).toBe(0.032);
        });

        test('should handle update without uniforms', () => {
            starfield.twinkleUniforms = null;

            expect(() => starfield.update(0.016)).not.toThrow();
            // When uniforms are null, time is not updated in the real implementation
            expect(starfield.time).toBe(0);
        });

        test('should toggle visibility', async () => {
            await starfield.init(mockScene);

            starfield.setVisible(false);
            expect(starfield.stars.visible).toBe(false);

            starfield.setVisible(true);
            expect(starfield.stars.visible).toBe(true);
        });

        test('should handle visibility when stars not initialized', () => {
            expect(() => starfield.setVisible(true)).not.toThrow();
        });

        test('should dispose resources properly', async () => {
            await starfield.init(mockScene);

            starfield.dispose();

            expect(starfield.starGeometry.dispose).toHaveBeenCalled();
            expect(starfield.starMaterial.dispose).toHaveBeenCalled();
        });

        test('should handle errors during initialization', async () => {
            // Mock scene.add to throw
            mockScene.add = jest.fn(() => {
                throw new Error('Scene add failed');
            });

            await starfield.init(mockScene);

            expect(window.Helpers.handleError).toHaveBeenCalledWith(
                expect.any(Error),
                'StarfieldSystem.init'
            );
        });

        test('should generate diverse star colors', async () => {
            await starfield.init(mockScene);

            const colorCalls = starfield.starGeometry.setAttribute.mock.calls
                .find(call => call[0] === 'color');

            expect(colorCalls).toBeDefined();
            expect(colorCalls[1]).toBeInstanceOf(THREE.BufferAttribute);
            expect(colorCalls[1].array.length).toBe(starfield.options.starCount * 3);

            // Verify colors are in valid range
            for (let i = 0; i < colorCalls[1].array.length; i++) {
                expect(colorCalls[1].array[i]).toBeGreaterThanOrEqual(0);
                expect(colorCalls[1].array[i]).toBeLessThanOrEqual(1);
            }
        });

        test('should generate proper star sizes', async () => {
            await starfield.init(mockScene);

            const sizeCalls = starfield.starGeometry.setAttribute.mock.calls
                .find(call => call[0] === 'size');

            expect(sizeCalls).toBeDefined();
            expect(sizeCalls[1]).toBeInstanceOf(THREE.BufferAttribute);

            for (let i = 0; i < sizeCalls[1].array.length; i++) {
                expect(sizeCalls[1].array[i]).toBeGreaterThanOrEqual(starfield.options.starSizeMin);
                expect(sizeCalls[1].array[i]).toBeLessThanOrEqual(starfield.options.starSizeMax);
            }
        });

        test('should create vertex and fragment shaders', async () => {
            await starfield.init(mockScene);

            expect(starfield.starMaterial.vertexShader).toContain('attribute float size');
            expect(starfield.starMaterial.vertexShader).toContain('uniform float time');
            expect(starfield.starMaterial.fragmentShader).toContain('varying vec3 vColor');
            expect(starfield.starMaterial.fragmentShader).toContain('gl_FragColor');
        });
    });

    describe('NebulaSystem', () => {
        let nebula;

        beforeEach(() => {
            nebula = new NebulaSystem();
        });

        afterEach(() => {
            if (nebula) {
                nebula.dispose();
            }
        });

        test('should initialize with default options', () => {
            expect(nebula.options.particleCount).toBe(2000);
            expect(nebula.options.nebulaDistance).toBe(800);
            expect(nebula.options.particleSize).toBe(10.0);
            expect(nebula.options.driftSpeed).toBe(0.1);
            expect(nebula.options.opacity).toBe(0.15);
            expect(nebula.options.colorPalette).toHaveLength(5);
        });

        test('should accept custom options', () => {
            const customNebula = new NebulaSystem({
                particleCount: 500,
                opacity: 0.3,
                driftSpeed: 0.2
            });

            expect(customNebula.options.particleCount).toBe(500);
            expect(customNebula.options.opacity).toBe(0.3);
            expect(customNebula.options.driftSpeed).toBe(0.2);

            customNebula.dispose();
        });

        test('should initialize successfully', async () => {
            await nebula.init(mockScene);

            expect(nebula.nebula).toBeInstanceOf(THREE.Points);
            expect(nebula.nebulaGeometry).toBeInstanceOf(THREE.BufferGeometry);
            expect(nebula.nebulaMaterial).toBeInstanceOf(THREE.ShaderMaterial);
            expect(mockScene.add).toHaveBeenCalledWith(nebula.nebula);
            expect(window.Helpers.log).toHaveBeenCalledWith(
                'Nebula created with 2000 particles',
                'debug'
            );
        });

        test('should create proper geometry attributes', async () => {
            await nebula.init(mockScene);

            expect(nebula.nebulaGeometry.setAttribute).toHaveBeenCalledWith(
                'position',
                expect.any(THREE.BufferAttribute)
            );
            expect(nebula.nebulaGeometry.setAttribute).toHaveBeenCalledWith(
                'color',
                expect.any(THREE.BufferAttribute)
            );
            expect(nebula.nebulaGeometry.setAttribute).toHaveBeenCalledWith(
                'size',
                expect.any(THREE.BufferAttribute)
            );
            expect(nebula.nebulaGeometry.setAttribute).toHaveBeenCalledWith(
                'velocity',
                expect.any(THREE.BufferAttribute)
            );
        });

        test('should update time uniform during animation', () => {
            nebula.nebulaUniforms = {
                time: { value: 0.0 },
                opacity: { value: 0.15 }
            };

            nebula.update(0.016);
            expect(nebula.time).toBe(0.016);
            expect(nebula.nebulaUniforms.time.value).toBe(0.016);
        });

        test('should handle update without uniforms', () => {
            nebula.nebulaUniforms = null;

            expect(() => nebula.update(0.016)).not.toThrow();
            // When uniforms are null, time is not updated in the real implementation
            expect(nebula.time).toBe(0);
        });

        test('should set opacity correctly', () => {
            nebula.nebulaUniforms = {
                time: { value: 0.0 },
                opacity: { value: 0.15 }
            };

            nebula.setOpacity(0.5);
            expect(nebula.options.opacity).toBe(0.5);
            expect(nebula.nebulaUniforms.opacity.value).toBe(0.5);
        });

        test('should handle opacity setting without uniforms', () => {
            nebula.nebulaUniforms = null;

            expect(() => nebula.setOpacity(0.5)).not.toThrow();
            expect(nebula.options.opacity).toBe(0.5);
        });

        test('should toggle visibility', async () => {
            await nebula.init(mockScene);

            nebula.setVisible(false);
            expect(nebula.nebula.visible).toBe(false);

            nebula.setVisible(true);
            expect(nebula.nebula.visible).toBe(true);
        });

        test('should dispose resources properly', async () => {
            await nebula.init(mockScene);

            nebula.dispose();

            expect(nebula.nebulaGeometry.dispose).toHaveBeenCalled();
            expect(nebula.nebulaMaterial.dispose).toHaveBeenCalled();
        });

        test('should handle errors during initialization', async () => {
            mockScene.add = jest.fn(() => {
                throw new Error('Scene add failed');
            });

            await nebula.init(mockScene);

            expect(window.Helpers.handleError).toHaveBeenCalledWith(
                expect.any(Error),
                'NebulaSystem.init'
            );
        });

        test('should generate colors from palette', async () => {
            await nebula.init(mockScene);

            const colorCalls = nebula.nebulaGeometry.setAttribute.mock.calls
                .find(call => call[0] === 'color');

            expect(colorCalls).toBeDefined();
            expect(colorCalls[1].array.length).toBe(nebula.options.particleCount * 3);

            // Verify colors are in valid range
            for (let i = 0; i < colorCalls[1].array.length; i++) {
                expect(colorCalls[1].array[i]).toBeGreaterThanOrEqual(0);
                expect(colorCalls[1].array[i]).toBeLessThanOrEqual(1);
            }
        });

        test('should create clustered particle distribution', async () => {
            await nebula.init(mockScene);

            const positionCalls = nebula.nebulaGeometry.setAttribute.mock.calls
                .find(call => call[0] === 'position');

            expect(positionCalls).toBeDefined();
            expect(positionCalls[1].array.length).toBe(nebula.options.particleCount * 3);

            // Check that particles are distributed in space (not all at origin)
            let nonZeroPositions = 0;
            for (let i = 0; i < positionCalls[1].array.length; i += 3) {
                if (positionCalls[1].array[i] !== 0 ||
                    positionCalls[1].array[i + 1] !== 0 ||
                    positionCalls[1].array[i + 2] !== 0) {
                    nonZeroPositions++;
                }
            }
            expect(nonZeroPositions).toBeGreaterThan(nebula.options.particleCount * 0.9);
        });

        test('should create vertex and fragment shaders', async () => {
            await nebula.init(mockScene);

            expect(nebula.nebulaMaterial.vertexShader).toContain('attribute float size');
            expect(nebula.nebulaMaterial.vertexShader).toContain('attribute vec3 velocity');
            expect(nebula.nebulaMaterial.fragmentShader).toContain('uniform float opacity');
            expect(nebula.nebulaMaterial.fragmentShader).toContain('gl_FragColor');
        });
    });

    describe('AsteroidBeltSystem', () => {
        let asteroidBelt;

        beforeEach(() => {
            asteroidBelt = new AsteroidBeltSystem();
        });

        afterEach(() => {
            if (asteroidBelt) {
                asteroidBelt.dispose();
            }
        });

        test('should initialize with default options', () => {
            expect(asteroidBelt.options.asteroidCount).toBe(20000);
            expect(asteroidBelt.options.calculateDynamicPositions).toBe(true);
            expect(asteroidBelt.options.particleSize).toBe(0.5);
            expect(asteroidBelt.options.orbitSpeed).toBe(0.1);
            expect(asteroidBelt.options.densityVariation).toBe(0.3);
        });

        test('should accept custom options', () => {
            const customBelt = new AsteroidBeltSystem({
                asteroidCount: 1000,
                orbitSpeed: 0.2,
                particleSize: 1.0
            });

            expect(customBelt.options.asteroidCount).toBe(1000);
            expect(customBelt.options.orbitSpeed).toBe(0.2);
            expect(customBelt.options.particleSize).toBe(1.0);

            customBelt.dispose();
        });

        test('should initialize without planet instances', async () => {
            await asteroidBelt.init(mockScene);

            expect(asteroidBelt.asteroids).toBeInstanceOf(THREE.Points);
            expect(asteroidBelt.asteroidGeometry).toBeInstanceOf(THREE.BufferGeometry);
            expect(asteroidBelt.asteroidMaterial).toBeInstanceOf(THREE.PointsMaterial);
            expect(mockScene.add).toHaveBeenCalledWith(asteroidBelt.asteroids);
        });

        test('should initialize with planet instances', async () => {
            const planetInstances = new Map([
                ['Mars', { position: { x: 60, y: 0, z: 45 } }],
                ['Jupiter', { position: { x: 80, y: 0, z: 100 } }]
            ]);

            await asteroidBelt.init(mockScene, planetInstances);

            expect(asteroidBelt.planetPositions).toBe(planetInstances);
            expect(window.Helpers.log).toHaveBeenCalledWith(
                expect.stringContaining('Asteroid belt created with'),
                'debug'
            );
        });

        test('should calculate belt positions correctly', () => {
            const planetInstances = new Map([
                ['Mars', { position: { x: 60, y: 0, z: 45 } }],
                ['Jupiter', { position: { x: 80, y: 0, z: 100 } }]
            ]);

            asteroidBelt.planetPositions = planetInstances;
            asteroidBelt.calculateBeltPositions();

            expect(asteroidBelt.innerRadius).toBeGreaterThan(0);
            expect(asteroidBelt.outerRadius).toBeGreaterThan(asteroidBelt.innerRadius);
            expect(asteroidBelt.outerRadius - asteroidBelt.innerRadius).toBeGreaterThanOrEqual(15);
        });

        test('should handle invalid planet positions gracefully', () => {
            // Test with positions that will cause NaN
            const invalidPlanets = new Map([
                ['Mars', { position: { x: NaN, y: 0, z: NaN } }],
                ['Jupiter', { position: { x: NaN, y: 0, z: NaN } }]
            ]);

            asteroidBelt.planetPositions = invalidPlanets;

            expect(() => asteroidBelt.calculateBeltPositions()).not.toThrow();

            // The implementation should fall back to default values when NaN is detected
            expect(asteroidBelt.innerRadius).toBeGreaterThan(0);
            expect(asteroidBelt.outerRadius).toBeGreaterThan(asteroidBelt.innerRadius);
            expect(asteroidBelt.innerRadius).toBe(232); // Default fallback value
            expect(asteroidBelt.outerRadius).toBe(292); // Default fallback value
        });

        test('should handle null planet positions', () => {
            // Test with null positions that would cause access errors
            const nullPlanets = new Map([
                ['Mars', { position: null }],
                ['Jupiter', { position: null }]
            ]);

            asteroidBelt.planetPositions = nullPlanets;

            // This should throw when trying to access position.x on null
            expect(() => asteroidBelt.calculateBeltPositions()).toThrow('Mars position contains null values');
        });

        test('should create proper geometry attributes', async () => {
            await asteroidBelt.init(mockScene);

            expect(asteroidBelt.asteroidGeometry.setAttribute).toHaveBeenCalledWith(
                'position',
                expect.any(THREE.BufferAttribute)
            );
            expect(asteroidBelt.asteroidGeometry.setAttribute).toHaveBeenCalledWith(
                'color',
                expect.any(THREE.BufferAttribute)
            );
            expect(asteroidBelt.asteroidGeometry.setAttribute).toHaveBeenCalledWith(
                'size',
                expect.any(THREE.BufferAttribute)
            );
            expect(asteroidBelt.asteroidGeometry.setAttribute).toHaveBeenCalledWith(
                'orbitalData',
                expect.any(THREE.BufferAttribute)
            );
        });

        test('should update orbital positions', async () => {
            await asteroidBelt.init(mockScene);

            asteroidBelt.update(0.1);

            expect(asteroidBelt.asteroidGeometry.attributes.position.needsUpdate).toBe(true);
        });

        test('should update belt position when planets move', async () => {
            await asteroidBelt.init(mockScene);

            const originalInner = asteroidBelt.innerRadius;
            const originalOuter = asteroidBelt.outerRadius;

            // Create new planet positions that would trigger a significant change
            const newPlanetInstances = new Map([
                ['Mars', { position: { x: 100, y: 0, z: 0 } }],
                ['Jupiter', { position: { x: 200, y: 0, z: 0 } }]
            ]);

            const originalDispose = asteroidBelt.asteroidGeometry.dispose;
            asteroidBelt.asteroidGeometry.dispose = jest.fn(originalDispose);

            asteroidBelt.updateBeltPosition(newPlanetInstances);

            // Positions should be recalculated
            expect(asteroidBelt.planetPositions).toBe(newPlanetInstances);
        });

        test('should toggle visibility', async () => {
            await asteroidBelt.init(mockScene);

            asteroidBelt.setVisible(false);
            expect(asteroidBelt.asteroids.visible).toBe(false);

            asteroidBelt.setVisible(true);
            expect(asteroidBelt.asteroids.visible).toBe(true);
        });

        test('should dispose resources properly', async () => {
            await asteroidBelt.init(mockScene);

            asteroidBelt.dispose();

            expect(asteroidBelt.asteroidGeometry.dispose).toHaveBeenCalled();
            expect(asteroidBelt.asteroidMaterial.dispose).toHaveBeenCalled();
        });

        test('should handle errors during initialization', async () => {
            mockScene.add = jest.fn(() => {
                throw new Error('Scene add failed');
            });

            await asteroidBelt.init(mockScene);

            expect(window.Helpers.handleError).toHaveBeenCalledWith(
                expect.any(Error),
                'AsteroidBeltSystem.init'
            );
        });

        test('should generate diverse asteroid types', async () => {
            await asteroidBelt.init(mockScene);

            const colorCalls = asteroidBelt.asteroidGeometry.setAttribute.mock.calls
                .find(call => call[0] === 'color');
            const sizeCalls = asteroidBelt.asteroidGeometry.setAttribute.mock.calls
                .find(call => call[0] === 'size');

            expect(colorCalls).toBeDefined();
            expect(sizeCalls).toBeDefined();

            // Check color diversity
            const colors = colorCalls[1].array;
            const uniqueColors = new Set();
            for (let i = 0; i < colors.length; i += 3) {
                uniqueColors.add(`${colors[i].toFixed(2)},${colors[i+1].toFixed(2)},${colors[i+2].toFixed(2)}`);
            }
            expect(uniqueColors.size).toBeGreaterThan(10);

            // Check size variation
            const sizes = sizeCalls[1].array;
            const minSize = Math.min(...sizes);
            const maxSize = Math.max(...sizes);
            expect(maxSize).toBeGreaterThan(minSize);
        });

        test('should position asteroids in belt region', async () => {
            await asteroidBelt.init(mockScene);

            const positionCalls = asteroidBelt.asteroidGeometry.setAttribute.mock.calls
                .find(call => call[0] === 'position');

            expect(positionCalls).toBeDefined();
            const positions = positionCalls[1].array;

            // Check that asteroids are positioned within the belt radius
            for (let i = 0; i < asteroidBelt.options.asteroidCount; i++) {
                const i3 = i * 3;
                const x = positions[i3];
                const z = positions[i3 + 2];
                const radius = Math.sqrt(x * x + z * z);

                // Allow some tolerance for density variation
                expect(radius).toBeGreaterThanOrEqual(asteroidBelt.innerRadius - 5);
                expect(radius).toBeLessThanOrEqual(asteroidBelt.outerRadius + 5);
            }
        });
    });

    describe('ParticleSystemManager', () => {
        let manager;

        beforeEach(() => {
            manager = new ParticleSystemManager();
        });

        afterEach(() => {
            if (manager) {
                manager.dispose();
            }
        });

        test('should initialize with default options', () => {
            expect(manager.options.enableStarfield).toBe(true);
            expect(manager.options.enableNebula).toBe(true);
            expect(manager.options.enableAsteroidBelt).toBe(true);
            expect(manager.options.performanceMode).toBe(false);
        });

        test('should accept custom options', () => {
            const customManager = new ParticleSystemManager({
                enableNebula: false,
                performanceMode: true
            });

            expect(customManager.options.enableNebula).toBe(false);
            expect(customManager.options.performanceMode).toBe(true);

            customManager.dispose();
        });

        test('should initialize all enabled systems', async () => {
            await manager.init(mockScene);

            expect(manager.isInitialized).toBe(true);
            expect(manager.systems.size).toBe(3);
            expect(manager.systems.has('starfield')).toBe(true);
            expect(manager.systems.has('nebula')).toBe(true);
            expect(manager.systems.has('asteroidBelt')).toBe(true);
            expect(window.Helpers.log).toHaveBeenCalledWith(
                'All particle systems initialized successfully',
                'debug'
            );
        });

        test('should initialize only enabled systems', async () => {
            const selectiveManager = new ParticleSystemManager({
                enableStarfield: true,
                enableNebula: false,
                enableAsteroidBelt: false
            });

            await selectiveManager.init(mockScene);

            expect(selectiveManager.systems.size).toBe(1);
            expect(selectiveManager.systems.has('starfield')).toBe(true);
            expect(selectiveManager.systems.has('nebula')).toBe(false);
            expect(selectiveManager.systems.has('asteroidBelt')).toBe(false);

            selectiveManager.dispose();
        });

        test('should apply performance mode during initialization', async () => {
            const performanceManager = new ParticleSystemManager({
                performanceMode: true
            });

            await performanceManager.init(mockScene);

            const starfield = performanceManager.getSystem('starfield');
            const nebula = performanceManager.getSystem('nebula');
            const asteroidBelt = performanceManager.getSystem('asteroidBelt');

            expect(starfield.options.starCount).toBe(2000); // Reduced from default 5000
            expect(nebula.options.particleCount).toBe(1000); // Reduced from default 2000
            expect(asteroidBelt.options.asteroidCount).toBe(500); // Reduced from default 1000

            performanceManager.dispose();
        });

        test('should update all systems', async () => {
            await manager.init(mockScene);

            const starfield = manager.getSystem('starfield');
            const nebula = manager.getSystem('nebula');
            const asteroidBelt = manager.getSystem('asteroidBelt');

            jest.spyOn(starfield, 'update');
            jest.spyOn(nebula, 'update');
            jest.spyOn(asteroidBelt, 'update');

            manager.update(0.016);

            expect(starfield.update).toHaveBeenCalledWith(0.016);
            expect(nebula.update).toHaveBeenCalledWith(0.016);
            expect(asteroidBelt.update).toHaveBeenCalledWith(0.016);
        });

        test('should not update when not initialized', () => {
            expect(() => manager.update(0.016)).not.toThrow();
        });

        test('should toggle system visibility', async () => {
            await manager.init(mockScene);

            const starfield = manager.getSystem('starfield');
            jest.spyOn(starfield, 'setVisible');

            manager.setSystemVisible('starfield', false);
            expect(starfield.setVisible).toHaveBeenCalledWith(false);

            manager.setSystemVisible('starfield', true);
            expect(starfield.setVisible).toHaveBeenCalledWith(true);
        });

        test('should handle visibility for non-existent systems', () => {
            expect(() => manager.setSystemVisible('nonexistent', true)).not.toThrow();
        });

        test('should set performance mode', async () => {
            await manager.init(mockScene);

            const nebula = manager.getSystem('nebula');
            jest.spyOn(nebula, 'setOpacity');

            manager.setPerformanceMode(true);
            expect(nebula.setOpacity).toHaveBeenCalledWith(0.08);

            manager.setPerformanceMode(false);
            expect(nebula.setOpacity).toHaveBeenCalledWith(0.15);
        });

        test('should set system opacity', async () => {
            await manager.init(mockScene);

            const nebula = manager.getSystem('nebula');
            jest.spyOn(nebula, 'setOpacity');

            manager.setSystemOpacity('nebula', 0.5);
            expect(nebula.setOpacity).toHaveBeenCalledWith(0.5);
        });

        test('should handle opacity setting for systems without setOpacity method', () => {
            manager.systems.set('test', { name: 'test' });

            expect(() => manager.setSystemOpacity('test', 0.5)).not.toThrow();
        });

        test('should get system by name', async () => {
            await manager.init(mockScene);

            const starfield = manager.getSystem('starfield');
            expect(starfield).toBeInstanceOf(StarfieldSystem);

            const nonexistent = manager.getSystem('nonexistent');
            expect(nonexistent).toBeNull();
        });

        test('should get system names', async () => {
            await manager.init(mockScene);

            const names = manager.getSystemNames();
            expect(names).toEqual(['starfield', 'nebula', 'asteroidBelt']);
        });

        test('should provide performance statistics', async () => {
            await manager.init(mockScene);

            const stats = manager.getStats();

            expect(stats.totalSystems).toBe(3);
            expect(stats.systems.starfield).toEqual({
                particleCount: 5000,
                visible: true
            });
            expect(stats.systems.nebula).toEqual({
                particleCount: 2000,
                visible: true
            });
            expect(stats.systems.asteroidBelt).toEqual({
                particleCount: 1000,
                visible: true
            });
        });

        test('should handle stats for systems without options', () => {
            manager.systems.set('test', { name: 'test' });

            const stats = manager.getStats();
            expect(stats.totalSystems).toBe(1);
        });

        test('should dispose all systems', async () => {
            await manager.init(mockScene);

            const starfield = manager.getSystem('starfield');
            const nebula = manager.getSystem('nebula');
            const asteroidBelt = manager.getSystem('asteroidBelt');

            jest.spyOn(starfield, 'dispose');
            jest.spyOn(nebula, 'dispose');
            jest.spyOn(asteroidBelt, 'dispose');

            manager.dispose();

            expect(starfield.dispose).toHaveBeenCalled();
            expect(nebula.dispose).toHaveBeenCalled();
            expect(asteroidBelt.dispose).toHaveBeenCalled();
            expect(manager.systems.size).toBe(0);
            expect(manager.isInitialized).toBe(false);
        });

        test('should handle disposal when scene objects exist', async () => {
            const mockObject = { name: 'starfield' };
            mockScene.getObjectByName = jest.fn((name) => mockObject);

            await manager.init(mockScene);
            manager.dispose();

            expect(mockScene.remove).toHaveBeenCalledWith(mockObject);
        });

        test('should handle errors during initialization', async () => {
            // Mock Promise.all to reject
            const originalPromise = Promise.all;
            Promise.all = jest.fn().mockRejectedValue(new Error('Initialization failed'));

            await manager.init(mockScene);

            expect(window.Helpers.handleError).toHaveBeenCalledWith(
                expect.any(Error),
                'ParticleSystemManager.init'
            );

            // Restore Promise.all
            Promise.all = originalPromise;
        });

        test('should handle partial system initialization failure', async () => {
            // Create a manager where one system will fail
            const failingManager = new ParticleSystemManager();

            // Override to simulate one system failing
            const originalStarfieldInit = StarfieldSystem.prototype.init;
            StarfieldSystem.prototype.init = jest.fn().mockRejectedValue(new Error('Starfield failed'));

            await failingManager.init(mockScene);

            expect(window.Helpers.handleError).toHaveBeenCalledWith(
                expect.any(Error),
                'ParticleSystemManager.init'
            );

            // Restore original method
            StarfieldSystem.prototype.init = originalStarfieldInit;
            failingManager.dispose();
        });
    });

    describe('Integration Tests', () => {
        let manager;

        beforeEach(() => {
            manager = new ParticleSystemManager();
        });

        afterEach(() => {
            if (manager) {
                manager.dispose();
            }
        });

        test('should complete full lifecycle', async () => {
            // Initialize
            await manager.init(mockScene);
            expect(manager.isInitialized).toBe(true);

            // Update systems
            manager.update(0.016);

            // Toggle visibility
            manager.setSystemVisible('starfield', false);
            manager.setSystemVisible('nebula', false);

            // Change performance mode
            manager.setPerformanceMode(true);

            // Get statistics
            const stats = manager.getStats();
            expect(stats.totalSystems).toBe(3);

            // Dispose
            manager.dispose();
            expect(manager.isInitialized).toBe(false);
        });

        test('should handle asteroid belt with planet updates', async () => {
            await manager.init(mockScene);

            const asteroidBelt = manager.getSystem('asteroidBelt');
            const initialRadius = asteroidBelt.innerRadius;

            // Update with new planet positions
            const newPlanets = new Map([
                ['Mars', { position: { x: 100, y: 0, z: 0 } }],
                ['Jupiter', { position: { x: 300, y: 0, z: 0 } }]
            ]);

            asteroidBelt.updateBeltPosition(newPlanets);

            // Verify positions were recalculated
            expect(asteroidBelt.planetPositions).toBe(newPlanets);
        });

        test('should maintain performance across multiple updates', async () => {
            await manager.init(mockScene);

            const startTime = Date.now();

            // Simulate multiple frame updates
            for (let i = 0; i < 100; i++) {
                manager.update(0.016);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete in reasonable time (less than 1 second for 100 updates)
            expect(duration).toBeLessThan(1000);
        });

        test('should handle system interactions correctly', async () => {
            await manager.init(mockScene);

            // Verify all systems were added to scene
            expect(mockScene.add).toHaveBeenCalledTimes(3);

            // Update all systems
            manager.update(0.032);

            // Change visibility of all systems
            manager.setSystemVisible('starfield', false);
            manager.setSystemVisible('nebula', false);
            manager.setSystemVisible('asteroidBelt', false);

            const starfield = manager.getSystem('starfield');
            const nebula = manager.getSystem('nebula');
            const asteroidBelt = manager.getSystem('asteroidBelt');

            expect(starfield.stars.visible).toBe(false);
            expect(nebula.nebula.visible).toBe(false);
            expect(asteroidBelt.asteroids.visible).toBe(false);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle system creation with zero particles', () => {
            const emptyStarfield = new StarfieldSystem({ starCount: 0 });
            expect(emptyStarfield.options.starCount).toBe(0);

            const emptyNebula = new NebulaSystem({ particleCount: 0 });
            expect(emptyNebula.options.particleCount).toBe(0);

            const emptyBelt = new AsteroidBeltSystem({ asteroidCount: 0 });
            expect(emptyBelt.options.asteroidCount).toBe(0);
        });

        test('should handle null scene during initialization', async () => {
            const manager = new ParticleSystemManager();

            // Should handle null scene gracefully
            await manager.init(null);
            // The actual implementation should handle this in try-catch
        });

        test('should handle system disposal when not initialized', () => {
            const starfield = new StarfieldSystem();
            expect(() => starfield.dispose()).not.toThrow();

            const nebula = new NebulaSystem();
            expect(() => nebula.dispose()).not.toThrow();

            const asteroidBelt = new AsteroidBeltSystem();
            expect(() => asteroidBelt.dispose()).not.toThrow();
        });

        test('should handle very large particle counts', async () => {
            const largeStarfield = new StarfieldSystem({ starCount: 100000 });

            // Should not throw during creation
            await largeStarfield.init(mockScene);
            expect(largeStarfield.stars).toBeInstanceOf(THREE.Points);

            largeStarfield.dispose();
        });

        test('should handle negative or invalid options gracefully', () => {
            const invalidStarfield = new StarfieldSystem({
                starCount: -100,
                starSizeMin: -1,
                starSizeMax: -2,
                twinkleSpeed: -0.5
            });

            // Options should still be set (validation would be in real implementation)
            expect(invalidStarfield.options.starCount).toBe(-100);
            expect(invalidStarfield.options.starSizeMin).toBe(-1);
        });

        test('should handle missing Helpers object', async () => {
            // Temporarily remove Helpers
            const originalHelpers = window.Helpers;
            delete window.Helpers;

            const starfield = new StarfieldSystem();

            // Should not throw when Helpers is undefined
            await starfield.init(mockScene);
            expect(starfield.stars).toBeInstanceOf(THREE.Points);

            // Restore Helpers
            window.Helpers = originalHelpers;
            starfield.dispose();
        });

        test('should handle rapid consecutive updates', async () => {
            const manager = new ParticleSystemManager();
            await manager.init(mockScene);

            // Rapid updates should not cause issues
            for (let i = 0; i < 1000; i++) {
                manager.update(0.001);
            }

            const starfield = manager.getSystem('starfield');
            expect(starfield.time).toBeCloseTo(1.0, 1);

            manager.dispose();
        });
    });

    describe('Factory Functions and API', () => {
        test('should provide factory functions for individual systems', () => {
            expect(window.ParticleSystems.createStarfield).toBeDefined();
            expect(window.ParticleSystems.createNebula).toBeDefined();
            expect(window.ParticleSystems.createAsteroidBelt).toBeDefined();
        });

        test('should create systems via factory methods', () => {
            const starfield = window.ParticleSystems.createStarfield({ starCount: 1000 });
            expect(starfield).toBeInstanceOf(StarfieldSystem);
            expect(starfield.options.starCount).toBe(1000);

            const nebula = window.ParticleSystems.createNebula({ particleCount: 500 });
            expect(nebula).toBeInstanceOf(NebulaSystem);
            expect(nebula.options.particleCount).toBe(500);

            const asteroidBelt = window.ParticleSystems.createAsteroidBelt({ asteroidCount: 200 });
            expect(asteroidBelt).toBeInstanceOf(AsteroidBeltSystem);
            expect(asteroidBelt.options.asteroidCount).toBe(200);

            starfield.dispose();
            nebula.dispose();
            asteroidBelt.dispose();
        });

        test('should provide manager factory with options', () => {
            const manager1 = window.ParticleSystems.create();
            const manager2 = window.ParticleSystems.create({ performanceMode: true });

            expect(manager1).toBeInstanceOf(ParticleSystemManager);
            expect(manager1.options.performanceMode).toBe(false);
            expect(manager2.options.performanceMode).toBe(true);

            manager1.dispose();
            manager2.dispose();
        });
    });

    describe('Performance and Memory Management', () => {
        test('should create appropriate buffer sizes', async () => {
            const starfield = new StarfieldSystem({ starCount: 1000 });
            await starfield.init(mockScene);

            const positionAttr = starfield.starGeometry.setAttribute.mock.calls
                .find(call => call[0] === 'position')[1];
            const colorAttr = starfield.starGeometry.setAttribute.mock.calls
                .find(call => call[0] === 'color')[1];
            const sizeAttr = starfield.starGeometry.setAttribute.mock.calls
                .find(call => call[0] === 'size')[1];

            expect(positionAttr.array.length).toBe(1000 * 3); // x,y,z per star
            expect(colorAttr.array.length).toBe(1000 * 3);    // r,g,b per star
            expect(sizeAttr.array.length).toBe(1000);         // size per star

            starfield.dispose();
        });

        test('should properly mark geometry for updates', async () => {
            const asteroidBelt = new AsteroidBeltSystem({ asteroidCount: 100 });
            await asteroidBelt.init(mockScene);

            asteroidBelt.update(0.1);

            expect(asteroidBelt.asteroidGeometry.attributes.position.needsUpdate).toBe(true);

            asteroidBelt.dispose();
        });

        test('should dispose of all resources during cleanup', async () => {
            const manager = new ParticleSystemManager();
            await manager.init(mockScene);

            const systemCount = manager.systems.size;
            expect(systemCount).toBeGreaterThan(0);

            // Track dispose calls
            const disposeCalls = [];
            manager.systems.forEach((system, name) => {
                if (system.dispose) {
                    const originalDispose = system.dispose;
                    system.dispose = jest.fn(() => {
                        disposeCalls.push(name);
                        originalDispose.call(system);
                    });
                }
            });

            manager.dispose();

            expect(disposeCalls.length).toBe(systemCount);
            expect(manager.systems.size).toBe(0);
        });
    });

    describe('Shader and Material Properties', () => {
        test('should create proper shader materials for starfield', async () => {
            const starfield = new StarfieldSystem();
            await starfield.init(mockScene);

            expect(starfield.starMaterial).toBeInstanceOf(THREE.ShaderMaterial);
            expect(starfield.starMaterial.uniforms).toEqual(starfield.twinkleUniforms);
            expect(starfield.starMaterial.vertexShader).toBeDefined();
            expect(starfield.starMaterial.fragmentShader).toBeDefined();
            expect(starfield.starMaterial.blending).toBe(THREE.AdditiveBlending);
            expect(starfield.starMaterial.transparent).toBe(true);
            expect(starfield.starMaterial.depthWrite).toBe(false);

            starfield.dispose();
        });

        test('should create proper shader materials for nebula', async () => {
            const nebula = new NebulaSystem();
            await nebula.init(mockScene);

            expect(nebula.nebulaMaterial).toBeInstanceOf(THREE.ShaderMaterial);
            expect(nebula.nebulaMaterial.uniforms).toEqual(nebula.nebulaUniforms);
            expect(nebula.nebulaMaterial.blending).toBe(THREE.AdditiveBlending);
            expect(nebula.nebulaMaterial.transparent).toBe(true);
            expect(nebula.nebulaMaterial.depthWrite).toBe(false);

            nebula.dispose();
        });

        test('should create proper point materials for asteroids', async () => {
            const asteroidBelt = new AsteroidBeltSystem();
            await asteroidBelt.init(mockScene);

            expect(asteroidBelt.asteroidMaterial).toBeInstanceOf(THREE.PointsMaterial);
            expect(asteroidBelt.asteroidMaterial.vertexColors).toBe(true);
            expect(asteroidBelt.asteroidMaterial.sizeAttenuation).toBe(true);
            expect(asteroidBelt.asteroidMaterial.transparent).toBe(true);
            expect(asteroidBelt.asteroidMaterial.blending).toBe(THREE.NormalBlending);

            asteroidBelt.dispose();
        });
    });

    describe('Console Logging', () => {
        test('should load module successfully', () => {
            // Test that the module loaded properly by checking its structure
            expect(typeof window.ParticleSystems).toBe('object');
            expect(window.ParticleSystems.loaded).toBe(true);
            expect(window.ParticleSystems.version).toBe('1.0.0');
            expect(window.ParticleSystems.StarfieldSystem).toBeDefined();
            expect(window.ParticleSystems.ParticleSystemManager).toBeDefined();
        });

        test('should log system creation messages', async () => {
            const starfield = new StarfieldSystem();
            await starfield.init(mockScene);

            expect(window.Helpers.log).toHaveBeenCalledWith(
                'Starfield created with 5000 stars',
                'debug'
            );

            starfield.dispose();
        });

        test('should log asteroid belt position calculations', () => {
            const asteroidBelt = new AsteroidBeltSystem();
            const planetInstances = new Map([
                ['Mars', { position: { x: 60, y: 0, z: 45 } }],
                ['Jupiter', { position: { x: 80, y: 0, z: 100 } }]
            ]);

            asteroidBelt.planetPositions = planetInstances;
            asteroidBelt.calculateBeltPositions();

            expect(window.Helpers.log).toHaveBeenCalledWith(
                expect.stringContaining('Asteroid belt positioned'),
                'debug'
            );

            asteroidBelt.dispose();
        });
    });
});