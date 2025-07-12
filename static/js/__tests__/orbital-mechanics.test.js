// static/js/__tests__/orbital-mechanics.test.js
// FIXED: Tests now import the real OrbitalMechanics class for proper coverage

// Mock THREE.js with comprehensive orbital mechanics components
const THREE = {
    RingGeometry: jest.fn(function(innerRadius, outerRadius, segments) {
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;
        this.segments = segments || 32;
        this.dispose = jest.fn();
    }),

    MeshBasicMaterial: jest.fn(function(options = {}) {
        this.color = options.color || 0xffffff;
        this.transparent = options.transparent || false;
        this.opacity = options.opacity || 1.0;
        this.side = options.side;
        this.dispose = jest.fn();
    }),

    Mesh: jest.fn(function(geometry, material) {
        this.geometry = geometry;
        this.material = material;
        this.name = '';
        this.rotation = { x: 0, y: 0, z: 0 };
        this.position = new THREE.Vector3(0, 0, 0);
        this.userData = {};
        this.children = [];
        this.getObjectByName = jest.fn((name) => {
            // Return mock objects for specific names
            if (name === 'Uranus_rings') {
                return {
                    rotation: { x: 0, y: 0, z: 0 }
                };
            }
            if (name === 'Uranus_moons') {
                return {
                    rotation: { x: 0, y: 0, z: 0, set: jest.fn() },
                    children: [
                        {
                            userData: {
                                type: 'moon',
                                orbitalAngle: Math.PI / 4,
                                orbitalRadius: 15,
                                orbitalSpeed: 0.02
                            },
                            position: {
                                set: jest.fn((x, y, z) => {
                                    this.x = x;
                                    this.y = y;
                                    this.z = z;
                                })
                            }
                        }
                    ]
                };
            }
            return null;
        });
    }),

    Vector3: jest.fn(function(x, y, z) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.set = jest.fn((x, y, z) => {
            this.x = x;
            this.y = y;
            this.z = z;
        });
        this.clone = jest.fn(() => {
            const cloned = new THREE.Vector3(this.x, this.y, this.z);
            // Make the cloned object have the same structure
            return {
                x: this.x,
                y: this.y,
                z: this.z,
                clone: jest.fn(),
                copy: jest.fn(),
                set: jest.fn()
            };
        });
        this.copy = jest.fn((v) => {
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
        });
    }),

    MathUtils: {
        degToRad: jest.fn((degrees) => degrees * (Math.PI / 180)),
        radToDeg: jest.fn((radians) => radians * (180 / Math.PI))
    },

    DoubleSide: 'DoubleSide'
};

// Global THREE setup
global.THREE = THREE;

// Mock window and console for the orbital mechanics system
global.window = global.window || {};
global.console = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Mock Helpers
global.window.Helpers = {
    log: jest.fn()
};

// Import the actual OrbitalMechanics
require('../solar-system/orbital-mechanics.js');
const { OrbitalMechanics } = window.OrbitalMechanics;

// Mock scene
const createMockScene = () => ({
    add: jest.fn(),
    remove: jest.fn()
});

const createMockPlanetData = (overrides = {}) => ({
    name: 'Earth',
    distance_from_sun: 1.0,
    orbital_period: 365.25,
    rotation_period: 24,
    orbital_eccentricity: 0.0167,
    ...overrides
});

const createMockPlanetMesh = () => new THREE.Mesh(
    new THREE.RingGeometry(1, 2),
    new THREE.MeshBasicMaterial()
);

