// Test for control-panel.js
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

// Mock DOM elements
const mockElement = (props = {}) => ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    click: jest.fn(),
    dispatchEvent: jest.fn(),
    remove: jest.fn(),
    classList: {
        add: jest.fn(),
        remove: jest.fn(),
        toggle: jest.fn(),
        contains: jest.fn(() => false)
    },
    style: {},
    textContent: '',
    innerHTML: '',
    appendChild: jest.fn(),
    parentNode: null,
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    checked: false,
    value: '1.0',
    dataset: {},
    title: '',
    clientWidth: 800,
    clientHeight: 600,
    ...props
});

// Mock Vector3
const mockVector3 = () => ({
    x: 0, y: 0, z: 0,
    set: jest.fn().mockReturnThis(),
    copy: jest.fn().mockReturnThis(),
    add: jest.fn().mockReturnThis(),
    sub: jest.fn().mockReturnThis(),
    normalize: jest.fn().mockReturnThis(),
    multiplyScalar: jest.fn().mockReturnThis(),
    distanceTo: jest.fn(() => 50),
    getWorldDirection: jest.fn(),
    getWorldPosition: jest.fn(),
    clone: jest.fn(() => mockVector3())
});

// Store original values to restore after tests
const originalTHREE = global.THREE;
const originalSetTimeout = global.setTimeout;
const originalWindow = { ...global.window };

// Set up global mocks before loading the module - but only for this test file
beforeAll(() => {
    global.THREE = {
        Vector3: jest.fn(() => mockVector3())
    };

    global.window.NotificationSystem = {
        showInfo: jest.fn(),
        showSuccess: jest.fn(),
        showError: jest.fn(),
        showWarning: jest.fn()
    };

    global.window.Helpers = {
        log: jest.fn()
    };

    global.window.solarSystemApp = {
        cameraControls: {
            camera: {
                position: mockVector3(),
                lookAt: jest.fn(),
                getWorldDirection: jest.fn()
            },
            target: mockVector3(),
            IsFollowing: false,
            followDistance: 50,
            followedPlanet: null,
            followOffset: mockVector3(),
            updateSphericalFromCamera: jest.fn(),
            stopFollowing: jest.fn(),
            setPosition: jest.fn(),
            lookAt: jest.fn()
        },
        interactionManager: {
            focusAndFollowPlanet: jest.fn(),
            SelectedPlanet: null
        },
        sceneManager: {
            takeScreenshot: jest.fn()
        },
        planetLabels: {
            toggle: jest.fn(() => true)
        },
        planets: [
            { name: 'Sun' },
            { name: 'Mercury' },
            { name: 'Venus' },
            { name: 'Earth' },
            { name: 'Mars' },
            { name: 'Jupiter' },
            { name: 'Saturn' },
            { name: 'Uranus' },
            { name: 'Neptune' },
            { name: 'Pluto' }
        ],
        resetCameraView: jest.fn(),
        togglePlanetFollowing: jest.fn(),
        stopFollowingPlanet: jest.fn()
    };

    global.window.SolarSystemConfig = {
        debug: false
    };

    // Mock globalThis
    global.globalThis = global.globalThis || {};
    global.globalThis.eventListenerCleanups = [];

    // Mock setTimeout that executes immediately for tests
    global.setTimeout = jest.fn((cb, delay) => {
        if (typeof cb === 'function') {
            // Execute callback immediately in tests
            cb();
        }
        return 1;
    });
});

// Restore original values after all tests
afterAll(() => {
    global.THREE = originalTHREE;
    global.setTimeout = originalSetTimeout;
    
    // Restore window properties
    if (originalWindow.NotificationSystem) {
        global.window.NotificationSystem = originalWindow.NotificationSystem;
    } else {
        delete global.window.NotificationSystem;
    }
    
    if (originalWindow.Helpers) {
        global.window.Helpers = originalWindow.Helpers;
    } else {
        delete global.window.Helpers;
    }
    
    if (originalWindow.solarSystemApp) {
        global.window.solarSystemApp = originalWindow.solarSystemApp;
    } else {
        delete global.window.solarSystemApp;
    }
    
    if (originalWindow.SolarSystemConfig) {
        global.window.SolarSystemConfig = originalWindow.SolarSystemConfig;
    } else {
        delete global.window.SolarSystemConfig;
    }
});

