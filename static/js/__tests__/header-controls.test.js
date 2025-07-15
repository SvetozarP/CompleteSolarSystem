// Test for header-controls.js
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

// Mock DOM elements with proper node type for jsdom
const mockElement = (props = {}) => ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    click: jest.fn(),
    dispatchEvent: jest.fn(),
    remove: jest.fn(),
    appendChild: jest.fn(),
    contains: jest.fn(() => false),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    classList: {
        add: jest.fn(),
        remove: jest.fn(),
        toggle: jest.fn(),
        contains: jest.fn(() => false)
    },
    style: {},
    textContent: '',
    innerHTML: '',
    title: '',
    id: '',
    className: '',
    closest: jest.fn(),
    nodeType: 1,
    nodeName: 'DIV',
    getContext: jest.fn(),
    ...props
});

// Store original values
const originalDocument = global.document;
const originalWindow = global.window;
const originalScreen = global.screen;
const originalNavigator = global.navigator;

// Set up mocks before loading the module
beforeAll(() => {
    // Mock screen
    global.screen = {
        width: 1920,
        height: 1080
    };

    // Mock navigator
    global.navigator = {
        hardwareConcurrency: 8
    };

    // Mock setTimeout
    global.setTimeout = jest.fn((cb) => {
        if (typeof cb === 'function') {
            cb();
        }
        return 1;
    });

    // Mock window
    global.window = {
        innerWidth: 1920,
        innerHeight: 1080,
        devicePixelRatio: 1,
        NotificationSystem: {
            showInfo: jest.fn(),
            showSuccess: jest.fn(),
            showError: jest.fn(),
            showWarning: jest.fn()
        },
        Helpers: {
            log: jest.fn()
        },
        solarSystemApp: {
            getPerformanceStats: jest.fn(() => ({
                fps: 60,
                qualityLevel: 'High',
                performanceMode: false,
                objects: 150,
                triangles: 50000,
                isAnimating: true,
                animationSpeed: 1.0
            })),
            Planets: [
                { name: 'Mercury', moon_count: 0 },
                { name: 'Venus', moon_count: 0 },
                { name: 'Earth', moon_count: 1 },
                { name: 'Mars', moon_count: 2 }
            ]
        }
    };

    // Mock document
    global.document = {
        getElementById: jest.fn(),
        querySelector: jest.fn(),
        createElement: jest.fn(() => mockElement()),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        body: mockElement(),
        documentElement: mockElement({
            requestFullscreen: jest.fn(),
            mozRequestFullScreen: jest.fn(),
            webkitRequestFullscreen: jest.fn(),
            msRequestFullscreen: jest.fn()
        }),
        fullscreenElement: null,
        mozFullScreenElement: null,
        webkitFullscreenElement: null,
        msFullscreenElement: null,
        exitFullscreen: jest.fn(),
        mozCancelFullScreen: jest.fn(),
        webkitExitFullscreen: jest.fn(),
        msExitFullscreen: jest.fn()
    };
});

// Restore original values
afterAll(() => {
    global.document = originalDocument;
    global.window = originalWindow;
    global.screen = originalScreen;
    global.navigator = originalNavigator;
});

// Load the module
require('../ui/header-controls.js');

