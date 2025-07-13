// static/js/__tests__/api-client-setup.js
// Dedicated setup file for API client tests

// Import testing-library matchers
import '@testing-library/jest-dom';

// Mock AbortController for older environments
if (typeof global.AbortController === 'undefined') {
    global.AbortController = class AbortController {
        constructor() {
            this.signal = {
                aborted: false,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn()
            };
        }

        abort() {
            this.signal.aborted = true;
        }
    };
}

// Mock fetch globally for API tests
global.fetch = jest.fn();

// Mock setTimeout and clearTimeout for testing timeouts
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;

global.setTimeout = jest.fn((fn, delay) => {
    if (typeof fn === 'function') {
        // For immediate execution in tests
        return originalSetTimeout(fn, 0);
    }
    return originalSetTimeout(fn, delay);
});

global.clearTimeout = jest.fn((id) => {
    return originalClearTimeout(id);
});

// Store originals for tests that need real timers
global.realSetTimeout = originalSetTimeout;
global.realClearTimeout = originalClearTimeout;

// Mock Date for consistent timestamps in cache tests
const originalDate = Date;
global.Date = class extends originalDate {
    constructor(...args) {
        if (args.length) {
            super(...args);
        } else {
            super('2024-01-01T00:00:00.000Z');
        }
    }

    static now() {
        return new originalDate('2024-01-01T00:00:00.000Z').getTime();
    }
};

// Preserve original Date methods
global.Date.originalNow = originalDate.now;
global.Date.original = originalDate;

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
    ...originalConsole,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
};

// Preserve original console for debugging
global.originalConsole = originalConsole;

// Setup global mocks for window object used by API client
if (typeof global.window === 'undefined') {
    Object.defineProperty(global, 'window', {
        value: {
            location: {
                reload: jest.fn()
            },
            SolarSystemConfig: {
                apiEndpoints: {
                    planets: '/api/planets/',
                    planetDetail: '/api/planets/{id}/',
                    systemInfo: '/api/system-info/'
                },
                debug: false
            },
            Helpers: {
                handleError: jest.fn(),
                log: jest.fn()
            }
        },
        writable: true,
        configurable: true
    });
} else {
    // Window already exists, just extend it
    global.window = {
        ...global.window,
        location: {
            reload: jest.fn(),
            ...global.window.location
        },
        SolarSystemConfig: {
            apiEndpoints: {
                planets: '/api/planets/',
                planetDetail: '/api/planets/{id}/',
                systemInfo: '/api/system-info/'
            },
            debug: false,
            ...global.window.SolarSystemConfig
        },
        Helpers: {
            handleError: jest.fn(),
            log: jest.fn(),
            ...global.window.Helpers
        }
    };
}

// Reset all mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Reset fetch mock
    if (global.fetch && global.fetch.mockReset) {
        global.fetch.mockReset();
    }

    // Reset console mocks
    if (console.log && console.log.mockReset) {
        console.log.mockReset();
        console.warn.mockReset();
        console.error.mockReset();
        console.info.mockReset();
        console.debug.mockReset();
    }

    // Ensure window mocks are available and reset them
    if (!global.window) {
        global.window = {};
    }

    // Reset or create SolarSystemConfig
    global.window.SolarSystemConfig = {
        apiEndpoints: {
            planets: '/api/planets/',
            planetDetail: '/api/planets/{id}/',
            systemInfo: '/api/system-info/'
        },
        debug: false
    };

    // Reset or create Helpers
    global.window.Helpers = {
        handleError: jest.fn(),
        log: jest.fn()
    };

    // Reset window mocks if they exist
    if (global.window.Helpers && global.window.Helpers.handleError && global.window.Helpers.handleError.mockReset) {
        global.window.Helpers.handleError.mockReset();
    }
    if (global.window.Helpers && global.window.Helpers.log && global.window.Helpers.log.mockReset) {
        global.window.Helpers.log.mockReset();
    }
});

// Cleanup after each test
afterEach(() => {
    jest.restoreAllMocks();

    // Clear any module cache for api-client to ensure fresh loading
    const apiClientPath = require.resolve('../utils/api-client');
    if (require.cache[apiClientPath]) {
        delete require.cache[apiClientPath];
    }
});

