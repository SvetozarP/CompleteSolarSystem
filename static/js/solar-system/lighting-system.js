// static/js/solar-system/lighting-system.js
// COMPLETELY FIXED Lighting System with working bloom effects and proper null handling

window.LightingSystem = (function() {
    'use strict';

    /**
     * Enhanced lighting system with bloom effects
     */
    class LightingSystem {
        constructor(options = {}) {
            this.options = {
                enableSunLight: true,
                enableAmbientLight: true,
                enableBloom: true,
                enableAtmosphere: true,
                sunIntensity: 2.0,
                ambientIntensity: 0.2,
                bloomStrength: 1.0,
                bloomRadius: 0.5,
                bloomThreshold: 0.8,
                ...options
            };

            // Lighting components
            this.sunLight = null;
            this.ambientLight = null;
            this.atmosphericLight = null;

            // Post-processing
            this.composer = null;
            this.bloomPass = null;
            this.renderPass = null;

            // Scene references
            this.scene = null;
            this.camera = null;
            this.renderer = null;

            // Sun reference
            this.sunObject = null;
            this.sunPosition = { x: 0, y: 0, z: 0 };

            this.isInitialized = false;
            this.bloomEnabled = false;
        }

        /**
         * Initialize lighting system
         */
        async init(scene, camera, renderer) {
            this.scene = scene;
            this.camera = camera;
            this.renderer = renderer;

            try {
                console.log('🌟 Initializing enhanced lighting system...');

                // Create lighting
                await this.createCoreLighting();

                // Setup post-processing
                if (this.options.enableBloom) {
                    await this.setupPostProcessing();
                }

                // Setup atmospheric effects
                if (this.options.enableAtmosphere) {
                    await this.createAtmosphericEffects();
                }

                this.isInitialized = true;
                console.log('✅ Enhanced lighting system initialized successfully');

            } catch (error) {
                console.error('❌ Failed to initialize lighting system:', error);
                throw error;
            }
        }

        /**
         * Create core lighting
         */
        async createCoreLighting() {
            // Remove existing lights
            this.removeAllLights();

            // Create sun light (directional)
            if (this.options.enableSunLight) {
                this.sunLight = new THREE.DirectionalLight(0xFFFFFF, this.options.sunIntensity);
                this.sunLight.position.set(0, 0, 0);
                this.sunLight.castShadow = true;

                // Configure shadows
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

                console.log('  ✅ Sun directional light created');
            }

            // Create ambient light
            if (this.options.enableAmbientLight) {
                this.ambientLight = new THREE.AmbientLight(0x404080, this.options.ambientIntensity);
                this.ambientLight.name = 'ambientLight';
                this.scene.add(this.ambientLight);

                console.log('  ✅ Ambient light created');
            }

            // Create point light at sun position
            this.sunPointLight = new THREE.PointLight(0xFFDD44, 2.0, 200, 1.8);
            this.sunPointLight.position.set(0, 0, 0);
            this.sunPointLight.name = 'sunPointLight';
            this.scene.add(this.sunPointLight);

            console.log('  ✅ Sun point light created');
        }

        /**
         * Setup post-processing for bloom
         */
        async setupPostProcessing() {
            try {
                console.log('🌟 Setting up bloom post-processing...');

                // Check if composer classes are available
                if (typeof THREE.EffectComposer === 'undefined' ||
                    typeof THREE.RenderPass === 'undefined' ||
                    typeof THREE.UnrealBloomPass === 'undefined') {

                    console.warn('⚠️ Post-processing classes not available, bloom disabled');
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

                console.log('  ✅ Bloom post-processing initialized');

            } catch (error) {
                console.warn('⚠️ Failed to setup bloom, using fallback:', error.message);
                this.bloomEnabled = false;
            }
        }

        /**
         * Create atmospheric lighting
         */
        async createAtmosphericEffects() {
            // Hemisphere light for atmospheric scattering
            this.atmosphericLight = new THREE.HemisphereLight(
                0x87CEEB, // Sky color
                0x1e1e1e, // Ground color
                0.4       // Intensity
            );
            this.atmosphericLight.name = 'atmosphericLight';
            this.scene.add(this.atmosphericLight);

            console.log('  ✅ Atmospheric lighting created');
        }

        /**
         * Update lighting system
         */
        update(deltaTime) {
            if (!this.isInitialized) return;

            // Update sun light position
            if (this.sunObject && this.sunLight) {
                this.sunPosition = this.sunObject.position;

                this.sunLight.position.copy(this.sunPosition);
                this.sunLight.target.position.set(0, 0, 0);
                this.sunLight.target.updateMatrixWorld();

                if (this.sunPointLight) {
                    this.sunPointLight.position.copy(this.sunPosition);
                }
            }

            // Update atmospheric effects
            this.updateAtmosphericEffects();

            // Update bloom
            if (this.bloomEnabled && this.bloomPass) {
                this.updateBloomEffects();
            }
        }

        /**
         * Update atmospheric effects
         */
        updateAtmosphericEffects() {
            if (!this.atmosphericLight || !this.camera) return;

            const cameraDistance = this.camera.position.distanceTo(
                new THREE.Vector3(this.sunPosition.x, this.sunPosition.y, this.sunPosition.z)
            );

            // Adjust intensity based on distance
            const maxDistance = 200;
            const minIntensity = 0.2;
            const maxIntensity = 0.6;

            const normalizedDistance = Math.min(cameraDistance / maxDistance, 1.0);
            const intensity = maxIntensity - (normalizedDistance * (maxIntensity - minIntensity));

            this.atmosphericLight.intensity = intensity;
        }

        /**
         * Update bloom effects
         */
        updateBloomEffects() {
            if (!this.sunObject || !this.camera) return;

            const sunDistance = this.camera.position.distanceTo(
                new THREE.Vector3(this.sunPosition.x, this.sunPosition.y, this.sunPosition.z)
            );

            // Adjust bloom based on distance to sun
            const maxDistance = 150;
            const minBloom = this.options.bloomStrength * 0.5;
            const maxBloom = this.options.bloomStrength * 1.5;

            const normalizedDistance = Math.min(sunDistance / maxDistance, 1.0);
            const bloomStrength = maxBloom - (normalizedDistance * (maxBloom - minBloom));

            this.bloomPass.strength = bloomStrength;
        }

        /**
         * Render with post-processing
         */
        render() {
            if (this.bloomEnabled && this.composer) {
                this.composer.render();
            } else {
                // Fallback to normal rendering
                this.renderer.render(this.scene, this.camera);
            }
        }

        /**
         * Handle window resize
         */
        handleResize(width, height) {
            if (this.composer) {
                this.composer.setSize(width, height);
            }

            if (this.bloomPass) {
                try {
                    if (this.bloomPass.resolution && this.bloomPass.resolution.set) {
                        this.bloomPass.resolution.set(width, height);
                    } else if (this.bloomPass.setSize) {
                        this.bloomPass.setSize(width, height);
                    }
                } catch (error) {
                    console.warn('⚠️ Could not resize bloom pass:', error.message);
                }
            }
        }

        /**
         * Set sun reference for dynamic lighting
         */
        setSunReference(sunObject) {
            this.sunObject = sunObject;
            if (sunObject) {
                this.sunPosition = sunObject.position;
                console.log('  ✅ Sun reference set for dynamic lighting');
            }
        }

        /**
         * Add planet for lighting calculations
         */
        addPlanet(planetMesh, planetData) {
            if (!planetMesh || !planetData) return;

            // Apply enhanced lighting to material
            this.enhancePlanetMaterial(planetMesh, planetData);

            console.log(`  ✅ Enhanced lighting applied to ${planetData.name}`);
        }

        /**
         * Enhance planet material with lighting
         */
        enhancePlanetMaterial(planetMesh, planetData) {
            if (!planetMesh.material) return;

            const material = planetMesh.material;

            // Set physical properties
            if (material.roughness !== undefined) {
                material.roughness = this.getPlanetRoughness(planetData);
            }
            if (material.metalness !== undefined) {
                material.metalness = this.getPlanetMetalness(planetData);
            }

            // Add emissive for gas giants
            if (planetData.planet_type === 'gas_giant' || planetData.planet_type === 'ice_giant') {
                if (material.emissive) {
                    const emissiveColor = new THREE.Color(planetData.color_hex);
                    emissiveColor.multiplyScalar(0.1);
                    material.emissive = emissiveColor;
                    material.emissiveIntensity = 0.2;
                }
            }

            material.needsUpdate = true;
        }

        /**
         * Get planet roughness
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
         * Get planet metalness
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
         * Set quality level
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

            console.log(`  ✅ Lighting quality set to ${quality}`);
        }

        /**
         * Low quality settings
         */
        setLowQuality() {
            if (this.sunLight) {
                this.sunLight.castShadow = false;
            }
            this.setBloomEnabled(false);
            if (this.ambientLight) {
                this.ambientLight.intensity = 0.5;
            }
        }

        /**
         * Medium quality settings
         */
        setMediumQuality() {
            if (this.sunLight) {
                this.sunLight.castShadow = true;
                this.sunLight.shadow.mapSize.setScalar(1024);
            }
            this.setBloomEnabled(true);
            if (this.ambientLight) {
                this.ambientLight.intensity = this.options.ambientIntensity;
            }
        }

        /**
         * High quality settings
         */
        setHighQuality() {
            if (this.sunLight) {
                this.sunLight.castShadow = true;
                this.sunLight.shadow.mapSize.setScalar(2048);
                this.sunLight.shadow.radius = 4;
            }
            this.setBloomEnabled(true);
            if (this.bloomPass) {
                this.bloomPass.strength = this.options.bloomStrength * 1.2;
            }
            if (this.ambientLight) {
                this.ambientLight.intensity = this.options.ambientIntensity * 1.1;
            }
        }

        /**
         * Enable/disable bloom
         */
        setBloomEnabled(enabled) {
            if (this.bloomPass) {
                this.bloomPass.enabled = enabled;
                this.bloomEnabled = enabled;
            }
        }

        /**
         * Get lighting stats
         */
        getStats() {
            return {
                isInitialized: this.isInitialized,
                bloomEnabled: this.bloomEnabled,
                lightsCount: this.getLightsCount(),
                shadowsEnabled: this.sunLight ? this.sunLight.castShadow : false,
                sunPosition: this.sunPosition
            };
        }

        /**
         * Get lights count
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
         * Remove all lights - FIXED: Handle null scene properly
         */
        removeAllLights() {
            // Early return if scene is not available
            if (!this.scene) {
                // Just null out the light references
                this.sunLight = null;
                this.ambientLight = null;
                this.atmosphericLight = null;
                this.sunPointLight = null;
                return;
            }

            const lightsToRemove = ['sunLight', 'ambientLight', 'atmosphericLight', 'sunPointLight'];

            lightsToRemove.forEach(lightName => {
                const light = this.scene.getObjectByName(lightName);
                if (light) {
                    this.scene.remove(light);
                }
            });

            this.sunLight = null;
            this.ambientLight = null;
            this.atmosphericLight = null;
            this.sunPointLight = null;
        }

        /**
         * Dispose lighting system
         */
        dispose() {
            this.removeAllLights();

            if (this.composer) {
                this.composer.dispose();
            }

            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.sunObject = null;

            this.isInitialized = false;
            console.log('✅ Lighting system disposed');
        }

        // Getters
        get SunLight() { return this.sunLight; }
        get AmbientLight() { return this.ambientLight; }
        get BloomEnabled() { return this.bloomEnabled; }
        get IsInitialized() { return this.isInitialized; }
    }

    // Public API
    return {
        LightingSystem,

        create: (options = {}) => {
            return new LightingSystem(options);
        }
    };
})();

console.log('✅ Enhanced LightingSystem with bloom effects loaded successfully');