// static/js/utils/api-client.js
// Enhanced API client for communicating with Django backend

window.ApiClient = (function() {
    'use strict';

    const cache = new Map();
    const DEFAULT_TIMEOUT = 10000;

    async function makeRequest(url, options = {}) {
        const {
            method = 'GET',
            timeout = DEFAULT_TIMEOUT,
            useCache = true
        } = options;

        // Check cache for GET requests
        if (method === 'GET' && useCache && cache.has(url)) {
            const cached = cache.get(url);
            const isExpired = Date.now() - cached.timestamp > 300000; // 5 minutes

            if (!isExpired) {
                return cached.data;
            } else {
                cache.delete(url);
            }
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                method,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Cache successful GET requests
            if (method === 'GET' && useCache) {
                cache.set(url, {
                    data,
                    timestamp: Date.now()
                });
            }

            return data;

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    return {
        async getPlanets() {
            try {
                const data = await makeRequest(window.SolarSystemConfig.apiEndpoints.planets);

                if (!data.success) {
                    throw new Error(data.message || 'Failed to fetch planet data');
                }

                return data.planets;
            } catch (error) {
                if (window.Helpers) {
                    window.Helpers.handleError(error, 'ApiClient.getPlanets');
                }
                throw error;
            }
        },

        async getPlanetDetails(planetId) {
            try {
                const url = window.SolarSystemConfig.apiEndpoints.planetDetail.replace('{id}', planetId);
                const data = await makeRequest(url);

                if (!data.success) {
                    throw new Error(data.message || 'Failed to fetch planet details');
                }

                return data.planet;
            } catch (error) {
                if (window.Helpers) {
                    window.Helpers.handleError(error, 'ApiClient.getPlanetDetails');
                }
                throw error;
            }
        },

        async getSystemInfo() {
            try {
                const data = await makeRequest(window.SolarSystemConfig.apiEndpoints.systemInfo);

                if (!data.success) {
                    throw new Error(data.message || 'Failed to fetch system info');
                }

                return data.system_info;
            } catch (error) {
                if (window.Helpers) {
                    window.Helpers.handleError(error, 'ApiClient.getSystemInfo');
                }
                throw error;
            }
        },

        clearCache() {
            cache.clear();
            if (window.Helpers) {
                window.Helpers.log('API cache cleared', 'debug');
            }
        },

        getCacheStats() {
            return {
                size: cache.size,
                keys: Array.from(cache.keys())
            };
        }
    };
})();

console.log('Enhanced ApiClient module loaded successfully');