// Custom matchers for API testing
expect.extend({
    toBeValidApiResponse(received) {
        const pass = received &&
                    typeof received === 'object' &&
                    'success' in received;

        if (pass) {
            return {
                message: () => `expected ${JSON.stringify(received)} not to be a valid API response`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${JSON.stringify(received)} to be a valid API response with 'success' property`,
                pass: false,
            };
        }
    },

    toHaveBeenCalledWithUrl(received, expectedUrl) {
        if (!received || !received.mock) {
            return {
                message: () => `expected a Jest mock function but received ${typeof received}`,
                pass: false,
            };
        }

        const calls = received.mock.calls;
        const pass = calls.some(call => call[0] === expectedUrl);

        if (pass) {
            return {
                message: () => `expected fetch not to have been called with URL ${expectedUrl}`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected fetch to have been called with URL ${expectedUrl}, but was called with: ${calls.map(call => call[0]).join(', ')}`,
                pass: false,
            };
        }
    },

    toHaveValidRequestHeaders(received) {
        if (!received || !received.mock) {
            return {
                message: () => `expected a Jest mock function but received ${typeof received}`,
                pass: false,
            };
        }

        const calls = received.mock.calls;
        const hasValidHeaders = calls.some(call => {
            const options = call[1];
            return options &&
                   options.headers &&
                   options.headers['Content-Type'] === 'application/json' &&
                   options.headers['X-Requested-With'] === 'XMLHttpRequest';
        });

        if (hasValidHeaders) {
            return {
                message: () => `expected fetch not to have been called with valid request headers`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected fetch to have been called with valid request headers (Content-Type: application/json, X-Requested-With: XMLHttpRequest)`,
                pass: false,
            };
        }
    }
});

// Export test utilities for API client tests
global.apiTestUtils = {
    // Mock response creators
    createMockResponse: (data, options = {}) => ({
        ok: options.ok !== false,
        status: options.status || 200,
        statusText: options.statusText || 'OK',
        headers: options.headers || {},
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
        blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
    }),

    createMockError: (message, name = 'Error') => {
        const error = new Error(message);
        error.name = name;
        return error;
    },

    // API-specific mock helpers
    mockApiSuccess: (data) => global.apiTestUtils.createMockResponse({
        success: true,
        ...data
    }),

    mockApiError: (message, data = {}) => global.apiTestUtils.createMockResponse({
        success: false,
        message,
        ...data
    }),

    mockHttpError: (status, statusText) => global.apiTestUtils.createMockResponse(
        { error: statusText },
        { ok: false, status, statusText }
    ),

    // Network error simulation
    mockNetworkError: (message = 'Network error') => {
        return Promise.reject(new Error(message));
    },

    mockTimeoutError: () => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
    },

    mockJsonParseError: () => global.apiTestUtils.createMockResponse(
        'invalid json',
        {
            json: () => Promise.reject(new Error('Unexpected token in JSON'))
        }
    ),

    // Test data generators
    createMockPlanet: (id = 1, name = 'Earth') => ({
        id,
        name,
        diameter: 12742,
        mass: 1.0,
        distance_from_sun: 1.0,
        orbital_period: 365.25,
        planet_type: 'terrestrial',
        has_moons: true,
        moon_count: 1
    }),

    createMockPlanetsList: (count = 3) => {
        const planets = [
            { id: 1, name: 'Mercury', diameter: 4879, planet_type: 'terrestrial' },
            { id: 2, name: 'Venus', diameter: 12104, planet_type: 'terrestrial' },
            { id: 3, name: 'Earth', diameter: 12742, planet_type: 'terrestrial' }
        ];
        return planets.slice(0, count);
    },

    createMockSystemInfo: () => ({
        total_planets: 9,
        system_age: '4.6 billion years',
        habitable_zone: '0.95 to 1.37 AU',
        planet_types: {
            terrestrial: 4,
            gas_giants: 2,
            ice_giants: 2,
            dwarf_planets: 1
        }
    }),

    // Async testing utilities
    waitForPromises: () => new Promise(resolve => {
        if (global.realSetTimeout) {
            global.realSetTimeout(resolve, 0);
        } else {
            setImmediate(resolve);
        }
    }),

    delay: (ms) => new Promise(resolve => global.realSetTimeout(resolve, ms)),

    // Mock setup helpers
    setupFetchMock: (responses) => {
        if (Array.isArray(responses)) {
            responses.forEach(response => {
                global.fetch.mockResolvedValueOnce(response);
            });
        } else {
            global.fetch.mockResolvedValue(responses);
        }
    },

    setupFetchError: (error) => {
        global.fetch.mockRejectedValue(error);
    },

    // Configuration helpers
    setDebugMode: (enabled) => {
        if (!global.window) {
            global.window = {};
        }
        if (!global.window.SolarSystemConfig) {
            global.window.SolarSystemConfig = {
                apiEndpoints: {
                    planets: '/api/planets/',
                    planetDetail: '/api/planets/{id}/',
                    systemInfo: '/api/system-info/'
                }
            };
        }
        global.window.SolarSystemConfig.debug = enabled;
    },

    setApiEndpoint: (name, url) => {
        if (!global.window) {
            global.window = {};
        }
        if (!global.window.SolarSystemConfig) {
            global.window.SolarSystemConfig = { apiEndpoints: {} };
        }
        if (!global.window.SolarSystemConfig.apiEndpoints) {
            global.window.SolarSystemConfig.apiEndpoints = {};
        }
        global.window.SolarSystemConfig.apiEndpoints[name] = url;
    },

    removeHelpers: () => {
        if (global.window) {
            global.window.Helpers = undefined;
        }
    },

    restoreHelpers: () => {
        if (!global.window) {
            global.window = {};
        }
        global.window.Helpers = {
            handleError: jest.fn(),
            log: jest.fn()
        };
    },

    // Cache testing utilities
    getCacheSize: () => {
        if (global.window && global.window.ApiClient) {
            const stats = global.window.ApiClient.getCacheStats();
            return stats.size;
        }
        return 0;
    },

    clearApiCache: () => {
        if (global.window && global.window.ApiClient && typeof global.window.ApiClient.clearCache === 'function') {
            global.window.ApiClient.clearCache();
        }
    }
};

// Global test configuration
global.API_TEST_CONFIG = {
    DEFAULT_TIMEOUT: 10000,
    CACHE_TTL: 300000, // 5 minutes
    TEST_ENDPOINTS: {
        planets: '/api/planets/',
        planetDetail: '/api/planets/{id}/',
        systemInfo: '/api/system-info/'
    }
};

// Console utilities for debugging tests
global.debugLog = (...args) => {
    if (process.env.NODE_ENV === 'test' && process.env.DEBUG_TESTS) {
        global.originalConsole.log('[API TEST DEBUG]', ...args);
    }
};

global.debugError = (...args) => {
    if (process.env.NODE_ENV === 'test' && process.env.DEBUG_TESTS) {
        global.originalConsole.error('[API TEST ERROR]', ...args);
    }
};

// Export for ES6 modules
export default global.apiTestUtils;