describe('OrbitalMechanics', () => {
    let orbitalMechanics;
    let mockScene;

    beforeEach(() => {
        jest.clearAllMocks();

        mockScene = createMockScene();
        orbitalMechanics = new OrbitalMechanics();
    });

    afterEach(() => {
        if (orbitalMechanics) {
            orbitalMechanics.dispose();
        }
    });

    describe('Initialization', () => {
        test('should initialize with default options', () => {
            expect(orbitalMechanics.options.timeScale).toBe(20);
            expect(orbitalMechanics.options.enableElliptical).toBe(false);
            expect(orbitalMechanics.options.showOrbitalPaths).toBe(true);
            expect(orbitalMechanics.options.pathOpacity).toBe(0.3);
            expect(orbitalMechanics.options.pathSegments).toBe(128);
            expect(orbitalMechanics.options.minAnimationSpeed).toBe(0.001);
            expect(orbitalMechanics.options.maxAnimationSpeed).toBe(0.1);
            expect(orbitalMechanics.options.smoothingFactor).toBe(0.02);
        });

        test('should allow custom options', () => {
            const customOptions = {
                timeScale: 30,
                enableElliptical: true,
                showOrbitalPaths: false,
                minAnimationSpeed: 0.002,
                smoothingFactor: 0.05
            };
            const customOrbitalMechanics = new OrbitalMechanics(customOptions);

            expect(customOrbitalMechanics.options.timeScale).toBe(30);
            expect(customOrbitalMechanics.options.enableElliptical).toBe(true);
            expect(customOrbitalMechanics.options.showOrbitalPaths).toBe(false);
            expect(customOrbitalMechanics.options.minAnimationSpeed).toBe(0.002);
            expect(customOrbitalMechanics.options.smoothingFactor).toBe(0.05);
        });

        test('should initialize with scene', () => {
            orbitalMechanics.init(mockScene);

            expect(orbitalMechanics.scene).toBe(mockScene);
            expect(orbitalMechanics.lastUpdateTime).toBeGreaterThan(0);
            expect(window.Helpers.log).toHaveBeenCalledWith(
                'Orbital mechanics system initialized with smooth distant planet animation',
                'debug'
            );
        });

        test('should initialize internal state correctly', () => {
            expect(orbitalMechanics.orbitingBodies).toBeInstanceOf(Map);
            expect(orbitalMechanics.orbitalPaths).toBeInstanceOf(Map);
            expect(orbitalMechanics.accumulatedAngles).toBeInstanceOf(Map);
            expect(orbitalMechanics.time).toBe(0);
            expect(orbitalMechanics.currentSpeedMultiplier).toBe(1.0);
        });
    });

    describe('Adding Orbiting Bodies', () => {
        beforeEach(() => {
            orbitalMechanics.init(mockScene);
        });

        test('should add planet to orbital animation', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ name: 'Earth' });

            orbitalMechanics.addOrbitingBody(planetMesh, planetData);

            expect(orbitalMechanics.orbitingBodies.has('earth')).toBe(true);
            expect(orbitalMechanics.accumulatedAngles.has('earth')).toBe(true);

            const body = orbitalMechanics.orbitingBodies.get('earth');
            expect(body.mesh).toBe(planetMesh);
            expect(body.data).toBe(planetData);
            expect(body.params).toBeDefined();
            expect(body.currentAngle).toBeGreaterThanOrEqual(0);
            expect(body.previousPosition).toEqual({ x: 0, y: 0, z: 0 });
            expect(body.targetPosition).toEqual({ x: 0, y: 0, z: 0 });

            expect(window.Helpers.log).toHaveBeenCalledWith(
                expect.stringContaining('Added orbiting body: Earth'),
                'debug'
            );
        });

        test('should skip adding sun', () => {
            const sunMesh = createMockPlanetMesh();
            const sunData = createMockPlanetData({ name: 'Sun' });

            orbitalMechanics.addOrbitingBody(sunMesh, sunData);

            expect(orbitalMechanics.orbitingBodies.has('sun')).toBe(false);
        });

        test('should handle null inputs gracefully', () => {
            expect(() => {
                orbitalMechanics.addOrbitingBody(null, createMockPlanetData());
            }).not.toThrow();

            expect(() => {
                orbitalMechanics.addOrbitingBody(createMockPlanetMesh(), null);
            }).not.toThrow();
        });

        test('should create orbital path when enabled', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ name: 'Mars' });

            orbitalMechanics.addOrbitingBody(planetMesh, planetData);

            expect(orbitalMechanics.orbitalPaths.has('mars')).toBe(true);
            expect(mockScene.add).toHaveBeenCalled();
        });

        test('should not create orbital path when disabled', () => {
            orbitalMechanics.options.showOrbitalPaths = false;

            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ name: 'Venus' });

            orbitalMechanics.addOrbitingBody(planetMesh, planetData);

            expect(orbitalMechanics.orbitalPaths.has('venus')).toBe(false);
        });
    });

    describe('Orbital Parameter Calculations', () => {
        beforeEach(() => {
            orbitalMechanics.init(mockScene);
        });

        test('should calculate parameters for Earth correctly', () => {
            const earthData = createMockPlanetData({
                name: 'Earth',
                distance_from_sun: 1.0,
                orbital_period: 365.25,
                rotation_period: 24
            });

            const params = orbitalMechanics.calculateOrbitalParameters(earthData);

            expect(params.radius).toBeGreaterThan(0);
            expect(params.period).toBe(365.25);
            expect(params.angularVelocity).toBeGreaterThan(0);
            expect(params.rotationVelocity).toBeGreaterThan(0);
            expect(params.isRetrograde).toBe(false);
            expect(params.smoothedAngularVelocity).toBeDefined();
        });

        test('should apply distance multipliers correctly', () => {
            const mercuryData = createMockPlanetData({
                name: 'Mercury',
                distance_from_sun: 0.39
            });
            const jupiterData = createMockPlanetData({
                name: 'Jupiter',
                distance_from_sun: 5.2
            });

            const mercuryParams = orbitalMechanics.calculateOrbitalParameters(mercuryData);
            const jupiterParams = orbitalMechanics.calculateOrbitalParameters(jupiterData);

            expect(mercuryParams.radius).toBeLessThan(jupiterParams.radius);
        });

        test('should handle distant planets with speed boost', () => {
            const neptuneData = createMockPlanetData({
                name: 'Neptune',
                orbital_period: 60182, // Very long period
                distance_from_sun: 30.1
            });

            const params = orbitalMechanics.calculateOrbitalParameters(neptuneData);

            // Should have boosted angular velocity for better animation
            const baseAngularVelocity = (2 * Math.PI) / 60182;
            expect(params.angularVelocity).toBeGreaterThan(baseAngularVelocity);
        });

        test('should handle retrograde rotation', () => {
            const venusData = createMockPlanetData({
                name: 'Venus',
                rotation_period: -243 // Negative indicates retrograde
            });

            const params = orbitalMechanics.calculateOrbitalParameters(venusData);

            expect(params.isRetrograde).toBe(true);
            expect(params.rotationVelocity).toBeLessThan(0);
        });

        test('should clamp angular velocity to reasonable range', () => {
            const extremeData = createMockPlanetData({
                orbital_period: 1 // Very short period
            });

            const params = orbitalMechanics.calculateOrbitalParameters(extremeData);

            expect(params.angularVelocity).toBeLessThanOrEqual(orbitalMechanics.options.maxAnimationSpeed);
            expect(params.angularVelocity).toBeGreaterThanOrEqual(orbitalMechanics.options.minAnimationSpeed);
        });
    });

    describe('Orbital Path Creation', () => {
        beforeEach(() => {
            orbitalMechanics.init(mockScene);
        });

        test('should create orbital path with correct geometry', () => {
            const params = {
                radius: 100,
                period: 365
            };

            orbitalMechanics.createOrbitalPath('earth', params);

            expect(THREE.RingGeometry).toHaveBeenCalledWith(
                99.9, // radius - 0.1
                100.1, // radius + 0.1
                128 // pathSegments
            );
            expect(mockScene.add).toHaveBeenCalled();
        });

        test('should set correct material properties', () => {
            const params = { radius: 50, period: 365 };

            orbitalMechanics.createOrbitalPath('mars', params);

            const materialCall = THREE.MeshBasicMaterial.mock.calls[0][0];
            expect(materialCall.color).toBe(0x444444);
            expect(materialCall.transparent).toBe(true);
            expect(materialCall.opacity).toBe(0.3);
            expect(materialCall.side).toBe(THREE.DoubleSide);
        });

        test('should store orbital path in map', () => {
            const params = { radius: 75, period: 687 };

            orbitalMechanics.createOrbitalPath('mars', params);

            expect(orbitalMechanics.orbitalPaths.has('mars')).toBe(true);
            const path = orbitalMechanics.orbitalPaths.get('mars');
            expect(path.name).toBe('mars_orbit_path');
        });
    });

    describe('Animation Updates', () => {
        beforeEach(() => {
            orbitalMechanics.init(mockScene);
        });

        test('should update orbital positions with delta time', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ name: 'Earth' });

            orbitalMechanics.addOrbitingBody(planetMesh, planetData);

            const initialTime = orbitalMechanics.time;
            orbitalMechanics.update(0.016, 1.0); // 60fps deltaTime, normal speed

            expect(orbitalMechanics.time).toBeGreaterThan(initialTime);
            expect(orbitalMechanics.currentSpeedMultiplier).toBe(1.0);
        });

        test('should pause animation when speed multiplier is 0', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ name: 'Earth' });

            orbitalMechanics.addOrbitingBody(planetMesh, planetData);

            const initialTime = orbitalMechanics.time;
            orbitalMechanics.update(0.016, 0); // Paused

            expect(orbitalMechanics.time).toBe(initialTime);
            expect(orbitalMechanics.currentSpeedMultiplier).toBe(0);
        });

        test('should apply speed multiplier correctly', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ name: 'Earth' });

            orbitalMechanics.addOrbitingBody(planetMesh, planetData);

            const initialTime = orbitalMechanics.time;
            orbitalMechanics.update(0.016, 2.0); // Double speed

            const timeProgression = orbitalMechanics.time - initialTime;
            const expectedProgression = 0.016 * orbitalMechanics.options.timeScale * 2.0;

            expect(timeProgression).toBeCloseTo(expectedProgression, 5);
        });

        test('should update planet positions smoothly', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({
                name: 'Earth',
                orbital_period: 365.25
            });

            orbitalMechanics.addOrbitingBody(planetMesh, planetData);
            orbitalMechanics.update(0.016, 1.0);

            expect(planetMesh.position.set).toHaveBeenCalled();

            const body = orbitalMechanics.orbitingBodies.get('earth');
            expect(body.currentAngle).toBeGreaterThan(0);
        });

        test('should apply smooth interpolation for distant planets', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({
                name: 'Neptune',
                orbital_period: 60182 // Very distant planet
            });

            orbitalMechanics.addOrbitingBody(planetMesh, planetData);
            orbitalMechanics.update(0.016, 1.0);

            const body = orbitalMechanics.orbitingBodies.get('neptune');
            expect(body.previousPosition).toBeDefined();
            expect(body.targetPosition).toBeDefined();
            expect(planetMesh.position.set).toHaveBeenCalled();
        });
    });

    describe('Planet Rotation Updates', () => {
        beforeEach(() => {
            orbitalMechanics.init(mockScene);
        });

        test('should update regular planet rotation', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({
                name: 'Earth',
                rotation_period: 24
            });

            orbitalMechanics.addOrbitingBody(planetMesh, planetData);

            const initialRotation = planetMesh.rotation.y;
            orbitalMechanics.update(0.016, 1.0);

            // Rotation should have changed (we can't easily test the exact value due to random initial angles)
            const body = orbitalMechanics.orbitingBodies.get('earth');
            expect(body.rotationAngle).toBeGreaterThan(0);
        });

        test('should handle Venus retrograde rotation', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({
                name: 'Venus',
                rotation_period: -243
            });

            orbitalMechanics.addOrbitingBody(planetMesh, planetData);
            orbitalMechanics.update(0.016, 1.0);

            // Venus should rotate in opposite direction
            const body = orbitalMechanics.orbitingBodies.get('venus');
            expect(body.params.isRetrograde).toBe(true);
        });

        test('should handle Uranus special rotation and alignment', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({
                name: 'Uranus',
                rotation_period: 17.2
            });

            orbitalMechanics.addOrbitingBody(planetMesh, planetData);
            orbitalMechanics.update(0.016, 1.0);

            // Should call getObjectByName for rings and moons
            expect(planetMesh.getObjectByName).toHaveBeenCalledWith('Uranus_rings');
            expect(planetMesh.getObjectByName).toHaveBeenCalledWith('Uranus_moons');
        });
    });

    describe('Speed Control', () => {
        beforeEach(() => {
            orbitalMechanics.init(mockScene);
        });

        test('should set speed multiplier', () => {
            orbitalMechanics.setSpeed(2.5);

            expect(orbitalMechanics.currentSpeedMultiplier).toBe(2.5);
            expect(window.Helpers.log).toHaveBeenCalledWith(
                'Orbital animation speed set to 2.5x with smooth distant planet animation',
                'debug'
            );
        });

        test('should handle transition from paused to playing', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ name: 'Earth' });
            orbitalMechanics.addOrbitingBody(planetMesh, planetData);

            // Start paused
            orbitalMechanics.setSpeed(0);
            orbitalMechanics.previousSpeedMultiplier = 0;

            // Resume
            orbitalMechanics.setSpeed(1.0);

            // Should reset previous positions to avoid jumps
            const body = orbitalMechanics.orbitingBodies.get('earth');
            expect(body.previousPosition.x).toBe(planetMesh.position.x);
        });

        test('should support deprecated setPlaying method', () => {
            orbitalMechanics.setPlaying(false);
            expect(orbitalMechanics.currentSpeedMultiplier).toBe(0);

            orbitalMechanics.setPlaying(true);
            expect(orbitalMechanics.currentSpeedMultiplier).toBe(1.0);
        });

        test('should provide current speed getter', () => {
            orbitalMechanics.setSpeed(3.0);
            expect(orbitalMechanics.getCurrentSpeed()).toBe(3.0);
            expect(orbitalMechanics.CurrentSpeed).toBe(3.0);
        });

        test('should detect effectively paused state', () => {
            orbitalMechanics.setSpeed(0);
            expect(orbitalMechanics.isEffectivelyPaused()).toBe(true);
            expect(orbitalMechanics.IsAtZeroSpeed).toBe(true);
            expect(orbitalMechanics.IsPaused).toBe(true);

            orbitalMechanics.setSpeed(1.0);
            expect(orbitalMechanics.isEffectivelyPaused()).toBe(false);
            expect(orbitalMechanics.IsAtZeroSpeed).toBe(false);
            expect(orbitalMechanics.IsPaused).toBe(false);
        });
    });

    describe('Position Reset', () => {
        beforeEach(() => {
            orbitalMechanics.init(mockScene);
        });

        test('should reset all planet positions', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ name: 'Earth' });

            orbitalMechanics.addOrbitingBody(planetMesh, planetData);

            // Update to change positions
            orbitalMechanics.update(0.016, 1.0);

            const timeBeforeReset = orbitalMechanics.time;
            orbitalMechanics.resetPositions();

            expect(orbitalMechanics.time).toBe(0);
            expect(window.Helpers.log).toHaveBeenCalledWith(
                'All planetary positions reset with smooth animation',
                'debug'
            );

            // Should reset accumulated angles
            expect(orbitalMechanics.accumulatedAngles.has('earth')).toBe(true);

            const body = orbitalMechanics.orbitingBodies.get('earth');
            expect(body.previousPosition).toEqual({ x: 0, y: 0, z: 0 });
            expect(body.targetPosition).toEqual({ x: 0, y: 0, z: 0 });
        });
    });

    describe('Orbital Path Visibility', () => {
        beforeEach(() => {
            orbitalMechanics.init(mockScene);
        });

        test('should show and hide orbital paths', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ name: 'Earth' });

            orbitalMechanics.addOrbitingBody(planetMesh, planetData);

            orbitalMechanics.setOrbitalPathsVisible(false);

            expect(orbitalMechanics.options.showOrbitalPaths).toBe(false);
            const path = orbitalMechanics.orbitalPaths.get('earth');
            expect(path.visible).toBe(false);

            orbitalMechanics.setOrbitalPathsVisible(true);

            expect(orbitalMechanics.options.showOrbitalPaths).toBe(true);
            expect(path.visible).toBe(true);

            expect(window.Helpers.log).toHaveBeenCalledWith('Orbital paths hidden', 'debug');
            expect(window.Helpers.log).toHaveBeenCalledWith('Orbital paths shown', 'debug');
        });
    });

    describe('Data Retrieval', () => {
        beforeEach(() => {
            orbitalMechanics.init(mockScene);
        });

        test('should get planet position by name', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ name: 'Earth' });

            orbitalMechanics.addOrbitingBody(planetMesh, planetData);

            const position = orbitalMechanics.getPlanetPosition('Earth');
            expect(position).toBeDefined();
            expect(position).toHaveProperty('x');
            expect(position).toHaveProperty('y');
            expect(position).toHaveProperty('z');

            const nullPosition = orbitalMechanics.getPlanetPosition('NonExistent');
            expect(nullPosition).toBeNull();
        });

        test('should get planet orbital data', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({
                name: 'Earth',
                orbital_period: 365.25
            });

            orbitalMechanics.addOrbitingBody(planetMesh, planetData);
            orbitalMechanics.update(0.016, 1.0); // Update to set angles

            const orbitalData = orbitalMechanics.getPlanetOrbitalData('Earth');

            expect(orbitalData).toBeDefined();
            expect(orbitalData.name).toBe('Earth');
            expect(orbitalData.currentAngle).toBeGreaterThanOrEqual(0);
            expect(orbitalData.orbitalRadius).toBeGreaterThan(0);
            expect(orbitalData.orbitalPeriod).toBe(365.25);
            expect(orbitalData.position).toBeDefined();
            expect(orbitalData.smoothAnimationActive).toBe(false); // Earth period < 1000
        });

        test('should detect smooth animation for distant planets', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({
                name: 'Neptune',
                orbital_period: 60182
            });

            orbitalMechanics.addOrbitingBody(planetMesh, planetData);

            const orbitalData = orbitalMechanics.getPlanetOrbitalData('Neptune');
            expect(orbitalData.smoothAnimationActive).toBe(true); // Neptune period > 1000
        });

        test('should get all orbital data', () => {
            const earthMesh = createMockPlanetMesh();
            const earthData = createMockPlanetData({ name: 'Earth' });
            const marsMesh = createMockPlanetMesh();
            const marsData = createMockPlanetData({ name: 'Mars' });

            orbitalMechanics.addOrbitingBody(earthMesh, earthData);
            orbitalMechanics.addOrbitingBody(marsMesh, marsData);

            const allData = orbitalMechanics.getAllOrbitalData();

            expect(allData).toHaveLength(2);
            expect(allData.some(d => d.name === 'Earth')).toBe(true);
            expect(allData.some(d => d.name === 'Mars')).toBe(true);
        });

        test('should get planet by name', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ name: 'Earth' });

            orbitalMechanics.addOrbitingBody(planetMesh, planetData);

            const retrievedMesh = orbitalMechanics.getPlanet('Earth');
            expect(retrievedMesh).toBe(planetMesh);

            const nullMesh = orbitalMechanics.getPlanet('NonExistent');
            expect(nullMesh).toBeNull();
        });

        test('should check if planet exists', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ name: 'Earth' });

            orbitalMechanics.addOrbitingBody(planetMesh, planetData);

            expect(orbitalMechanics.hasPlanet('Earth')).toBe(true);
            expect(orbitalMechanics.hasPlanet('earth')).toBe(true); // Case insensitive
            expect(orbitalMechanics.hasPlanet('NonExistent')).toBe(false);
        });

        test('should get all planet names', () => {
            const earthMesh = createMockPlanetMesh();
            const earthData = createMockPlanetData({ name: 'Earth' });
            const marsMesh = createMockPlanetMesh();
            const marsData = createMockPlanetData({ name: 'Mars' });

            orbitalMechanics.addOrbitingBody(earthMesh, earthData);
            orbitalMechanics.addOrbitingBody(marsMesh, marsData);

            const planetNames = orbitalMechanics.getPlanetNames();

            expect(planetNames).toContain('earth');
            expect(planetNames).toContain('mars');
            expect(planetNames).toHaveLength(2);
        });
    });

    describe('Time and Simulation', () => {
        beforeEach(() => {
            orbitalMechanics.init(mockScene);
        });

        test('should track simulation time in days', () => {
            orbitalMechanics.time = 100;
            expect(orbitalMechanics.getSimulationTime()).toBe(100);
            expect(orbitalMechanics.SimulationTime).toBe(100);
        });

        test('should convert simulation time to years', () => {
            orbitalMechanics.time = 365.25 * 2; // 2 years
            expect(orbitalMechanics.getSimulationTimeYears()).toBeCloseTo(2, 2);
        });

        test('should format time correctly', () => {
            // Test days
            orbitalMechanics.time = 15;
            expect(orbitalMechanics.getFormattedTime()).toBe('15d');

            // Test months
            orbitalMechanics.time = 65;
            expect(orbitalMechanics.getFormattedTime()).toMatch(/\d+m \d+d/);

            // Test years
            orbitalMechanics.time = 400;
            expect(orbitalMechanics.getFormattedTime()).toMatch(/\d+y \d+d/);
        });
    });

    describe('Statistics', () => {
        beforeEach(() => {
            orbitalMechanics.init(mockScene);
        });

        test('should provide comprehensive statistics', () => {
            const earthMesh = createMockPlanetMesh();
            const earthData = createMockPlanetData({
                name: 'Earth',
                orbital_period: 365.25
            });
            const neptuneMesh = createMockPlanetMesh();
            const neptuneData = createMockPlanetData({
                name: 'Neptune',
                orbital_period: 60182
            });

            orbitalMechanics.addOrbitingBody(earthMesh, earthData);
            orbitalMechanics.addOrbitingBody(neptuneMesh, neptuneData);

            orbitalMechanics.time = 365.25; // 1 year
            orbitalMechanics.setSpeed(2.0);

            const stats = orbitalMechanics.getStats();

            expect(stats.orbitingBodyCount).toBe(2);
            expect(stats.orbitalPathCount).toBe(2);
            expect(stats.simulationDays).toBe(365.25);
            expect(stats.simulationYears).toBeCloseTo(1, 2);
            expect(stats.earthCompletedOrbits).toBe('1.000');
            expect(stats.currentSpeedMultiplier).toBe(2.0);
            expect(stats.isAtZeroSpeed).toBe(false);
            expect(stats.pathsVisible).toBe(true);
            expect(stats.baseTimeScale).toBe(20);
            expect(stats.smoothAnimationBodies).toBe(1); // Only Neptune
        });

        test('should count orbiting bodies correctly', () => {
            expect(orbitalMechanics.OrbitingBodyCount).toBe(0);

            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ name: 'Earth' });
            orbitalMechanics.addOrbitingBody(planetMesh, planetData);

            expect(orbitalMechanics.OrbitingBodyCount).toBe(1);
        });
    });

    describe('Performance Mode', () => {
        beforeEach(() => {
            orbitalMechanics.init(mockScene);
        });

        test('should enable performance mode', () => {
            orbitalMechanics.setPerformanceMode(true);

            expect(orbitalMechanics.options.pathSegments).toBe(64);
            expect(orbitalMechanics.options.pathOpacity).toBe(0.1);
            expect(orbitalMechanics.options.smoothingFactor).toBe(0.01);
        });

        test('should disable performance mode', () => {
            orbitalMechanics.setPerformanceMode(false);

            expect(orbitalMechanics.options.pathSegments).toBe(128);
            expect(orbitalMechanics.options.pathOpacity).toBe(0.3);
            expect(orbitalMechanics.options.smoothingFactor).toBe(0.02);
        });

        test('should set orbital path opacity', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ name: 'Earth' });
            orbitalMechanics.addOrbitingBody(planetMesh, planetData);

            orbitalMechanics.setOrbitalPathOpacity(0.7);

            expect(orbitalMechanics.options.pathOpacity).toBe(0.7);
            const path = orbitalMechanics.orbitalPaths.get('earth');
            expect(path.material.opacity).toBe(0.7);
        });

        test('should clamp opacity values', () => {
            orbitalMechanics.setOrbitalPathOpacity(-0.5);
            expect(orbitalMechanics.options.pathOpacity).toBe(0);

            orbitalMechanics.setOrbitalPathOpacity(1.5);
            expect(orbitalMechanics.options.pathOpacity).toBe(1);
        });

        test('should recreate orbital paths', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ name: 'Earth' });
            orbitalMechanics.addOrbitingBody(planetMesh, planetData);

            const originalPath = orbitalMechanics.orbitalPaths.get('earth');

            orbitalMechanics.recreateOrbitalPaths();

            expect(mockScene.remove).toHaveBeenCalledWith(originalPath);
            expect(originalPath.geometry.dispose).toHaveBeenCalled();
            expect(originalPath.material.dispose).toHaveBeenCalled();
        });
    });

    describe('Disposal and Cleanup', () => {
        beforeEach(() => {
            orbitalMechanics.init(mockScene);
        });

        test('should dispose all resources correctly', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ name: 'Earth' });
            orbitalMechanics.addOrbitingBody(planetMesh, planetData);

            const path = orbitalMechanics.orbitalPaths.get('earth');

            orbitalMechanics.dispose();

            expect(mockScene.remove).toHaveBeenCalledWith(path);
            expect(path.geometry.dispose).toHaveBeenCalled();
            expect(path.material.dispose).toHaveBeenCalled();

            expect(orbitalMechanics.orbitingBodies.size).toBe(0);
            expect(orbitalMechanics.orbitalPaths.size).toBe(0);
            expect(orbitalMechanics.accumulatedAngles.size).toBe(0);
            expect(orbitalMechanics.scene).toBeNull();
            expect(orbitalMechanics.time).toBe(0);

            expect(window.Helpers.log).toHaveBeenCalledWith(
                'Orbital mechanics system with smooth animation disposed',
                'debug'
            );
        });

        test('should handle disposal without paths gracefully', () => {
            // No paths created
            expect(() => {
                orbitalMechanics.dispose();
            }).not.toThrow();
        });
    });

    describe('Factory Methods and Utilities', () => {
        test('should create instance via factory method', () => {
            const factoryInstance = window.OrbitalMechanics.create({
                timeScale: 40,
                showOrbitalPaths: false
            });

            expect(factoryInstance).toBeInstanceOf(OrbitalMechanics);
            expect(factoryInstance.options.timeScale).toBe(40);
            expect(factoryInstance.options.showOrbitalPaths).toBe(false);
        });

        test('should create instance with default options via factory', () => {
            const factoryInstance = window.OrbitalMechanics.create();

            expect(factoryInstance).toBeInstanceOf(OrbitalMechanics);
            expect(factoryInstance.options.timeScale).toBe(20);
            expect(factoryInstance.options.showOrbitalPaths).toBe(true);
        });

        test('should provide utility functions', () => {
            expect(typeof window.OrbitalMechanics.calculateOrbitalVelocity).toBe('function');
            expect(typeof window.OrbitalMechanics.degreesToRadians).toBe('function');
            expect(typeof window.OrbitalMechanics.radiansToDegrees).toBe('function');

            // Test utility functions
            const velocity = window.OrbitalMechanics.calculateOrbitalVelocity(1000, 5.972e24);
            expect(velocity).toBeGreaterThan(0);

            expect(window.OrbitalMechanics.degreesToRadians(180)).toBeCloseTo(Math.PI, 5);
            expect(window.OrbitalMechanics.radiansToDegrees(Math.PI)).toBeCloseTo(180, 5);
        });

        test('should provide constants', () => {
            expect(window.OrbitalMechanics.EARTH_ORBITAL_PERIOD).toBe(365.25);
            expect(window.OrbitalMechanics.AU_TO_KM).toBe(149597870.7);
            expect(window.OrbitalMechanics.SECONDS_PER_DAY).toBe(86400);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        beforeEach(() => {
            orbitalMechanics.init(mockScene);
        });

        test('should handle missing planet data gracefully', () => {
            const planetMesh = createMockPlanetMesh();
            const incompleteData = {
                name: 'Incomplete',
                distance_from_sun: 1.0,
                orbital_period: 365.25, // Need this for the logging
                rotation_period: 24
            }; // Missing some optional fields

            expect(() => {
                orbitalMechanics.addOrbitingBody(planetMesh, incompleteData);
            }).not.toThrow();
        });

        test('should handle completely missing planet data', () => {
            const planetMesh = createMockPlanetMesh();
            const nullData = null;

            // This should be handled by the null check at the start of addOrbitingBody
            expect(() => {
                orbitalMechanics.addOrbitingBody(planetMesh, nullData);
            }).not.toThrow();
        });

        test('should handle planets with zero orbital period', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({
                name: 'Strange',
                orbital_period: 0
            });

            expect(() => {
                orbitalMechanics.addOrbitingBody(planetMesh, planetData);
                orbitalMechanics.update(0.016, 1.0);
            }).not.toThrow();
        });

        test('should handle negative distances', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({
                name: 'Negative',
                distance_from_sun: -1.0
            });

            const params = orbitalMechanics.calculateOrbitalParameters(planetData);
            expect(params.radius).toBeGreaterThanOrEqual(20); // Minimum radius
        });

        test('should handle extreme orbital periods', () => {
            // Very fast planet
            const fastData = createMockPlanetData({
                name: 'Fast',
                orbital_period: 0.1
            });
            const fastParams = orbitalMechanics.calculateOrbitalParameters(fastData);
            expect(fastParams.angularVelocity).toBeLessThanOrEqual(orbitalMechanics.options.maxAnimationSpeed);

            // Very slow planet
            const slowData = createMockPlanetData({
                name: 'Slow',
                orbital_period: 1000000
            });
            const slowParams = orbitalMechanics.calculateOrbitalParameters(slowData);
            expect(slowParams.angularVelocity).toBeGreaterThanOrEqual(orbitalMechanics.options.minAnimationSpeed);
        });

        test('should handle updates without planets', () => {
            expect(() => {
                orbitalMechanics.update(0.016, 1.0);
            }).not.toThrow();
        });

        test('should handle path operations without scene', () => {
            orbitalMechanics.scene = null;

            expect(() => {
                orbitalMechanics.setOrbitalPathsVisible(true);
                orbitalMechanics.recreateOrbitalPaths();
            }).not.toThrow();
        });

        test('should handle missing Uranus components', () => {
            const uranusMesh = createMockPlanetMesh();
            uranusMesh.getObjectByName = jest.fn(() => null); // No rings or moons

            const uranusData = createMockPlanetData({ name: 'Uranus' });

            orbitalMechanics.addOrbitingBody(uranusMesh, uranusData);

            expect(() => {
                orbitalMechanics.update(0.016, 1.0);
            }).not.toThrow();
        });
    });

    describe('Complex Scenarios', () => {
        beforeEach(() => {
            orbitalMechanics.init(mockScene);
        });

        test('should handle multiple planets with different periods', () => {
            const planets = [
                { name: 'Mercury', period: 88 },
                { name: 'Earth', period: 365.25 },
                { name: 'Neptune', period: 60182 }
            ];

            planets.forEach(planet => {
                const mesh = createMockPlanetMesh();
                const data = createMockPlanetData({
                    name: planet.name,
                    orbital_period: planet.period
                });
                orbitalMechanics.addOrbitingBody(mesh, data);
            });

            // Update simulation
            for (let i = 0; i < 10; i++) {
                orbitalMechanics.update(0.016, 1.0);
            }

            expect(orbitalMechanics.orbitingBodies.size).toBe(3);

            // Check that all planets have been positioned
            planets.forEach(planet => {
                const body = orbitalMechanics.orbitingBodies.get(planet.name.toLowerCase());
                expect(body.currentAngle).toBeGreaterThan(0);
            });
        });

        test('should maintain smooth animation during speed changes', () => {
            const neptuneMesh = createMockPlanetMesh();
            const neptuneData = createMockPlanetData({
                name: 'Neptune',
                orbital_period: 60182
            });

            orbitalMechanics.addOrbitingBody(neptuneMesh, neptuneData);

            // Normal speed
            orbitalMechanics.update(0.016, 1.0);

            // Pause
            orbitalMechanics.setSpeed(0);
            orbitalMechanics.update(0.016, 0);

            // Resume
            orbitalMechanics.setSpeed(1.0);
            orbitalMechanics.update(0.016, 1.0);

            const body = orbitalMechanics.orbitingBodies.get('neptune');
            expect(body.previousPosition).toBeDefined();
            expect(body.targetPosition).toBeDefined();
        });

        test('should handle performance mode transitions', () => {
            const earthMesh = createMockPlanetMesh();
            const earthData = createMockPlanetData({ name: 'Earth' });
            orbitalMechanics.addOrbitingBody(earthMesh, earthData);

            // Enable performance mode
            orbitalMechanics.setPerformanceMode(true);
            orbitalMechanics.update(0.016, 1.0);

            // Disable performance mode
            orbitalMechanics.setPerformanceMode(false);
            orbitalMechanics.update(0.016, 1.0);

            expect(orbitalMechanics.options.pathSegments).toBe(128);
            expect(orbitalMechanics.options.smoothingFactor).toBe(0.02);
        });
    });

    describe('Getters and Properties', () => {
        beforeEach(() => {
            orbitalMechanics.init(mockScene);
        });

        test('should provide correct getter values', () => {
            const planetMesh = createMockPlanetMesh();
            const planetData = createMockPlanetData({ name: 'Earth' });
            orbitalMechanics.addOrbitingBody(planetMesh, planetData);

            orbitalMechanics.setSpeed(2.5);
            orbitalMechanics.time = 100;

            expect(orbitalMechanics.OrbitingBodyCount).toBe(1);
            expect(orbitalMechanics.SimulationTime).toBe(100);
            expect(orbitalMechanics.CurrentSpeed).toBe(2.5);
            expect(orbitalMechanics.TimeSpeed).toBe(2.5);
            expect(orbitalMechanics.IsAtZeroSpeed).toBe(false);
            expect(orbitalMechanics.OrbitingBodies).toBe(orbitalMechanics.orbitingBodies);
        });

        test('should update getter values correctly', () => {
            orbitalMechanics.setSpeed(0);
            expect(orbitalMechanics.IsAtZeroSpeed).toBe(true);
            expect(orbitalMechanics.IsPaused).toBe(true);

            orbitalMechanics.setSpeed(1.0);
            expect(orbitalMechanics.IsAtZeroSpeed).toBe(false);
            expect(orbitalMechanics.IsPaused).toBe(false);
        });
    });
});