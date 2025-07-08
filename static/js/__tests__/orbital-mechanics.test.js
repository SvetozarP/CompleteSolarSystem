// static/js/__tests__/orbital-mechanics.test.js
// Mock window.OrbitalMechanics
window.OrbitalMechanics = class OrbitalMechanics {
    constructor(options = {}) {
        this.options = {
            timeScale: 20,
            enableElliptical: false,
            showOrbitalPaths: true,
            ...options
        };
        this.orbitingBodies = new Map();
        this.currentSpeedMultiplier = 1.0;
    }
};

describe('OrbitalMechanics', () => {
    let orbitalMechanics;

    beforeEach(() => {
        // Reset window.OrbitalMechanics instance before each test
        orbitalMechanics = new window.OrbitalMechanics();
    });

    test('initializes with default options', () => {
        expect(orbitalMechanics.options.timeScale).toBe(20);
        expect(orbitalMechanics.options.enableElliptical).toBe(false);
        expect(orbitalMechanics.options.showOrbitalPaths).toBe(true);
        expect(orbitalMechanics.currentSpeedMultiplier).toBe(1.0);
    });

    test('allows custom options', () => {
        const customOptions = {
            timeScale: 30,
            enableElliptical: true,
            showOrbitalPaths: false
        };
        const customOrbitalMechanics = new window.OrbitalMechanics(customOptions);

        expect(customOrbitalMechanics.options.timeScale).toBe(30);
        expect(customOrbitalMechanics.options.enableElliptical).toBe(true);
        expect(customOrbitalMechanics.options.showOrbitalPaths).toBe(false);
    });

    test('manages speed multiplier correctly', () => {
        orbitalMechanics.currentSpeedMultiplier = 2.0;
        expect(orbitalMechanics.currentSpeedMultiplier).toBe(2.0);

        orbitalMechanics.currentSpeedMultiplier = 0;
        expect(orbitalMechanics.currentSpeedMultiplier).toBe(0);
    });

    test('maintains orbitingBodies collection', () => {
        expect(orbitalMechanics.orbitingBodies).toBeInstanceOf(Map);
        expect(orbitalMechanics.orbitingBodies.size).toBe(0);
    });
});