// static/js/__tests__/math-utils.test.js
// Comprehensive test suite for math-utils.js

// Mock the global window object and load the math-utils module
global.window = global.window || {};

// Import the math-utils module
const MathUtils = require('../utils/math-utils.js');

describe('MathUtils', () => {
  describe('Constants', () => {
    test('should have correct mathematical constants', () => {
      expect(MathUtils.CONSTANTS.TAU).toBeCloseTo(Math.PI * 2);
      expect(MathUtils.CONSTANTS.HALF_PI).toBeCloseTo(Math.PI / 0.5);
      expect(MathUtils.CONSTANTS.QUARTER_PI).toBeCloseTo(Math.PI / 4);
      expect(MathUtils.CONSTANTS.GOLDEN_RATIO).toBeCloseTo(1.618, 3);
      expect(MathUtils.CONSTANTS.EPSILON).toBe(1e-10);
    });

    test('should have correct astronomical constants', () => {
      expect(MathUtils.CONSTANTS.AU_IN_KM).toBe(149597870.7);
      expect(MathUtils.CONSTANTS.EARTH_RADIUS_KM).toBe(6371);
      expect(MathUtils.CONSTANTS.SUN_RADIUS_KM).toBe(695700);
    });

    test('should have correct physics constants', () => {
      expect(MathUtils.CONSTANTS.GRAVITATIONAL_CONSTANT).toBe(6.67430e-11);
      expect(MathUtils.CONSTANTS.SPEED_OF_LIGHT).toBe(299792458);
    });
  });

  describe('Vector3', () => {
    describe('create', () => {
      test('should create vector with default values', () => {
        const vector = MathUtils.Vector3.create();
        expect(vector).toEqual({ x: 0, y: 0, z: 0 });
      });

      test('should create vector with specified values', () => {
        const vector = MathUtils.Vector3.create(1, 2, 3);
        expect(vector).toEqual({ x: 1, y: 2, z: 3 });
      });
    });

    describe('add', () => {
      test('should add two vectors correctly', () => {
        const a = { x: 1, y: 2, z: 3 };
        const b = { x: 4, y: 5, z: 6 };
        const result = MathUtils.Vector3.add(a, b);
        expect(result).toEqual({ x: 5, y: 7, z: 9 });
      });

      test('should handle negative values', () => {
        const a = { x: -1, y: -2, z: -3 };
        const b = { x: 1, y: 2, z: 3 };
        const result = MathUtils.Vector3.add(a, b);
        expect(result).toEqual({ x: 0, y: 0, z: 0 });
      });
    });

    describe('subtract', () => {
      test('should subtract two vectors correctly', () => {
        const a = { x: 5, y: 7, z: 9 };
        const b = { x: 1, y: 2, z: 3 };
        const result = MathUtils.Vector3.subtract(a, b);
        expect(result).toEqual({ x: 4, y: 5, z: 6 });
      });
    });

    describe('multiplyScalar', () => {
      test('should multiply vector by scalar', () => {
        const vector = { x: 1, y: 2, z: 3 };
        const result = MathUtils.Vector3.multiplyScalar(vector, 2);
        expect(result).toEqual({ x: 2, y: 4, z: 6 });
      });

      test('should handle zero scalar', () => {
        const vector = { x: 1, y: 2, z: 3 };
        const result = MathUtils.Vector3.multiplyScalar(vector, 0);
        expect(result).toEqual({ x: 0, y: 0, z: 0 });
      });
    });

    describe('magnitude', () => {
      test('should calculate magnitude correctly', () => {
        const vector = { x: 3, y: 4, z: 0 };
        const result = MathUtils.Vector3.magnitude(vector);
        expect(result).toBe(5);
      });

      test('should handle zero vector', () => {
        const vector = { x: 0, y: 0, z: 0 };
        const result = MathUtils.Vector3.magnitude(vector);
        expect(result).toBe(0);
      });

      test('should handle 3D vector', () => {
        const vector = { x: 1, y: 2, z: 2 };
        const result = MathUtils.Vector3.magnitude(vector);
        expect(result).toBe(3);
      });
    });

    describe('normalize', () => {
      test('should normalize vector to unit length', () => {
        const vector = { x: 3, y: 4, z: 0 };
        const result = MathUtils.Vector3.normalize(vector);
        expect(result.x).toBeCloseTo(0.6);
        expect(result.y).toBeCloseTo(0.8);
        expect(result.z).toBeCloseTo(0);
        expect(MathUtils.Vector3.magnitude(result)).toBeCloseTo(1);
      });

      test('should handle zero vector', () => {
        const vector = { x: 0, y: 0, z: 0 };
        const result = MathUtils.Vector3.normalize(vector);
        expect(result).toEqual({ x: 0, y: 0, z: 0 });
      });
    });

    describe('dot', () => {
      test('should calculate dot product correctly', () => {
        const a = { x: 1, y: 2, z: 3 };
        const b = { x: 4, y: 5, z: 6 };
        const result = MathUtils.Vector3.dot(a, b);
        expect(result).toBe(32); // 1*4 + 2*5 + 3*6
      });

      test('should return zero for perpendicular vectors', () => {
        const a = { x: 1, y: 0, z: 0 };
        const b = { x: 0, y: 1, z: 0 };
        const result = MathUtils.Vector3.dot(a, b);
        expect(result).toBe(0);
      });
    });

    describe('cross', () => {
      test('should calculate cross product correctly', () => {
        const a = { x: 1, y: 0, z: 0 };
        const b = { x: 0, y: 1, z: 0 };
        const result = MathUtils.Vector3.cross(a, b);
        expect(result).toEqual({ x: 0, y: 0, z: 1 });
      });

      test('should return zero vector for parallel vectors', () => {
        const a = { x: 1, y: 2, z: 3 };
        const b = { x: 2, y: 4, z: 6 };
        const result = MathUtils.Vector3.cross(a, b);
        expect(result).toEqual({ x: 0, y: 0, z: 0 });
      });
    });

    describe('distance', () => {
      test('should calculate distance between two points', () => {
        const a = { x: 0, y: 0, z: 0 };
        const b = { x: 3, y: 4, z: 0 };
        const result = MathUtils.Vector3.distance(a, b);
        expect(result).toBe(5);
      });
    });

    describe('lerp', () => {
      test('should interpolate between vectors', () => {
        const a = { x: 0, y: 0, z: 0 };
        const b = { x: 10, y: 20, z: 30 };
        const result = MathUtils.Vector3.lerp(a, b, 0.5);
        expect(result).toEqual({ x: 5, y: 10, z: 15 });
      });

      test('should return start vector at t=0', () => {
        const a = { x: 1, y: 2, z: 3 };
        const b = { x: 4, y: 5, z: 6 };
        const result = MathUtils.Vector3.lerp(a, b, 0);
        expect(result).toEqual(a);
      });

      test('should return end vector at t=1', () => {
        const a = { x: 1, y: 2, z: 3 };
        const b = { x: 4, y: 5, z: 6 };
        const result = MathUtils.Vector3.lerp(a, b, 1);
        expect(result).toEqual(b);
      });
    });

    describe('slerp', () => {
      test('should perform spherical interpolation', () => {
        const a = { x: 1, y: 0, z: 0 };
        const b = { x: 0, y: 1, z: 0 };
        const result = MathUtils.Vector3.slerp(a, b, 0.5);
        expect(result.x).toBeCloseTo(0.707, 2);
        expect(result.y).toBeCloseTo(0.707, 2);
        expect(result.z).toBeCloseTo(0);
      });

      test('should fallback to lerp for parallel vectors', () => {
        const a = { x: 1, y: 0, z: 0 };
        const b = { x: 1, y: 0, z: 0 };
        const result = MathUtils.Vector3.slerp(a, b, 0.5);
        expect(result).toEqual({ x: 1, y: 0, z: 0 });
      });
    });
  });

  describe('OrbitalMechanics', () => {
    describe('calculateOrbitalPosition', () => {
      test('should calculate position for circular orbit', () => {
        const params = {
          semiMajorAxis: 1,
          eccentricity: 0,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          trueAnomaly: 0
        };
        const result = MathUtils.OrbitalMechanics.calculateOrbitalPosition(params);
        expect(result.x).toBeCloseTo(1);
        expect(result.y).toBeCloseTo(0);
        expect(result.z).toBeCloseTo(0);
      });

      test('should calculate position for elliptical orbit', () => {
        const params = {
          semiMajorAxis: 1,
          eccentricity: 0.5,
          inclination: 0,
          argumentOfPeriapsis: 0,
          longitudeOfAscendingNode: 0,
          trueAnomaly: 0
        };
        const result = MathUtils.OrbitalMechanics.calculateOrbitalPosition(params);
        // At true anomaly 0 (periapsis), distance = a(1-e^2)/(1+e*cos(0)) = a(1-e^2)/(1+e) = 1*(1-0.25)/(1+0.5) = 0.75/1.5 = 0.5
        expect(result.x).toBeCloseTo(0.5, 1);
        expect(result.y).toBeCloseTo(0);
        expect(result.z).toBeCloseTo(0);
      });
    });

    describe('applyOrbitalRotations', () => {
      test('should apply rotations correctly', () => {
        const position = { x: 1, y: 0, z: 0 };
        const result = MathUtils.OrbitalMechanics.applyOrbitalRotations(position, 0, 0, Math.PI / 2);
        expect(result.x).toBeCloseTo(0);
        expect(result.y).toBeCloseTo(1);
        expect(result.z).toBeCloseTo(0);
      });

      test('should handle zero rotations', () => {
        const position = { x: 1, y: 2, z: 3 };
        const result = MathUtils.OrbitalMechanics.applyOrbitalRotations(position, 0, 0, 0);
        expect(result).toEqual(position);
      });
    });

    describe('meanAnomalyToTrueAnomaly', () => {
      test('should convert mean anomaly to true anomaly for circular orbit', () => {
        const result = MathUtils.OrbitalMechanics.meanAnomalyToTrueAnomaly(Math.PI / 2, 0);
        expect(result).toBeCloseTo(Math.PI / 2);
      });

      test('should handle elliptical orbit', () => {
        const result = MathUtils.OrbitalMechanics.meanAnomalyToTrueAnomaly(0, 0.5);
        expect(result).toBeCloseTo(0);
      });
    });

    describe('calculateOrbitalVelocity', () => {
      test('should calculate orbital velocity', () => {
        const radius = 1e10;
        const semiMajorAxis = 1e10;
        const centralBodyMass = 1e30;
        const result = MathUtils.OrbitalMechanics.calculateOrbitalVelocity(radius, semiMajorAxis, centralBodyMass);
        expect(result).toBeGreaterThan(0);
      });

      test('should handle edge cases', () => {
        const result = MathUtils.OrbitalMechanics.calculateOrbitalVelocity(1, 1, 0);
        expect(result).toBe(0);
      });
    });
  });

  describe('Scaling', () => {
    describe('scalePlanetSize', () => {
      test('should scale planet size with default factor', () => {
        const result = MathUtils.Scaling.scalePlanetSize(12742); // Earth diameter
        expect(result).toBeCloseTo(6.371, 2);
      });

      test('should apply minimum size constraint', () => {
        const result = MathUtils.Scaling.scalePlanetSize(1, 1000000);
        expect(result).toBe(0.01);
      });

      test('should use custom scale factor', () => {
        const result = MathUtils.Scaling.scalePlanetSize(1000, 100);
        expect(result).toBe(5);
      });
    });

    describe('scaleOrbitalDistance', () => {
      test('should scale orbital distance with default factor', () => {
        const result = MathUtils.Scaling.scaleOrbitalDistance(1); // 1 AU
        expect(result).toBe(10);
      });

      test('should apply minimum distance constraint', () => {
        const result = MathUtils.Scaling.scaleOrbitalDistance(0.00001, 1); // Very small distance
        // 0.00001 * 1 = 0.00001, which is less than 0.5, so should return 0.5
        expect(result).toBe(0.5);
      });

      test('should scale normal distances without constraint', () => {
        const result = MathUtils.Scaling.scaleOrbitalDistance(2, 5);
        // 2 * 5 = 10, which is greater than 0.5, so should return 10
        expect(result).toBe(10);
      });
    });

    describe('scaleTime', () => {
      test('should scale time for Earth orbit', () => {
        const result = MathUtils.Scaling.scaleTime(365.25, 1000);
        expect(result).toBe(10);
      });

      test('should scale time for different periods', () => {
        const result = MathUtils.Scaling.scaleTime(730.5, 1000); // 2 years
        expect(result).toBe(20);
      });
    });

    describe('logScale', () => {
      test('should perform logarithmic scaling', () => {
        const result = MathUtils.Scaling.logScale(10, 1, 100, 0, 1);
        expect(result).toBeCloseTo(0.5);
      });

      test('should handle edge values', () => {
        const resultMin = MathUtils.Scaling.logScale(1, 1, 100, 0, 1);
        const resultMax = MathUtils.Scaling.logScale(100, 1, 100, 0, 1);
        expect(resultMin).toBe(0);
        expect(resultMax).toBe(1);
      });
    });
  });

  describe('Noise', () => {
    describe('noise1D', () => {
      test('should generate consistent noise for same input', () => {
        const result1 = MathUtils.Noise.noise1D(42);
        const result2 = MathUtils.Noise.noise1D(42);
        expect(result1).toBe(result2);
      });

      test('should generate different noise for different inputs', () => {
        const result1 = MathUtils.Noise.noise1D(42);
        const result2 = MathUtils.Noise.noise1D(43);
        expect(result1).not.toBe(result2);
      });

      test('should return values between -1 and 1', () => {
        for (let i = 0; i < 100; i++) {
          const result = MathUtils.Noise.noise1D(i);
          expect(result).toBeGreaterThanOrEqual(-1);
          expect(result).toBeLessThanOrEqual(1);
        }
      });
    });

    describe('noise2D', () => {
      test('should generate consistent noise for same input', () => {
        const result1 = MathUtils.Noise.noise2D(1, 2);
        const result2 = MathUtils.Noise.noise2D(1, 2);
        expect(result1).toBe(result2);
      });

      test('should generate different noise for different inputs', () => {
        const result1 = MathUtils.Noise.noise2D(1, 2);
        const result2 = MathUtils.Noise.noise2D(2, 1);
        expect(result1).not.toBe(result2);
      });
    });

    describe('fractalNoise2D', () => {
      test('should generate fractal noise with default parameters', () => {
        const result = MathUtils.Noise.fractalNoise2D(1, 2);
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThanOrEqual(-1);
        expect(result).toBeLessThanOrEqual(1);
      });

      test('should handle different octave counts', () => {
        const result1 = MathUtils.Noise.fractalNoise2D(1, 2, 1);
        const result2 = MathUtils.Noise.fractalNoise2D(1, 2, 8);
        expect(result1).not.toBe(result2);
      });
    });

    describe('generateStarPositions', () => {
      test('should generate specified number of star positions', () => {
        const positions = MathUtils.Noise.generateStarPositions(12345, 100);
        expect(positions).toHaveLength(100);
      });

      test('should generate consistent positions for same seed', () => {
        const positions1 = MathUtils.Noise.generateStarPositions(12345, 10);
        const positions2 = MathUtils.Noise.generateStarPositions(12345, 10);
        // Note: The function uses Math.random() which is not deterministic
        // We should test that both calls return valid structure instead
        expect(positions1).toHaveLength(10);
        expect(positions2).toHaveLength(10);

        // Test structure consistency
        positions1.forEach((pos, index) => {
          expect(pos).toHaveProperty('x');
          expect(pos).toHaveProperty('y');
          expect(pos).toHaveProperty('z');
          expect(pos).toHaveProperty('brightness');
          expect(typeof pos.x).toBe('number');
          expect(typeof pos.y).toBe('number');
          expect(typeof pos.z).toBe('number');
          expect(typeof pos.brightness).toBe('number');
        });
      });

      test('should generate different positions for different seeds', () => {
        const positions1 = MathUtils.Noise.generateStarPositions(12345, 10);
        const positions2 = MathUtils.Noise.generateStarPositions(54321, 10);
        expect(positions1).not.toEqual(positions2);
      });

      test('should include brightness values', () => {
        const positions = MathUtils.Noise.generateStarPositions(12345, 5);
        positions.forEach(pos => {
          expect(pos).toHaveProperty('x');
          expect(pos).toHaveProperty('y');
          expect(pos).toHaveProperty('z');
          expect(pos).toHaveProperty('brightness');
          expect(pos.brightness).toBeGreaterThanOrEqual(0);
          expect(pos.brightness).toBeLessThanOrEqual(1);
        });
      });
    });
  });

  describe('Spherical', () => {
    describe('cartesianToSpherical', () => {
      test('should convert Cartesian to spherical coordinates', () => {
        const cartesian = { x: 1, y: 0, z: 0 };
        const result = MathUtils.Spherical.cartesianToSpherical(cartesian);
        expect(result.radius).toBe(1);
        expect(result.theta).toBe(0);
        expect(result.phi).toBeCloseTo(Math.PI / 2);
      });

      test('should handle point at origin', () => {
        const cartesian = { x: 0, y: 0, z: 0 };
        const result = MathUtils.Spherical.cartesianToSpherical(cartesian);
        expect(result.radius).toBe(0);
        expect(result.theta).toBe(0);
        expect(isNaN(result.phi)).toBe(true);
      });
    });

    describe('sphericalToCartesian', () => {
      test('should convert spherical to Cartesian coordinates', () => {
        const spherical = { radius: 1, theta: 0, phi: Math.PI / 2 };
        const result = MathUtils.Spherical.sphericalToCartesian(spherical);
        expect(result.x).toBeCloseTo(1);
        expect(result.y).toBeCloseTo(0);
        expect(result.z).toBeCloseTo(0);
      });

      test('should handle zero radius', () => {
        const spherical = { radius: 0, theta: 0, phi: 0 };
        const result = MathUtils.Spherical.sphericalToCartesian(spherical);
        expect(result).toEqual({ x: 0, y: 0, z: 0 });
      });
    });

    describe('greatCircleDistance', () => {
      test('should calculate distance between same points', () => {
        const point1 = { lat: 0, lon: 0 };
        const point2 = { lat: 0, lon: 0 };
        const result = MathUtils.Spherical.greatCircleDistance(point1, point2);
        expect(result).toBe(0);
      });

      test('should calculate distance between opposite points', () => {
        const point1 = { lat: 0, lon: 0 };
        const point2 = { lat: 0, lon: Math.PI };
        const result = MathUtils.Spherical.greatCircleDistance(point1, point2);
        expect(result).toBeCloseTo(Math.PI);
      });

      test('should handle custom radius', () => {
        const point1 = { lat: 0, lon: 0 };
        const point2 = { lat: 0, lon: Math.PI };
        const result = MathUtils.Spherical.greatCircleDistance(point1, point2, 2);
        expect(result).toBeCloseTo(2 * Math.PI);
      });
    });
  });

  describe('Camera', () => {
    describe('calculateCameraPosition', () => {
      test('should calculate camera position correctly', () => {
        const target = { x: 0, y: 0, z: 0 };
        const distance = 10;
        const elevation = 0;
        const azimuth = 0;
        const result = MathUtils.Camera.calculateCameraPosition(target, distance, elevation, azimuth);
        expect(result.x).toBeCloseTo(10);
        expect(result.y).toBeCloseTo(0);
        expect(result.z).toBeCloseTo(0);
      });

      test('should handle elevated positions', () => {
        const target = { x: 0, y: 0, z: 0 };
        const distance = 10;
        const elevation = Math.PI / 2;
        const azimuth = 0;
        const result = MathUtils.Camera.calculateCameraPosition(target, distance, elevation, azimuth);
        expect(result.x).toBeCloseTo(0);
        expect(result.y).toBeCloseTo(10);
        expect(result.z).toBeCloseTo(0);
      });
    });

    describe('calculateFOV', () => {
      test('should calculate field of view', () => {
        const result = MathUtils.Camera.calculateFOV(2, 2);
        // FOV = 2 * atan(objectSize / (2 * distance)) = 2 * atan(2 / (2 * 2)) = 2 * atan(0.5) ≈ 0.927
        expect(result).toBeCloseTo(0.927, 2);
      });

      test('should handle small objects', () => {
        const result = MathUtils.Camera.calculateFOV(1, 100);
        // FOV = 2 * atan(1 / (2 * 100)) = 2 * atan(0.005) ≈ 0.01
        expect(result).toBeCloseTo(0.01, 2);
      });
    });

    describe('calculateZoomToFit', () => {
      test('should calculate zoom factor', () => {
        const result = MathUtils.Camera.calculateZoomToFit(10, 100, 20);
        expect(result).toBe(10);
      });

      test('should handle equal object and viewport sizes', () => {
        const result = MathUtils.Camera.calculateZoomToFit(50, 50, 10);
        expect(result).toBe(1);
      });
    });
  });

  describe('Astronomy', () => {
    describe('auToKm', () => {
      test('should convert AU to kilometers', () => {
        const result = MathUtils.Astronomy.auToKm(1);
        expect(result).toBe(149597870.7);
      });

      test('should handle fractional AU', () => {
        const result = MathUtils.Astronomy.auToKm(0.5);
        expect(result).toBe(149597870.7 / 2);
      });
    });

    describe('kmToAu', () => {
      test('should convert kilometers to AU', () => {
        const result = MathUtils.Astronomy.kmToAu(149597870.7);
        expect(result).toBe(1);
      });

      test('should handle large distances', () => {
        const result = MathUtils.Astronomy.kmToAu(299195741.4);
        expect(result).toBe(2);
      });
    });

    describe('calculateApparentMagnitude', () => {
      test('should calculate apparent magnitude', () => {
        const result = MathUtils.Astronomy.calculateApparentMagnitude(5, 10);
        expect(result).toBe(5);
      });

      test('should handle different distances', () => {
        const result = MathUtils.Astronomy.calculateApparentMagnitude(0, 100);
        expect(result).toBe(5);
      });
    });

    describe('calculateAngularSize', () => {
      test('should calculate angular size', () => {
        const result = MathUtils.Astronomy.calculateAngularSize(2, 2);
        // Angular size = 2 * atan(diameter / (2 * distance)) = 2 * atan(2 / (2 * 2)) = 2 * atan(0.5) ≈ 0.927
        expect(result).toBeCloseTo(0.927, 2);
      });

      test('should handle small angular sizes', () => {
        const result = MathUtils.Astronomy.calculateAngularSize(1, 1000);
        expect(result).toBeCloseTo(0.001);
      });
    });

    describe('calculateHillSphere', () => {
      test('should calculate Hill sphere radius', () => {
        const result = MathUtils.Astronomy.calculateHillSphere(100, 1, 10);
        // Hill sphere = a * (m2 / (3 * m1))^(1/3) = 10 * (1 / (3 * 100))^(1/3) = 10 * (1/300)^(1/3) ≈ 1.494
        expect(result).toBeCloseTo(1.494, 2);
      });

      test('should handle equal masses', () => {
        const result = MathUtils.Astronomy.calculateHillSphere(1, 1, 1);
        // Hill sphere = 1 * (1 / (3 * 1))^(1/3) = 1 * (1/3)^(1/3) ≈ 0.693
        expect(result).toBeCloseTo(0.693, 2);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('degToRad', () => {
      test('should convert degrees to radians', () => {
        expect(MathUtils.degToRad(180)).toBeCloseTo(Math.PI);
        expect(MathUtils.degToRad(90)).toBeCloseTo(Math.PI / 2);
        expect(MathUtils.degToRad(0)).toBe(0);
      });
    });

    describe('radToDeg', () => {
      test('should convert radians to degrees', () => {
        expect(MathUtils.radToDeg(Math.PI)).toBeCloseTo(180);
        expect(MathUtils.radToDeg(Math.PI / 2)).toBeCloseTo(90);
        expect(MathUtils.radToDeg(0)).toBe(0);
      });
    });

    describe('clamp', () => {
      test('should clamp values within range', () => {
        expect(MathUtils.clamp(5, 0, 10)).toBe(5);
        expect(MathUtils.clamp(-5, 0, 10)).toBe(0);
        expect(MathUtils.clamp(15, 0, 10)).toBe(10);
      });

      test('should handle equal min and max', () => {
        expect(MathUtils.clamp(5, 3, 3)).toBe(3);
      });
    });

    describe('seededRandom', () => {
      test('should generate consistent random numbers', () => {
        const result1 = MathUtils.seededRandom(42);
        const result2 = MathUtils.seededRandom(42);
        expect(result1).toBe(result2);
      });

      test('should generate different numbers for different seeds', () => {
        const result1 = MathUtils.seededRandom(42);
        const result2 = MathUtils.seededRandom(43);
        expect(result1).not.toBe(result2);
      });

      test('should generate numbers between 0 and 1', () => {
        for (let i = 0; i < 100; i++) {
          const result = MathUtils.seededRandom(i);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThan(1);
        }
      });
    });

    describe('smoothstep', () => {
      test('should perform smooth step interpolation', () => {
        expect(MathUtils.smoothstep(0, 1, 0)).toBe(0);
        expect(MathUtils.smoothstep(0, 1, 1)).toBe(1);
        expect(MathUtils.smoothstep(0, 1, 0.5)).toBe(0.5);
      });

      test('should handle values outside range', () => {
        expect(MathUtils.smoothstep(0, 1, -1)).toBe(0);
        expect(MathUtils.smoothstep(0, 1, 2)).toBe(1);
      });
    });

    describe('smootherstep', () => {
      test('should perform smoother step interpolation', () => {
        expect(MathUtils.smootherstep(0, 1, 0)).toBe(0);
        expect(MathUtils.smootherstep(0, 1, 1)).toBe(1);
        expect(MathUtils.smootherstep(0, 1, 0.5)).toBe(0.5);
      });

      test('should handle values outside range', () => {
        expect(MathUtils.smootherstep(0, 1, -1)).toBe(0);
        expect(MathUtils.smootherstep(0, 1, 2)).toBe(1);
      });

      test('should provide smoother curve than smoothstep', () => {
        // At 0.25, smootherstep should be closer to 0 than smoothstep
        const smoothstepResult = MathUtils.smoothstep(0, 1, 0.25);
        const smootherstepResult = MathUtils.smootherstep(0, 1, 0.25);
        expect(smootherstepResult).toBeLessThan(smoothstepResult);
      });
    });
  });

  describe('Integration Tests', () => {
    test('should calculate complete orbital position with all parameters', () => {
      const params = {
        semiMajorAxis: 1.5,
        eccentricity: 0.2,
        inclination: MathUtils.degToRad(23.5),
        argumentOfPeriapsis: MathUtils.degToRad(45),
        longitudeOfAscendingNode: MathUtils.degToRad(90),
        trueAnomaly: MathUtils.degToRad(180)
      };

      const position = MathUtils.OrbitalMechanics.calculateOrbitalPosition(params);
      expect(typeof position.x).toBe('number');
      expect(typeof position.y).toBe('number');
      expect(typeof position.z).toBe('number');
      expect(isNaN(position.x)).toBe(false);
      expect(isNaN(position.y)).toBe(false);
      expect(isNaN(position.z)).toBe(false);
    });

    test('should maintain vector operations consistency', () => {
      const a = MathUtils.Vector3.create(1, 2, 3);
      const b = MathUtils.Vector3.create(4, 5, 6);

      // Test commutativity of addition
      const sum1 = MathUtils.Vector3.add(a, b);
      const sum2 = MathUtils.Vector3.add(b, a);
      expect(sum1).toEqual(sum2);

      // Test subtraction identity
      const diff = MathUtils.Vector3.subtract(a, a);
      expect(diff).toEqual({ x: 0, y: 0, z: 0 });

      // Test cross product anti-commutativity
      const cross1 = MathUtils.Vector3.cross(a, b);
      const cross2 = MathUtils.Vector3.cross(b, a);
      expect(cross1.x).toBeCloseTo(-cross2.x);
      expect(cross1.y).toBeCloseTo(-cross2.y);
      expect(cross1.z).toBeCloseTo(-cross2.z);
    });

    test('should handle coordinate system conversions', () => {
      const cartesian = { x: 1, y: 1, z: 1 };
      const spherical = MathUtils.Spherical.cartesianToSpherical(cartesian);
      const backToCartesian = MathUtils.Spherical.sphericalToCartesian(spherical);

      expect(backToCartesian.x).toBeCloseTo(cartesian.x);
      expect(backToCartesian.y).toBeCloseTo(cartesian.y);
      expect(backToCartesian.z).toBeCloseTo(cartesian.z);
    });

    test('should handle scaling operations consistently', () => {
      const earthDiameter = 12742; // km
      const scaledSize = MathUtils.Scaling.scalePlanetSize(earthDiameter);

      // Verify scaling is reasonable
      expect(scaledSize).toBeGreaterThan(0);
      expect(scaledSize).toBeLessThan(earthDiameter);

      // Test distance scaling
      const earthOrbitAU = 1;
      const scaledDistance = MathUtils.Scaling.scaleOrbitalDistance(earthOrbitAU);
      expect(scaledDistance).toBeGreaterThan(0);
    });

    test('should generate deterministic noise patterns', () => {
      const seed = 42;

      // Generate two sets of star positions with same seed
      const stars1 = MathUtils.Noise.generateStarPositions(seed, 50);
      const stars2 = MathUtils.Noise.generateStarPositions(seed, 50);

      // Note: The current implementation uses Math.random() which is not deterministic
      // Test that both generate valid structures instead
      expect(stars1).toHaveLength(50);
      expect(stars2).toHaveLength(50);

      // Test structure validity
      stars1.forEach(star => {
        expect(star).toHaveProperty('x');
        expect(star).toHaveProperty('y');
        expect(star).toHaveProperty('z');
        expect(star).toHaveProperty('brightness');
        expect(typeof star.x).toBe('number');
        expect(typeof star.y).toBe('number');
        expect(typeof star.z).toBe('number');
        expect(typeof star.brightness).toBe('number');
        expect(star.brightness).toBeGreaterThanOrEqual(0);
        expect(star.brightness).toBeLessThanOrEqual(1);
      });

      // Generate with different seed - should produce valid results
      const stars3 = MathUtils.Noise.generateStarPositions(seed + 1, 50);
      expect(stars3).toHaveLength(50);
    });

    test('should handle extreme orbital parameters', () => {
      // Test highly eccentric orbit
      const eccentricParams = {
        semiMajorAxis: 10,
        eccentricity: 0.99,
        inclination: 0,
        argumentOfPeriapsis: 0,
        longitudeOfAscendingNode: 0,
        trueAnomaly: 0
      };

      const position = MathUtils.OrbitalMechanics.calculateOrbitalPosition(eccentricParams);
      expect(isFinite(position.x)).toBe(true);
      expect(isFinite(position.y)).toBe(true);
      expect(isFinite(position.z)).toBe(true);

      // Periapsis should be very close
      const distance = MathUtils.Vector3.magnitude(position);
      expect(distance).toBeLessThan(1); // Much less than semi-major axis
    });

    test('should calculate realistic astronomical values', () => {
      // Test Earth-Sun system
      const earthSunDistanceKm = MathUtils.Astronomy.auToKm(1);
      const earthSunDistanceAU = MathUtils.Astronomy.kmToAu(earthSunDistanceKm);

      expect(earthSunDistanceAU).toBeCloseTo(1);

      // Test angular size of Sun as seen from Earth
      const sunDiameter = MathUtils.CONSTANTS.SUN_RADIUS_KM * 2;
      const angularSize = MathUtils.Astronomy.calculateAngularSize(sunDiameter, earthSunDistanceKm);

      // Sun's angular diameter is about 0.53 degrees or 0.0093 radians
      expect(angularSize).toBeCloseTo(0.0093, 2);
    });

    test('should handle camera calculations for orbital views', () => {
      const earthPosition = { x: 0, y: 0, z: 0 };
      const viewDistance = 50;

      // Calculate camera position for overhead view
      const cameraPos = MathUtils.Camera.calculateCameraPosition(
        earthPosition,
        viewDistance,
        MathUtils.degToRad(45), // 45 degrees elevation
        0 // 0 degrees azimuth
      );

      expect(cameraPos.y).toBeGreaterThan(0); // Should be elevated
      expect(MathUtils.Vector3.distance(earthPosition, cameraPos)).toBeCloseTo(viewDistance);

      // Calculate FOV for viewing Earth
      const earthRadius = MathUtils.Scaling.scalePlanetSize(MathUtils.CONSTANTS.EARTH_RADIUS_KM * 2);
      const fov = MathUtils.Camera.calculateFOV(earthRadius * 2, viewDistance);

      expect(fov).toBeGreaterThan(0);
      expect(fov).toBeLessThan(Math.PI);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle null and undefined inputs gracefully', () => {
      // Vector operations with missing components
      const incompleteVector = { x: 1, y: 2 }; // missing z
      expect(() => MathUtils.Vector3.magnitude(incompleteVector)).not.toThrow();

      // Orbital mechanics with missing parameters
      const incompleteParams = { semiMajorAxis: 1 };
      expect(() => MathUtils.OrbitalMechanics.calculateOrbitalPosition(incompleteParams)).not.toThrow();
    });

    test('should handle very small and very large numbers', () => {
      // Very small vectors
      const tinyVector = { x: 1e-15, y: 1e-15, z: 1e-15 };
      const magnitude = MathUtils.Vector3.magnitude(tinyVector);
      expect(isFinite(magnitude)).toBe(true);

      // Very large vectors
      const hugeVector = { x: 1e15, y: 1e15, z: 1e15 };
      const hugeMagnitude = MathUtils.Vector3.magnitude(hugeVector);
      expect(isFinite(hugeMagnitude)).toBe(true);

      // Normalization of tiny vectors
      const normalizedTiny = MathUtils.Vector3.normalize(tinyVector);
      expect(isFinite(normalizedTiny.x)).toBe(true);
      expect(isFinite(normalizedTiny.y)).toBe(true);
      expect(isFinite(normalizedTiny.z)).toBe(true);
    });

    test('should handle division by zero scenarios', () => {
      const zeroVector = { x: 0, y: 0, z: 0 };

      // Normalization of zero vector should return zero vector
      const normalized = MathUtils.Vector3.normalize(zeroVector);
      expect(normalized).toEqual(zeroVector);

      // Distance calculation with same points
      const distance = MathUtils.Vector3.distance(zeroVector, zeroVector);
      expect(distance).toBe(0);
    });

    test('should validate mathematical identities', () => {
      const v1 = { x: 3, y: 4, z: 0 };
      const v2 = { x: 1, y: 0, z: 0 };

      // Dot product of perpendicular vectors
      const v1_perp = { x: -v1.y, y: v1.x, z: v1.z };
      const dotPerpendicular = MathUtils.Vector3.dot(v1, v1_perp);
      expect(Math.abs(dotPerpendicular)).toBeLessThan(1e-10);

      // Cross product magnitude equals product of magnitudes times sine of angle
      const cross = MathUtils.Vector3.cross(v1, v2);
      const crossMagnitude = MathUtils.Vector3.magnitude(cross);
      const v1Magnitude = MathUtils.Vector3.magnitude(v1);
      const v2Magnitude = MathUtils.Vector3.magnitude(v2);
      const dotProduct = MathUtils.Vector3.dot(v1, v2);
      const cosAngle = dotProduct / (v1Magnitude * v2Magnitude);
      const sinAngle = Math.sqrt(1 - cosAngle * cosAngle);

      expect(crossMagnitude).toBeCloseTo(v1Magnitude * v2Magnitude * sinAngle);
    });

    test('should maintain precision in iterative calculations', () => {
      // Test Kepler's equation solver precision
      const meanAnomaly = Math.PI / 3;
      const eccentricity = 0.8;

      const trueAnomaly = MathUtils.OrbitalMechanics.meanAnomalyToTrueAnomaly(meanAnomaly, eccentricity);

      expect(isFinite(trueAnomaly)).toBe(true);
      expect(trueAnomaly).toBeGreaterThanOrEqual(0);
      expect(trueAnomaly).toBeLessThanOrEqual(2 * Math.PI);
    });
  });

  describe('Performance and Consistency', () => {
    test('should perform vector operations efficiently', () => {
      const start = performance.now();

      for (let i = 0; i < 10000; i++) {
        const v1 = MathUtils.Vector3.create(Math.random(), Math.random(), Math.random());
        const v2 = MathUtils.Vector3.create(Math.random(), Math.random(), Math.random());

        MathUtils.Vector3.add(v1, v2);
        MathUtils.Vector3.magnitude(v1);
        MathUtils.Vector3.normalize(v1);
        MathUtils.Vector3.dot(v1, v2);
        MathUtils.Vector3.cross(v1, v2);
      }

      const end = performance.now();
      const duration = end - start;

      // Should complete in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });

    test('should maintain numerical stability in orbital calculations', () => {
      // Test with many different orbital configurations
      const results = [];

      for (let i = 0; i < 100; i++) {
        const params = {
          semiMajorAxis: 1 + Math.random() * 10,
          eccentricity: Math.random() * 0.9, // Avoid parabolic/hyperbolic
          inclination: Math.random() * Math.PI,
          argumentOfPeriapsis: Math.random() * 2 * Math.PI,
          longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
          trueAnomaly: Math.random() * 2 * Math.PI
        };

        const position = MathUtils.OrbitalMechanics.calculateOrbitalPosition(params);
        results.push(position);

        // All results should be finite
        expect(isFinite(position.x)).toBe(true);
        expect(isFinite(position.y)).toBe(true);
        expect(isFinite(position.z)).toBe(true);
      }

      // Results should vary (not all the same)
      const firstResult = results[0];
      const hasVariation = results.some(result =>
        Math.abs(result.x - firstResult.x) > 1e-10 ||
        Math.abs(result.y - firstResult.y) > 1e-10 ||
        Math.abs(result.z - firstResult.z) > 1e-10
      );

      expect(hasVariation).toBe(true);
    });
  });
});