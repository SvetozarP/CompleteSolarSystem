// static/js/solar-system/lighting-system.js
// Enhanced lighting system with proper illumination for planets

window.LightingSystem = (function() {
    'use strict';

    /**
     * Advanced lighting system for solar system visualization
     */
    class LightingSystem {
        constructor(options = {}) {
            this.options = {
                enableShadows: false, // Disabled for performance
                sunLightIntensity: 2.0,      // Increased from 1.0
                ambientLightIntensity: 0.4,  // Increased from 0.1
                sunLightDistance: 1000,
                sunLightDecay: 1,
                enableSunGlow: true,
                enableAmbientOcclusion: false,
                ...options
            };

            this.lights = new Map();
            this.scene = null;
            this.isInitialized = false;
        }

        /**
         * Initialize the lighting system
         * @param {THREE.Scene} scene - Three.js scene
         * @param {THREE.Mesh} sunMesh - Sun mesh for light positioning
         */
        init(scene, sunMesh = null) {
            this.scene = scene;

            try {
                // Create ambient lighting for overall visibility
                this.createAmbientLight();

                // Create directional light from sun
                this.createSunLight(sunMesh);

                // Add hemisphere light for realistic sky/ground lighting
                this.createHemisphereLight();

                // Optional: Add fill lights for better planet visibility
                this.createFillLights();

                this.isInitialized = true;

                if (window.Helpers) {
                    window.Helpers.log('Enhanced lighting system initialized successfully', 'debug');
                }

            } catch (error) {
                if (window.Helpers) {
                    window.Helpers.handleError(error, 'LightingSystem.init');
                }
                throw error;
            }
        }

        /**
         * Create ambient light for base visibility
         */
        createAmbientLight() {
            const ambientLight = new THREE.AmbientLight(
                0x404040, // Soft white color
                this.options.ambientLightIntensity
            );
            ambientLight.name = 'ambient_light';

            this.lights.set('ambient', ambientLight);
            this.scene.add(ambientLight);

            if (window.Helpers) {
                window.Helpers.log(`Ambient light created with intensity: ${this.options.ambientLightIntensity}`, 'debug');
            }
        }

        /**
         * Create main sun light (point light)
         */
        createSunLight(sunMesh = null) {
            // Use warm sun color
            const sunColor = 0xFFF8DC; // Warm white/cream color

            const sunLight = new THREE.PointLight(
                sunColor,
                this.options.sunLightIntensity,
                this.options.sunLightDistance,
                this.options.sunLightDecay
            );

            sunLight.name = 'sun_light';
            sunLight.position.set(0, 0, 0); // Center at sun position

            // Configure shadows if enabled
            if (this.options.enableShadows) {
                sunLight.castShadow = true;
                sunLight.shadow.mapSize.width = 2048;
                sunLight.shadow.mapSize.height = 2048;
                sunLight.shadow.camera.near = 0.1;
                sunLight.shadow.camera.far = this.options.sunLightDistance;
                sunLight.shadow.radius = 5;
                sunLight.shadow.blurSamples = 10;
            }

            this.lights.set('sun', sunLight);
            this.scene.add(sunLight);

            // Add light helper for debugging (only in debug mode)
            if (window.SolarSystemConfig?.debug) {
                const lightHelper = new THREE.PointLightHelper(sunLight, 5, sunColor);
                lightHelper.name = 'sun_light_helper';
                this.scene.add(lightHelper);
                this.lights.set('sun_helper', lightHelper);
            }

            if (window.Helpers) {
                window.Helpers.log(`Sun light created with intensity: ${this.options.sunLightIntensity}`, 'debug');
            }
        }

        /**
         * Create hemisphere light for realistic ambient lighting
         */
        createHemisphereLight() {
            const hemisphereLight = new THREE.HemisphereLight(
                0x87CEEB, // Sky blue for top
                0x4B0082, // Deep space purple for bottom
                0.3       // Moderate intensity
            );
            hemisphereLight.name = 'hemisphere_light';

            this.lights.set('hemisphere', hemisphereLight);
            this.scene.add(hemisphereLight);

            if (window.Helpers) {
                window.Helpers.log('Hemisphere light created for realistic ambient lighting', 'debug');
            }
        }

        /**
         * Create fill lights to ensure planets are visible from all angles
         */
        createFillLights() {
            // Create several fill lights around the solar system
            const fillLightPositions = [
                { x: 100, y: 100, z: 100 },
                { x: -100, y: 100, z: -100 },
                { x: 100, y: -100, z: -100 },
                { x: -100, y: -100, z: 100 }
            ];

            fillLightPositions.forEach((position, index) => {
                const fillLight = new THREE.DirectionalLight(
                    0x404040, // Soft gray
                    0.2       // Low intensity
                );

                fillLight.position.set(position.x, position.y, position.z);
                fillLight.name = `fill_light_${index}`;

                this.lights.set(`fill_${index}`, fillLight);
                this.scene.add(fillLight);
            });

            if (window.Helpers) {
                window.Helpers.log(`Created ${fillLightPositions.length} fill lights for better planet visibility`, 'debug');
            }
        }

        /**
         * Update lighting (for dynamic effects)
         * @param {number} deltaTime - Time since last update
         */
        update(deltaTime) {
            if (!this.isInitialized) return;

            // Optional: Add subtle light flickering for the sun
            const sunLight = this.lights.get('sun');
            if (sunLight && this.options.enableSunGlow) {
                // Subtle intensity variation to simulate solar activity
                const baseIntensity = this.options.sunLightIntensity;
                const flicker = Math.sin(Date.now() * 0.001) * 0.05; // Small variation
                sunLight.intensity = baseIntensity + flicker;
            }
        }

        /**
         * Set sun light intensity
         * @param {number} intensity - Light intensity
         */
        setSunLightIntensity(intensity) {
            const sunLight = this.lights.get('sun');
            if (sunLight) {
                this.options.sunLightIntensity = intensity;
                sunLight.intensity = intensity;

                if (window.Helpers) {
                    window.Helpers.log(`Sun light intensity set to: ${intensity}`, 'debug');
                }
            }
        }

        /**
         * Set ambient light intensity
         * @param {number} intensity - Ambient light intensity
         */
        setAmbientLightIntensity(intensity) {
            const ambientLight = this.lights.get('ambient');
            if (ambientLight) {
                this.options.ambientLightIntensity = intensity;
                ambientLight.intensity = intensity;

                if (window.Helpers) {
                    window.Helpers.log(`Ambient light intensity set to: ${intensity}`, 'debug');
                }
            }
        }

        /**
         * Toggle shadows on/off
         * @param {boolean} enabled - Enable shadows
         */
        setShadowsEnabled(enabled) {
            this.options.enableShadows = enabled;

            const sunLight = this.lights.get('sun');
            if (sunLight) {
                sunLight.castShadow = enabled;

                if (window.Helpers) {
                    window.Helpers.log(`Shadows ${enabled ? 'enabled' : 'disabled'}`, 'debug');
                }
            }
        }

        /**
         * Update sun position (if sun moves)
         * @param {THREE.Vector3} position - New sun position
         */
        updateSunPosition(position) {
            const sunLight = this.lights.get('sun');
            if (sunLight) {
                sunLight.position.copy(position);

                // Update light helper if it exists
                const lightHelper = this.lights.get('sun_helper');
                if (lightHelper) {
                    lightHelper.update();
                }
            }
        }

        /**
         * Set lighting preset for different viewing modes
         * @param {string} preset - Preset name ('realistic', 'bright', 'dark', 'space')
         */
        setLightingPreset(preset) {
            switch (preset) {
                case 'realistic':
                    this.setSunLightIntensity(1.5);
                    this.setAmbientLightIntensity(0.2);
                    break;
                case 'bright':
                    this.setSunLightIntensity(2.5);
                    this.setAmbientLightIntensity(0.6);
                    break;
                case 'dark':
                    this.setSunLightIntensity(1.0);
                    this.setAmbientLightIntensity(0.1);
                    break;
                case 'space':
                    this.setSunLightIntensity(2.0);
                    this.setAmbientLightIntensity(0.4);
                    break;
                default:
                    if (window.Helpers) {
                        window.Helpers.log(`Unknown lighting preset: ${preset}`, 'warn');
                    }
            }

            if (window.Helpers) {
                window.Helpers.log(`Applied lighting preset: ${preset}`, 'debug');
            }
        }

        /**
         * Get light by name
         * @param {string} name - Light name
         * @returns {THREE.Light|null} Light object
         */
        getLight(name) {
            return this.lights.get(name) || null;
        }

        /**
         * Get all light names
         * @returns {Array} Array of light names
         */
        getLightNames() {
            return Array.from(this.lights.keys());
        }

        /**
         * Get lighting statistics
         * @returns {Object} Lighting stats
         */
        getStats() {
            return {
                totalLights: this.lights.size,
                sunLightIntensity: this.options.sunLightIntensity,
                ambientLightIntensity: this.options.ambientLightIntensity,
                shadowsEnabled: this.options.enableShadows,
                isInitialized: this.isInitialized,
                lightNames: this.getLightNames()
            };
        }

        /**
         * Enable performance mode (reduce lighting quality)
         * @param {boolean} enabled - Performance mode enabled
         */
        setPerformanceMode(enabled) {
            if (enabled) {
                // Reduce lighting complexity for better performance
                this.setSunLightIntensity(1.5);
                this.setAmbientLightIntensity(0.5);
                this.setShadowsEnabled(false);

                // Remove fill lights to improve performance
                for (let i = 0; i < 4; i++) {
                    const fillLight = this.lights.get(`fill_${i}`);
                    if (fillLight) {
                        this.scene.remove(fillLight);
                        this.lights.delete(`fill_${i}`);
                    }
                }
            } else {
                // Restore full lighting
                this.setSunLightIntensity(2.0);
                this.setAmbientLightIntensity(0.4);
                this.createFillLights();
            }

            if (window.Helpers) {
                window.Helpers.log(`Performance mode ${enabled ? 'enabled' : 'disabled'}`, 'debug');
            }
        }

        /**
         * Dispose of all lighting resources
         */
        dispose() {
            this.lights.forEach((light, name) => {
                if (this.scene) {
                    this.scene.remove(light);
                }
                if (light.dispose) {
                    light.dispose();
                }
            });

            this.lights.clear();
            this.isInitialized = false;

            if (window.Helpers) {
                window.Helpers.log('Lighting system disposed', 'debug');
            }
        }
    }

    // Public API
    return {
        LightingSystem,

        // Factory function
        create: (options = {}) => {
            return new LightingSystem(options);
        },

        // Lighting presets
        PRESETS: {
            REALISTIC: 'realistic',
            BRIGHT: 'bright',
            DARK: 'dark',
            SPACE: 'space'
        }
    };
})();

console.log('Enhanced LightingSystem module loaded successfully');