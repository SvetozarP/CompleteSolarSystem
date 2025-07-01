// static/js/solar-system/lighting-system.js
// Enhanced lighting system with realistic sun lighting, bloom effects, and atmospheric lighting - FIXED

window.LightingSystem = (function() {
    'use strict';

    /**
     * Main lighting system class
     */
    class LightingSystem {
        constructor(options = {}) {
            this.options = {
                enableSunLight: true,
                enableAmbientLight: true,
                enableBloom: true,
                enableAtmosphere: true,
                sunIntensity: 1.5,
                ambientIntensity: 0.3,
                bloomStrength: 0.8,
                bloomRadius: 0.4,
                bloomThreshold: 0.85,
                ...options
            };

            // Lighting components
            this.sunLight = null;
            this.ambientLight = null;
            this.atmosphericLight = null;
            this.lightHelpers = [];

            // Post-processing
            this.composer = null;
            this.bloomPass = null;
            this.renderPass = null;

            // Scene references
            this.scene = null;
            this.camera = null;
            this.renderer = null;

            // Sun object reference
            this.sunObject = null;
            this.sunPosition = { x: 0, y: 0, z: 0 };

            // Performance monitoring
            this.isInitialized = false;
            this.bloomEnabled = false;
        }

        /**
         * Initialize the lighting system
         * @param {THREE.Scene} scene - Three.js scene
         * @param {THREE.Camera} camera - Camera object
         * @param {THREE.WebGLRenderer} renderer - WebGL renderer
         */
        async init(scene, camera, renderer) {
            this.scene = scene;
            this.camera = camera;
            this.renderer = renderer;

            try {
                // Create core lighting
                await this.createCoreLighting();

                // Setup post-processing if bloom is enabled
                if (this.options.enableBloom) {
                    await this.setupPostProcessing();
                }

                // Setup atmospheric effects
                if (this.options.enableAtmosphere) {
                    await this.createAtmosphericEffects();
                }

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
         * Create core lighting (sun and ambient)
         */
        async createCoreLighting() {
            // Remove existing lights
            this.removeAllLights();

            // Create sun light (directional light)
            if (this.options.enableSunLight) {
                this.sunLight = new THREE.DirectionalLight(0xFFFFFF, this.options.sunIntensity);
                this.sunLight.position.set(0, 0, 0);
                this.sunLight.castShadow = true;

                // Configure shadow properties
                this.sunLight.shadow.mapSize.width = 2048;
                this.sunLight.shadow.mapSize.height = 2048;
                this.sunLight.shadow.camera.near = 0.1;
                this.sunLight.shadow.camera.far = 1000;
                this.sunLight.shadow.camera.left = -100;
                this.sunLight.shadow.camera.right = 100;
                this.sunLight.shadow.camera.top = 100;
                this.sunLight.shadow.camera.bottom = -100;
                this.sunLight.shadow.bias = -0.001;

                this.sunLight.name = 'sunLight';
                this.scene.add(this.sunLight);

                if (window.Helpers) {
                    window.Helpers.log('Sun directional light created', 'debug');
                }
            }

            // Create ambient light for base illumination
            if (this.options.enableAmbientLight) {
                this.ambientLight = new THREE.AmbientLight(0x404080, this.options.ambientIntensity);
                this.ambientLight.name = 'ambientLight';
                this.scene.add(this.ambientLight);

                if (window.Helpers) {
                    window.Helpers.log('Ambient light created', 'debug');
                }
            }

            // Create point light at sun position for close illumination
            this.sunPointLight = new THREE.PointLight(0xFFDD44, 2.0, 200, 1.8);
            this.sunPointLight.position.set(0, 0, 0);
            this.sunPointLight.name = 'sunPointLight';
            this.scene.add(this.sunPointLight);
        }

        /**
         * Setup post-processing for bloom effects
         */
        async setupPostProcessing() {
            try {
                // Check if post-processing libraries are available
                if (typeof THREE.EffectComposer === 'undefined' ||
                    typeof THREE.RenderPass === 'undefined' ||
                    typeof THREE.UnrealBloomPass === 'undefined') {

                    if (window.Helpers) {
                        window.Helpers.log('Post-processing libraries not available, bloom effects disabled', 'warn');
                    }
                    this.bloomEnabled = false;
                    return;
                }

                // Create effect composer
                this.composer = new THREE.EffectComposer(this.renderer);

                // Render pass
                this.renderPass = new THREE.RenderPass(this.scene, this.camera);
                this.composer.addPass(this.renderPass);

                // Bloom pass
                this.bloomPass = new THREE.UnrealBloomPass(
                    new THREE.Vector2(window.innerWidth, window.innerHeight),
                    this.options.bloomStrength,
                    this.options.bloomRadius,
                    this.options.bloomThreshold
                );

                this.composer.addPass(this.bloomPass);

                this.bloomEnabled = true;

                if (window.Helpers) {
                    window.Helpers.log('Post-processing bloom effects initialized', 'debug');
                }

            } catch (error) {
                if (window.Helpers) {
                    window.Helpers.log('Failed to setup post-processing: ' + error.message, 'warn');
                }
                this.bloomEnabled = false;
            }
        }

        /**
         * Create atmospheric lighting effects
         */
        async createAtmosphericEffects() {
            // Create subtle hemisphere light for atmospheric scattering simulation
            this.atmosphericLight = new THREE.HemisphereLight(
                0x87CEEB, // Sky color (light blue)
                0x1e1e1e, // Ground color (dark)
                0.4       // Intensity
            );
            this.atmosphericLight.name = 'atmosphericLight';
            this.scene.add(this.atmosphericLight);

            // Add subtle rim lighting for planets (will be implemented per planet)
            this.createRimLightingSetup();

            if (window.Helpers) {
                window.Helpers.log('Atmospheric lighting effects created', 'debug');
            }
        }

        /**
         * Setup rim lighting configuration
         */
        createRimLightingSetup() {
            // Store rim lighting parameters for planet materials
            this.rimLightingParams = {
                rimColor: new THREE.Color(0x4488FF),
                rimPower: 2.0,
                rimIntensity: 0.3
            };
        }

        /**
         * Update lighting system (called each frame)
         * @param {number} deltaTime - Time since last frame
         */
        update(deltaTime) {
            if (!this.isInitialized) return;

            // Update sun light position if sun object exists
            if (this.sunObject && this.sunLight) {
                this.sunPosition = this.sunObject.position;

                // Update directional light to point from sun
                this.sunLight.position.copy(this.sunPosition);
                this.sunLight.target.position.set(0, 0, 0);
                this.sunLight.target.updateMatrixWorld();

                // Update point light at sun position
                if (this.sunPointLight) {
                    this.sunPointLight.position.copy(this.sunPosition);
                }
            }

            // Update atmospheric effects based on camera position
            this.updateAtmosphericEffects();

            // Update bloom effects if enabled
            if (this.bloomEnabled && this.bloomPass) {
                this.updateBloomEffects();
            }
        }

        /**
         * Update atmospheric effects based on viewing angle
         */
        updateAtmosphericEffects() {
            if (!this.atmosphericLight || !this.camera) return;

            // Calculate distance from camera to sun
            const cameraDistance = this.camera.position.distanceTo(this.sunPosition);

            // Adjust atmospheric light intensity based on distance
            const maxDistance = 200;
            const minIntensity = 0.2;
            const maxIntensity = 0.6;

            const normalizedDistance = Math.min(cameraDistance / maxDistance, 1.0);
            const intensity = window.Helpers?.MathHelper?.lerp(maxIntensity, minIntensity, normalizedDistance) || 0.4;

            this.atmosphericLight.intensity = intensity;
        }

        /**
         * Update bloom effects
         */
        updateBloomEffects() {
            // Adjust bloom based on sun visibility and intensity
            if (this.sunObject && this.camera) {
                const sunDistance = this.camera.position.distanceTo(this.sunPosition);

                // Increase bloom when closer to sun
                const maxDistance = 150;
                const minBloom = this.options.bloomStrength * 0.5;
                const maxBloom = this.options.bloomStrength * 1.5;

                const normalizedDistance = Math.min(sunDistance / maxDistance, 1.0);
                const bloomStrength = window.Helpers?.MathHelper?.lerp(maxBloom, minBloom, normalizedDistance) || this.options.bloomStrength;

                this.bloomPass.strength = bloomStrength;
            }
        }

        /**
         * Render scene with post-processing
         */
        render() {
            if (this.bloomEnabled && this.composer) {
                this.composer.render();
            } else {
                this.renderer.render(this.scene, this.camera);
            }
        }

        /**
         * Handle window resize
         * @param {number} width - New width
         * @param {number} height - New height
         */
        handleResize(width, height) {
            if (this.composer) {
                this.composer.setSize(width, height);
            }

            if (this.bloomPass) {
                this.bloomPass.resolution.set(width, height);
            }
        }

        /**
         * Set sun object reference for dynamic lighting
         * @param {THREE.Object3D} sunObject - Sun mesh object
         */
        setSunReference(sunObject) {
            this.sunObject = sunObject;
            if (sunObject) {
                this.sunPosition = sunObject.position;

                if (window.Helpers) {
                    window.Helpers.log('Sun reference set for dynamic lighting', 'debug');
                }
            }
        }

        /**
         * Add planet for lighting calculations
         * @param {THREE.Object3D} planetMesh - Planet mesh
         * @param {Object} planetData - Planet data
         */
        addPlanet(planetMesh, planetData) {
            if (!planetMesh || !planetData) return;

            // Apply enhanced lighting to planet material
            this.enhancePlanetMaterial(planetMesh, planetData);

            // Store planet reference for dynamic lighting updates
            if (!this.planets) {
                this.planets = new Map();
            }
            this.planets.set(planetData.name, { mesh: planetMesh, data: planetData });
        }

        /**
         * Enhance planet material with advanced lighting
         * @param {THREE.Object3D} planetMesh - Planet mesh
         * @param {Object} planetData - Planet data
         */
        enhancePlanetMaterial(planetMesh, planetData) {
            if (!planetMesh.material) return;

            const material = planetMesh.material;

            // Enable various lighting features
            material.roughness = this.getPlanetRoughness(planetData);
            material.metalness = this.getPlanetMetalness(planetData);

            // Add emissive properties for gas giants
            if (planetData.planet_type === 'gas_giant' || planetData.planet_type === 'ice_giant') {
                const emissiveColor = new THREE.Color(planetData.color_hex);
                emissiveColor.multiplyScalar(0.1);
                material.emissive = emissiveColor;
                material.emissiveIntensity = 0.2;
            }

            // Add subsurface scattering simulation for applicable planets
            if (planetData.name === 'Earth' || planetData.name === 'Mars') {
                this.addSubsurfaceScattering(material, planetData);
            }

            // Update material properties
            material.needsUpdate = true;
        }

        /**
         * Get appropriate roughness value for planet type
         * @param {Object} planetData - Planet data
         * @returns {number} Roughness value
         */
        getPlanetRoughness(planetData) {
            const roughnessMap = {
                'terrestrial': 0.8,
                'gas_giant': 0.1,
                'ice_giant': 0.3,
                'dwarf_planet': 0.9
            };

            return roughnessMap[planetData.planet_type] || 0.7;
        }

        /**
         * Get appropriate metalness value for planet type
         * @param {Object} planetData - Planet data
         * @returns {number} Metalness value
         */
        getPlanetMetalness(planetData) {
            const metalnessMap = {
                'terrestrial': 0.1,
                'gas_giant': 0.0,
                'ice_giant': 0.0,
                'dwarf_planet': 0.2
            };

            return metalnessMap[planetData.planet_type] || 0.0;
        }

        /**
         * Add subsurface scattering effect
         * @param {THREE.Material} material - Planet material
         * @param {Object} planetData - Planet data
         */
        addSubsurfaceScattering(material, planetData) {
            // Simple subsurface scattering simulation using translucency
            if (material.userData) {
                material.userData.subsurfaceScattering = {
                    enabled: true,
                    thickness: planetData.name === 'Earth' ? 0.1 : 0.05,
                    color: new THREE.Color(planetData.color_hex),
                    intensity: 0.3
                };
            }
        }

        /**
         * Update lighting quality based on performance
         * @param {string} quality - Quality level ('low', 'medium', 'high')
         */
        setQuality(quality) {
            switch (quality) {
                case 'low':
                    this.setLowQuality();
                    break;
                case 'medium':
                    this.setMediumQuality();
                    break;
                case 'high':
                    this.setHighQuality();
                    break;
                default:
                    this.setMediumQuality();
            }

            if (window.Helpers) {
                window.Helpers.log(`Lighting quality set to ${quality}`, 'debug');
            }
        }

        /**
         * Configure low quality lighting
         */
        setLowQuality() {
            // Disable shadows
            if (this.sunLight) {
                this.sunLight.castShadow = false;
            }

            // Disable bloom
            this.setBloomEnabled(false);

            // Reduce light intensity
            if (this.ambientLight) {
                this.ambientLight.intensity = 0.5;
            }
        }

        /**
         * Configure medium quality lighting
         */
        setMediumQuality() {
            // Enable basic shadows
            if (this.sunLight) {
                this.sunLight.castShadow = true;
                this.sunLight.shadow.mapSize.setScalar(1024);
            }

            // Enable bloom if available
            this.setBloomEnabled(true);

            // Standard light intensity
            if (this.ambientLight) {
                this.ambientLight.intensity = this.options.ambientIntensity;
            }
        }

        /**
         * Configure high quality lighting
         */
        setHighQuality() {
            // Enable high quality shadows
            if (this.sunLight) {
                this.sunLight.castShadow = true;
                this.sunLight.shadow.mapSize.setScalar(2048);
                this.sunLight.shadow.radius = 4;
            }

            // Enable enhanced bloom
            this.setBloomEnabled(true);
            if (this.bloomPass) {
                this.bloomPass.strength = this.options.bloomStrength * 1.2;
            }

            // Enhanced light intensity
            if (this.ambientLight) {
                this.ambientLight.intensity = this.options.ambientIntensity * 1.1;
            }
        }

        /**
         * Enable or disable bloom effects
         * @param {boolean} enabled - Bloom enabled state
         */
        setBloomEnabled(enabled) {
            if (this.bloomPass) {
                this.bloomPass.enabled = enabled;
                this.bloomEnabled = enabled;
            }
        }

        /**
         * Get lighting statistics
         * @returns {Object} Lighting stats
         */
        getStats() {
            return {
                isInitialized: this.isInitialized,
                bloomEnabled: this.bloomEnabled,
                lightsCount: this.getLightsCount(),
                shadowsEnabled: this.sunLight ? this.sunLight.castShadow : false,
                sunPosition: this.sunPosition,
                planetsCount: this.planets ? this.planets.size : 0
            };
        }

        /**
         * Get total number of lights in scene
         * @returns {number} Number of lights
         */
        getLightsCount() {
            let count = 0;
            if (this.sunLight) count++;
            if (this.ambientLight) count++;
            if (this.atmosphericLight) count++;
            if (this.sunPointLight) count++;
            return count;
        }

        /**
         * Remove all lights from scene
         */
        removeAllLights() {
            const lightsToRemove = ['sunLight', 'ambientLight', 'atmosphericLight', 'sunPointLight'];

            lightsToRemove.forEach(lightName => {
                const light = this.scene.getObjectByName(lightName);
                if (light) {
                    this.scene.remove(light);
                }
            });

            // Clear references
            this.sunLight = null;
            this.ambientLight = null;
            this.atmosphericLight = null;
            this.sunPointLight = null;
        }

        /**
         * Dispose of lighting system resources
         */
        dispose() {
            // Remove all lights
            this.removeAllLights();

            // Dispose post-processing
            if (this.composer) {
                this.composer.dispose();
            }

            // Clear references
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.sunObject = null;

            if (this.planets) {
                this.planets.clear();
            }

            this.isInitialized = false;

            if (window.Helpers) {
                window.Helpers.log('Lighting system disposed', 'debug');
            }
        }

        // Getters
        get SunLight() { return this.sunLight; }
        get AmbientLight() { return this.ambientLight; }
        get AtmosphericLight() { return this.atmosphericLight; }
        get BloomEnabled() { return this.bloomEnabled; }
        get IsInitialized() { return this.isInitialized; }
    }

    // Public API
    return {
        LightingSystem,

        // Factory function
        create: (options = {}) => {
            return new LightingSystem(options);
        },

        // Utility functions
        calculateLightIntensity: (distance, baseLightIntensity = 1.0) => {
            // Inverse square law with minimum intensity
            const minIntensity = 0.1;
            const intensity = baseLightIntensity / Math.max(distance * distance, 1);
            return Math.max(intensity, minIntensity);
        },

        calculateShadowDistance: (objectSize) => {
            // Calculate appropriate shadow camera distance based on object size
            return Math.max(objectSize * 10, 50);
        }
    };
})();

// Make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.LightingSystem;
}

console.log('Enhanced LightingSystem module loaded successfully');