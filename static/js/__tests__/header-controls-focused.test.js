// Test focused on achievable coverage improvements for header-controls.js
// This supplements the main test file with targeted coverage for specific uncovered lines

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
    ...props
});

// Store original values
const originalDocument = global.document;
const originalWindow = global.window;
const originalScreen = global.screen;
const originalNavigator = global.navigator;

// Set up mocks
beforeAll(() => {
    global.screen = { width: 1920, height: 1080 };
    global.navigator = { hardwareConcurrency: 8 };
    global.setTimeout = jest.fn((cb) => { if (typeof cb === 'function') { cb(); } return 1; });
    
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

afterAll(() => {
    global.document = originalDocument;
    global.window = originalWindow;
    global.screen = originalScreen;
    global.navigator = originalNavigator;
});

// Load the module
require('../ui/header-controls.js');

describe('HeaderControls Focused Coverage', () => {
    let headerControls;
    let mockElements;

    beforeEach(() => {
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

        mockElements.fullscreenBtn.querySelector = jest.fn().mockReturnValue(mockElements.fullscreenIcon);
        headerControls = window.HeaderControls;
    });

    describe('Console Log Coverage', () => {
        test('console logs are called during init', () => {
            headerControls.init();
            
            expect(console.log).toHaveBeenCalledWith('✅ Header controls: event listeners for ControlPanel setup');
            expect(console.log).toHaveBeenCalledWith('✅ Header controls: minimal keyboard handling setup');
        });
    });

    describe('Event Handler Coverage', () => {
        test('toggleHelp document event handler', () => {
            const eventHandlers = {};

            global.document.addEventListener = jest.fn((event, handler) => {
                eventHandlers[event] = handler;
            });

            headerControls.init();

            // ✅ Check if the 'toggleHelp' event was registered
            expect(eventHandlers).toHaveProperty('toggleHelp');
            expect(typeof eventHandlers.toggleHelp).toBe('function');

            // ✅ Optionally test the effect of calling it
            eventHandlers.toggleHelp?.();

        });


        test('toggleFullscreen document event handler', () => {
            const eventHandlers = {};
            global.document.addEventListener = jest.fn().mockImplementation((event, handler) => {
                eventHandlers[event] = handler;
            });

            headerControls.init();

            // Simulate toggleFullscreen event
            if (eventHandlers.toggleFullscreen) {
                eventHandlers.toggleFullscreen();
            }
            
            expect(eventHandlers).toHaveProperty('toggleFullscreen');
            expect(typeof eventHandlers.toggleFullscreen).toBe('function');
        });

        test('keyboard event handler with F11', () => {
            const eventHandlers = {};
            global.document.addEventListener = jest.fn().mockImplementation((event, handler) => {
                eventHandlers[event] = handler;
            });

            headerControls.init();

            // Simulate F11 key press
            if (eventHandlers.keydown) {
                eventHandlers.keydown({ code: 'F11' });
            }
            
            expect(eventHandlers).toHaveProperty('keydown');
            expect(typeof eventHandlers.keydown).toBe('function');
        });

        test('keyboard event handler with Escape', () => {
            const eventHandlers = {};
            global.document.addEventListener = jest.fn().mockImplementation((event, handler) => {
                eventHandlers[event] = handler;
            });

            headerControls.init();

            // Simulate Escape key press
            if (eventHandlers.keydown) {
                eventHandlers.keydown({ 
                    code: 'Escape',
                    target: {
                        closest: jest.fn().mockReturnValue(mockElement({ className: 'modal' }))
                    }
                });
            }
            
            expect(eventHandlers).toHaveProperty('keydown');
            expect(typeof eventHandlers.keydown).toBe('function');
        });
    });

    describe('Modal State Coverage', () => {
        test('toggle help modal when visible', () => {
            const helpModal = mockElement();
            helpModal.classList.contains = jest.fn().mockReturnValue(false); // simulate modal visible
            helpModal.classList.add = jest.fn();
            helpModal.classList.remove = jest.fn();

            // Mock the "existing" modal to simulate replacement logic
            const existing = mockElement();
            existing.remove = jest.fn();

            // Mock document.getElementById
            global.document.getElementById = jest.fn((id) => {
                if (id === 'help-modal') return existing; // existing modal
                return null;
            });

            // Mock document.createElement to return your real modal
            global.document.createElement = jest.fn().mockImplementation((tag) => {
                if (tag === 'div') return helpModal;
                return document.createElement(tag); // fallback
            });

            // Mock appendChild so modal gets added to document.body
            global.document.body.appendChild = jest.fn();

            // Now init and trigger
            headerControls.init();
            headerControls.toggleHelpModal();

            // Expect modal to be hidden (since .contains returned false)
            expect(helpModal.classList.add).toHaveBeenCalledWith('hidden');
            expect(helpModal.classList.remove).toHaveBeenCalledWith('fade-in');
        });

        test('toggle system info modal when visible', () => {
            // Mock system info modal as visible
            const systemInfoModal = mockElement();
            systemInfoModal.classList.contains = jest.fn().mockReturnValue(true);

            global.document.getElementById = jest.fn().mockImplementation((id) => {
                if (id === 'system-info-modal') return systemInfoModal;
                return mockElements[id] || null;
            });

            // Mock document.createElement to return your real modal
            global.document.createElement = jest.fn().mockImplementation((tag) => {
                if (tag === 'div') return systemInfoModal;
                return document.createElement(tag); // fallback
            });

            // Mock appendChild so modal gets added to document.body
            global.document.body.appendChild = jest.fn();

            headerControls.init();
            headerControls.toggleSystemInfoModal();

            expect(systemInfoModal.classList.add).toHaveBeenCalledWith('hidden');
            expect(systemInfoModal.classList.remove).toHaveBeenCalledWith('fade-in');
        });

        test('show help modal when not visible', () => {
            // Mock help modal as hidden
            const helpModal = mockElement();
            helpModal.classList.contains = jest.fn().mockReturnValue(true);
            
            global.document.getElementById = jest.fn().mockImplementation((id) => {
                if (id === 'help-modal') return helpModal;
                return mockElements[id] || null;
            });

           // Mock document.createElement to return your real modal
            global.document.createElement = jest.fn().mockImplementation((tag) => {
                if (tag === 'div') return helpModal;
                return document.createElement(tag); // fallback
            });

            // Mock appendChild so modal gets added to document.body
            global.document.body.appendChild = jest.fn();


            headerControls.init();
            headerControls.toggleHelpModal();

            expect(helpModal.classList.remove).toHaveBeenCalledWith('hidden');
            expect(helpModal.classList.add).toHaveBeenCalledWith('fade-in');
        });

        test('show system info modal when not visible', () => {
            // Mock system info modal as hidden
            const systemInfoModal = mockElement();
            systemInfoModal.classList.contains = jest.fn().mockReturnValue(true);
            
            global.document.getElementById = jest.fn().mockImplementation((id) => {
                if (id === 'system-info-modal') return systemInfoModal;
                return mockElements[id] || null;
            });

            // Mock document.createElement to return your real modal
            global.document.createElement = jest.fn().mockImplementation((tag) => {
                if (tag === 'div') return systemInfoModal;
                return document.createElement(tag); // fallback
            });

            // Mock appendChild so modal gets added to document.body
            global.document.body.appendChild = jest.fn();

            headerControls.init();
            headerControls.toggleSystemInfoModal();

            expect(systemInfoModal.classList.remove).toHaveBeenCalledWith('hidden');
            expect(systemInfoModal.classList.add).toHaveBeenCalledWith('fade-in');
        });
    });

    describe('Update Functions Coverage', () => {
        test('updateFullscreenButton with different fullscreen states', () => {
            const fullscreenBtn = mockElements.fullscreenBtn;
            const icon = mockElement();
            fullscreenBtn.querySelector = jest.fn().mockReturnValue(icon);

            headerControls.init();

            // Test with fullscreen element
            global.document.fullscreenElement = mockElement();
            headerControls.toggleFullscreen();

            // Simulate the fullscreenchange event
            document.dispatchEvent(new Event('fullscreenchange'));

            expect(icon.textContent).toBe('🗗');
            expect(fullscreenBtn.title).toBe('Exit Fullscreen');

            // Test without fullscreen element
            global.document.fullscreenElement = null;
            headerControls.toggleFullscreen();

            // Simulate the fullscreenchange event again
            document.dispatchEvent(new Event('fullscreenchange'));

            expect(icon.textContent).toBe('⛶');
            expect(fullscreenBtn.title).toBe('Enter Fullscreen');
        });

        test('updateFullscreenButton with webkit fullscreen', () => {
            const fullscreenBtn = mockElements.fullscreenBtn;
            const icon = mockElement();
            fullscreenBtn.querySelector = jest.fn().mockReturnValue(icon);

            headerControls.init();

            // Simulate entering fullscreen via webkitFullscreenElement
            global.document.webkitFullscreenElement = mockElement();
            headerControls.toggleFullscreen();

            // Simulate the fullscreenchange event that would normally be triggered by the browser
            document.dispatchEvent(new Event('webkitfullscreenchange'));

            expect(icon.textContent).toBe('🗗');
            expect(fullscreenBtn.title).toBe('Exit Fullscreen');
        });

        test('updateFullscreenButton with moz fullscreen', () => {
            const fullscreenBtn = mockElements.fullscreenBtn;
            const icon = mockElement();
            fullscreenBtn.querySelector = jest.fn().mockReturnValue(icon);

            headerControls.init();

            // Simulate entering fullscreen using mozFullScreenElement
            global.document.mozFullScreenElement = mockElement();
            headerControls.toggleFullscreen();

            // Simulate the mozfullscreenchange event
            document.dispatchEvent(new Event('mozfullscreenchange'));

            expect(icon.textContent).toBe('🗗');
            expect(fullscreenBtn.title).toBe('Exit Fullscreen');
        });

        test('updateFullscreenButton with ms fullscreen', () => {
            const fullscreenBtn = mockElements.fullscreenBtn;
            const icon = mockElement();
            fullscreenBtn.querySelector = jest.fn().mockReturnValue(icon);

            headerControls.init();

            // Simulate entering fullscreen using msFullscreenElement
            global.document.msFullscreenElement = mockElement();
            headerControls.toggleFullscreen();

            // Simulate the MSFullscreenChange event
            document.dispatchEvent(new Event('MSFullscreenChange'));

            expect(icon.textContent).toBe('🗗');
            expect(fullscreenBtn.title).toBe('Exit Fullscreen');
        });
    });

});