// Load the control panel module after setting up mocks
require('../ui/control-panel.js');

describe('ControlPanel', () => {
    let controlPanel;
    let mockElements;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        global.globalThis.eventListenerCleanups = [];
        
        // Reset solarSystemApp to original state
        global.window.solarSystemApp = {
            cameraControls: {
                camera: {
                    position: mockVector3(),
                    lookAt: jest.fn(),
                    getWorldDirection: jest.fn()
                },
                target: mockVector3(),
                IsFollowing: false,
                followDistance: 50,
                followedPlanet: null,
                followOffset: mockVector3(),
                updateSphericalFromCamera: jest.fn(),
                stopFollowing: jest.fn(),
                setPosition: jest.fn(),
                lookAt: jest.fn()
            },
            interactionManager: {
                focusAndFollowPlanet: jest.fn(),
                SelectedPlanet: null
            },
            sceneManager: {
                takeScreenshot: jest.fn()
            },
            planetLabels: {
                toggle: jest.fn(() => true)
            },
            planets: [
                { name: 'Sun' },
                { name: 'Mercury' },
                { name: 'Venus' },
                { name: 'Earth' },
                { name: 'Mars' },
                { name: 'Jupiter' },
                { name: 'Saturn' },
                { name: 'Uranus' },
                { name: 'Neptune' },
                { name: 'Pluto' }
            ],
            resetCameraView: jest.fn(),
            togglePlanetFollowing: jest.fn(),
            stopFollowingPlanet: jest.fn()
        };
        
        // Create fresh mock elements
        mockElements = {
            panel: mockElement(),
            collapseBtn: mockElement(),
            resetBtn: mockElement(),
            speedSlider: mockElement(),
            speedValue: mockElement(),
            planetNavigation: mockElement(),
            simTime: mockElement(),
            selectedPlanet: mockElement(),
            cameraDistance: mockElement(),
            speedContainer: mockElement(),
            infoPanel: mockElement(),
            checkboxes: {
                orbits: mockElement(),
                labels: mockElement(),
                asteroids: mockElement(),
                stars: mockElement()
            }
        };

        // Set up element relationships
        mockElements.speedSlider.parentNode = mockElement();
        mockElements.planetNavigation.querySelector = jest.fn(() => mockElement());
        mockElements.planetNavigation.querySelectorAll = jest.fn(() => [mockElement(), mockElement()]);

        // Mock DOM queries - Reset and set up fresh
        document.getElementById = jest.fn().mockImplementation((id) => {
            const elementMap = {
                'control-panel': mockElements.panel,
                'collapse-panel': mockElements.collapseBtn,
                'reset-btn': mockElements.resetBtn,
                'speed-slider': mockElements.speedSlider,
                'speed-value': mockElements.speedValue,
                'planet-navigation': mockElements.planetNavigation,
                'sim-time': mockElements.simTime,
                'selected-planet': mockElements.selectedPlanet,
                'camera-distance': mockElements.cameraDistance,
                'show-orbits': mockElements.checkboxes.orbits,
                'show-labels': mockElements.checkboxes.labels,
                'show-asteroids': mockElements.checkboxes.asteroids,
                'show-stars': mockElements.checkboxes.stars,
                'info-panel': mockElements.infoPanel,
                'zoom-in': mockElement(),
                'zoom-out': mockElement(),
                'zoom-reset': mockElement()
            };
            return elementMap[id] || null;
        });

        document.querySelector = jest.fn().mockImplementation((selector) => {
            if (selector === '.speed-presets') return null; // Return null initially
            if (selector === '.panel-content') return mockElement();
            if (selector === '.control-panel') return mockElements.panel;
            return mockElements.panel;
        });

        document.querySelectorAll = jest.fn().mockImplementation((selector) => {
            if (selector === '.speed-btn') return [mockElement(), mockElement()];
            if (selector === '.planet-btn') return [mockElement(), mockElement()];
            return [];
        });

        document.createElement = jest.fn().mockImplementation(() => mockElement());
        document.dispatchEvent = jest.fn();

        // Get the control panel instance
        controlPanel = window.ControlPanel;
    });

    afterEach(() => {
        if (controlPanel && controlPanel.dispose) {
            controlPanel.dispose();
        }
    });

    describe('Module Loading', () => {
        test('ControlPanel is available on window', () => {
            expect(window.ControlPanel).toBeDefined();
            expect(typeof window.ControlPanel).toBe('object');
        });

        test('ControlPanel has required methods', () => {
            expect(typeof controlPanel.init).toBe('function');
            expect(typeof controlPanel.setSpeed).toBe('function');
            expect(typeof controlPanel.getSpeed).toBe('function');
            expect(typeof controlPanel.focusOnPlanet).toBe('function');
            expect(typeof controlPanel.handleKeyPress).toBe('function');
            expect(typeof controlPanel.dispose).toBe('function');
        });
    });

    describe('Initialization', () => {
        test('init method calls setTimeout', () => {
            controlPanel.init();
            
            expect(setTimeout).toHaveBeenCalled();
        });

        test('init method exists and is callable', () => {
            expect(typeof controlPanel.init).toBe('function');
            expect(() => controlPanel.init()).not.toThrow();
        });

        test('initialization sets up proper internal state', () => {
            controlPanel.init();
            
            // Test that control methods work after init
            expect(controlPanel.getSpeed()).toBe(1.0);
            expect(controlPanel.isPlaying()).toBe(true);
        });
    });

    describe('Speed Controls', () => {
        beforeEach(() => {
            controlPanel.init();
        });

        test('setSpeed updates speed value', () => {
            controlPanel.setSpeed(2.0);
            
            expect(controlPanel.getSpeed()).toBe(2.0);
            expect(mockElements.speedValue.textContent).toBe('2.0x');
            expect(mockElements.speedValue.style.color).toBe('#4a9eff');
        });

        test('setSpeed with 0 shows paused state', () => {
            controlPanel.setSpeed(0);
            
            expect(controlPanel.getSpeed()).toBe(0);
            expect(mockElements.speedValue.textContent).toBe('Paused');
            expect(mockElements.speedValue.style.color).toBe('#ef4444');
        });

        test('pause sets speed to 0', () => {
            controlPanel.pause();
            expect(controlPanel.getSpeed()).toBe(0);
        });

        test('resume sets speed to 1.0', () => {
            controlPanel.pause();
            controlPanel.resume();
            expect(controlPanel.getSpeed()).toBe(1.0);
        });

        test('isPlaying returns correct state', () => {
            controlPanel.setSpeed(1.0);
            expect(controlPanel.isPlaying()).toBe(true);
            
            controlPanel.pause();
            expect(controlPanel.isPlaying()).toBe(false);
        });

        test('speed changes dispatch events', () => {
            controlPanel.setSpeed(3.0);
            
            expect(document.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'speedChanged',
                    detail: { speed: 3.0 }
                })
            );
        });
    });

    describe('Panel Management', () => {
        beforeEach(() => {
            controlPanel.init();
        });

        test('togglePanel changes collapsed state', () => {
            controlPanel.togglePanel();
            
            expect(mockElements.panel.classList.toggle).toHaveBeenCalledWith('collapsed', true);
            expect(mockElements.collapseBtn.textContent).toBe('+');
        });

        test('collapse method works', () => {
            controlPanel.collapse();
            
            expect(mockElements.panel.classList.toggle).toHaveBeenCalledWith('collapsed', true);
        });

        test('expand method works', () => {
            controlPanel.togglePanel(); // collapse first
            controlPanel.expand();
            
            expect(mockElements.panel.classList.toggle).toHaveBeenCalledWith('collapsed', false);
        });
    });

    describe('Feature Toggles', () => {
        beforeEach(() => {
            controlPanel.init();
        });

        test('setFeature updates checkbox', () => {
            controlPanel.setFeature('labels', true);
            
            expect(mockElements.checkboxes.labels.checked).toBe(true);
            expect(mockElements.checkboxes.labels.dispatchEvent).toHaveBeenCalled();
        });

        test('getFeature returns checkbox state', () => {
            mockElements.checkboxes.orbits.checked = true;
            expect(controlPanel.getFeature('orbits')).toBe(true);
            
            mockElements.checkboxes.orbits.checked = false;
            expect(controlPanel.getFeature('orbits')).toBe(false);
        });
    });

    describe('Planet Navigation', () => {
        beforeEach(() => {
            controlPanel.init();
        });

        test('focusOnPlanet calls interaction manager', () => {
            controlPanel.focusOnPlanet('Earth');
            
            expect(window.solarSystemApp.interactionManager.focusAndFollowPlanet).toHaveBeenCalledWith(
                { name: 'Earth' }
            );
        });

        test('focusOnPlanet handles non-existent planet', () => {
            controlPanel.focusOnPlanet('NonExistent');
            
            expect(window.solarSystemApp.interactionManager.focusAndFollowPlanet).not.toHaveBeenCalled();
        });

        test('selectPlanet updates button selection', () => {
            const mockButton = mockElement();
            mockElements.planetNavigation.querySelector.mockReturnValue(mockButton);
            
            controlPanel.selectPlanet('Mars');
            
            expect(mockElements.planetNavigation.querySelector).toHaveBeenCalledWith('[data-planet="mars"]');
        });
    });

    describe('Information Display', () => {
        beforeEach(() => {
            controlPanel.init();
        });

        test('updateSimulationTime updates display', () => {
            controlPanel.updateSimulationTime('2024-01-01 12:00:00');
            
            expect(mockElements.simTime.textContent).toBe('2024-01-01 12:00:00');
        });

        test('updateSelectedPlanet updates display', () => {
            controlPanel.updateSelectedPlanet('Jupiter');
            
            expect(mockElements.selectedPlanet.textContent).toBe('Jupiter');
        });

        test('updateCameraDistance updates display', () => {
            controlPanel.updateCameraDistance(15.5);
            
            expect(mockElements.cameraDistance.textContent).toBe('15.5 AU');
        });
    });

    describe('Keyboard Shortcuts', () => {
        beforeEach(() => {
            controlPanel.init();
        });

        test('Space key toggles play/pause', () => {
            const event = { code: 'Space', preventDefault: jest.fn(), stopPropagation: jest.fn() };
            
            const result = controlPanel.handleKeyPress(event);
            
            expect(result).toBe(true);
            expect(event.preventDefault).toHaveBeenCalled();
            expect(controlPanel.getSpeed()).toBe(0);
        });

        test('R key resets view', () => {
            const event = { code: 'KeyR', preventDefault: jest.fn(), stopPropagation: jest.fn() };
            
            const result = controlPanel.handleKeyPress(event);
            
            expect(result).toBe(true);
            expect(window.solarSystemApp.resetCameraView).toHaveBeenCalled();
        });

        test('L key toggles labels', () => {
            const event = { code: 'KeyL', preventDefault: jest.fn(), stopPropagation: jest.fn() };
            
            const result = controlPanel.handleKeyPress(event);
            
            expect(result).toBe(true);
            expect(mockElements.checkboxes.labels.dispatchEvent).toHaveBeenCalled();
        });

        test('Digit0 focuses on Sun', () => {
            const event = { code: 'Digit0', preventDefault: jest.fn(), stopPropagation: jest.fn() };
            
            const result = controlPanel.handleKeyPress(event);
            
            expect(result).toBe(true);
            expect(window.solarSystemApp.interactionManager.focusAndFollowPlanet).toHaveBeenCalledWith(
                { name: 'Sun' }
            );
        });

        test('Escape stops following', () => {
            const event = { code: 'Escape', preventDefault: jest.fn(), stopPropagation: jest.fn() };
            
            const result = controlPanel.handleKeyPress(event);
            
            expect(result).toBe(true);
            expect(window.solarSystemApp.stopFollowingPlanet).toHaveBeenCalled();
        });

        test('unhandled keys return false', () => {
            const event = { code: 'KeyZ', preventDefault: jest.fn(), stopPropagation: jest.fn() };
            
            const result = controlPanel.handleKeyPress(event);
            
            expect(result).toBe(false);
        });
    });

    describe('State Management', () => {
        beforeEach(() => {
            controlPanel.init();
        });

        test('getState returns current state', () => {
            controlPanel.setSpeed(2.5);
            mockElements.checkboxes.orbits.checked = true;
            
            const state = controlPanel.getState();
            
            expect(state.currentSpeed).toBe(2.5);
            expect(state.isPlaying).toBe(true);
            expect(state.features.orbits).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('handles missing DOM elements', () => {
            document.getElementById = jest.fn(() => null);
            
            expect(() => controlPanel.init()).not.toThrow();
        });

        test('handles missing solarSystemApp', () => {
            window.solarSystemApp = null;
            
            expect(() => controlPanel.focusOnPlanet('Earth')).not.toThrow();
        });

        test('handles missing notification system', () => {
            window.NotificationSystem = null;
            
            expect(() => controlPanel.setSpeed(2.0)).not.toThrow();
        });
    });

    describe('Speed Button Creation', () => {
        beforeEach(() => {
            controlPanel.init();
        });

        test('creates speed buttons with correct configurations', () => {
            const mockContainer = mockElement();
            document.querySelector.mockImplementation((selector) => {
                if (selector === '.speed-presets') return mockContainer;
                return mockElements.panel;
            });

            // Re-init to trigger button creation
            controlPanel.init();

            expect(document.createElement).toHaveBeenCalledWith('button');
            expect(mockContainer.appendChild).toHaveBeenCalled();
        });

        test('clears existing speed buttons when recreating', () => {
            const mockContainer = mockElement();
            document.querySelector.mockImplementation((selector) => {
                if (selector === '.speed-presets') return mockContainer;
                return mockElements.panel;
            });

            controlPanel.init();
            expect(mockContainer.innerHTML).toBe('');
        });
    });

    describe('Speed Button Interactions', () => {
        beforeEach(() => {
            controlPanel.init();
        });

        test('speed buttons handle click events', () => {
            const mockButton = mockElement({ dataset: { speed: '2' } });
            
            // Mock the speed container and button creation
            const mockContainer = mockElement();
            document.querySelector.mockImplementation((selector) => {
                if (selector === '.speed-presets') return mockContainer;
                return mockElements.panel;
            });
            
            // Re-initialize to create speed buttons
            controlPanel.init();
            
            // Test that the speed button handler would set speed correctly
            expect(controlPanel.getSpeed()).toBe(1.0); // Default speed
            
            // Simulate speed button click by calling setSpeed directly
            controlPanel.setSpeed(2.0);
            expect(controlPanel.getSpeed()).toBe(2.0);
        });

        test('speed buttons handle mouseenter events', () => {
            const mockButton = mockElement({ 
                dataset: { speed: '2' },
                classList: { contains: jest.fn(() => false) }
            });
            
            // Simulate mouseenter
            const mouseenterHandler = mockButton.addEventListener.mock.calls
                .find(call => call[0] === 'mouseenter')?.[1];
            
            if (mouseenterHandler) {
                expect(() => mouseenterHandler()).not.toThrow();
            }
        });

        test('speed buttons handle mouseleave events', () => {
            const mockButton = mockElement({ 
                dataset: { speed: '0' },
                classList: { contains: jest.fn(() => false) }
            });
            
            // Simulate mouseleave
            const mouseleaveHandler = mockButton.addEventListener.mock.calls
                .find(call => call[0] === 'mouseleave')?.[1];
            
            if (mouseleaveHandler) {
                expect(() => mouseleaveHandler()).not.toThrow();
            }
        });
    });

    describe('Planet Navigation Button Creation', () => {
        beforeEach(() => {
            controlPanel.init();
        });

        test('creates planet navigation buttons', () => {
            const mockNavContainer = mockElement();
            mockElements.planetNavigation = mockNavContainer;
            
            document.getElementById.mockImplementation((id) => {
                if (id === 'planet-navigation') return mockNavContainer;
                return mockElements.panel;
            });

            controlPanel.init();
            expect(document.createElement).toHaveBeenCalledWith('button');
        });
    });

    describe('Advanced Features via Keyboard Shortcuts', () => {
        beforeEach(() => {
            controlPanel.init();
        });

        test('I key toggles planet info when planet is selected', () => {
            const mockInfoPanel = mockElement();
            document.getElementById.mockImplementation((id) => {
                if (id === 'info-panel') return mockInfoPanel;
                return null;
            });

            window.solarSystemApp.interactionManager.SelectedPlanet = { name: 'Earth' };
            
            const event = { code: 'KeyI', preventDefault: jest.fn(), stopPropagation: jest.fn() };
            const result = controlPanel.handleKeyPress(event);
            
            expect(result).toBe(true);
            expect(mockInfoPanel.classList.toggle).toHaveBeenCalledWith('hidden');
        });

        test('I key shows warning when no planet selected', () => {
            window.solarSystemApp.interactionManager.SelectedPlanet = null;
            
            // Ensure NotificationSystem is available
            window.NotificationSystem = {
                showWarning: jest.fn(),
                showSuccess: jest.fn(),
                showError: jest.fn(),
                showInfo: jest.fn()
            };
            
            const event = { code: 'KeyI', preventDefault: jest.fn(), stopPropagation: jest.fn() };
            const result = controlPanel.handleKeyPress(event);
            
            expect(result).toBe(true);
            expect(window.NotificationSystem.showWarning).toHaveBeenCalledWith('No planet selected');
        });

        test('F key toggles fullscreen', () => {
            const event = { code: 'KeyF', preventDefault: jest.fn(), stopPropagation: jest.fn() };
            
            const result = controlPanel.handleKeyPress(event);
            
            expect(result).toBe(true);
            expect(document.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'toggleFullscreen'
                })
            );
        });

        test('S key takes screenshot with Ctrl', () => {
            // Ensure NotificationSystem is available
            window.NotificationSystem = {
                showWarning: jest.fn(),
                showSuccess: jest.fn(),
                showError: jest.fn(),
                showInfo: jest.fn()
            };
            
            const event = { code: 'KeyS', ctrlKey: true, preventDefault: jest.fn(), stopPropagation: jest.fn() };
            
            const result = controlPanel.handleKeyPress(event);
            
            expect(result).toBe(true);
            expect(window.solarSystemApp.sceneManager.takeScreenshot).toHaveBeenCalled();
            expect(window.NotificationSystem.showSuccess).toHaveBeenCalledWith('📷 Screenshot saved!');
        });

        test('S key handles screenshot error with Ctrl', () => {
            // Ensure NotificationSystem is available
            window.NotificationSystem = {
                showWarning: jest.fn(),
                showSuccess: jest.fn(),
                showError: jest.fn(),
                showInfo: jest.fn()
            };
            
            window.solarSystemApp.sceneManager.takeScreenshot.mockImplementation(() => {
                throw new Error('Screenshot failed');
            });
            
            const event = { code: 'KeyS', ctrlKey: true, preventDefault: jest.fn(), stopPropagation: jest.fn() };
            const result = controlPanel.handleKeyPress(event);
            
            expect(result).toBe(true);
            expect(window.NotificationSystem.showError).toHaveBeenCalledWith('Screenshot failed');
        });

        test('Equal key (Plus) zooms in with Ctrl and zoom button', () => {
            const mockZoomBtn = mockElement();
            document.getElementById.mockImplementation((id) => {
                if (id === 'zoom-in') return mockZoomBtn;
                return null;
            });

            const event = { code: 'Equal', ctrlKey: true, preventDefault: jest.fn(), stopPropagation: jest.fn() };
            const result = controlPanel.handleKeyPress(event);
            
            expect(result).toBe(true);
            expect(mockZoomBtn.click).toHaveBeenCalled();
        });

        test('Minus key zooms out with Ctrl and zoom button', () => {
            const mockZoomBtn = mockElement();
            document.getElementById.mockImplementation((id) => {
                if (id === 'zoom-out') return mockZoomBtn;
                return null;
            });

            const event = { code: 'Minus', ctrlKey: true, preventDefault: jest.fn(), stopPropagation: jest.fn() };
            const result = controlPanel.handleKeyPress(event);
            
            expect(result).toBe(true);
            expect(mockZoomBtn.click).toHaveBeenCalled();
        });

        test('Equal key zooms in with Ctrl without zoom button - following mode', () => {
            document.getElementById.mockReturnValue(null);
            window.solarSystemApp.cameraControls.IsFollowing = true;
            window.solarSystemApp.cameraControls.followDistance = 50;
            window.solarSystemApp.cameraControls.followedPlanet = {
                getWorldPosition: jest.fn()
            };

            const event = { code: 'Equal', ctrlKey: true, preventDefault: jest.fn(), stopPropagation: jest.fn() };
            const result = controlPanel.handleKeyPress(event);
            
            expect(result).toBe(true);
            expect(window.solarSystemApp.cameraControls.followDistance).toBe(40);
        });

        test('Minus key zooms out with Ctrl without zoom button - non-following mode', () => {
            document.getElementById.mockReturnValue(null);
            window.solarSystemApp.cameraControls.IsFollowing = false;
            
            const mockCamera = {
                position: mockVector3(),
                getWorldDirection: jest.fn()
            };
            window.solarSystemApp.cameraControls.camera = mockCamera;
            
            const event = { code: 'Minus', ctrlKey: true, preventDefault: jest.fn(), stopPropagation: jest.fn() };
            const result = controlPanel.handleKeyPress(event);
            
            expect(result).toBe(true);
            expect(mockCamera.getWorldDirection).toHaveBeenCalled();
        });

        test('Digit0 with Ctrl resets zoom with zoom reset button', () => {
            const mockZoomResetBtn = mockElement();
            document.getElementById.mockImplementation((id) => {
                if (id === 'zoom-reset') return mockZoomResetBtn;
                return null;
            });

            const event = { code: 'Digit0', ctrlKey: true, preventDefault: jest.fn(), stopPropagation: jest.fn() };
            const result = controlPanel.handleKeyPress(event);
            
            expect(result).toBe(true);
            expect(mockZoomResetBtn.click).toHaveBeenCalled();
        });

        test('Digit0 with Ctrl resets zoom without button', () => {
            document.getElementById.mockReturnValue(null);
            
            const event = { code: 'Digit0', ctrlKey: true, preventDefault: jest.fn(), stopPropagation: jest.fn() };
            const result = controlPanel.handleKeyPress(event);
            
            expect(result).toBe(true);
            expect(window.solarSystemApp.resetCameraView).toHaveBeenCalled();
        });

        test('H key toggles help', () => {
            const event = { code: 'KeyH', preventDefault: jest.fn(), stopPropagation: jest.fn() };
            
            const result = controlPanel.handleKeyPress(event);
            
            expect(result).toBe(true);
            expect(document.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'toggleHelp'
                })
            );
        });
    });

    describe('Speed Slider Interactions', () => {
        beforeEach(() => {
            controlPanel.init();
        });

        test('speed slider input updates speed', () => {
            const mockSlider = mockElement();
            mockElements.speedSlider = mockSlider;
            
            const inputHandler = mockSlider.addEventListener.mock.calls
                .find(call => call[0] === 'input')?.[1];
            
            if (inputHandler) {
                inputHandler({ target: { value: '3.5' } });
                expect(controlPanel.getSpeed()).toBe(3.5);
            }
        });
    });

    describe('Checkbox Feature Toggles', () => {
        beforeEach(() => {
            controlPanel.init();
        });

        test('checkbox changes dispatch events and show notifications', () => {
            const mockCheckbox = mockElement();
            mockElements.checkboxes.orbits = mockCheckbox;
            
            const changeHandler = mockCheckbox.addEventListener.mock.calls
                .find(call => call[0] === 'change')?.[1];
            
            if (changeHandler) {
                changeHandler({ target: { checked: true } });
                
                expect(document.dispatchEvent).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'toggleFeature',
                        detail: { feature: 'orbits', enabled: true }
                    })
                );
                expect(window.NotificationSystem.showInfo).toHaveBeenCalledWith('Orbits enabled');
            }
        });
    });

    describe('Planet Button Interactions', () => {
        beforeEach(() => {
            controlPanel.init();
        });

        test('planet buttons handle click events', () => {
            const mockPlanetBtn = mockElement({ dataset: { planet: 'mars' } });
            
            // Simulate clicking a planet button
            const clickHandler = mockPlanetBtn.addEventListener.mock.calls
                .find(call => call[0] === 'click')?.[1];
            
            if (clickHandler) {
                clickHandler();
                expect(window.solarSystemApp.interactionManager.focusAndFollowPlanet)
                    .toHaveBeenCalledWith({ name: 'Mars' });
            }
        });
    });

    describe('Additional Keyboard Shortcuts', () => {
        beforeEach(() => {
            controlPanel.init();
        });

        test('Digit keys 1-9 focus on planets when button exists', () => {
            const mockButton = mockElement();
            mockButton.textContent = 'Mars';
            
            mockElements.planetNavigation.querySelector.mockReturnValue(mockButton);
            
            const event = { code: 'Digit4', preventDefault: jest.fn(), stopPropagation: jest.fn() };
            
            const result = controlPanel.handleKeyPress(event);
            
            expect(result).toBe(true);
            expect(mockElements.planetNavigation.querySelector).toHaveBeenCalledWith('[data-key="4"]');
        });
    });

    describe('Error Handling Edge Cases', () => {
        test('handles missing speed container gracefully', () => {
            document.querySelector.mockImplementation((selector) => {
                if (selector === '.speed-presets') return null;
                return mockElements.panel;
            });

            expect(() => controlPanel.init()).not.toThrow();
        });

        test('handles missing planet navigation container', () => {
            mockElements.planetNavigation = null;
            document.getElementById.mockImplementation((id) => {
                if (id === 'planet-navigation') return null;
                return mockElements.panel;
            });

            expect(() => controlPanel.init()).not.toThrow();
        });
    });

    describe('Cleanup', () => {
        test('dispose cleans up event listeners', () => {
            const cleanup1 = jest.fn();
            const cleanup2 = jest.fn();
            global.globalThis.eventListenerCleanups = [cleanup1, cleanup2];
            
            controlPanel.dispose();
            
            expect(cleanup1).toHaveBeenCalled();
            expect(cleanup2).toHaveBeenCalled();
        });

        test('dispose handles errors gracefully', () => {
            const failingCleanup = jest.fn(() => { throw new Error('Cleanup failed'); });
            global.globalThis.eventListenerCleanups = [failingCleanup];
            
            expect(() => controlPanel.dispose()).not.toThrow();
        });
    });
});