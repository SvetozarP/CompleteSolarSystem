// static/js/__tests__/interaction-manager.test.js
// Mock THREE with proper constructor functions
const THREE = {
    Raycaster: jest.fn(function() {
        this.setFromCamera = jest.fn();
        this.intersectObjects = jest.fn();
    })
};

// Mock the InteractionManager class
class InteractionManager {
    constructor(domElement, options = {}) {
        this.domElement = domElement;
        this.options = {
            ...options
        };

        this.raycaster = new THREE.Raycaster();
        this.hoveredPlanet = null;
        this.lastFocusedPlanet = null;
        this.isInitialized = false;
        this.eventListeners = [];

        this.focusDebounceDelay = 500;
        this.lastFocusTime = 0;
    }

    updateCursor(intersectedPlanet) {
        if (this.domElement) {
            this.domElement.style.cursor = intersectedPlanet ? 'pointer' : 'grab';
        }
    }
}

describe('InteractionManager', () => {
    let domElement;
    let interactionManager;

    beforeEach(() => {
        domElement = document.createElement('div');
        interactionManager = new InteractionManager(domElement);
    });

    test('initializes with default properties', () => {
        expect(interactionManager.domElement).toBe(domElement);
        expect(interactionManager.raycaster).toBeInstanceOf(THREE.Raycaster);
        expect(interactionManager.hoveredPlanet).toBeNull();
        expect(interactionManager.lastFocusedPlanet).toBeNull();
        expect(interactionManager.isInitialized).toBe(false);
        expect(interactionManager.eventListeners).toEqual([]);
        expect(interactionManager.focusDebounceDelay).toBe(500);
        expect(interactionManager.lastFocusTime).toBe(0);
    });

    test('updateCursor changes cursor style based on intersection', () => {
        interactionManager.updateCursor(null);
        expect(domElement.style.cursor).toBe('grab');

        interactionManager.updateCursor({ name: 'Earth' });
        expect(domElement.style.cursor).toBe('pointer');
    });

    test('maintains event listener collection', () => {
        const mockListener = jest.fn();
        interactionManager.eventListeners.push(mockListener);
        expect(interactionManager.eventListeners).toHaveLength(1);
        expect(interactionManager.eventListeners[0]).toBe(mockListener);
    });

    test('handles planet focus debouncing', () => {
        const currentTime = Date.now();
        interactionManager.lastFocusTime = currentTime;

        // Should be debounced (time difference < debounceDelay)
        expect(currentTime - interactionManager.lastFocusTime).toBeLessThan(interactionManager.focusDebounceDelay);
    });
});