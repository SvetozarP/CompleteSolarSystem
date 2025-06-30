// static/js/solar-system/planet-factory.js
// Enhanced planet factory with proper scaling and materials for Stage 3

window.PlanetFactory = (function() {
    'use strict';

    // Enhanced scaling constants for better visual separation
    const SCALING = {
        SIZE_SCALE_FACTOR: 2000,      // Increased from 1000 for smaller planets
        DISTANCE_SCALE_FACTOR: 25,    // Increased from 20 for even better spacing
        MIN_PLANET_SIZE: 0.3,         // Minimum visible size
        MAX_PLANET_SIZE: 8.0,         // Maximum size for gas giants
        SUN_SIZE_MULTIPLIER: 1.5,     // Reduced from 3.0 - Sun relative to largest planet

        // Distance multipliers for specific planets to prevent overlap
        DISTANCE_MULTIPLIERS: {
            'mercury': 2.0,  // Mercury closer to realistic
            'venus': 2.5,    // Venus
            'earth': 3.0,    // Earth
            'mars': 4.5,     // Mars much further out
            'jupiter': 2.5,  // Jupiter much further from Mars
            'saturn': 2.2,   // Saturn
            'uranus': 1.8,   // Uranus
            'neptune': 1.5,  // Neptune
            'pluto': 1.2     // Pluto
        }
    };

    /**
     * Create a planet with proper scaling and materials
     */
    class PlanetFactory {
        constructor(textureLoader = null) {
            this.textureLoader = textureLoader || window.TextureLoader;
            this.planets = new Map();
            this.planetGroups = new Map();
        }

        /**
         * Create a planet from database data
         * @param {Object} planetData - Planet data from Django API
         * @param {THREE.Scene} scene - Three.js scene
         * @returns {Promise<THREE.Group>} Planet group
         */
        async createPlanet(planetData, scene) {
            try {
                // Calculate scaled properties
                const scaledSize = this.calculateScaledSize(planetData);
                const scaledDistance = this.calculateScaledDistance(planetData);

                // Create planet group for organization
                const planetGroup = new THREE.Group();
                planetGroup.name = `${planetData.name}_group`;

                // Create planet geometry
                const geometry = new THREE.SphereGeometry(
                    scaledSize,
                    32, // Reduced segments for performance
                    32
                );

                // Create planet material
                const material = await this.createPlanetMaterial(planetData);

                // Create planet mesh
                const planetMesh = new THREE.Mesh(geometry, material);
                planetMesh.name = planetData.name;
                planetMesh.userData = {
                    planetData: planetData,
                    originalSize: scaledSize,
                    originalDistance: scaledDistance,
                    isSelectable: true
                };

                // Position planet at initial orbital position
                planetMesh.position.set(scaledDistance, 0, 0);

                // Add subtle self-rotation
                planetMesh.rotation.y = Math.random() * Math.PI * 2;

                planetGroup.add(planetMesh);

                // Store references
                this.planets.set(planetData.name.toLowerCase(), planetMesh);
                this.planetGroups.set(planetData.name.toLowerCase(), planetGroup);

                // Add to scene
                scene.add(planetGroup);

                if (window.Helpers) {
                    window.Helpers.log(`Created planet: ${planetData.name} - Size: ${scaledSize.toFixed(2)}, Distance: ${scaledDistance.toFixed(2)}`, 'debug');
                }

                return planetGroup;

            } catch (error) {
                if (window.Helpers) {
                    window.Helpers.handleError(error, `PlanetFactory.createPlanet(${planetData.name})`);
                }
                throw error;
            }
        }

        /**
         * Create the Sun with proper scaling and emissive material
         * @param {Object} sunData - Sun data from database
         * @param {THREE.Scene} scene - Three.js scene
         * @returns {Promise<THREE.Group>} Sun group
         */
        async createSun(sunData, scene) {
            try {
                // Calculate sun size based on largest planet
                const maxPlanetSize = SCALING.MAX_PLANET_SIZE;
                const sunSize = maxPlanetSize * SCALING.SUN_SIZE_MULTIPLIER;

                // Create sun geometry with more segments for smoothness
                const geometry = new THREE.SphereGeometry(sunSize, 48, 48);

                // Create emissive sun material
                const material = await this.createSunMaterial(sunData);

                // Create sun mesh
                const sunMesh = new THREE.Mesh(geometry, material);
                sunMesh.name = 'Sun';
                sunMesh.position.set(0, 0, 0);
                sunMesh.userData = {
                    planetData: sunData,
                    isSun: true,
                    isSelectable: true
                };

                // Add subtle rotation
                sunMesh.rotation.y = Math.random() * Math.PI * 2;

                // Create sun group
                const sunGroup = new THREE.Group();
                sunGroup.name = 'sun_group';
                sunGroup.add(sunMesh);

                // Store references
                this.planets.set('sun', sunMesh);
                this.planetGroups.set('sun', sunGroup);

                // Add to scene
                scene.add(sunGroup);

                if (window.Helpers) {
                    window.Helpers.log(`Created Sun - Size: ${sunSize.toFixed(2)}`, 'debug');
                }

                return sunGroup;

            } catch (error) {
                if (window.Helpers) {
                    window.Helpers.handleError(error, 'PlanetFactory.createSun');
                }
                throw error;
            }
        }

        /**
         * Calculate scaled planet size with better proportions
         * @param {Object} planetData - Planet data
         * @returns {number} Scaled radius
         */
        calculateScaledSize(planetData) {
            // Get diameter in km and convert to radius
            const realRadius = planetData.diameter / 2;

            // Apply scaling
            let scaledRadius = realRadius / SCALING.SIZE_SCALE_FACTOR;

            // Special handling for different planet types
            if (planetData.planet_type === 'gas_giant' || planetData.planet_type === 'ice_giant') {
                // Gas giants can be larger
                scaledRadius = Math.min(scaledRadius, SCALING.MAX_PLANET_SIZE);
            } else {
                // Terrestrial planets stay smaller
                scaledRadius = Math.min(scaledRadius, SCALING.MAX_PLANET_SIZE * 0.6);
            }

            // Ensure minimum size for visibility
            scaledRadius = Math.max(scaledRadius, SCALING.MIN_PLANET_SIZE);

            return scaledRadius;
        }

        /**
         * Calculate scaled orbital distance with enhanced spacing
         * @param {Object} planetData - Planet data
         * @returns {number} Scaled distance
         */
        calculateScaledDistance(planetData) {
            const realDistanceAU = planetData.distance_from_sun;
            const planetName = planetData.name.toLowerCase();

            // Get distance multiplier for this planet
            const multiplier = SCALING.DISTANCE_MULTIPLIERS[planetName] || 1.0;

            // Calculate base scaled distance
            let scaledDistance = realDistanceAU * SCALING.DISTANCE_SCALE_FACTOR * multiplier;

            // Ensure minimum distance from sun
            const minDistance = 15; // Minimum distance to prevent overlap with sun
            scaledDistance = Math.max(scaledDistance, minDistance);

            return scaledDistance;
        }

        /**
         * Create planet material with proper lighting response
         * @param {Object} planetData - Planet data
         * @returns {Promise<THREE.Material>} Planet material
         */
        async createPlanetMaterial(planetData) {
            try {
                // Try to load texture
                let texture = null;
                if (this.textureLoader && planetData.texture_filename) {
                    try {
                        const texturePath = `/static/textures/${planetData.texture_filename}`;
                        texture = await this.textureLoader.load(texturePath);
                    } catch (textureError) {
                        if (window.Helpers) {
                            window.Helpers.log(`Texture failed for ${planetData.name}, using procedural`, 'warn');
                        }
                    }
                }

                // Create material based on planet type
                const materialOptions = {
                    color: planetData.color_hex || '#888888',
                    roughness: this.getPlanetRoughness(planetData),
                    metalness: this.getPlanetMetalness(planetData),
                    emissive: 0x000000,
                    emissiveIntensity: 0
                };

                // Add texture if available
                if (texture) {
                    materialOptions.map = texture;
                }

                // Special handling for different planet types
                if (planetData.planet_type === 'gas_giant' || planetData.planet_type === 'ice_giant') {
                    // Gas giants are less rough
                    materialOptions.roughness = 0.9;
                    materialOptions.metalness = 0.0;
                } else if (planetData.name.toLowerCase() === 'earth') {
                    // Earth has more variation
                    materialOptions.roughness = 0.6;
                    materialOptions.metalness = 0.1;

                    // Add slight blue emission for atmosphere effect
                    materialOptions.emissive = new THREE.Color(0x0033aa);
                    materialOptions.emissiveIntensity = 0.05;
                }

                const material = new THREE.MeshStandardMaterial(materialOptions);

                // Ensure the material receives lighting properly
                material.needsUpdate = true;

                return material;

            } catch (error) {
                // Fallback to basic colored material
                if (window.Helpers) {
                    window.Helpers.log(`Material creation failed for ${planetData.name}, using fallback`, 'warn');
                }

                return new THREE.MeshStandardMaterial({
                    color: planetData.color_hex || '#888888',
                    roughness: 0.7,
                    metalness: 0.1
                });
            }
        }

        /**
         * Create Sun material with strong emission
         * @param {Object} sunData - Sun data
         * @returns {Promise<THREE.Material>} Sun material
         */
        async createSunMaterial(sunData) {
            const sunColor = new THREE.Color(sunData.color_hex || '#FDB813');

            // Try to load sun texture
            let texture = null;
            if (this.textureLoader && sunData.texture_filename) {
                try {
                    const texturePath = `/static/textures/${sunData.texture_filename}`;
                    texture = await this.textureLoader.load(texturePath);
                } catch (error) {
                    // Use procedural texture
                    if (window.TextureLoader && window.TextureLoader.TextureUtils) {
                        texture = window.TextureLoader.TextureUtils.createProceduralTexture({
                            baseColor: sunData.color_hex,
                            type: 'surface',
                            size: 512,
                            noiseScale: 0.02,
                            noiseStrength: 0.3
                        });
                    }
                }
            }

            // Use MeshStandardMaterial with emissive properties for the sun
            const material = new THREE.MeshStandardMaterial({
                color: sunColor,
                emissive: sunColor,
                emissiveIntensity: 0.8,
                map: texture,
                roughness: 1.0,
                metalness: 0.0
            });

            return material;
        }

        /**
         * Get appropriate roughness for planet type
         * @param {Object} planetData - Planet data
         * @returns {number} Roughness value
         */
        getPlanetRoughness(planetData) {
            switch (planetData.planet_type) {
                case 'gas_giant':
                case 'ice_giant':
                    return 0.9; // Very rough for gas
                case 'terrestrial':
                    if (planetData.atmosphere && planetData.atmosphere.includes('thick')) {
                        return 0.4; // Smoother with thick atmosphere
                    }
                    return 0.8; // Rocky surface
                default:
                    return 0.7;
            }
        }

        /**
         * Get appropriate metalness for planet type
         * @param {Object} planetData - Planet data
         * @returns {number} Metalness value
         */
        getPlanetMetalness(planetData) {
            if (planetData.composition && planetData.composition.toLowerCase().includes('iron')) {
                return 0.3; // More metallic for iron-rich planets
            }

            switch (planetData.planet_type) {
                case 'gas_giant':
                case 'ice_giant':
                    return 0.0; // No metallic reflection for gas
                case 'terrestrial':
                    return 0.1; // Slight metallic reflection for rocky planets
                default:
                    return 0.05;
            }
        }

        /**
         * Update planet rotation (self-spin)
         * @param {number} deltaTime - Time since last update
         */
        updatePlanetRotations(deltaTime) {
            this.planets.forEach((planetMesh, name) => {
                if (planetMesh.userData.planetData) {
                    const planetData = planetMesh.userData.planetData;

                    // Calculate rotation speed based on real rotation period (much slower)
                    let rotationSpeed = 0.0004; // Much slower default rotation (5x slower than before)

                    if (planetData.rotation_period && planetData.rotation_period > 0) {
                        // Scale rotation speed (much slower than before)
                        rotationSpeed = (24 / Math.abs(planetData.rotation_period)) * 0.001; // Reduced from 0.005 (5x slower)

                        // Handle retrograde rotation (Venus, Uranus)
                        if (planetData.rotation_period < 0) {
                            rotationSpeed = -rotationSpeed;
                        }
                    }

                    planetMesh.rotation.y += rotationSpeed * deltaTime * 60; // 60fps normalization
                }
            });
        }

        /**
         * Get planet mesh by name
         * @param {string} planetName - Planet name
         * @returns {THREE.Mesh|null} Planet mesh
         */
        getPlanet(planetName) {
            return this.planets.get(planetName.toLowerCase()) || null;
        }

        /**
         * Get planet group by name
         * @param {string} planetName - Planet name
         * @returns {THREE.Group|null} Planet group
         */
        getPlanetGroup(planetName) {
            return this.planetGroups.get(planetName.toLowerCase()) || null;
        }

        /**
         * Get all planet names
         * @returns {Array} Array of planet names
         */
        getAllPlanetNames() {
            return Array.from(this.planets.keys());
        }

        /**
         * Get scaling information for debugging
         * @returns {Object} Scaling info
         */
        getScalingInfo() {
            return {
                ...SCALING,
                planetsCreated: this.planets.size,
                planetNames: this.getAllPlanetNames()
            };
        }

        /**
         * Dispose of all planet resources
         */
        dispose() {
            this.planets.forEach((planetMesh) => {
                if (planetMesh.geometry) {
                    planetMesh.geometry.dispose();
                }
                if (planetMesh.material) {
                    if (Array.isArray(planetMesh.material)) {
                        planetMesh.material.forEach(mat => mat.dispose());
                    } else {
                        planetMesh.material.dispose();
                    }
                }
            });

            this.planets.clear();
            this.planetGroups.clear();
        }
    }

    // Public API
    return {
        PlanetFactory,
        SCALING,

        // Factory function
        create: (textureLoader = null) => {
            return new PlanetFactory(textureLoader);
        }
    };
})();

console.log('Enhanced PlanetFactory module loaded successfully');