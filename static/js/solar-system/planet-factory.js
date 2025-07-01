// static/js/solar-system/planet-factory.js
// Enhanced planet factory with realistic materials and visual effects - COMPLETELY FIXED

window.PlanetFactory = (function() {
    'use strict';

    /**
     * Planet factory for creating realistic 3D planets
     */
    class PlanetFactory {
        constructor(options = {}) {
            this.options = {
                defaultSegments: 64,
                highQualitySegments: 128,
                lowQualitySegments: 32,
                enableTextures: true,
                enableNormalMaps: true,
                enableAtmosphere: true,
                enableRings: true,
                quality: 'medium',
                ...options
            };

            // Caches
            this.materialCache = new Map();
            this.geometryCache = new Map();
            this.planetInstances = new Map();
            this.atmospheres = new Map();
            this.ringSystems = new Map();

            this.isInitialized = false;
        }

        /**
         * Initialize the planet factory
         */
        async init() {
            try {
                this.isInitialized = true;

                if (window.Helpers) {
                    window.Helpers.log('Enhanced Planet Factory initialized', 'debug');
                }

            } catch (error) {
                if (window.Helpers) {
                    window.Helpers.handleError(error, 'PlanetFactory.init');
                }
                throw error;
            }
        }

        /**
         * Create a planet with all visual effects
         * @param {Object} planetData - Planet data from API
         * @param {Object} options - Creation options
         * @returns {Promise<THREE.Group>} Planet group with all components
         */
        async createPlanet(planetData, options = {}) {
            if (!this.isInitialized) {
                await this.init();
            }

            try {
                const planetOptions = {
                    quality: this.options.quality,
                    enableAtmosphere: this.options.enableAtmosphere && this.shouldHaveAtmosphere(planetData),
                    enableRings: this.options.enableRings && planetData.has_rings,
                    enableGlow: planetData.name === 'Sun',
                    ...options
                };

                // Create planet group to hold all components
                const planetGroup = new THREE.Group();
                planetGroup.name = `${planetData.name}_group`;
                planetGroup.userData = { planetData, type: 'planet' };

                // Create main planet mesh
                const planetMesh = await this.createPlanetMesh(planetData, planetOptions);
                planetGroup.add(planetMesh);

                // Add atmosphere if applicable
                if (planetOptions.enableAtmosphere) {
                    const atmosphere = await this.createAtmosphere(planetData, planetOptions);
                    if (atmosphere) {
                        planetGroup.add(atmosphere);
                        this.atmospheres.set(planetData.name, atmosphere);
                    }
                }

                // Add ring system if applicable
                if (planetOptions.enableRings) {
                    const rings = await this.createRingSystem(planetData, planetOptions);
                    if (rings) {
                        planetGroup.add(rings);
                        this.ringSystems.set(planetData.name, rings);
                    }
                }

                // Add glow effect for the sun
                if (planetOptions.enableGlow) {
                    const glow = await this.createSunGlow(planetData, planetOptions);
                    if (glow) {
                        planetGroup.add(glow);
                    }
                }

                // Store planet instance
                this.planetInstances.set(planetData.name, planetGroup);

                if (window.Helpers) {
                    window.Helpers.log(`Created enhanced planet: ${planetData.name}`, 'debug');
                }

                return planetGroup;

            } catch (error) {
                if (window.Helpers) {
                    window.Helpers.handleError(error, `PlanetFactory.createPlanet(${planetData.name})`);
                }

                // Return basic fallback planet
                return this.createFallbackPlanet(planetData);
            }
        }

        /**
         * Create the main planet mesh with advanced materials
         * @param {Object} planetData - Planet data
         * @param {Object} options - Creation options
         * @returns {Promise<THREE.Mesh>} Planet mesh
         */
        async createPlanetMesh(planetData, options = {}) {
            // Get or create geometry
            const geometry = this.getOrCreateGeometry(planetData, options);

            // Create advanced material
            const material = await this.createAdvancedMaterial(planetData, options);

            // Create mesh
            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = planetData.name;
            mesh.userData = { planetData, type: 'planetMesh' };

            // Set position and scale with corrected values
            const scaledSize = this.calculateScaledSize(planetData);
            mesh.scale.setScalar(scaledSize);

            // Enable shadows for non-sun objects
            if (planetData.name !== 'Sun') {
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }

            return mesh;
        }

        /**
         * Calculate planet size scaling for realistic appearance
         */
        calculateScaledSize(planetData) {
            // Much smaller scaling for realistic appearance
            const MIN_SIZE = 0.3;  // Minimum visible size
            const MAX_SIZE = 6.0;  // Maximum size (for Sun)

            let scaledSize;

            if (planetData.name === 'Sun') {
                // Sun should be larger but not overwhelming
                scaledSize = 5.0;
            } else {
                // Scale planets relative to Earth with better proportions
                const earthDiameter = 12756; // km
                const sizeRatio = planetData.diameter / earthDiameter;

                // Apply logarithmic scaling for better visibility of smaller planets
                if (sizeRatio < 0.1) {
                    scaledSize = 0.3 + (sizeRatio * 5); // Boost tiny planets
                } else if (sizeRatio < 1.0) {
                    scaledSize = 0.5 + (sizeRatio * 1.5); // Small to medium planets
                } else {
                    scaledSize = 1.0 + Math.log(sizeRatio) * 0.8; // Large planets
                }
            }

            return Math.max(MIN_SIZE, Math.min(MAX_SIZE, scaledSize));
        }

        /**
         * Get or create sphere geometry with appropriate detail level
         * @param {Object} planetData - Planet data
         * @param {Object} options - Creation options
         * @returns {THREE.SphereGeometry} Sphere geometry
         */
        getOrCreateGeometry(planetData, options = {}) {
            const segments = this.getSegmentCount(planetData, options.quality);
            const geometryKey = `sphere_${segments}`;

            if (this.geometryCache.has(geometryKey)) {
                return this.geometryCache.get(geometryKey);
            }

            const geometry = new THREE.SphereGeometry(1, segments, segments);
            this.geometryCache.set(geometryKey, geometry);

            return geometry;
        }

        /**
         * Create advanced material with textures and effects
         * @param {Object} planetData - Planet data
         * @param {Object} options - Creation options
         * @returns {Promise<THREE.Material>} Advanced material
         */
        async createAdvancedMaterial(planetData, options = {}) {
            const materialKey = `${planetData.name}_${options.quality || 'medium'}`;

            if (this.materialCache.has(materialKey)) {
                return this.materialCache.get(materialKey);
            }

            let material;

            if (planetData.name === 'Sun') {
                material = await this.createSunMaterial(planetData, options);
            } else {
                material = await this.createPlanetMaterial(planetData, options);
            }

            this.materialCache.set(materialKey, material);
            return material;
        }

        /**
         * Create sun material with emissive properties - FIXED
         * @param {Object} planetData - Sun data
         * @param {Object} options - Creation options
         * @returns {Promise<THREE.Material>} Sun material
         */
        async createSunMaterial(planetData, options = {}) {
            const baseColor = new THREE.Color(planetData.color_hex || '#FDB813');

            // Create sun material with proper emissive properties
            const material = new THREE.MeshBasicMaterial({
                color: baseColor,
                // Don't set emissive on MeshBasicMaterial - it doesn't support it
                transparent: false
            });

            // For advanced sun effects, we could use custom shaders, but keep it simple for now
            if (options.quality === 'high') {
                // Add custom properties for future shader enhancement
                material.userData = {
                    isSun: true,
                    baseColor: baseColor,
                    intensity: 1.2
                };
            }

            return material;
        }

        /**
         * Create planet material with advanced lighting
         * @param {Object} planetData - Planet data
         * @param {Object} options - Creation options
         * @returns {Promise<THREE.Material>} Planet material
         */
        async createPlanetMaterial(planetData, options = {}) {
            const baseColor = new THREE.Color(planetData.color_hex || '#888888');

            // Create material based on planet type
            const materialOptions = {
                color: baseColor,
                roughness: this.getRoughness(planetData),
                metalness: this.getMetalness(planetData),
                transparent: false
            };

            // Add special properties for different planet types
            this.addPlanetSpecificProperties(materialOptions, planetData);

            const material = new THREE.MeshStandardMaterial(materialOptions);

            // Add custom properties for advanced effects
            material.userData = {
                planetData: planetData,
                originalColor: baseColor.clone(),
                animationTime: 0
            };

            return material;
        }

        /**
         * Add planet-specific material properties
         * @param {Object} materialOptions - Material options to modify
         * @param {Object} planetData - Planet data
         */
        addPlanetSpecificProperties(materialOptions, planetData) {
            switch (planetData.name) {
                case 'Earth':
                    materialOptions.roughness = 0.7;
                    materialOptions.metalness = 0.1;
                    // Add subtle blue emissive for atmosphere glow
                    materialOptions.emissive = new THREE.Color(0x001122);
                    materialOptions.emissiveIntensity = 0.05;
                    break;

                case 'Mars':
                    materialOptions.roughness = 0.9;
                    materialOptions.metalness = 0.05;
                    // Dusty appearance
                    break;

                case 'Venus':
                    materialOptions.roughness = 0.1;
                    materialOptions.metalness = 0.0;
                    // Bright, reflective atmosphere
                    materialOptions.emissive = new THREE.Color(planetData.color_hex);
                    materialOptions.emissiveIntensity = 0.1;
                    break;

                case 'Jupiter':
                case 'Saturn':
                    materialOptions.roughness = 0.1;
                    materialOptions.metalness = 0.0;
                    // Gas giant appearance
                    break;

                case 'Uranus':
                case 'Neptune':
                    materialOptions.roughness = 0.2;
                    materialOptions.metalness = 0.0;
                    // Ice giant with subtle glow
                    materialOptions.emissive = new THREE.Color(planetData.color_hex);
                    materialOptions.emissiveIntensity = 0.05;
                    break;

                default:
                    // Default rocky appearance
                    materialOptions.roughness = 0.8;
                    materialOptions.metalness = 0.1;
            }
        }

        /**
         * Create atmosphere effect
         * @param {Object} planetData - Planet data
         * @param {Object} options - Creation options
         * @returns {Promise<THREE.Mesh|null>} Atmosphere mesh
         */
        async createAtmosphere(planetData, options = {}) {
            if (!this.shouldHaveAtmosphere(planetData)) {
                return null;
            }

            const atmosphereRadius = 1.05; // Slightly larger than planet
            const geometry = new THREE.SphereGeometry(atmosphereRadius, 32, 32);

            const atmosphereColor = this.getAtmosphereColor(planetData);

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0.0 },
                    atmosphereColor: { value: atmosphereColor },
                    opacity: { value: 0.3 },
                    fresnelPower: { value: 3.0 }
                },
                vertexShader: `
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        vPosition = position;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 atmosphereColor;
                    uniform float opacity;
                    uniform float fresnelPower;
                    
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    
                    void main() {
                        // Fresnel effect for atmosphere
                        vec3 viewDirection = normalize(cameraPosition - vPosition);
                        float fresnel = 1.0 - abs(dot(viewDirection, vNormal));
                        fresnel = pow(fresnel, fresnelPower);
                        
                        // Subtle animation
                        float pulse = sin(time * 2.0) * 0.1 + 0.9;
                        
                        gl_FragColor = vec4(atmosphereColor, fresnel * opacity * pulse);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                depthWrite: false
            });

            const atmosphereMesh = new THREE.Mesh(geometry, material);
            atmosphereMesh.name = `${planetData.name}_atmosphere`;
            atmosphereMesh.userData = { type: 'atmosphere', planetData };

            return atmosphereMesh;
        }

        /**
         * Create ring system for planets
         * @param {Object} planetData - Planet data
         * @param {Object} options - Creation options
         * @returns {Promise<THREE.Group|null>} Ring system group
         */
        async createRingSystem(planetData, options = {}) {
            if (!planetData.has_rings) {
                return null;
            }

            const ringGroup = new THREE.Group();
            ringGroup.name = `${planetData.name}_rings`;

            // Create ring geometry
            const innerRadius = 1.2; // Start outside planet
            let outerRadius = 2.0;    // Default outer radius

            // Specific ring parameters for known planets
            if (planetData.name === 'Saturn') {
                outerRadius = 2.5;
                // Create multiple ring sections for Saturn
                await this.createSaturnRings(ringGroup, innerRadius, outerRadius);
            } else {
                // Generic ring system
                await this.createGenericRings(ringGroup, innerRadius, outerRadius, planetData);
            }

            return ringGroup;
        }

        /**
         * Create Saturn's detailed ring system
         * @param {THREE.Group} ringGroup - Ring group to add to
         * @param {number} innerRadius - Inner radius
         * @param {number} outerRadius - Outer radius
         */
        async createSaturnRings(ringGroup, innerRadius, outerRadius) {
            // Saturn has multiple ring divisions
            const ringDivisions = [
                { inner: 1.2, outer: 1.5, opacity: 0.8, color: 0xCCCCCC },
                { inner: 1.6, outer: 1.9, opacity: 0.6, color: 0xAAAAAA },
                { inner: 2.0, outer: 2.3, opacity: 0.9, color: 0xDDDDDD },
                { inner: 2.4, outer: 2.5, opacity: 0.4, color: 0x999999 }
            ];

            for (const ring of ringDivisions) {
                const geometry = new THREE.RingGeometry(ring.inner, ring.outer, 64);

                // Create ring material with transparency
                const material = new THREE.MeshBasicMaterial({
                    color: ring.color,
                    transparent: true,
                    opacity: ring.opacity,
                    side: THREE.DoubleSide,
                    depthWrite: false
                });

                const ringMesh = new THREE.Mesh(geometry, material);
                ringMesh.rotation.x = Math.PI / 2; // Rotate to horizontal

                // Add slight random rotation for realism
                ringMesh.rotation.z = Math.random() * Math.PI * 2;

                ringGroup.add(ringMesh);
            }
        }

        /**
         * Create generic ring system
         * @param {THREE.Group} ringGroup - Ring group to add to
         * @param {number} innerRadius - Inner radius
         * @param {number} outerRadius - Outer radius
         * @param {Object} planetData - Planet data
         */
        async createGenericRings(ringGroup, innerRadius, outerRadius, planetData) {
            const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);

            const ringColor = new THREE.Color(planetData.color_hex).multiplyScalar(0.7);

            const material = new THREE.MeshBasicMaterial({
                color: ringColor,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide,
                depthWrite: false
            });

            const ringMesh = new THREE.Mesh(geometry, material);
            ringMesh.rotation.x = Math.PI / 2; // Rotate to horizontal

            ringGroup.add(ringMesh);
        }

        /**
         * Create sun glow effect
         * @param {Object} planetData - Sun data
         * @param {Object} options - Creation options
         * @returns {Promise<THREE.Mesh>} Glow mesh
         */
        async createSunGlow(planetData, options = {}) {
            const glowRadius = 1.5; // Larger than sun
            const geometry = new THREE.SphereGeometry(glowRadius, 32, 32);

            const glowColor = new THREE.Color(planetData.color_hex || '#FDB813');

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0.0 },
                    glowColor: { value: glowColor },
                    intensity: { value: 0.4 }
                },
                vertexShader: `
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        vPosition = position;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 glowColor;
                    uniform float intensity;
                    
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    
                    void main() {
                        vec3 viewDirection = normalize(cameraPosition - vPosition);
                        float fresnel = 1.0 - abs(dot(viewDirection, vNormal));
                        
                        // Pulsing effect
                        float pulse = sin(time * 3.0) * 0.2 + 0.8;
                        
                        float alpha = fresnel * intensity * pulse;
                        gl_FragColor = vec4(glowColor, alpha);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                depthWrite: false
            });

            const glowMesh = new THREE.Mesh(geometry, material);
            glowMesh.name = `${planetData.name}_glow`;
            glowMesh.userData = { type: 'glow', planetData };

            return glowMesh;
        }

        /**
         * Update planet animations
         * @param {number} deltaTime - Time since last frame
         */
        update(deltaTime) {
            if (!this.isInitialized) return;

            this.planetInstances.forEach((planetGroup, planetName) => {
                this.updatePlanetGroup(planetGroup, deltaTime);
            });
        }

        /**
         * Update individual planet group
         * @param {THREE.Group} planetGroup - Planet group
         * @param {number} deltaTime - Delta time
         */
        updatePlanetGroup(planetGroup, deltaTime) {
            const planetData = planetGroup.userData.planetData;

            // Update main planet rotation
            const planetMesh = planetGroup.getObjectByName(planetData.name);
            if (planetMesh && planetData.rotation_period) {
                const rotationSpeed = (2 * Math.PI) / (planetData.rotation_period * 3600); // Convert hours to seconds
                planetMesh.rotation.y += rotationSpeed * deltaTime * 1000; // Speed up for visualization
            }

            // Update shader animations
            planetGroup.traverse((child) => {
                if (child.material && child.material.uniforms) {
                    if (child.material.uniforms.time) {
                        child.material.uniforms.time.value += deltaTime;
                    }
                }
            });

            // Update atmosphere effects
            const atmosphere = this.atmospheres.get(planetData.name);
            if (atmosphere && atmosphere.material.uniforms) {
                atmosphere.material.uniforms.time.value += deltaTime;
            }
        }

        /**
         * Helper methods
         */
        shouldHaveAtmosphere(planetData) {
            const atmosphericPlanets = ['Earth', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
            return atmosphericPlanets.includes(planetData.name);
        }

        getAtmosphereColor(planetData) {
            const atmosphereColors = {
                'Earth': new THREE.Color(0x87CEEB),
                'Venus': new THREE.Color(0xFFC649),
                'Mars': new THREE.Color(0xFF6B47),
                'Jupiter': new THREE.Color(0xD2691E),
                'Saturn': new THREE.Color(0xFAD5A5),
                'Uranus': new THREE.Color(0x4FD0FF),
                'Neptune': new THREE.Color(0x4169E1)
            };

            return atmosphereColors[planetData.name] || new THREE.Color(planetData.color_hex);
        }

        getRoughness(planetData) {
            const roughnessMap = {
                'terrestrial': 0.8,
                'gas_giant': 0.1,
                'ice_giant': 0.3,
                'dwarf_planet': 0.9
            };
            return roughnessMap[planetData.planet_type] || 0.7;
        }

        getMetalness(planetData) {
            const metalnessMap = {
                'terrestrial': 0.1,
                'gas_giant': 0.0,
                'ice_giant': 0.0,
                'dwarf_planet': 0.2
            };
            return metalnessMap[planetData.planet_type] || 0.0;
        }

        getSegmentCount(planetData, quality = 'medium') {
            const baseSegments = {
                'low': this.options.lowQualitySegments,
                'medium': this.options.defaultSegments,
                'high': this.options.highQualitySegments
            }[quality] || this.options.defaultSegments;

            // Adjust for planet importance
            if (planetData.name === 'Sun' || planetData.name === 'Earth') {
                return Math.min(baseSegments * 1.5, 128);
            }

            return baseSegments;
        }

        /**
         * Create fallback planet for error cases
         * @param {Object} planetData - Planet data
         * @returns {THREE.Group} Basic planet group
         */
        createFallbackPlanet(planetData) {
            const geometry = new THREE.SphereGeometry(1, 32, 32);
            const material = new THREE.MeshStandardMaterial({
                color: planetData.color_hex || '#888888',
                roughness: 0.7,
                metalness: 0.1
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = planetData.name;
            mesh.userData = { planetData, type: 'fallback' };

            // Apply correct scaling
            const scaledSize = this.calculateScaledSize(planetData);
            mesh.scale.setScalar(scaledSize);

            const group = new THREE.Group();
            group.add(mesh);
            group.name = `${planetData.name}_group`;
            group.userData = { planetData, type: 'planet' };

            return group;
        }

        /**
         * Set quality level
         * @param {string} quality - Quality level ('low', 'medium', 'high')
         */
        setQuality(quality) {
            this.options.quality = quality;

            // Clear caches to force recreation with new quality
            this.materialCache.clear();
            this.geometryCache.clear();

            if (window.Helpers) {
                window.Helpers.log(`Planet factory quality set to ${quality}`, 'debug');
            }
        }

        /**
         * Get planet instance
         * @param {string} planetName - Planet name
         * @returns {THREE.Group|null} Planet group
         */
        getPlanet(planetName) {
            return this.planetInstances.get(planetName) || null;
        }

        /**
         * Get all planet instances
         * @returns {Map} Map of planet instances
         */
        getAllPlanets() {
            return this.planetInstances;
        }

        /**
         * Get factory statistics
         * @returns {Object} Factory stats
         */
        getStats() {
            return {
                isInitialized: this.isInitialized,
                planetsCreated: this.planetInstances.size,
                materialsCached: this.materialCache.size,
                geometriesCached: this.geometryCache.size,
                ringSystems: this.ringSystems.size,
                atmospheres: this.atmospheres.size,
                quality: this.options.quality
            };
        }

        /**
         * Dispose of factory resources
         */
        dispose() {
            // Dispose geometries
            this.geometryCache.forEach(geometry => geometry.dispose());
            this.geometryCache.clear();

            // Dispose materials
            this.materialCache.forEach(material => material.dispose());
            this.materialCache.clear();

            // Clear planet instances
            this.planetInstances.clear();
            this.ringSystems.clear();
            this.atmospheres.clear();

            this.isInitialized = false;

            if (window.Helpers) {
                window.Helpers.log('Planet factory disposed', 'debug');
            }
        }
    }

    // Public API
    return {
        PlanetFactory,

        // Factory function
        create: (options = {}) => {
            return new PlanetFactory(options);
        }
    };
})();

// Make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.PlanetFactory;
}

console.log('Enhanced PlanetFactory module loaded successfully');