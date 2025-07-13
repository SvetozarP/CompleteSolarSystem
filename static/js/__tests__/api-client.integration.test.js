// static/js/__tests__/api-client.integration.test.js

// Import the dedicated API client test setup
import './api-client-setup';

describe('ApiClient Integration Tests', () => {
    beforeEach(() => {
        // Clear any existing cache
        global.apiTestUtils.clearApiCache();

        // Load the ApiClient module fresh for each test
        require('../utils/api-client');
    });

    describe('Real-world API interaction scenarios', () => {
        test('should handle complete planet data flow', async () => {
            const planetsData = {
                success: true,
                planets: global.apiTestUtils.createMockPlanetsList(3)
            };

            const earthDetailData = {
                success: true,
                planet: global.apiTestUtils.createMockPlanet(3, 'Earth')
            };

            const systemInfoData = {
                success: true,
                system_info: global.apiTestUtils.createMockSystemInfo()
            };

            // Mock the sequential API calls
            global.apiTestUtils.setupFetchMock([
                global.apiTestUtils.createMockResponse(planetsData),
                global.apiTestUtils.createMockResponse(earthDetailData),
                global.apiTestUtils.createMockResponse(systemInfoData)
            ]);

            // Simulate real usage pattern
            const planets = await window.ApiClient.getPlanets();
            expect(planets).toHaveLength(3);
            expect(planets[2].name).toBe('Earth');

            const earthDetails = await window.ApiClient.getPlanetDetails(3);
            expect(earthDetails.name).toBe('Earth');

            const systemInfo = await window.ApiClient.getSystemInfo();
            expect(systemInfo.total_planets).toBe(9);

            // Verify all requests were made correctly
            expect(global.fetch).toHaveBeenCalledTimes(3);
            expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/planets/', expect.any(Object));
            expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/planets/3/', expect.any(Object));
            expect(global.fetch).toHaveBeenNthCalledWith(3, '/api/system-info/', expect.any(Object));
        });

        test('should handle API degradation gracefully', async () => {
            // First call succeeds
            global.fetch.mockResolvedValueOnce(
                global.apiTestUtils.mockApiSuccess({
                    planets: [global.apiTestUtils.createMockPlanet(1, 'Mercury')]
                })
            );

            // Second call fails with server error
            global.fetch.mockResolvedValueOnce(
                global.apiTestUtils.mockHttpError(500, 'Internal Server Error')
            );

            // Third call succeeds again
            global.fetch.mockResolvedValueOnce(
                global.apiTestUtils.mockApiSuccess({
                    system_info: global.apiTestUtils.createMockSystemInfo()
                })
            );

            // First call should succeed
            const planets = await window.ApiClient.getPlanets();
            expect(planets).toHaveLength(1);

            // Second call should fail
            await expect(window.ApiClient.getPlanetDetails(1)).rejects.toThrow('HTTP 500: Internal Server Error');

            // Third call should succeed
            const systemInfo = await window.ApiClient.getSystemInfo();
            expect(systemInfo.total_planets).toBe(9);

            expect(global.window.Helpers.handleError).toHaveBeenCalledTimes(1);
        });

        test('should handle mixed success/error API responses', async () => {
            // Success response
            global.fetch.mockResolvedValueOnce(
                global.apiTestUtils.mockApiSuccess({ planets: [] })
            );

            // API-level error (HTTP 200 but success: false)
            global.fetch.mockResolvedValueOnce(
                global.apiTestUtils.mockApiError('Planet not found in database')
            );

            const planets = await window.ApiClient.getPlanets();
            expect(planets).toEqual([]);

            await expect(window.ApiClient.getPlanetDetails(999)).rejects.toThrow('Planet not found in database');
            expect(global.window.Helpers.handleError).toHaveBeenCalledTimes(1);
        });

        test('should handle rapid sequential requests with caching', async () => {
            const mockData = {
                success: true,
                planets: [global.apiTestUtils.createMockPlanet(1, 'Mercury')]
            };

            // Use mockResolvedValue to ensure same response for all calls
            global.fetch.mockResolvedValue(
                global.apiTestUtils.createMockResponse(mockData)
            );

            // Make sequential requests to test caching
            const result1 = await window.ApiClient.getPlanets();
            const result2 = await window.ApiClient.getPlanets();
            const result3 = await window.ApiClient.getPlanets();

            // All should return the same data
            expect(result1).toEqual(mockData.planets);
            expect(result2).toEqual(mockData.planets);
            expect(result3).toEqual(mockData.planets);

            // Due to caching, only one network request should have been made
            expect(global.fetch).toHaveBeenCalledTimes(1);

            // Cache should contain the data
            const cacheStats = window.ApiClient.getCacheStats();
            expect(cacheStats.size).toBe(1);
        });

        test('should handle concurrent requests appropriately', async () => {
            const mockData = {
                success: true,
                planets: [global.apiTestUtils.createMockPlanet(1, 'Mercury')]
            };

            global.fetch.mockResolvedValue(
                global.apiTestUtils.createMockResponse(mockData)
            );

            // Make concurrent requests
            const promises = Array(5).fill().map(() => window.ApiClient.getPlanets());
            const results = await Promise.all(promises);

            // All should return the same data
            results.forEach(result => {
                expect(result).toEqual(mockData.planets);
            });

            // Verify all requests completed successfully
            expect(results).toHaveLength(5);
            expect(global.fetch).toHaveBeenCalled();
        });
    });

    describe('Error recovery and resilience', () => {
        test('should recover from temporary network failures', async () => {
            // First attempt fails
            global.fetch.mockRejectedValueOnce(new Error('Network timeout'));

            // Second attempt succeeds
            global.fetch.mockResolvedValueOnce(
                global.apiTestUtils.mockApiSuccess({
                    planets: [global.apiTestUtils.createMockPlanet(1, 'Mercury')]
                })
            );

            // First call should fail
            await expect(window.ApiClient.getPlanets()).rejects.toThrow('Network timeout');

            // Second call should succeed
            const planets = await window.ApiClient.getPlanets();
            expect(planets).toHaveLength(1);

            expect(global.window.Helpers.handleError).toHaveBeenCalledTimes(1);
        });

        test('should handle JSON parsing errors gracefully', async () => {
            // Mock a response that will fail during JSON parsing
            global.fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: () => Promise.reject(new Error('Unexpected token in JSON'))
            });

            await expect(window.ApiClient.getPlanets()).rejects.toThrow('Unexpected token in JSON');
            expect(global.window.Helpers.handleError).toHaveBeenCalled();
        });

        test('should handle missing window.SolarSystemConfig', async () => {
            // Remove config
            delete global.window.SolarSystemConfig;

            // This should cause an error when trying to access endpoints
            await expect(window.ApiClient.getPlanets()).rejects.toThrow();
        });

        test('should handle missing specific endpoint configuration', async () => {
            // Remove planets endpoint
            global.window.SolarSystemConfig.apiEndpoints.planets = undefined;

            await expect(window.ApiClient.getPlanets()).rejects.toThrow();
        });
    });

    describe('Cache behavior under various conditions', () => {
        test('should handle cache with expired entries', async () => {
            // Test cache expiration logic by directly manipulating cache timestamps
            const mockData = { success: true, planets: [] };

            // First request
            global.fetch.mockResolvedValueOnce(
                global.apiTestUtils.createMockResponse(mockData)
            );

            await window.ApiClient.getPlanets();
            expect(global.fetch).toHaveBeenCalledTimes(1);

            // Simulate cache expiration by clearing and making another request
            // In a real scenario, this would happen after 5 minutes
            global.apiTestUtils.clearApiCache();

            // Mock second response
            global.fetch.mockResolvedValueOnce(
                global.apiTestUtils.createMockResponse(mockData)
            );

            // Request should make new network call since cache was cleared
            await window.ApiClient.getPlanets();
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        test('should handle cache clear during active requests', async () => {
            const mockData = { success: true, planets: [] };

            // Setup delayed response
            let resolvePromise;
            const delayedPromise = new Promise(resolve => {
                resolvePromise = resolve;
            });

            global.fetch.mockImplementationOnce(() => delayedPromise);

            // Start request
            const requestPromise = window.ApiClient.getPlanets();

            // Clear cache while request is in flight
            window.ApiClient.clearCache();

            // Resolve the request
            resolvePromise(global.apiTestUtils.createMockResponse(mockData));

            // Request should still complete
            const result = await requestPromise;
            expect(result).toEqual(mockData.planets);
        });

        test('should handle multiple cache operations', async () => {
            const planetsData = { success: true, planets: [] };
            const systemData = { success: true, system_info: {} };

            global.fetch
                .mockResolvedValueOnce(global.apiTestUtils.createMockResponse(planetsData))
                .mockResolvedValueOnce(global.apiTestUtils.createMockResponse(systemData));

            // Make multiple different requests
            await window.ApiClient.getPlanets();
            await window.ApiClient.getSystemInfo();

            let stats = window.ApiClient.getCacheStats();
            expect(stats.size).toBe(2);

            // Clear cache
            window.ApiClient.clearCache();

            stats = window.ApiClient.getCacheStats();
            expect(stats.size).toBe(0);
            expect(stats.keys).toEqual([]);
        });
    });

    describe('Request header and configuration validation', () => {
        test('should include correct headers in all requests', async () => {
            const mockData = { success: true, planets: [] };
            global.fetch.mockResolvedValue(
                global.apiTestUtils.createMockResponse(mockData)
            );

            await window.ApiClient.getPlanets();

            expect(global.fetch).toHaveValidRequestHeaders();
        });

        test('should handle different planet ID types in URL replacement', async () => {
            const mockData = { success: true, planet: {} };
            global.fetch.mockResolvedValue(
                global.apiTestUtils.createMockResponse(mockData)
            );

            // Test with number
            await window.ApiClient.getPlanetDetails(42);
            expect(global.fetch).toHaveBeenLastCalledWith('/api/planets/42/', expect.any(Object));

            // Test with string
            await window.ApiClient.getPlanetDetails('sun');
            expect(global.fetch).toHaveBeenLastCalledWith('/api/planets/sun/', expect.any(Object));

            // Test with special characters (should still work)
            await window.ApiClient.getPlanetDetails('test-planet');
            expect(global.fetch).toHaveBeenLastCalledWith('/api/planets/test-planet/', expect.any(Object));
        });
    });

    describe('AbortController timeout scenarios', () => {
        test('should properly clean up aborted requests', async () => {
            // Test abort handling by mocking a timeout error directly
            const timeoutError = global.apiTestUtils.createMockError('Request timeout');
            global.fetch.mockRejectedValueOnce(timeoutError);

            await expect(window.ApiClient.getPlanets()).rejects.toThrow('Request timeout');
        });

        test('should handle AbortError correctly', async () => {
            global.fetch.mockRejectedValueOnce(
                global.apiTestUtils.createMockError('Request aborted', 'AbortError')
            );

            await expect(window.ApiClient.getPlanets()).rejects.toThrow('Request timeout');
            expect(global.window.Helpers.handleError).toHaveBeenCalled();
        });
    });

    describe('Debug mode behavior', () => {
        test('should handle debug mode logging', async () => {
            // Enable debug mode
            global.apiTestUtils.setDebugMode(true);

            window.ApiClient.clearCache();
            expect(global.window.Helpers.log).toHaveBeenCalledWith('API cache cleared', 'debug');
        });

        test('should work without debug mode', async () => {
            global.apiTestUtils.setDebugMode(false);

            const mockData = { success: true, planets: [] };
            global.fetch.mockResolvedValue(
                global.apiTestUtils.createMockResponse(mockData)
            );

            const result = await window.ApiClient.getPlanets();
            expect(result).toEqual(mockData.planets);
        });
    });

    describe('Module initialization and loading', () => {
        test('should be available on window object after loading', () => {
            expect(window.ApiClient).toBeDefined();
            expect(typeof window.ApiClient.getPlanets).toBe('function');
            expect(typeof window.ApiClient.getPlanetDetails).toBe('function');
            expect(typeof window.ApiClient.getSystemInfo).toBe('function');
            expect(typeof window.ApiClient.clearCache).toBe('function');
            expect(typeof window.ApiClient.getCacheStats).toBe('function');
        });

        test('should handle multiple module loads gracefully', () => {
            // Load module again
            require('../utils/api-client');

            // Should still work
            expect(window.ApiClient).toBeDefined();
            expect(typeof window.ApiClient.getPlanets).toBe('function');
        });
    });

    describe('Edge cases and boundary conditions', () => {
        test('should handle empty planet ID', async () => {
            const mockData = { success: true, planet: {} };
            global.fetch.mockResolvedValue(
                global.apiTestUtils.createMockResponse(mockData)
            );

            await window.ApiClient.getPlanetDetails('');
            expect(global.fetch).toHaveBeenCalledWith('/api/planets//', expect.any(Object));
        });

        test('should handle null planet ID', async () => {
            const mockData = { success: true, planet: {} };
            global.fetch.mockResolvedValue(
                global.apiTestUtils.createMockResponse(mockData)
            );

            await window.ApiClient.getPlanetDetails(null);
            expect(global.fetch).toHaveBeenCalledWith('/api/planets/null/', expect.any(Object));
        });

        test('should handle undefined planet ID', async () => {
            const mockData = { success: true, planet: {} };
            global.fetch.mockResolvedValue(
                global.apiTestUtils.createMockResponse(mockData)
            );

            await window.ApiClient.getPlanetDetails(undefined);
            expect(global.fetch).toHaveBeenCalledWith('/api/planets/undefined/', expect.any(Object));
        });

        test('should handle very large response payloads', async () => {
            const largePlanetsArray = Array(1000).fill().map((_, i) =>
                global.apiTestUtils.createMockPlanet(i, `Planet${i}`)
            );

            const mockData = {
                success: true,
                planets: largePlanetsArray
            };

            global.fetch.mockResolvedValue(
                global.apiTestUtils.createMockResponse(mockData)
            );

            const result = await window.ApiClient.getPlanets();
            expect(result).toHaveLength(1000);
            expect(result[999].name).toBe('Planet999');
        });

        test('should handle response with null data', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(null)
            });

            await expect(window.ApiClient.getPlanets()).rejects.toThrow();
        });

        test('should handle response with undefined success property', async () => {
            const mockData = { planets: [] }; // Missing success property
            global.fetch.mockResolvedValue(
                global.apiTestUtils.createMockResponse(mockData)
            );

            // Should throw because success is not explicitly true
            await expect(window.ApiClient.getPlanets()).rejects.toThrow('Failed to fetch planet data');
        });
    });

    describe('Performance and optimization', () => {
        test('should handle rapid cache access efficiently', async () => {
            const mockData = { success: true, planets: [] };
            global.fetch.mockResolvedValue(
                global.apiTestUtils.createMockResponse(mockData)
            );

            // First call to populate cache
            await window.ApiClient.getPlanets();

            // Multiple rapid cache accesses
            const start = Date.now();
            const promises = Array(100).fill().map(() => window.ApiClient.getPlanets());
            await Promise.all(promises);
            const end = Date.now();

            // Should be very fast due to caching (under 100ms for 100 calls)
            expect(end - start).toBeLessThan(100);
            expect(global.fetch).toHaveBeenCalledTimes(1); // Only one network call
        });

        test('should handle cache size limits gracefully', async () => {
            // Add many different URLs to cache
            for (let i = 0; i < 50; i++) {
                const mockData = { success: true, planet: global.apiTestUtils.createMockPlanet(i) };
                global.fetch.mockResolvedValueOnce(
                    global.apiTestUtils.createMockResponse(mockData)
                );

                await window.ApiClient.getPlanetDetails(i);
            }

            const stats = window.ApiClient.getCacheStats();
            expect(stats.size).toBe(50);
            expect(stats.keys).toHaveLength(50);
        });
    });

    describe('error handling without Helpers', () => {
        beforeEach(() => {
            // Remove Helpers to test fallback behavior
            global.apiTestUtils.removeHelpers();
        });

        afterEach(() => {
            // Restore Helpers
            global.apiTestUtils.restoreHelpers();
        });

        test('should handle errors gracefully without Helpers.handleError', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(window.ApiClient.getPlanets()).rejects.toThrow('Network error');
            // Should not throw additional errors when Helpers is undefined
        });

        test('should not call Helpers.log when clearing cache without Helpers', () => {
            window.ApiClient.clearCache();
            // Should not throw errors when Helpers is undefined

            const stats = window.ApiClient.getCacheStats();
            expect(stats.size).toBe(0);
        });
    });
});