describe('HeaderControls', () => {
    let headerControls;
    let mockElements;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Reset window objects
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
            getPerformanceStats: jest.fn(() => ({
                fps: 60,
                qualityLevel: 'High',
                performanceMode: false,
                objects: 150,
                triangles: 50000,
                isAnimating: true,
                animationSpeed: 1.0
            })),
            Planets: [
                { name: 'Mercury', moon_count: 0 },
                { name: 'Venus', moon_count: 0 },
                { name: 'Earth', moon_count: 1 },
                { name: 'Mars', moon_count: 2 }
            ]
        };

        // Create mock elements
        mockElements = {
            helpBtn: mockElement({ id: 'help-btn' }),
            fullscreenBtn: mockElement({ id: 'fullscreen-btn' }),
            infoBtn: mockElement({ id: 'info-btn' }),
            infoPanel: mockElement({ id: 'info-panel' }),
            fullscreenIcon: mockElement()
        };

        // Set up DOM queries
        global.document.getElementById = jest.fn().mockImplementation((id) => {
            const elementMap = {
                'help-btn': mockElements.helpBtn,
                'fullscreen-btn': mockElements.fullscreenBtn,
                'info-btn': mockElements.infoBtn,
                'info-panel': mockElements.infoPanel,
                'help-modal': null,
                'system-info-modal': null
            };
            return elementMap[id] || null;
        });

        // Mock fullscreen button with icon
        mockElements.fullscreenBtn.querySelector = jest.fn().mockReturnValue(mockElements.fullscreenIcon);

        // Get the header controls instance
        headerControls = window.HeaderControls;
    });

    afterEach(() => {
        if (headerControls && headerControls.dispose) {
            headerControls.dispose();
        }
    });

    describe('Module Loading', () => {
        test('HeaderControls is available on window', () => {
            expect(window.HeaderControls).toBeDefined();
            expect(typeof window.HeaderControls).toBe('object');
        });

        test('HeaderControls has required methods', () => {
            expect(typeof headerControls.init).toBe('function');
            expect(typeof headerControls.toggleHelpModal).toBe('function');
            expect(typeof headerControls.showHelpModal).toBe('function');
            expect(typeof headerControls.hideHelpModal).toBe('function');
            expect(typeof headerControls.toggleSystemInfoModal).toBe('function');
            expect(typeof headerControls.showSystemInfoModal).toBe('function');
            expect(typeof headerControls.hideSystemInfoModal).toBe('function');
            expect(typeof headerControls.toggleFullscreen).toBe('function');
            expect(typeof headerControls.hideAllModals).toBe('function');
            expect(typeof headerControls.isFullscreen).toBe('function');
            expect(typeof headerControls.dispose).toBe('function');
        });
    });

    describe('Initialization', () => {
        test('init method exists and is callable', () => {
            expect(typeof headerControls.init).toBe('function');
            expect(() => headerControls.init()).not.toThrow();
        });

        test('init method calls helper log when available', () => {
            headerControls.init();
            expect(window.Helpers.log).toHaveBeenCalledWith('Header controls initialized', 'debug');
        });

        test('init method handles missing helpers gracefully', () => {
            window.Helpers = null;
            expect(() => headerControls.init()).not.toThrow();
        });

        test('init method handles missing buttons gracefully', () => {
            global.document.getElementById = jest.fn().mockReturnValue(null);
            expect(() => headerControls.init()).not.toThrow();
        });

        test('init method handles existing modals', () => {
            const existingModal = mockElement();
            global.document.getElementById = jest.fn().mockImplementation((id) => {
                if (id === 'help-modal' || id === 'system-info-modal') return existingModal;
                return mockElements[id] || null;
            });
            headerControls.init();
            expect(existingModal.remove).toHaveBeenCalled();
        });
    });

    describe('Public API Methods', () => {
        test('hideHelpModal works', () => {
            expect(() => headerControls.hideHelpModal()).not.toThrow();
        });

        test('hideSystemInfoModal works', () => {
            expect(() => headerControls.hideSystemInfoModal()).not.toThrow();
        });

        test('hideAllModals works', () => {
            headerControls.hideAllModals();
            expect(mockElements.infoPanel.classList.add).toHaveBeenCalledWith('hidden');
        });

        test('hideAllModals handles missing info panel', () => {
            global.document.getElementById.mockImplementation((id) => {
                if (id === 'info-panel') return null;
                return mockElements[id] || null;
            });
            expect(() => headerControls.hideAllModals()).not.toThrow();
        });

        test('isFullscreen returns current state', () => {
            expect(headerControls.isFullscreen()).toBe(false);
        });

        test('dispose works', () => {
            expect(() => headerControls.dispose()).not.toThrow();
        });

        test('dispose resets internal state', () => {
            headerControls.dispose();
            expect(headerControls.isFullscreen()).toBe(false);
        });
    });

    describe('Modal Functionality', () => {
        test('toggleHelpModal calls appropriate methods', () => {
            expect(() => headerControls.toggleHelpModal()).not.toThrow();
        });

        test('toggleSystemInfoModal calls appropriate methods', () => {
            expect(() => headerControls.toggleSystemInfoModal()).not.toThrow();
        });

        test('showHelpModal handles missing NotificationSystem', () => {
            window.NotificationSystem = null;
            expect(() => headerControls.showHelpModal()).not.toThrow();
        });

        test('showSystemInfoModal handles missing NotificationSystem', () => {
            window.NotificationSystem = null;
            expect(() => headerControls.showSystemInfoModal()).not.toThrow();
        });

        test('showSystemInfoModal handles missing solarSystemApp', () => {
            window.solarSystemApp = null;
            expect(() => headerControls.showSystemInfoModal()).not.toThrow();
        });

        test('showSystemInfoModal handles solarSystemApp error', () => {
            window.solarSystemApp = {
                getPerformanceStats: () => {
                    throw new Error('Test error');
                }
            };
            expect(() => headerControls.showSystemInfoModal()).not.toThrow();
        });

        test('showSystemInfoModal handles partial solarSystemApp data', () => {
            window.solarSystemApp = {
                getPerformanceStats: () => ({
                    fps: 30,
                    qualityLevel: 'Medium'
                }),
                Planets: [
                    { name: 'Earth', moon_count: 1 },
                    { name: 'Mars' }
                ]
            };
            expect(() => headerControls.showSystemInfoModal()).not.toThrow();
        });

        test('showSystemInfoModal handles missing content element', () => {
            const modalElement = mockElement();
            modalElement.querySelector = jest.fn().mockReturnValue(null);
            
            global.document.getElementById = jest.fn().mockImplementation((id) => {
                if (id === 'system-info-modal') return modalElement;
                return mockElements[id] || null;
            });
            
            expect(() => headerControls.showSystemInfoModal()).not.toThrow();
        });

    });

    describe('Fullscreen Functionality', () => {
        test('toggleFullscreen enters fullscreen when not in fullscreen', () => {
            global.document.fullscreenElement = null;
            global.document.documentElement.requestFullscreen = jest.fn();
            
            headerControls.toggleFullscreen();
            
            expect(global.document.documentElement.requestFullscreen).toHaveBeenCalled();
            expect(window.NotificationSystem.showInfo).toHaveBeenCalledWith('🖥️ Entered fullscreen - Press F or Escape to exit');
        });

        test('toggleFullscreen exits fullscreen when in fullscreen', () => {
            global.document.fullscreenElement = mockElement();
            global.document.exitFullscreen = jest.fn();
            
            headerControls.toggleFullscreen();
            
            expect(global.document.exitFullscreen).toHaveBeenCalled();
            expect(window.NotificationSystem.showInfo).toHaveBeenCalledWith('🖥️ Exited fullscreen mode');
        });

        test('toggleFullscreen handles webkit fullscreen', () => {
            global.document.fullscreenElement = null;
            global.document.webkitFullscreenElement = null;
            global.document.documentElement.requestFullscreen = null;
            global.document.documentElement.webkitRequestFullscreen = jest.fn();
            
            headerControls.toggleFullscreen();
            
            expect(global.document.documentElement.webkitRequestFullscreen).toHaveBeenCalled();
        });

        test('toggleFullscreen handles moz fullscreen', () => {
            global.document.fullscreenElement = null;
            global.document.mozFullScreenElement = null;
            global.document.documentElement.requestFullscreen = null;
            global.document.documentElement.mozRequestFullScreen = jest.fn();
            
            headerControls.toggleFullscreen();
            
            expect(global.document.documentElement.mozRequestFullScreen).toHaveBeenCalled();
        });

        test('toggleFullscreen handles ms fullscreen', () => {
            global.document.fullscreenElement = null;
            global.document.msFullscreenElement = null;
            global.document.documentElement.requestFullscreen = null;
            global.document.documentElement.mozRequestFullScreen = null;
            global.document.documentElement.webkitRequestFullscreen = null;
            global.document.documentElement.msRequestFullscreen = jest.fn();
            
            headerControls.toggleFullscreen();
            
            expect(global.document.documentElement.msRequestFullscreen).toHaveBeenCalled();
        });

        test('toggleFullscreen handles webkit exit fullscreen', () => {
            global.document.webkitFullscreenElement = mockElement();
            global.document.exitFullscreen = null;
            global.document.webkitExitFullscreen = jest.fn();
            
            headerControls.toggleFullscreen();
            
            expect(global.document.webkitExitFullscreen).toHaveBeenCalled();
        });

        test('toggleFullscreen handles moz exit fullscreen', () => {
            global.document.mozFullScreenElement = mockElement();
            global.document.exitFullscreen = null;
            global.document.mozCancelFullScreen = jest.fn();
            
            headerControls.toggleFullscreen();
            
            expect(global.document.mozCancelFullScreen).toHaveBeenCalled();
        });

        test('toggleFullscreen handles ms exit fullscreen', () => {
            global.document.msFullscreenElement = mockElement();
            global.document.exitFullscreen = null;
            global.document.mozCancelFullScreen = null;
            global.document.webkitExitFullscreen = null;
            global.document.msExitFullscreen = jest.fn();
            
            headerControls.toggleFullscreen();
            
            expect(global.document.msExitFullscreen).toHaveBeenCalled();
        });

        test('toggleFullscreen handles missing notification system', () => {
            window.NotificationSystem = null;
            global.document.fullscreenElement = null;
            global.document.documentElement.requestFullscreen = jest.fn();
            
            expect(() => headerControls.toggleFullscreen()).not.toThrow();
        });

        test('updateFullscreenButton handles missing button', () => {
            global.document.getElementById = jest.fn().mockReturnValue(null);
            expect(() => headerControls.toggleFullscreen()).not.toThrow();
        });

        test('updateFullscreenButton handles missing icon', () => {
            mockElements.fullscreenBtn.querySelector = jest.fn().mockReturnValue(null);
            expect(() => headerControls.toggleFullscreen()).not.toThrow();
        });

    });

    describe('WebGL Detection', () => {
        test('getWebGLVersion handles no WebGL support', () => {
            const mockCanvas = mockElement({
                getContext: jest.fn().mockReturnValue(null)
            });
            global.document.createElement = jest.fn().mockReturnValue(mockCanvas);
            
            expect(() => headerControls.showSystemInfoModal()).not.toThrow();
        });

    });

    describe('Edge Cases and Error Handling', () => {
        
        test('modal functions exist and callable', () => {
            // Test that modal functions exist and are callable
            expect(typeof headerControls.showHelpModal).toBe('function');
            expect(typeof headerControls.hideHelpModal).toBe('function');
            expect(typeof headerControls.showSystemInfoModal).toBe('function');
            expect(typeof headerControls.hideSystemInfoModal).toBe('function');
        });

        test('dispose function coverage', () => {
            // Test dispose function
            headerControls.dispose();
            
            // Verify dispose logging
            expect(console.log).toHaveBeenCalledWith('🧹 Disposing HeaderControls and cleaning up event listeners...');
            expect(console.log).toHaveBeenCalledWith('✅ HeaderControls disposed successfully');
        });
        
        test('isFullscreen function coverage', () => {
            // Test isFullscreen function
            expect(typeof headerControls.isFullscreen).toBe('function');
            const result = headerControls.isFullscreen();
            expect(typeof result).toBe('boolean');
        });
    });

    describe('Additional Coverage Tests', () => {
        
        test('modal visibility and toggle states', () => {
            // Test that modals can be toggled
            expect(() => headerControls.toggleHelpModal()).not.toThrow();
            expect(() => headerControls.toggleSystemInfoModal()).not.toThrow();
            
            // Test show/hide methods work
            expect(() => headerControls.showHelpModal()).not.toThrow();
            expect(() => headerControls.hideHelpModal()).not.toThrow();
            expect(() => headerControls.showSystemInfoModal()).not.toThrow();
            expect(() => headerControls.hideSystemInfoModal()).not.toThrow();
        });

    });

    describe('Module Auto-initialization', () => {
        test('module sets up auto-initialization', () => {
            expect(window.HeaderControls).toBeDefined();
            expect(typeof window.HeaderControls.init).toBe('function');
        });

        test('DOMContentLoaded handles missing HeaderControls gracefully', () => {
            const originalHeaderControls = window.HeaderControls;
            window.HeaderControls = null;
            
            const event = new Event('DOMContentLoaded');
            expect(() => document.dispatchEvent(event)).not.toThrow();
            
            window.HeaderControls = originalHeaderControls;
        });
    });
});