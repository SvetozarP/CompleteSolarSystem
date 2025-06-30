// static/js/solar-system/solar-system-app.js
// Main Solar System Application - Stage 2 with particle systems

window.SolarSystemApp = class {
    constructor(options = {}) {
        this.options = {
            containerId: 'canvas-container',
            canvasId: 'solar-system-canvas',
            ...options
        };

        // Core components
        this.sceneManager = null;
        this.particleManager = null;
        this.textureLoader = null;

        // Data
        this.planets = [];
        this.systemInfo = null;

        // State
        this.isInitialized = false;
        this.animationSpeed = 1.0;
        this.isAnimating = true;

        // Event listeners for cleanup
        this.eventListeners = [];
    }

    async init() {
        try {
            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Initializing 3D environment...', 10);
            }

            // Initialize scene manager
            await this.initSceneManager();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Loading textures...', 30);
            }

            // Initialize texture loader
            await this.initTextureLoader();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Creating particle systems...', 50);
            }

            // Initialize particle systems
            await this.initParticleSystems();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Loading planetary data...', 70);
            }

            // Load data from Django API
            await this.loadData();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Setting up controls...', 85);
            }

            // Setup UI and controls
            this.setupEventListeners();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Starting animation...', 95);
            }

            // Start render loop
            this.startRenderLoop();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Complete!', 100);
            }

            this.isInitialized = true;

            if (window.Helpers) {
                window.Helpers.log('Solar System App initialized successfully', 'debug');
            }

            if (window.NotificationSystem) {
                window.NotificationSystem.showSuccess('Solar System loaded successfully!');
            }

            return true;

        } catch (error) {
            if (window.Helpers) {
                window.Helpers.handleError(error, 'SolarSystemApp.init');
            }

            if (window.NotificationSystem) {
                window.NotificationSystem.showError('Failed to initialize solar system: ' + error.message);
            }

            throw error;
        }
    }

    async initSceneManager() {
        this.sceneManager = window.SceneManager.create(this.options);
        const success = await this.sceneManager.init();

        if (!success) {
            throw new Error('Failed to initialize scene manager');
        }

        if (window.Helpers) {
            window.Helpers.log('Scene manager initialized', 'debug');
        }
    }

    async initTextureLoader() {
        if (window.TextureLoader) {
            // Preload essential textures
            try {
                await window.TextureLoader.preload();
                if (window.Helpers) {
                    window.Helpers.log('Essential textures preloaded', 'debug');
                }
            } catch (error) {
                if (window.Helpers) {
                    window.Helpers.log('Texture preloading failed, will use fallbacks', 'warn');
                }
            }
        }
    }

    async initParticleSystems() {
        // Initialize particle systems with performance settings
        const performanceMode = this.detectPerformanceMode();

        this.particleManager = window.ParticleSystems.create({
            enableStarfield: true,
            enableNebula: true,
            enableAsteroidBelt: true,
            performanceMode: performanceMode
        });

        await this.particleManager.init(this.sceneManager.Scene);

        if (window.Helpers) {
            window.Helpers.log('Particle systems initialized', 'debug');
        }
    }

    async loadData() {
        try {
            // Load planet data
            this.planets = await window.ApiClient.getPlanets();

            // Load system information
            this.systemInfo = await window.ApiClient.getSystemInfo();

            if (window.Helpers) {
                window.Helpers.log(`Loaded ${this.planets.length} planets and system info`, 'debug');
            }

        } catch (error) {
            if (window.Helpers) {
                window.Helpers.log('Failed to load data from API, using fallback', 'warn');
            }

            // Fallback data if API fails
            this.planets = this.getFallbackPlanetData();
            this.systemInfo = this.getFallbackSystemInfo();
        }
    }

    setupEventListeners() {
        // Animation control events
        this.addEventListener('toggleAnimation', (e) => {
            this.isAnimating = e.detail.playing;
            if (window.Helpers) {
                window.Helpers.log(`Animation ${this.isAnimating ? 'started' : 'paused'}`, 'debug');
            }
        });

        this.addEventListener('speedChanged', (e) => {
            this.animationSpeed = e.detail.speed;
            if (window.Helpers) {
                window.Helpers.log(`Animation speed set to ${this.animationSpeed}x`, 'debug');
            }
        });

        // Feature toggle events
        this.addEventListener('toggleFeature', (e) => {
            const { feature, enabled } = e.detail;
            this.toggleFeature(feature, enabled);
        });

        // View control events
        this.addEventListener('resetView', () => {
            this.resetCameraView();
        });

        this.addEventListener('focusPlanet', (e) => {
            this.focusOnPlanet(e.detail.planet);
        });

        // Panel control events
        this.addEventListener('closeAllPanels', () => {
            this.closeAllPanels();
        });

        this.addEventListener('toggleHelp', () => {
            this.toggleHelpModal();
        });
    }

    addEventListener(type, handler) {
        document.addEventListener(type, handler);
        this.eventListeners.push({ type, handler });
    }

    startRenderLoop() {
        let lastTime = 0;
        let frameCount = 0;

        const animate = (currentTime) => {
            requestAnimationFrame(animate);

            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            frameCount++;

            if (this.sceneManager && this.sceneManager.IsAnimating && this.isAnimating) {
                // Update particle systems with animation speed
                if (this.particleManager) {
                    this.particleManager.update(deltaTime * this.animationSpeed);
                }

                // Update simulation time display every 60 frames
                if (frameCount % 60 === 0) {
                    this.updateSimulationTime(currentTime);
                }

                // Render scene
                this.sceneManager.render();
            }
        };

        animate(0);

        if (window.Helpers) {
            window.Helpers.log('Render loop started', 'debug');
        }
    }

    updateSimulationTime(currentTime) {
        if (window.ControlPanel) {
            const simulatedDays = Math.floor(currentTime * this.animationSpeed / 1000);
            const timeString = `${simulatedDays} days`;
            window.ControlPanel.updateSimulationTime(timeString);
        }
    }

    toggleFeature(feature, enabled) {
        if (!this.particleManager) return;

        switch (feature) {
            case 'stars':
                this.particleManager.setSystemVisible('starfield', enabled);
                break;
            case 'asteroids':
                this.particleManager.setSystemVisible('asteroidBelt', enabled);
                break;
            case 'orbits':
                // Will be implemented in Stage 3
                if (window.Helpers) {
                    window.Helpers.log('Orbit paths toggle - Stage 3 feature', 'debug');
                }
                break;
            case 'labels':
                // Will be implemented in Stage 3
                if (window.Helpers) {
                    window.Helpers.log('Planet labels toggle - Stage 3 feature', 'debug');
                }
                break;
        }

        // Special handling for nebula (reduce opacity instead of hiding)
        if (feature === 'stars') {
            this.particleManager.setSystemVisible('nebula', enabled);
            if (enabled) {
                this.particleManager.setSystemOpacity('nebula', 0.15);
            } else {
                this.particleManager.setSystemOpacity('nebula', 0.05);
            }
        }
    }

    resetCameraView() {
        if (this.sceneManager && this.sceneManager.Camera) {
            // Reset to default position
            this.sceneManager.Camera.position.set(0, 50, 100);
            this.sceneManager.Camera.lookAt(0, 0, 0);

            if (window.ControlPanel) {
                window.ControlPanel.updateCameraDistance(85.4); // Approximate distance in AU
                window.ControlPanel.updateSelectedPlanet('None');
            }
        }
    }

    focusOnPlanet(planetName) {
        // This will be implemented in Stage 3 with actual planets
        if (window.Helpers) {
            window.Helpers.log(`Focus on ${planetName} - Stage 3 feature`, 'debug');
        }

        if (window.ControlPanel) {
            window.ControlPanel.updateSelectedPlanet(planetName);
        }
    }

    closeAllPanels() {
        // Close info panel
        const infoPanel = document.getElementById('info-panel');
        if (infoPanel) {
            infoPanel.classList.add('hidden');
        }

        // Close help modal
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
            helpModal.classList.add('hidden');
        }
    }

    toggleHelpModal() {
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
            helpModal.classList.toggle('hidden');
        }
    }

    detectPerformanceMode() {
        // Simple performance detection
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

        if (!gl) return true; // Enable performance mode if no WebGL

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            // Enable performance mode for integrated graphics
            const isIntegratedGPU = renderer.toLowerCase().includes('intel') &&
                                   !renderer.toLowerCase().includes('iris pro');
            return isIntegratedGPU;
        }

        return false;
    }

    getFallbackPlanetData() {
        // Fallback planet data if API fails
        return [
            { name: 'Mercury', color_hex: '#8C7853', distance_from_sun: 0.39 },
            { name: 'Venus', color_hex: '#FC649F', distance_from_sun: 0.72 },
            { name: 'Earth', color_hex: '#4F94CD', distance_from_sun: 1.0 },
            { name: 'Mars', color_hex: '#CD5C5C', distance_from_sun: 1.52 },
            { name: 'Jupiter', color_hex: '#D2691E', distance_from_sun: 5.20 },
            { name: 'Saturn', color_hex: '#FAD5A5', distance_from_sun: 9.54 },
            { name: 'Uranus', color_hex: '#4FD0FF', distance_from_sun: 19.19 },
            { name: 'Neptune', color_hex: '#4169E1', distance_from_sun: 30.07 },
            { name: 'Pluto', color_hex: '#EEE8AA', distance_from_sun: 39.48 }
        ];
    }

    getFallbackSystemInfo() {
        return {
            total_planets: 9,
            total_moons: 200,
            system_age: '4.6 billion years'
        };
    }

    // Event handlers for external calls
    handleResize() {
        if (this.sceneManager) {
            this.sceneManager.needsResize = true;
        }
    }

    handleVisibilityChange(hidden) {
        if (this.sceneManager) {
            this.sceneManager.isAnimating = !hidden;
        }
    }

    handleKeyPress(event) {
        // Pass keyboard events to control panel
        if (window.ControlPanel && window.ControlPanel.handleKeyPress) {
            window.ControlPanel.handleKeyPress(event);
        }
    }

    // Performance and stats
    getPerformanceStats() {
        const stats = {
            isInitialized: this.isInitialized,
            isAnimating: this.isAnimating,
            animationSpeed: this.animationSpeed,
            planetCount: this.planets.length
        };

        if (this.sceneManager) {
            Object.assign(stats, this.sceneManager.getStats());
        }

        if (this.particleManager) {
            stats.particleSystems = this.particleManager.getStats();
        }

        return stats;
    }

    // Cleanup
    dispose() {
        // Remove event listeners
        this.eventListeners.forEach(({ type, handler }) => {
            document.removeEventListener(type, handler);
        });
        this.eventListeners = [];

        // Dispose of particle systems
        if (this.particleManager) {
            this.particleManager.dispose();
        }

        // Dispose of scene manager
        if (this.sceneManager) {
            this.sceneManager.dispose();
        }

        // Clear texture cache
        if (window.TextureLoader) {
            window.TextureLoader.clear();
        }

        this.isInitialized = false;

        if (window.Helpers) {
            window.Helpers.log('Solar System App disposed', 'debug');
        }
    }

    // Public getters
    get Scene() { return this.sceneManager?.Scene; }
    get Camera() { return this.sceneManager?.Camera; }
    get Renderer() { return this.sceneManager?.Renderer; }
    get Planets() { return this.planets; }
    get SystemInfo() { return this.systemInfo; }
    get IsInitialized() { return this.isInitialized; }
    get AnimationSpeed() { return this.animationSpeed; }
    get IsAnimating() { return this.isAnimating; }
};

console.log('Enhanced SolarSystemApp module loaded successfully');