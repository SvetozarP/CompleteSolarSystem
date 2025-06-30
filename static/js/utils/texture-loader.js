// static/js/utils/texture-loader.js
// Advanced texture loading and management system for realistic planet rendering

window.TextureLoader = (function() {
    'use strict';

    // Texture cache and loading state
    const textureCache = new Map();
    const loadingPromises = new Map();
    const loadingState = {
        totalTextures: 0,
        loadedTextures: 0,
        failedTextures: 0,
        isLoading: false
    };

    // Default texture paths - these should point to your texture files
    const DEFAULT_TEXTURE_PATHS = {
        sun: '/static/textures/sun_texture.jpg',
        mercury: '/static/textures/mercury_texture.jpg',
        venus: '/static/textures/venus_texture.jpg',
        earth: '/static/textures/earth_texture.jpg',
        mars: '/static/textures/mars_texture.jpg',
        jupiter: '/static/textures/jupiter_texture.jpg',
        saturn: '/static/textures/saturn_texture.jpg',
        uranus: '/static/textures/uranus_texture.jpg',
        neptune: '/static/textures/neptune_texture.jpg',
        pluto: '/static/textures/pluto_texture.jpg',

        // Additional texture types
        starfield: '/static/textures/starfield.jpg',
        nebula: '/static/textures/nebula.jpg',
        asteroids: '/static/textures/asteroid_texture.jpg',

        // Normal maps for enhanced detail
        earth_normal: '/static/textures/earth_normal.jpg',
        mars_normal: '/static/textures/mars_normal.jpg',
        moon_texture: '/static/textures/moon_texture.jpg'
    };

    // Fallback colors if textures fail to load
    const FALLBACK_COLORS = {
        sun: '#FDB813',
        mercury: '#8C7853',
        venus: '#FC649F',
        earth: '#4F94CD',
        mars: '#CD5C5C',
        jupiter: '#D2691E',
        saturn: '#FAD5A5',
        uranus: '#4FD0FF',
        neptune: '#4169E1',
        pluto: '#EEE8AA'
    };

    /**
     * Create Three.js texture loader
     */
    const threeTextureLoader = new THREE.TextureLoader();

    /**
     * Texture loading utilities
     */
    const TextureUtils = {
        /**
         * Load a single texture with error handling
         * @param {string} url - Texture URL
         * @param {Object} options - Loading options
         * @returns {Promise<THREE.Texture>} Loaded texture
         */
        loadTexture: async (url, options = {}) => {
            const {
                wrapS = THREE.RepeatWrapping,
                wrapT = THREE.RepeatWrapping,
                magFilter = THREE.LinearFilter,
                minFilter = THREE.LinearMipMapLinearFilter,
                anisotropy = 16,
                flipY = true,
                generateMipmaps = true
            } = options;

            // Check cache first
            if (textureCache.has(url)) {
                return textureCache.get(url);
            }

            // Check if already loading
            if (loadingPromises.has(url)) {
                return loadingPromises.get(url);
            }

            // Create loading promise
            const loadingPromise = new Promise((resolve, reject) => {
                threeTextureLoader.load(
                    url,
                    // Success callback
                    (texture) => {
                        // Configure texture properties
                        texture.wrapS = wrapS;
                        texture.wrapT = wrapT;
                        texture.magFilter = magFilter;
                        texture.minFilter = minFilter;
                        texture.flipY = flipY;
                        texture.generateMipmaps = generateMipmaps;

                        // Set anisotropy if supported
                        const renderer = window.solarSystemApp?.renderer;
                        if (renderer) {
                            texture.anisotropy = Math.min(anisotropy, renderer.capabilities.getMaxAnisotropy());
                        }

                        // Cache the texture
                        textureCache.set(url, texture);
                        loadingState.loadedTextures++;

                        if (window.Helpers) {
                            window.Helpers.log(`Texture loaded successfully: ${url}`, 'debug');
                        }

                        resolve(texture);
                    },
                    // Progress callback
                    (progress) => {
                        if (window.LoadingManager) {
                            const percent = (progress.loaded / progress.total) * 100;
                            window.LoadingManager.updateProgress(`Loading texture: ${Math.round(percent)}%`);
                        }
                    },
                    // Error callback
                    (error) => {
                        loadingState.failedTextures++;
                        console.warn(`Failed to load texture: ${url}`, error);

                        // Create a simple colored texture as fallback
                        const canvas = document.createElement('canvas');
                        canvas.width = canvas.height = 256;
                        const context = canvas.getContext('2d');

                        // Extract planet name from URL to get fallback color
                        const planetName = TextureUtils.extractPlanetName(url);
                        const fallbackColor = FALLBACK_COLORS[planetName] || '#888888';

                        context.fillStyle = fallbackColor;
                        context.fillRect(0, 0, 256, 256);

                        // Add some texture variation
                        TextureUtils.addNoiseToCanvas(context, 256, 256);

                        const fallbackTexture = new THREE.CanvasTexture(canvas);
                        fallbackTexture.wrapS = wrapS;
                        fallbackTexture.wrapT = wrapT;
                        fallbackTexture.magFilter = magFilter;
                        fallbackTexture.minFilter = minFilter;

                        textureCache.set(url, fallbackTexture);
                        resolve(fallbackTexture);
                    }
                );
            });

            loadingPromises.set(url, loadingPromise);
            return loadingPromise;
        },

        /**
         * Extract planet name from texture URL
         * @param {string} url - Texture URL
         * @returns {string} Planet name
         */
        extractPlanetName: (url) => {
            const match = url.match(/(\w+)_texture/);
            return match ? match[1].toLowerCase() : 'unknown';
        },

        /**
         * Add noise pattern to canvas for fallback textures
         * @param {CanvasRenderingContext2D} context - Canvas context
         * @param {number} width - Canvas width
         * @param {number} height - Canvas height
         */
        addNoiseToCanvas: (context, width, height) => {
            const imageData = context.getImageData(0, 0, width, height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const noise = (Math.random() - 0.5) * 30;
                data[i] = Math.max(0, Math.min(255, data[i] + noise));     // Red
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // Green
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // Blue
            }

            context.putImageData(imageData, 0, 0);
        },

        /**
         * Create procedural texture for astronomical objects
         * @param {Object} options - Texture generation options
         * @returns {THREE.Texture} Generated texture
         */
        createProceduralTexture: (options = {}) => {
            const {
                size = 512,
                baseColor = '#888888',
                noiseScale = 0.1,
                noiseStrength = 0.2,
                type = 'surface'
            } = options;

            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = size;
            const context = canvas.getContext('2d');

            // Parse base color
            const color = window.Helpers?.Color?.hexToRgb(baseColor) || { r: 0.5, g: 0.5, b: 0.5 };

            // Generate procedural texture based on type
            switch (type) {
                case 'surface':
                    TextureUtils.generateSurfaceTexture(context, size, color, noiseScale, noiseStrength);
                    break;
                case 'gas_giant':
                    TextureUtils.generateGasGiantTexture(context, size, color);
                    break;
                case 'ice':
                    TextureUtils.generateIceTexture(context, size, color);
                    break;
                case 'starfield':
                    TextureUtils.generateStarfieldTexture(context, size);
                    break;
                default:
                    TextureUtils.generateSurfaceTexture(context, size, color, noiseScale, noiseStrength);
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.magFilter = THREE.LinearFilter;
            texture.minFilter = THREE.LinearMipMapLinearFilter;

            return texture;
        },

        /**
         * Generate surface texture with noise
         * @param {CanvasRenderingContext2D} context - Canvas context
         * @param {number} size - Texture size
         * @param {Object} baseColor - RGB color object
         * @param {number} noiseScale - Noise scaling factor
         * @param {number} noiseStrength - Noise strength
         */
        generateSurfaceTexture: (context, size, baseColor, noiseScale, noiseStrength) => {
            const imageData = context.createImageData(size, size);
            const data = imageData.data;

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const index = (y * size + x) * 4;

                    // Generate noise using MathUtils if available
                    const noise = window.MathUtils?.Noise?.fractalNoise2D(
                        x * noiseScale,
                        y * noiseScale,
                        4,
                        0.5
                    ) || (Math.random() - 0.5);

                    // Apply noise to base color
                    const variation = noise * noiseStrength;
                    data[index] = Math.max(0, Math.min(255, (baseColor.r + variation) * 255));     // Red
                    data[index + 1] = Math.max(0, Math.min(255, (baseColor.g + variation) * 255)); // Green
                    data[index + 2] = Math.max(0, Math.min(255, (baseColor.b + variation) * 255)); // Blue
                    data[index + 3] = 255; // Alpha
                }
            }

            context.putImageData(imageData, 0, 0);
        },

        /**
         * Generate gas giant texture with bands
         * @param {CanvasRenderingContext2D} context - Canvas context
         * @param {number} size - Texture size
         * @param {Object} baseColor - RGB color object
         */
        generateGasGiantTexture: (context, size, baseColor) => {
            const imageData = context.createImageData(size, size);
            const data = imageData.data;

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const index = (y * size + x) * 4;

                    // Create horizontal bands
                    const bandFreq = 8;
                    const bandPhase = Math.sin(y * Math.PI * 2 / size * bandFreq);

                    // Add turbulence
                    const turbulence = window.MathUtils?.Noise?.fractalNoise2D(
                        x * 0.02,
                        y * 0.02,
                        3,
                        0.6
                    ) || (Math.random() - 0.5);

                    const intensity = (bandPhase + turbulence * 0.3) * 0.5 + 0.5;

                    data[index] = Math.max(0, Math.min(255, baseColor.r * intensity * 255));
                    data[index + 1] = Math.max(0, Math.min(255, baseColor.g * intensity * 255));
                    data[index + 2] = Math.max(0, Math.min(255, baseColor.b * intensity * 255));
                    data[index + 3] = 255;
                }
            }

            context.putImageData(imageData, 0, 0);
        },

        /**
         * Generate ice texture
         * @param {CanvasRenderingContext2D} context - Canvas context
         * @param {number} size - Texture size
         * @param {Object} baseColor - RGB color object
         */
        generateIceTexture: (context, size, baseColor) => {
            const imageData = context.createImageData(size, size);
            const data = imageData.data;

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const index = (y * size + x) * 4;

                    // Create crystalline patterns
                    const crystal1 = Math.sin(x * 0.1) * Math.cos(y * 0.1);
                    const crystal2 = Math.sin(x * 0.05 + y * 0.05) * 0.5;
                    const noise = window.MathUtils?.Noise?.noise2D(x * 0.03, y * 0.03) || (Math.random() - 0.5);

                    const intensity = (crystal1 + crystal2 + noise * 0.3) * 0.3 + 0.7;

                    // Ice tends to be brighter and bluer
                    data[index] = Math.max(0, Math.min(255, baseColor.r * intensity * 255));
                    data[index + 1] = Math.max(0, Math.min(255, baseColor.g * intensity * 255));
                    data[index + 2] = Math.max(0, Math.min(255, Math.min(baseColor.b * intensity * 1.2, 1) * 255));
                    data[index + 3] = 255;
                }
            }

            context.putImageData(imageData, 0, 0);
        },

        /**
         * Generate starfield texture
         * @param {CanvasRenderingContext2D} context - Canvas context
         * @param {number} size - Texture size
         */
        generateStarfieldTexture: (context, size) => {
            // Black background
            context.fillStyle = '#000000';
            context.fillRect(0, 0, size, size);

            // Generate stars
            const numStars = size * size / 1000; // Density based on size

            for (let i = 0; i < numStars; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const brightness = Math.random();
                const starSize = Math.random() * 2 + 0.5;

                // Star color based on temperature
                let r, g, b;
                if (brightness > 0.8) {
                    // Blue-white hot stars
                    r = 0.8 + Math.random() * 0.2;
                    g = 0.9 + Math.random() * 0.1;
                    b = 1.0;
                } else if (brightness > 0.6) {
                    // White stars
                    r = g = b = 0.9 + Math.random() * 0.1;
                } else if (brightness > 0.4) {
                    // Yellow stars
                    r = 1.0;
                    g = 0.9 + Math.random() * 0.1;
                    b = 0.7 + Math.random() * 0.2;
                } else {
                    // Red stars
                    r = 1.0;
                    g = 0.5 + Math.random() * 0.3;
                    b = 0.3 + Math.random() * 0.2;
                }

                const alpha = brightness * brightness; // Dimmer stars are more transparent

                context.fillStyle = `rgba(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)}, ${alpha})`;

                // Draw star with glow effect
                context.beginPath();
                context.arc(x, y, starSize, 0, Math.PI * 2);
                context.fill();

                // Add glow for brighter stars
                if (brightness > 0.7) {
                    context.fillStyle = `rgba(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)}, ${alpha * 0.3})`;
                    context.beginPath();
                    context.arc(x, y, starSize * 2, 0, Math.PI * 2);
                    context.fill();
                }
            }
        }
    };

    /**
     * Batch texture loading with progress tracking
     */
    const BatchLoader = {
        /**
         * Load multiple textures with progress tracking
         * @param {Array} textureList - Array of texture specifications
         * @param {Function} progressCallback - Progress update callback
         * @returns {Promise<Map>} Map of loaded textures
         */
        loadTextures: async (textureList, progressCallback) => {
            loadingState.isLoading = true;
            loadingState.totalTextures = textureList.length;
            loadingState.loadedTextures = 0;
            loadingState.failedTextures = 0;

            const results = new Map();
            const promises = [];

            textureList.forEach(({ name, url, options = {} }) => {
                const promise = TextureUtils.loadTexture(url, options)
                    .then(texture => {
                        results.set(name, texture);

                        if (progressCallback) {
                            const progress = {
                                loaded: loadingState.loadedTextures,
                                total: loadingState.totalTextures,
                                current: name,
                                percentage: (loadingState.loadedTextures / loadingState.totalTextures) * 100
                            };
                            progressCallback(progress);
                        }

                        return texture;
                    })
                    .catch(error => {
                        console.warn(`Failed to load texture ${name}:`, error);
                        return null;
                    });

                promises.push(promise);
            });

            await Promise.allSettled(promises);
            loadingState.isLoading = false;

            return results;
        },

        /**
         * Load planet textures based on planet data
         * @param {Array} planetData - Array of planet objects
         * @param {Function} progressCallback - Progress callback
         * @returns {Promise<Map>} Loaded textures
         */
        loadPlanetTextures: async (planetData, progressCallback) => {
            const textureList = [];

            planetData.forEach(planet => {
                const planetName = planet.name.toLowerCase();

                // Main texture
                if (planet.texture_filename && planet.texture_filename !== '') {
                    textureList.push({
                        name: `${planetName}_texture`,
                        url: `/static/textures/${planet.texture_filename}`,
                        options: {
                            wrapS: THREE.RepeatWrapping,
                            wrapT: THREE.RepeatWrapping
                        }
                    });
                } else {
                    // Create procedural texture if no file specified
                    const proceduralTexture = TextureUtils.createProceduralTexture({
                        baseColor: planet.color_hex,
                        type: planet.planet_type === 'gas_giant' || planet.planet_type === 'ice_giant' ? 'gas_giant' : 'surface'
                    });

                    textureCache.set(`${planetName}_texture`, proceduralTexture);
                }

                // Normal maps for enhanced detail (if available)
                if (DEFAULT_TEXTURE_PATHS[`${planetName}_normal`]) {
                    textureList.push({
                        name: `${planetName}_normal`,
                        url: DEFAULT_TEXTURE_PATHS[`${planetName}_normal`],
                        options: {
                            wrapS: THREE.RepeatWrapping,
                            wrapT: THREE.RepeatWrapping
                        }
                    });
                }
            });

            // Add environment textures
            textureList.push(
                {
                    name: 'starfield',
                    url: DEFAULT_TEXTURE_PATHS.starfield,
                    options: {
                        wrapS: THREE.RepeatWrapping,
                        wrapT: THREE.RepeatWrapping,
                        magFilter: THREE.LinearFilter,
                        minFilter: THREE.LinearFilter
                    }
                },
                {
                    name: 'nebula',
                    url: DEFAULT_TEXTURE_PATHS.nebula,
                    options: {
                        wrapS: THREE.RepeatWrapping,
                        wrapT: THREE.RepeatWrapping
                    }
                }
            );

            return await BatchLoader.loadTextures(textureList, progressCallback);
        }
    };

    /**
     * Texture management utilities
     */
    const Management = {
        /**
         * Get texture from cache or load if not cached
         * @param {string} name - Texture name/key
         * @param {string} fallbackUrl - Fallback URL if not cached
         * @returns {Promise<THREE.Texture>} Texture
         */
        getTexture: async (name, fallbackUrl = null) => {
            // Check cache first
            if (textureCache.has(name)) {
                return textureCache.get(name);
            }

            // Try to load from fallback URL
            if (fallbackUrl) {
                return await TextureUtils.loadTexture(fallbackUrl);
            }

            // Create procedural fallback
            return TextureUtils.createProceduralTexture({
                baseColor: FALLBACK_COLORS[name] || '#888888'
            });
        },

        /**
         * Preload essential textures for immediate use
         * @returns {Promise<void>}
         */
        preloadEssentialTextures: async () => {
            const essentialTextures = [
                { name: 'sun_texture', url: DEFAULT_TEXTURE_PATHS.sun },
                { name: 'earth_texture', url: DEFAULT_TEXTURE_PATHS.earth },
                { name: 'starfield', url: DEFAULT_TEXTURE_PATHS.starfield }
            ];

            await BatchLoader.loadTextures(essentialTextures, (progress) => {
                if (window.LoadingManager) {
                    window.LoadingManager.updateProgress(`Loading essential textures: ${Math.round(progress.percentage)}%`);
                }
            });
        },

        /**
         * Clear texture cache to free memory
         * @param {Array} excludeList - Textures to keep in cache
         */
        clearCache: (excludeList = []) => {
            textureCache.forEach((texture, key) => {
                if (!excludeList.includes(key)) {
                    if (texture.dispose) {
                        texture.dispose();
                    }
                    textureCache.delete(key);
                }
            });

            if (window.Helpers) {
                window.Helpers.log(`Texture cache cleared. Kept ${excludeList.length} textures.`, 'debug');
            }
        },

        /**
         * Get texture loading statistics
         * @returns {Object} Loading statistics
         */
        getStats: () => {
            return {
                ...loadingState,
                cachedTextures: textureCache.size,
                activePromises: loadingPromises.size
            };
        },

        /**
         * Check if all textures are loaded
         * @returns {boolean} All textures loaded
         */
        isLoadingComplete: () => {
            return !loadingState.isLoading && loadingPromises.size === 0;
        }
    };

    /**
     * Create fallback materials when textures fail
     */
    const FallbackMaterials = {
        /**
         * Create basic material with fallback color
         * @param {string} planetName - Planet name
         * @param {Object} options - Material options
         * @returns {THREE.Material} Fallback material
         */
        createPlanetMaterial: (planetName, options = {}) => {
            const color = FALLBACK_COLORS[planetName.toLowerCase()] || '#888888';

            const materialOptions = {
                color: color,
                roughness: 0.7,
                metalness: 0.1,
                ...options
            };

            return new THREE.MeshStandardMaterial(materialOptions);
        },

        /**
         * Create emissive material for the sun
         * @param {Object} options - Material options
         * @returns {THREE.Material} Sun material
         */
        createSunMaterial: (options = {}) => {
            return new THREE.MeshBasicMaterial({
                color: FALLBACK_COLORS.sun,
                emissive: FALLBACK_COLORS.sun,
                emissiveIntensity: 0.8,
                ...options
            });
        },

        /**
         * Create gas giant material with bands
         * @param {string} planetName - Planet name
         * @returns {THREE.Material} Gas giant material
         */
        createGasGiantMaterial: (planetName) => {
            const proceduralTexture = TextureUtils.createProceduralTexture({
                baseColor: FALLBACK_COLORS[planetName.toLowerCase()] || '#888888',
                type: 'gas_giant',
                size: 256
            });

            return new THREE.MeshStandardMaterial({
                map: proceduralTexture,
                roughness: 0.9,
                metalness: 0.0
            });
        }
    };

    // Public API
    return {
        TextureUtils,
        BatchLoader,
        Management,
        FallbackMaterials,

        // Convenience methods
        load: TextureUtils.loadTexture,
        loadPlanetTextures: BatchLoader.loadPlanetTextures,
        get: Management.getTexture,
        preload: Management.preloadEssentialTextures,
        clear: Management.clearCache,
        stats: Management.getStats,
        isComplete: Management.isLoadingComplete,

        // Configuration
        setTexturePath: (planetName, path) => {
            DEFAULT_TEXTURE_PATHS[planetName.toLowerCase()] = path;
        },

        setFallbackColor: (planetName, color) => {
            FALLBACK_COLORS[planetName.toLowerCase()] = color;
        },

        // Constants
        PATHS: DEFAULT_TEXTURE_PATHS,
        FALLBACK_COLORS
    };
})();

// Make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.TextureLoader;
}

console.log('TextureLoader module loaded successfully');