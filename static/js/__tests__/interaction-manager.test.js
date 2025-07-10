// static/js/__tests__/interaction-manager.test.js

// Mock THREE.js before importing the class
jest.mock('three', () => ({
    Raycaster: jest.fn(function() {
        this.setFromCamera = jest.fn();
        this.intersectObjects = jest.fn(() => []);
    })
}));

// Import the actual class to test
import { InteractionManager } from '../solar-system/interaction-manager.js';

describe('InteractionManager', () => {
    let domElement;
    let interactionManager;
    let mockApp;
    let mockCameraControls;
    let mockInfoPanel;

    beforeEach(() => {
        // Create DOM element
        domElement = document.createElement('div');
        document.body.appendChild(domElement);

        // Mock global objects
        mockCameraControls = {
            focusAndFollowPlanet: jest.fn(),
            followDistance: 50
        };

        mockApp = {
            cameraControls: mockCameraControls,
            planetInstances: new Map([
                ['Earth', { name: 'Earth', position: { x: 0, y: 0, z: 0 } }],
                ['Mars', { name: 'Mars', position: { x: 100, y: 0, z: 0 } }]
            ])
        };

        mockInfoPanel = {
            show: jest.fn(),
            init: jest.fn()
        };

        // Set up global window mocks
        window.solarSystemApp = mockApp;
        window.Helpers = {
            log: jest.fn()
        };
        window.ControlPanel = {
            updateSelectedPlanet: jest.fn(),
            updateCameraDistance: jest.fn()
        };

        // Mock window.InteractionManager for backward compatibility test
        window.InteractionManager = {
            create: (options) => new InteractionManager(null, options)
        };

        // Mock document.dispatchEvent
        jest.spyOn(document, 'dispatchEvent').mockImplementation(() => true);

        // Create interaction manager instance
        interactionManager = new InteractionManager(domElement);
        interactionManager.infoPanel = mockInfoPanel;
    });

    afterEach(() => {
        // Clean up DOM
        if (domElement.parentNode) {
            domElement.parentNode.removeChild(domElement);
        }
        jest.clearAllMocks();
    });

    test('initializes with default properties', () => {
        expect(interactionManager.domElement).toBe(domElement);
        expect(interactionManager.raycaster).toBeDefined();
        expect(interactionManager.hoveredPlanet).toBeNull();
        expect(interactionManager.lastFocusedPlanet).toBeNull();
        expect(interactionManager.isInitialized).toBe(false);
        expect(interactionManager.eventListeners).toEqual([]);
        expect(interactionManager.focusDebounceDelay).toBe(500);
        expect(interactionManager.lastFocusTime).toBe(0);
    });

    test('initializes with custom options', () => {
        const customOptions = { customOption: 'test' };
        const customManager = new InteractionManager(domElement, customOptions);

        expect(customManager.options).toEqual(customOptions);
    });

    test('updateCursor changes cursor style based on intersection', () => {
        // Test no intersection
        interactionManager.updateCursor(null);
        expect(domElement.style.cursor).toBe('grab');

        // Test with intersection
        interactionManager.updateCursor({ name: 'Earth' });
        expect(domElement.style.cursor).toBe('pointer');
    });

    test('updateCursor handles missing domElement gracefully', () => {
        const managerWithoutElement = new InteractionManager(null);
        expect(() => {
            managerWithoutElement.updateCursor({ name: 'Earth' });
        }).not.toThrow();
    });

    test('handlePlanetClick selects planet and shows info panel', () => {
        const planetData = { name: 'Earth', radius: 6371 };

        interactionManager.handlePlanetClick(planetData);

        expect(interactionManager.selectedPlanet).toBe(planetData);
        expect(mockInfoPanel.show).toHaveBeenCalledWith(planetData);
        expect(document.dispatchEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'planetSelected',
                detail: { planet: planetData }
            })
        );
        expect(window.Helpers.log).toHaveBeenCalledWith(
            `Planet selected (UI only): ${planetData.name}`,
            'debug'
        );
    });

    test('handlePlanetClick works without info panel', () => {
        interactionManager.infoPanel = null;
        const planetData = { name: 'Mars', radius: 3390 };

        expect(() => {
            interactionManager.handlePlanetClick(planetData);
        }).not.toThrow();

        expect(interactionManager.selectedPlanet).toBe(planetData);
    });

    test('handlePlanetDoubleClick calls focusAndFollowPlanet', () => {
        const planetData = { name: 'Earth', radius: 6371 };
        const focusSpy = jest.spyOn(interactionManager, 'focusAndFollowPlanet');

        interactionManager.handlePlanetDoubleClick(planetData);

        expect(focusSpy).toHaveBeenCalledWith(planetData);
        expect(window.Helpers.log).toHaveBeenCalledWith(
            `Double-clicked planet: ${planetData.name}`,
            'debug'
        );
    });

    test('focusAndFollowPlanet focuses camera and updates controls', () => {
        const planetData = { name: 'Earth', radius: 6371 };

        interactionManager.focusAndFollowPlanet(planetData);

        expect(mockCameraControls.focusAndFollowPlanet).toHaveBeenCalledWith(
            mockApp.planetInstances.get('Earth'),
            planetData
        );
        expect(window.ControlPanel.updateSelectedPlanet).toHaveBeenCalledWith('Earth');
        expect(window.ControlPanel.updateCameraDistance).toHaveBeenCalledWith(50);
    });

    test('focusAndFollowPlanet handles debouncing', () => {
        const planetData = { name: 'Earth', radius: 6371 };

        // First call should work
        interactionManager.focusAndFollowPlanet(planetData);
        expect(mockCameraControls.focusAndFollowPlanet).toHaveBeenCalledTimes(1);

        // Immediate second call should be debounced
        interactionManager.focusAndFollowPlanet(planetData);
        expect(mockCameraControls.focusAndFollowPlanet).toHaveBeenCalledTimes(1);
    });

    test('focusAndFollowPlanet allows calls after debounce delay', (done) => {
        const planetData = { name: 'Earth', radius: 6371 };

        // First call
        interactionManager.focusAndFollowPlanet(planetData);
        expect(mockCameraControls.focusAndFollowPlanet).toHaveBeenCalledTimes(1);

        // Wait for debounce delay and call again
        setTimeout(() => {
            interactionManager.focusAndFollowPlanet(planetData);
            expect(mockCameraControls.focusAndFollowPlanet).toHaveBeenCalledTimes(2);
            done();
        }, 600); // Longer than debounce delay
    });

    test('focusAndFollowPlanet handles missing app gracefully', () => {
        window.solarSystemApp = null;
        const planetData = { name: 'Earth', radius: 6371 };

        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        interactionManager.focusAndFollowPlanet(planetData);

        expect(consoleSpy).toHaveBeenCalledWith(
            'Cannot focus on planet - camera controls not available'
        );

        consoleSpy.mockRestore();
    });

    test('focusAndFollowPlanet handles missing planet instance gracefully', () => {
        // Set up app with camera controls but without the planet instance
        const limitedApp = {
            cameraControls: mockCameraControls,
            planetInstances: new Map() // Empty map, no UnknownPlanet
        };
        window.solarSystemApp = limitedApp;

        const planetData = { name: 'UnknownPlanet', radius: 1000 };

        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        interactionManager.focusAndFollowPlanet(planetData);

        expect(consoleSpy).toHaveBeenCalledWith(
            'Planet instance not found: UnknownPlanet'
        );

        consoleSpy.mockRestore();
    });

    test('selectPlanet updates selected planet', () => {
        const planetData1 = { name: 'Earth', radius: 6371 };
        const planetData2 = { name: 'Mars', radius: 3390 };

        // Select first planet
        interactionManager.selectPlanet(planetData1);
        expect(interactionManager.selectedPlanet).toBe(planetData1);

        // Select second planet (should deselect first)
        interactionManager.selectPlanet(planetData2);
        expect(interactionManager.selectedPlanet).toBe(planetData2);
    });

    test('initialize sets up info panel and marks as initialized', () => {
        expect(interactionManager.isInitialized).toBe(false);

        interactionManager.initialize();

        expect(mockInfoPanel.init).toHaveBeenCalled();
        expect(interactionManager.isInitialized).toBe(true);
    });

    test('initialize works without info panel', () => {
        interactionManager.infoPanel = null;

        expect(() => {
            interactionManager.initialize();
        }).not.toThrow();

        expect(interactionManager.isInitialized).toBe(true);
    });

    test('maintains event listener collection', () => {
        const mockListener = jest.fn();
        interactionManager.eventListeners.push(mockListener);

        expect(interactionManager.eventListeners).toHaveLength(1);
        expect(interactionManager.eventListeners[0]).toBe(mockListener);
    });

    test('window.InteractionManager.create creates instance', () => {
        const options = { test: 'option' };
        const instance = window.InteractionManager.create(options);

        expect(instance).toBeInstanceOf(InteractionManager);
        expect(instance.options).toEqual(options);
    });
});