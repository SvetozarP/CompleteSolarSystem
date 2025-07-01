// static/js/debug-helper.js
// Debug helper for troubleshooting the solar system app

window.DebugHelper = (function() {
    'use strict';

    return {
        /**
         * Check planet sizes and distances
         */
        checkPlanetScaling: function() {
            if (!window.solarSystemApp || !window.solarSystemApp.planetInstances) {
                console.log('Solar system app not available');
                return;
            }

            console.log('=== PLANET SCALING DEBUG ===');

            window.solarSystemApp.planetInstances.forEach((planetGroup, name) => {
                const planetData = planetGroup.userData.planetData;
                const mesh = planetGroup.getObjectByName(planetData.name);

                if (mesh) {
                    console.log(`${name}:`);
                    console.log(`  Real diameter: ${planetData.diameter} km`);
                    console.log(`  Scaled size: ${mesh.scale.x.toFixed(2)}`);
                    console.log(`  Position: ${planetGroup.position.x.toFixed(1)} units from center`);
                    console.log(`  Real distance: ${planetData.distance_from_sun} AU`);
                    console.log('---');
                }
            });
        },

        /**
         * Check loading status
         */
        checkLoadingStatus: function() {
            console.log('=== LOADING STATUS ===');
            console.log('Three.js available:', typeof THREE !== 'undefined');
            console.log('EffectComposer available:', typeof THREE.EffectComposer !== 'undefined');
            console.log('RenderPass available:', typeof THREE.RenderPass !== 'undefined');
            console.log('UnrealBloomPass available:', typeof THREE.UnrealBloomPass !== 'undefined');
            console.log('Solar System App available:', typeof window.SolarSystemApp !== 'undefined');
            console.log('Solar System App instance:', !!window.solarSystemApp);

            if (window.solarSystemApp) {
                console.log('App initialized:', window.solarSystemApp.isInitialized);
                console.log('Planet count:', window.solarSystemApp.planetInstances.size);
            }
        },

        /**
         * Show performance info
         */
        showPerformanceInfo: function() {
            if (!window.solarSystemApp) {
                console.log('Solar system app not available');
                return;
            }

            const stats = window.solarSystemApp.getPerformanceStats();
            console.log('=== PERFORMANCE STATS ===');
            console.log('FPS:', stats.fps);
            console.log('Frame time:', stats.frameTime?.toFixed(2), 'ms');
            console.log('Objects in scene:', stats.objects);
            console.log('Draw calls:', stats.calls);
            console.log('Triangles:', stats.triangles);
            console.log('Quality level:', stats.qualityLevel);
            console.log('Performance mode:', stats.performanceMode);
        },

        /**
         * Force reload with specific settings
         */
        reloadWithSettings: function(options = {}) {
            const params = new URLSearchParams();

            Object.keys(options).forEach(key => {
                params.set(key, options[key]);
            });

            const newUrl = window.location.origin + window.location.pathname + '?' + params.toString();
            window.location.href = newUrl;
        },

        /**
         * Test planet creation manually
         */
        testPlanetCreation: function() {
            if (!window.PlanetFactory) {
                console.error('PlanetFactory not available');
                return;
            }

            const testPlanet = {
                name: 'TestPlanet',
                distance_from_sun: 1.0,
                diameter: 12756,
                color_hex: '#FF0000',
                planet_type: 'terrestrial',
                has_rings: false,
                has_moons: false,
                orbital_period: 365.25,
                rotation_period: 24
            };

            console.log('Creating test planet...');

            const factory = window.PlanetFactory.create();
            factory.init().then(() => {
                return factory.createPlanet(testPlanet);
            }).then(planetGroup => {
                console.log('Test planet created successfully:', planetGroup);
                console.log('Scale:', planetGroup.scale);
                console.log('Children:', planetGroup.children.length);
            }).catch(error => {
                console.error('Failed to create test planet:', error);
            });
        },

        /**
         * Reset camera to good viewing position
         */
        resetCamera: function() {
            if (window.solarSystemApp && window.solarSystemApp.cameraControls) {
                window.solarSystemApp.cameraControls.setPosition(0, 30, 80);
                window.solarSystemApp.cameraControls.lookAt(0, 0, 0);
                console.log('Camera reset to default position');
            }
        },

        /**
         * Toggle debug mode
         */
        toggleDebugMode: function() {
            window.SolarSystemConfig.debug = !window.SolarSystemConfig.debug;
            console.log('Debug mode:', window.SolarSystemConfig.debug ? 'ON' : 'OFF');

            if (window.SolarSystemConfig.debug) {
                // Show performance monitor if available
                const perfMonitor = document.getElementById('performance-monitor');
                if (perfMonitor) {
                    perfMonitor.style.display = 'block';
                }
            }
        },

        /**
         * Fix planet sizes if they appear wrong
         */
        fixPlanetSizes: function() {
            if (!window.solarSystemApp || !window.solarSystemApp.planetInstances) {
                console.log('Solar system app not available');
                return;
            }

            console.log('Applying planet size fixes...');

            window.solarSystemApp.planetInstances.forEach((planetGroup, name) => {
                const planetData = planetGroup.userData.planetData;
                const mesh = planetGroup.getObjectByName(planetData.name);

                if (mesh && window.solarSystemApp.planetFactory) {
                    // Recalculate and apply correct size
                    const correctSize = window.solarSystemApp.planetFactory.calculateScaledSize(planetData);
                    mesh.scale.setScalar(correctSize);
                    console.log(`Fixed ${name} size to ${correctSize.toFixed(2)}`);
                }
            });
        },

        /**
         * Show current orbital mechanics state
         */
        showOrbitalState: function() {
            if (!window.solarSystemApp || !window.solarSystemApp.orbitalMechanics) {
                console.log('Orbital mechanics not available');
                return;
            }

            const stats = window.solarSystemApp.orbitalMechanics.getStats();
            console.log('=== ORBITAL MECHANICS STATE ===');
            console.log('Orbiting bodies:', stats.orbitingBodyCount);
            console.log('Simulation time:', stats.simulationTime);
            console.log('Simulation years:', stats.simulationYears.toFixed(2));
            console.log('Earth orbits completed:', stats.earthCompletedOrbits);
            console.log('Animation speed:', stats.currentTimeScale);
            console.log('Is paused:', stats.isPaused);
            console.log('Paths visible:', stats.pathsVisible);
        },

        /**
         * Test all major systems
         */
        runSystemTests: function() {
            console.log('=== RUNNING SYSTEM TESTS ===');

            // Test 1: Check if all modules loaded
            const modules = [
                'Helpers', 'MathUtils', 'ApiClient', 'LoadingManager', 'NotificationSystem',
                'ControlPanel', 'SceneManager', 'PlanetFactory', 'LightingSystem',
                'CameraControls', 'OrbitalMechanics', 'InteractionManager', 'ParticleSystems'
            ];

            modules.forEach(module => {
                const available = typeof window[module] !== 'undefined';
                console.log(`${module}: ${available ? '✓' : '✗'}`);
            });

            // Test 2: Check app state
            if (window.solarSystemApp) {
                console.log('\nApp State:');
                console.log('  Initialized:', window.solarSystemApp.isInitialized);
                console.log('  Animating:', window.solarSystemApp.isAnimating);
                console.log('  Quality:', window.solarSystemApp.options.qualityLevel);
                console.log('  Planets loaded:', window.solarSystemApp.planetInstances.size);
            }

            // Test 3: Check Three.js context
            console.log('\nThree.js Context:');
            if (window.solarSystemApp && window.solarSystemApp.sceneManager) {
                const scene = window.solarSystemApp.sceneManager.Scene;
                const renderer = window.solarSystemApp.sceneManager.Renderer;
                console.log('  Scene objects:', scene ? scene.children.length : 0);
                console.log('  WebGL context:', renderer ? renderer.getContext().constructor.name : 'None');
            }
        },

        /**
         * Generate performance report
         */
        generatePerformanceReport: function() {
            if (!window.solarSystemApp) {
                console.log('Solar system app not available');
                return;
            }

            const report = {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                screenSize: `${screen.width}x${screen.height}`,
                viewportSize: `${window.innerWidth}x${window.innerHeight}`,
                devicePixelRatio: window.devicePixelRatio,
                hardwareConcurrency: navigator.hardwareConcurrency,
                deviceMemory: navigator.deviceMemory || 'unknown',
                webglVersion: this.getWebGLVersion(),
                appStats: window.solarSystemApp.getPerformanceStats()
            };

            console.log('=== PERFORMANCE REPORT ===');
            console.log(JSON.stringify(report, null, 2));

            // Copy to clipboard if available
            if (navigator.clipboard) {
                navigator.clipboard.writeText(JSON.stringify(report, null, 2));
                console.log('Report copied to clipboard');
            }
        },

        /**
         * Get WebGL version
         */
        getWebGLVersion: function() {
            const canvas = document.createElement('canvas');
            const gl2 = canvas.getContext('webgl2');
            const gl1 = canvas.getContext('webgl');

            if (gl2) return 'WebGL 2.0';
            if (gl1) return 'WebGL 1.0';
            return 'Not supported';
        },

        /**
         * Quick fix for common issues
         */
        quickFix: function() {
            console.log('=== APPLYING QUICK FIXES ===');

            // Fix 1: Reset camera if stuck
            if (window.solarSystemApp && window.solarSystemApp.cameraControls) {
                this.resetCamera();
                console.log('✓ Camera reset');
            }

            // Fix 2: Fix planet sizes
            this.fixPlanetSizes();
            console.log('✓ Planet sizes checked');

            // Fix 3: Resume animation if paused unexpectedly
            if (window.solarSystemApp && !window.solarSystemApp.isAnimating) {
                document.dispatchEvent(new CustomEvent('toggleAnimation', {
                    detail: { playing: true }
                }));
                console.log('✓ Animation resumed');
            }

            // Fix 4: Clear any error notifications
            if (window.NotificationSystem) {
                window.NotificationSystem.clear();
                console.log('✓ Notifications cleared');
            }

            console.log('Quick fixes applied!');
        },

        /**
         * List all available functions
         */
        help: function() {
            console.log('=== DEBUG HELPER COMMANDS ===');
            console.log('DebugHelper.checkPlanetScaling() - Check planet sizes and distances');
            console.log('DebugHelper.checkLoadingStatus() - Check what components loaded');
            console.log('DebugHelper.showPerformanceInfo() - Show FPS and performance data');
            console.log('DebugHelper.showOrbitalState() - Show orbital mechanics state');
            console.log('DebugHelper.testPlanetCreation() - Test creating a planet manually');
            console.log('DebugHelper.resetCamera() - Reset camera to default position');
            console.log('DebugHelper.fixPlanetSizes() - Fix planet scaling issues');
            console.log('DebugHelper.toggleDebugMode() - Toggle debug mode on/off');
            console.log('DebugHelper.runSystemTests() - Test all major systems');
            console.log('DebugHelper.generatePerformanceReport() - Generate detailed report');
            console.log('DebugHelper.quickFix() - Apply common fixes automatically');
            console.log('DebugHelper.reloadWithSettings({debug: true}) - Reload with options');
            console.log('DebugHelper.help() - Show this help');
        }
    };
})();

// Auto-run some checks in debug mode
if (window.SolarSystemConfig?.debug) {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('=== SOLAR SYSTEM DEBUG MODE ===');
        console.log('Type DebugHelper.help() for available commands');

        // Run initial checks after a delay
        setTimeout(() => {
            if (window.DebugHelper) {
                window.DebugHelper.checkLoadingStatus();
            }
        }, 3000);
    });
}

console.log('Debug Helper loaded - type DebugHelper.help() for commands');