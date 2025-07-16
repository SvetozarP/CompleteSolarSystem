// Test for loading-manager.js
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
const mockElement = (props = {}) => {
    const element = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        click: jest.fn(),
        dispatchEvent: jest.fn(),
        remove: jest.fn(),
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        contains: jest.fn(() => false),
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(() => []),
        closest: jest.fn(),
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
        parentNode: null,
        nodeType: 1,
        nodeName: 'DIV',
        ...props
    };
    
    // Merge style properties properly
    element.style = {
        opacity: '1',
        display: 'block',
        transition: '',
        width: '0%',
        color: '',
        ...props.style
    };
    
    return element;
};

// Store original values
const originalDocument = global.document;
const originalWindow = global.window;
const originalSetTimeout = global.setTimeout;

// Set up mocks before loading the module
beforeAll(() => {
    // Mock window
    global.window = {
        Helpers: {
            log: jest.fn(),
            handleError: jest.fn()
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
        body: mockElement()
    };

    // Mock setTimeout
    global.setTimeout = jest.fn((callback, delay) => {
        if (typeof callback === 'function') {
            // Execute callback after a short delay in tests
            setTimeout(() => callback(), 0);
        }
        return 1;
    });
});

// Restore original values
afterAll(() => {
    global.document = originalDocument;
    global.window = originalWindow;
    global.setTimeout = originalSetTimeout;
});

// Load the module
require('../ui/loading-manager.js');

describe('LoadingManager', () => {
    let loadingManager;
    let mockElements;
    let originalSetTimeout;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Store original setTimeout
        originalSetTimeout = global.setTimeout;
        
        // Mock setTimeout for controllable execution
        global.setTimeout = jest.fn((callback, delay) => {
            if (typeof callback === 'function') {
                callback();
            }
            return 1;
        });
        
        // Reset window objects
        global.window.Helpers = {
            log: jest.fn(),
            handleError: jest.fn()
        };

        // Create mock elements
        mockElements = {
            loadingScreen: mockElement({ 
                id: 'loading-screen',
                style: { opacity: '1', display: 'flex', transition: '' }
            }),
            loadingProgress: mockElement({ 
                id: 'loading-progress',
                style: { width: '0%' }
            }),
            loadingStatus: mockElement({ 
                id: 'loading-status',
                style: { color: '' }
            }),
            appContainer: mockElement({ 
                id: 'app-container',
                style: { display: 'none', opacity: '1', transition: '' }
            })
        };

        // Set up DOM queries
        global.document.getElementById = jest.fn().mockImplementation((id) => {
            const elementMap = {
                'loading-screen': mockElements.loadingScreen,
                'loading-progress': mockElements.loadingProgress,
                'loading-status': mockElements.loadingStatus,
                'app-container': mockElements.appContainer
            };
            return elementMap[id] || null;
        });

        // Get the loading manager instance and reset it
        loadingManager = window.LoadingManager;
        if (loadingManager.reset) {
            loadingManager.reset();
        }
    });

    afterEach(() => {
        global.setTimeout = originalSetTimeout;
    });

    describe('Module Loading', () => {
        test('LoadingManager is available on window', () => {
            expect(window.LoadingManager).toBeDefined();
            expect(typeof window.LoadingManager).toBe('object');
        });

        test('LoadingManager has required methods', () => {
            expect(typeof loadingManager.init).toBe('function');
            expect(typeof loadingManager.updateProgress).toBe('function');
            expect(typeof loadingManager.setProgress).toBe('function');
            expect(typeof loadingManager.complete).toBe('function');
            expect(typeof loadingManager.error).toBe('function');
            expect(typeof loadingManager.reset).toBe('function');
            expect(typeof loadingManager.isLoading).toBe('function');
            expect(typeof loadingManager.getCurrentProgress).toBe('function');
        });
    });

    describe('Initialization', () => {
        test('init method initializes elements', () => {
            loadingManager.init();

            expect(global.document.getElementById).toHaveBeenCalledWith('loading-screen');
            expect(global.document.getElementById).toHaveBeenCalledWith('loading-progress');
            expect(global.document.getElementById).toHaveBeenCalledWith('loading-status');
            expect(window.Helpers.log).toHaveBeenCalledWith('Enhanced Loading Manager initialized', 'debug');
        });

        test('init method handles missing helpers gracefully', () => {
            window.Helpers = null;
            expect(() => loadingManager.init()).not.toThrow();
        });

        test('init method handles missing elements gracefully', () => {
            global.document.getElementById = jest.fn().mockReturnValue(null);
            expect(() => loadingManager.init()).not.toThrow();
        });
    });

    describe('Progress Updates', () => {
        beforeEach(() => {
            loadingManager.init();
        });

        test('updateProgress updates status message', () => {
            loadingManager.updateProgress('Loading assets...');
            
            expect(mockElements.loadingStatus.textContent).toBe('Loading assets...');
            expect(window.Helpers.log).toHaveBeenCalledWith('Loading: 0% - Loading assets...', 'debug');
        });

        test('updateProgress updates progress bar and status', () => {
            loadingManager.updateProgress('Loading models...', 50);
            
            expect(mockElements.loadingStatus.textContent).toBe('Loading models...');
            expect(mockElements.loadingProgress.style.width).toBe('50%');
            expect(window.Helpers.log).toHaveBeenCalledWith('Loading: 50% - Loading models...', 'debug');
        });

        test('updateProgress handles progress over 100%', () => {
            loadingManager.updateProgress('Complete!', 150);
            
            expect(mockElements.loadingProgress.style.width).toBe('100%');
            expect(window.Helpers.log).toHaveBeenCalledWith('Loading: 100% - Complete!', 'debug');
        });

        test('updateProgress handles null progress', () => {
            loadingManager.updateProgress('Loading...', null);
            
            expect(mockElements.loadingStatus.textContent).toBe('Loading...');
            expect(window.Helpers.log).toHaveBeenCalledWith('Loading: 0% - Loading...', 'debug');
        });

        test('updateProgress handles missing status element', () => {
            mockElements.loadingStatus = null;
            global.document.getElementById = jest.fn().mockImplementation((id) => {
                if (id === 'loading-status') return null;
                return mockElements[id.replace('-', '_')] || null;
            });
            
            loadingManager.init();
            expect(() => loadingManager.updateProgress('Test message', 25)).not.toThrow();
        });

        test('updateProgress handles missing progress bar', () => {
            mockElements.loadingProgress = null;
            global.document.getElementById = jest.fn().mockImplementation((id) => {
                if (id === 'loading-progress') return null;
                return mockElements[id.replace('-', '_')] || null;
            });
            
            loadingManager.init();
            expect(() => loadingManager.updateProgress('Test message', 25)).not.toThrow();
        });

        test('updateProgress handles missing helpers', () => {
            window.Helpers = null;
            expect(() => loadingManager.updateProgress('Test message', 25)).not.toThrow();
        });

        test('updateProgress does nothing when completed', () => {
            loadingManager.complete();
            loadingManager.updateProgress('Should not update', 25);
            
            expect(mockElements.loadingStatus.textContent).toBe('Complete!');
            expect(mockElements.loadingProgress.style.width).toBe('100%');
        });
    });

    describe('setProgress Method', () => {
        beforeEach(() => {
            loadingManager.init();
        });

        test('setProgress updates progress bar', () => {
            loadingManager.setProgress(75);
            
            expect(mockElements.loadingProgress.style.width).toBe('75%');
        });

        test('setProgress handles values over 100%', () => {
            loadingManager.setProgress(150);
            
            expect(mockElements.loadingProgress.style.width).toBe('100%');
        });

        test('setProgress handles missing progress bar', () => {
            mockElements.loadingProgress = null;
            global.document.getElementById = jest.fn().mockImplementation((id) => {
                if (id === 'loading-progress') return null;
                return mockElements[id.replace('-', '_')] || null;
            });
            
            loadingManager.init();
            expect(() => loadingManager.setProgress(50)).not.toThrow();
        });

        test('setProgress does nothing when completed', () => {
            loadingManager.complete();
            loadingManager.setProgress(25);
            
            expect(mockElements.loadingProgress.style.width).toBe('100%');
        });
    });

    describe('Complete Method', () => {
        beforeEach(() => {
            loadingManager.init();
        });

        test('complete method sets progress to 100% and updates status', () => {
            loadingManager.complete();
            
            expect(mockElements.loadingProgress.style.width).toBe('100%');
            expect(mockElements.loadingStatus.textContent).toBe('Complete!');
        });

        test('complete method handles missing app container', () => {
            global.document.getElementById = jest.fn().mockImplementation((id) => {
                if (id === 'app-container') return null;
                return mockElements[id.replace('-', '_')] || null;
            });
            
            loadingManager.init();
            expect(() => loadingManager.complete()).not.toThrow();
        });

        test('complete method handles missing loading screen', () => {
            mockElements.loadingScreen = null;
            global.document.getElementById = jest.fn().mockImplementation((id) => {
                if (id === 'loading-screen') return null;
                return mockElements[id.replace('-', '_')] || null;
            });
            
            loadingManager.init();
            expect(() => loadingManager.complete()).not.toThrow();
        });

        test('complete method does nothing when already completed', () => {
            loadingManager.complete();
            const timeoutCallCount = global.setTimeout.mock.calls.length;
            
            loadingManager.complete();
            
            expect(global.setTimeout.mock.calls.length).toBe(timeoutCallCount);
        });

        test('complete method handles missing helpers', () => {
            window.Helpers = null;
            expect(() => loadingManager.complete()).not.toThrow();
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            loadingManager.init();
        });

        test('error method calls helper error handler', () => {
            loadingManager.error('Network error');
            
            expect(window.Helpers.handleError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Network error'
                }),
                'LoadingManager'
            );
        });

        test('error method completes after timeout', () => {
            const completeSpy = jest.spyOn(loadingManager, 'complete');
            loadingManager.error('Test error');
            
            expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 3000);
            expect(completeSpy).toHaveBeenCalled();
        });

        test('error method handles missing status element', () => {
            mockElements.loadingStatus = null;
            global.document.getElementById = jest.fn().mockImplementation((id) => {
                if (id === 'loading-status') return null;
                return mockElements[id.replace('-', '_')] || null;
            });
            
            loadingManager.init();
            expect(() => loadingManager.error('Test error')).not.toThrow();
        });

        test('error method handles missing helpers', () => {
            window.Helpers = null;
            expect(() => loadingManager.error('Test error')).not.toThrow();
        });
    });

    describe('Reset Method', () => {
        beforeEach(() => {
            loadingManager.init();
        });

        test('reset method resets all values', () => {
            loadingManager.setProgress(50);
            loadingManager.updateProgress('Half done', 50);
            loadingManager.complete();
            
            loadingManager.reset();
            
            expect(mockElements.loadingScreen.style.display).toBe('flex');
            expect(mockElements.loadingScreen.style.opacity).toBe('1');
            expect(mockElements.loadingProgress.style.width).toBe('0%');
            expect(mockElements.loadingStatus.textContent).toBe('Initializing...');
            expect(mockElements.loadingStatus.style.color).toBe('');
            expect(mockElements.appContainer.style.display).toBe('none');
        });

        test('reset method handles missing loading screen', () => {
            mockElements.loadingScreen = null;
            global.document.getElementById = jest.fn().mockImplementation((id) => {
                if (id === 'loading-screen') return null;
                return mockElements[id.replace('-', '_')] || null;
            });
            
            loadingManager.init();
            expect(() => loadingManager.reset()).not.toThrow();
        });

        test('reset method handles missing progress bar', () => {
            mockElements.loadingProgress = null;
            global.document.getElementById = jest.fn().mockImplementation((id) => {
                if (id === 'loading-progress') return null;
                return mockElements[id.replace('-', '_')] || null;
            });
            
            loadingManager.init();
            expect(() => loadingManager.reset()).not.toThrow();
        });

        test('reset method handles missing status element', () => {
            mockElements.loadingStatus = null;
            global.document.getElementById = jest.fn().mockImplementation((id) => {
                if (id === 'loading-status') return null;
                return mockElements[id.replace('-', '_')] || null;
            });
            
            loadingManager.init();
            expect(() => loadingManager.reset()).not.toThrow();
        });

        test('reset method handles missing app container', () => {
            global.document.getElementById = jest.fn().mockImplementation((id) => {
                if (id === 'app-container') return null;
                return mockElements[id.replace('-', '_')] || null;
            });
            
            loadingManager.init();
            expect(() => loadingManager.reset()).not.toThrow();
        });

        test('reset allows progress updates after completion', () => {
            loadingManager.complete();
            loadingManager.reset();
            loadingManager.updateProgress('Loading again...', 30);
            
            expect(mockElements.loadingStatus.textContent).toBe('Loading again...');
            expect(mockElements.loadingProgress.style.width).toBe('30%');
        });
    });

    describe('State Query Methods', () => {
        beforeEach(() => {
            loadingManager.init();
        });

        test('isLoading returns true initially', () => {
            expect(loadingManager.isLoading()).toBe(true);
        });

        test('isLoading returns false after completion', () => {
            loadingManager.complete();
            expect(loadingManager.isLoading()).toBe(false);
        });

        test('isLoading returns true after reset', () => {
            loadingManager.complete();
            loadingManager.reset();
            expect(loadingManager.isLoading()).toBe(true);
        });

        test('getCurrentProgress returns initial progress', () => {
            expect(loadingManager.getCurrentProgress()).toBe(0);
        });

        test('getCurrentProgress returns current progress', () => {
            loadingManager.setProgress(75);
            expect(loadingManager.getCurrentProgress()).toBe(75);
        });

        test('getCurrentProgress returns progress after update', () => {
            loadingManager.updateProgress('Test', 40);
            expect(loadingManager.getCurrentProgress()).toBe(40);
        });

        test('getCurrentProgress returns 100 after completion', () => {
            loadingManager.complete();
            expect(loadingManager.getCurrentProgress()).toBe(100);
        });

        test('getCurrentProgress returns 0 after reset', () => {
            loadingManager.setProgress(50);
            loadingManager.reset();
            expect(loadingManager.getCurrentProgress()).toBe(0);
        });
    });

    describe('Animation Sequence', () => {
        let mockSetTimeout;
        
        beforeEach(() => {
            loadingManager.init();
            mockSetTimeout = jest.fn();
            global.setTimeout = mockSetTimeout;
        });

        test('complete method triggers correct animation sequence', () => {
            loadingManager.complete();
            
            expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 500);
            
            const firstCallback = mockSetTimeout.mock.calls[0][1];
            expect(firstCallback).toBe(500);
        });

        test('complete method handles nested setTimeout calls', () => {
            // Mock setTimeout to execute callbacks immediately
            global.setTimeout = jest.fn((callback, delay) => {
                if (typeof callback === 'function') {
                    callback();
                }
                return delay;
            });
            
            loadingManager.complete();
            
            expect(mockElements.loadingScreen.style.display).toBe('none');
            expect(mockElements.appContainer.style.opacity).toBe('1');
        });
    });

    describe('Edge Cases', () => {
        test('module can be used without initialization', () => {
            expect(() => loadingManager.updateProgress('Test')).not.toThrow();
            expect(() => loadingManager.setProgress(50)).not.toThrow();
            expect(() => loadingManager.complete()).not.toThrow();
            expect(() => loadingManager.error('Test')).not.toThrow();
            expect(() => loadingManager.reset()).not.toThrow();
        });

        test('methods handle string progress values', () => {
            loadingManager.init();
            loadingManager.setProgress('50');
            expect(loadingManager.getCurrentProgress()).toBe(50);
        });

        test('methods handle negative progress values', () => {
            loadingManager.init();
            loadingManager.setProgress(-10);
            expect(loadingManager.getCurrentProgress()).toBe(-10);
        });

        test('updateProgress handles empty message', () => {
            loadingManager.init();
            loadingManager.updateProgress('');
            expect(mockElements.loadingStatus.textContent).toBe('');
        });

    });

    describe('Integration Tests', () => {
        beforeEach(() => {
            loadingManager.init();
        });

        test('complete workflow from start to finish', () => {
            expect(loadingManager.isLoading()).toBe(true);
            expect(loadingManager.getCurrentProgress()).toBe(0);
            
            loadingManager.updateProgress('Loading models...', 25);
            expect(loadingManager.getCurrentProgress()).toBe(25);
            
            loadingManager.updateProgress('Loading textures...', 50);
            expect(loadingManager.getCurrentProgress()).toBe(50);
            
            loadingManager.setProgress(75);
            expect(loadingManager.getCurrentProgress()).toBe(75);
            
            loadingManager.complete();
            expect(loadingManager.isLoading()).toBe(false);
            expect(loadingManager.getCurrentProgress()).toBe(100);
        });

        test('reset workflow', () => {
            loadingManager.updateProgress('Loading...', 60);
            loadingManager.complete();
            loadingManager.reset();
            
            expect(loadingManager.isLoading()).toBe(true);
            expect(loadingManager.getCurrentProgress()).toBe(0);
            expect(mockElements.loadingStatus.textContent).toBe('Initializing...');
            expect(mockElements.loadingProgress.style.width).toBe('0%');
        });
    });
});