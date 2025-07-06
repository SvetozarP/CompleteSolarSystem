// static/js/solar-system/solar-system-app.js
// Solar System Application with speed-based animation control (no pause state)

window.SolarSystemApp = class {
    constructor(options = {}) {
        this.options = {
            containerId: 'canvas-container',
            canvasId: 'solar-system-canvas',
            enableBloom: true,
            enableAdvancedLighting: true,
            enableRealisticTextures: true,
            enableAtmospheres: true,
            enableRings: true,
            enableEnhancedParticles: true,
            qualityLevel: 'high',
            performanceMode: false,
            ...options
        };

        // Core components
        this.sceneManager = null;
        this.lightingSystem = null;
        this.planetFactory = null;
        this.particleManager = null;
        this.cameraControls = null;
        this.orbitalMechanics = null;
        this.interactionManager = null;

        // Visual effects
        this.postProcessing = null;
        this.atmosphereEffects = null;

        // Data and state
        this.planets = [];
        this.planetInstances = new Map();
        this.systemInfo = null;
        this.isInitialized = false;

        // MODIFIED: Remove isAnimating, use speed-based approach
        this.animationSpeed = 1.0; // Animation continues, but speed can be 0

        // Performance monitoring
        this.performanceStats = {
            fps: 60,
            frameTime: 0,
            triangles: 0,
            drawCalls: 0
        };

        // Event listeners for cleanup
        this.eventListeners = [];

        // Animation loop ID
        this.animationId = null;
        this.planetLabels = null;
    }


    /**
     * SIMPLIFIED: Focus on planet (always follows) - delegates to interaction manager
     */
    focusOnPlanet(planetName) {
        console.log('SolarSystemApp.focusOnPlanet - DELEGATING to interaction manager:', planetName);

        // SIMPLIFIED: Just delegate to interaction manager
        if (this.interactionManager) {
            const planetData = this.planets.find(p => p.name === planetName);
            if (planetData) {
                // SINGLE call - no cascading
                this.interactionManager.focusAndFollowPlanet(planetData);
            }
        }
    }

    /**
     * SIMPLIFIED: Stop following planet - delegate to camera controls
     */
    stopFollowingPlanet() {
        if (this.cameraControls && this.cameraControls.IsFollowing) {
            this.cameraControls.stopFollowing();

            if (window.NotificationSystem) {
                window.NotificationSystem.showInfo('📹 Stopped following planet');
            }

            if (window.ControlPanel) {
                window.ControlPanel.updateSelectedPlanet('None');
            }
        }
    }

    /**
     * SIMPLIFIED: Reset camera view - delegate to camera controls
     */
    resetCameraView() {
        if (this.cameraControls) {
            this.cameraControls.stopFollowing();
            this.cameraControls.setPosition(0, 30, 80);
            this.cameraControls.lookAt(0, 0, 0);
        }

        if (window.ControlPanel) {
            window.ControlPanel.updateCameraDistance(85.4);
            window.ControlPanel.updateSelectedPlanet('None');
        }

        if (window.NotificationSystem) {
            window.NotificationSystem.showInfo('📷 Camera reset to overview');
        }
    }

    /**
     * SIMPLIFIED: Toggle planet following - delegate to interaction manager
     */
    togglePlanetFollowing() {
        if (!this.cameraControls) return;

        if (this.cameraControls.IsFollowing) {
            this.stopFollowingPlanet();
        } else {
            if (this.interactionManager && this.interactionManager.SelectedPlanet) {
                this.focusOnPlanet(this.interactionManager.SelectedPlanet.name);
            } else {
                if (window.NotificationSystem) {
                    window.NotificationSystem.showWarning('No planet selected to follow');
                }
            }
        }
    }

    /**
     * Get current camera/following status
     */
    getCameraStatus() {
        if (!this.cameraControls) {
            return { isFollowing: false, followedPlanet: null };
        }

        return {
            isFollowing: this.cameraControls.IsFollowing,
            followedPlanet: this.cameraControls.FollowedPlanet?.userData?.planetData?.name || null,
            followDistance: this.cameraControls.followDistance || null
        };
    }

    /**
     * Initialize planet labels system
     */
    async initPlanetLabels() {
        if (!window.PlanetLabels) {
            if (window.Helpers) {
                window.Helpers.log('PlanetLabels not available', 'warn');
            }
            return;
        }

        this.planetLabels = window.PlanetLabels.create({
            enabled: true,
            fontSize: '13px',
            fontFamily: 'Orbitron, monospace',
            backgroundColor: 'rgba(16, 22, 58, 0.9)',
            borderColor: 'rgba(74, 158, 255, 0.7)',
            textColor: '#ffffff',
            fadeDistance: 180,
            minDistance: 8,
            maxDistance: 400
        });

        const success = this.planetLabels.init(
            this.sceneManager.Camera,
            this.planetInstances
        );

        if (success) {
            if (window.Helpers) {
                window.Helpers.log('Planet labels system initialized', 'debug');
            }
        }
    }

    /**
     * Initialize the complete solar system application
     */
    async init() {
        try {
            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Initializing enhanced 3D environment...', 5);
            }

            await this.initSceneManager();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Setting up advanced lighting system...', 15);
            }

            await this.initLightingSystem();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Loading high-quality textures...', 25);
            }

            await this.initPlanetFactory();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Creating realistic particle systems...', 40);
            }

            await this.initEnhancedParticleSystems();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Loading astronomical data...', 55);
            }

            await this.loadPlanetData();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Creating 3D planets with textures...', 70);
            }

            await this.createAllPlanets();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Setting up orbital mechanics...', 80);
            }

            await this.initOrbitalMechanics();
            await this.initCameraControls();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Initializing interaction system...', 90);
            }

            await this.initInteractionManager();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Setting up planet labels...', 92);
            }

            await this.initPlanetLabels();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Starting simulation...', 95);
            }

            this.setupEventListeners();
            this.startRenderLoop();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Complete!', 100);
            }

            this.isInitialized = true;

            if (window.Helpers) {
                window.Helpers.log('Enhanced Solar System App initialized successfully', 'debug');
            }

            if (window.NotificationSystem) {
                window.NotificationSystem.showSuccess('Solar System loaded with enhanced visual effects!');
            }

            if (window.NotificationSystem) {
                window.NotificationSystem.showInfo(`Quality Level: ${this.options.qualityLevel.toUpperCase()}`);
            }

            return true;

        } catch (error) {
            if (window.Helpers) {
                window.Helpers.handleError(error, 'SolarSystemApp.init');
            }

            if (window.NotificationSystem) {
                window.NotificationSystem.showError('Failed to initialize enhanced solar system: ' + error.message);
            }

            throw error;
        }
    }

    /**
     * Initialize scene manager with advanced settings
     */
    async initSceneManager() {
        this.sceneManager = window.SceneManager.create({
            ...this.options,
            antialias: true,
            enableShadows: this.options.qualityLevel !== 'low',
            shadowMapSize: this.options.qualityLevel === 'high' ? 2048 : 1024,
            logarithmicDepthBuffer: true
        });

        const success = await this.sceneManager.init();
        if (!success) {
            throw new Error('Failed to initialize enhanced scene manager');
        }

        this.sceneManager.setQuality(this.getQualityMultiplier());

        if (window.Helpers) {
            window.Helpers.log('Enhanced scene manager initialized', 'debug');
        }
    }

    /**
     * Initialize advanced lighting system
     */
    async initLightingSystem() {
        if (!window.LightingSystem) {
            if (window.Helpers) {
                window.Helpers.log('LightingSystem not available, using basic lighting', 'warn');
            }
            return;
        }

        this.lightingSystem = window.LightingSystem.create({
            enableSunLight: true,
            enableAmbientLight: true,
            enableBloom: this.options.enableBloom && this.options.qualityLevel !== 'low',
            enableAtmosphere: this.options.enableAtmospheres,
            sunIntensity: 1.8,
            ambientIntensity: 0.2,
            bloomStrength: 0.9,
            bloomRadius: 0.5,
            bloomThreshold: 0.8
        });

        await this.lightingSystem.init(
            this.sceneManager.Scene,
            this.sceneManager.Camera,
            this.sceneManager.Renderer
        );

        this.lightingSystem.setQuality(this.options.qualityLevel);

        if (window.Helpers) {
            window.Helpers.log('Advanced lighting system initialized', 'debug');
        }
    }

    /**
     * Initialize planet factory with advanced materials
     */
    async initPlanetFactory() {
        if (!window.PlanetFactory) {
            throw new Error('PlanetFactory not available');
        }

        this.planetFactory = window.PlanetFactory.create({
            enableTextures: this.options.enableRealisticTextures,
            enableNormalMaps: this.options.qualityLevel === 'high',
            enableSpecularMaps: this.options.qualityLevel === 'high',
            enableAtmosphere: this.options.enableAtmospheres,
            enableRings: this.options.enableRings,
            quality: this.options.qualityLevel
        });

        await this.planetFactory.init();

        if (window.Helpers) {
            window.Helpers.log('Enhanced planet factory initialized', 'debug');
        }
    }

    /**
     * Initialize enhanced particle systems
     */
    async initEnhancedParticleSystems() {
        if (window.EnhancedParticleSystems) {
            this.particleManager = window.EnhancedParticleSystems.create({
                enableRealisticStarfield: true,
                enableProceduralNebulae: this.options.qualityLevel !== 'low',
                enableRealisticAsteroids: true,
                qualityLevel: this.options.qualityLevel,
                performanceMode: this.options.performanceMode
            });
        } else if (window.ParticleSystems) {
            this.particleManager = window.ParticleSystems.create({
                enableStarfield: true,
                enableNebula: this.options.qualityLevel !== 'low',
                enableAsteroidBelt: true,
                performanceMode: this.options.performanceMode
            });
        } else {
            if (window.Helpers) {
                window.Helpers.log('No particle systems available', 'warn');
            }
            return;
        }

        await this.particleManager.init(this.sceneManager.Scene);

        if (window.Helpers) {
            window.Helpers.log('Enhanced particle systems initialized', 'debug');
        }
    }

    /**
     * Load planet data from Django API
     */
    async loadPlanetData() {
        try {
            this.planets = await window.ApiClient.getPlanets();
            this.systemInfo = await window.ApiClient.getSystemInfo();
            this.planets.sort((a, b) => a.display_order - b.display_order);

            if (window.Helpers) {
                window.Helpers.log(`Loaded ${this.planets.length} planets with enhanced data`, 'debug');
            }

        } catch (error) {
            if (window.Helpers) {
                window.Helpers.log('Failed to load data from API, using enhanced fallback', 'warn');
            }

            this.planets = this.getEnhancedFallbackPlanetData();
            this.systemInfo = this.getFallbackSystemInfo();
        }
    }

    /**
     * Create all planets with advanced materials and effects
     */
    async createAllPlanets() {
        for (const planetData of this.planets) {
            try {
                const planetGroup = await this.planetFactory.createPlanet(planetData, {
                    quality: this.options.qualityLevel,
                    enableAtmosphere: this.options.enableAtmospheres,
                    enableRings: this.options.enableRings && planetData.has_rings,
                    enableGlow: planetData.name === 'Sun'
                });

                if (planetGroup) {
                    const distance = this.calculateScaledDistance(planetData);
                    planetGroup.position.set(distance, 0, 0);

                    this.sceneManager.addObject(planetGroup, `${planetData.name}_group`);
                    this.planetInstances.set(planetData.name, planetGroup);

                    if (planetData.name === 'Sun' && this.lightingSystem) {
                        this.lightingSystem.setSunReference(planetGroup);
                    }

                    if (this.lightingSystem && planetData.name !== 'Sun') {
                        const planetMesh = planetGroup.getObjectByName(planetData.name);
                        if (planetMesh) {
                            this.lightingSystem.addPlanet(planetMesh, planetData);
                        }
                    }

                    if (window.Helpers) {
                        window.Helpers.log(`Created enhanced planet: ${planetData.name}`, 'debug');
                    }
                }

            } catch (error) {
                if (window.Helpers) {
                    window.Helpers.handleError(error, `Creating planet ${planetData.name}`);
                }
            }
        }
    }

    /**
     * Initialize orbital mechanics system
     */
    async initOrbitalMechanics() {
        if (!window.OrbitalMechanics) {
            if (window.Helpers) {
                window.Helpers.log('OrbitalMechanics not available', 'warn');
            }
            return;
        }

        this.orbitalMechanics = window.OrbitalMechanics.create({
            timeScale: 20,
            enableEllipticalOrbits: this.options.qualityLevel === 'high',
            enableAxialTilt: true,
            enablePrecession: this.options.qualityLevel === 'high'
        });

        this.orbitalMechanics.init(this.sceneManager.Scene);

        this.planets.forEach(planetData => {
            const planetGroup = this.planetInstances.get(planetData.name);
            if (planetGroup && planetData.name !== 'Sun') {
                this.orbitalMechanics.addOrbitingBody(planetGroup, planetData);
            }
        });

        if (window.Helpers) {
            window.Helpers.log('Orbital mechanics system initialized', 'debug');
        }
    }

    /**
     * Initialize camera controls
     */
    async initCameraControls() {
        if (!window.CameraControls) {
            if (window.Helpers) {
                window.Helpers.log('CameraControls not available', 'warn');
            }
            return;
        }

        this.cameraControls = window.CameraControls.create({
            camera: this.sceneManager.Camera,
            domElement: this.sceneManager.Renderer.domElement,
            enableDamping: true,
            dampingFactor: 0.05,
            enableZoom: true,
            enableRotate: true,
            enablePan: true,
            maxDistance: 500,
            minDistance: 5
        });

        await this.cameraControls.init();
        this.cameraControls.setPosition(0, 30, 80);
        this.cameraControls.lookAt(0, 0, 0);

        if (window.Helpers) {
            window.Helpers.log('Camera controls initialized', 'debug');
        }
    }

    /**
     * Initialize interaction manager
     */
    async initInteractionManager() {
        if (!window.InteractionManager) {
            if (window.Helpers) {
                window.Helpers.log('InteractionManager not available', 'warn');
            }
            return;
        }

        this.interactionManager = window.InteractionManager.create({
            scene: this.sceneManager.Scene,
            camera: this.sceneManager.Camera,
            domElement: this.sceneManager.Renderer.domElement,
            planets: this.planetInstances
        });

        await this.interactionManager.init();

        if (window.Helpers) {
            window.Helpers.log('Interaction manager initialized', 'debug');
        }
    }

    /**
     * Setup event listeners - MODIFIED for speed-based animation
     */
    setupEventListeners() {
        // MODIFIED: Speed change events instead of play/pause
        this.addEventListener('speedChanged', (e) => {
            console.log('Speed changed event received:', e.detail.speed); // Debug log
            this.animationSpeed = e.detail.speed;
            // Update orbital mechanics with new speed
            if (this.orbitalMechanics) {
                this.orbitalMechanics.setSpeed(this.animationSpeed);
            }

            if (window.Helpers) {
                window.Helpers.log(`Animation speed updated to: ${this.animationSpeed}`, 'debug');
            }
        });

        // DEPRECATED: Keep for backward compatibility but map to speed control
        this.addEventListener('toggleAnimation', (e) => {
            console.log('Legacy toggleAnimation event received:', e.detail); // Debug log
            // Map old play/pause to speed 0/1
            const newSpeed = e.detail.playing ? (this.animationSpeed > 0 ? this.animationSpeed : 1.0) : 0;
            this.animationSpeed = newSpeed;

            if (this.orbitalMechanics) {
                this.orbitalMechanics.setSpeed(this.animationSpeed);
            }

            if (window.Helpers) {
                window.Helpers.log(`Legacy animation toggle: ${e.detail.playing ? 'play' : 'pause'} → speed: ${newSpeed}`, 'debug');
            }
        });

        // Feature toggle events
        this.addEventListener('toggleFeature', (e) => {
            this.toggleFeature(e.detail.feature, e.detail.enabled);
        });

        // View control events
        this.addEventListener('resetView', () => {
            this.resetCameraView();
        });

        this.addEventListener('focusPlanet', (e) => {
            this.focusOnPlanet(e.detail.planet);
        });

        // Quality control events
        this.addEventListener('qualityChanged', (e) => {
            this.setQualityLevel(e.detail.quality);
        });

        // Screenshot event
        this.addEventListener('takeScreenshot', () => {
            this.takeScreenshot();
        });

        // Performance events
        this.addEventListener('togglePerformanceMode', (e) => {
            this.setPerformanceMode(e.detail.enabled);
        });
    }

    /**
     * Start the enhanced render loop - MODIFIED for continuous animation
     */
    startRenderLoop() {
        let lastTime = 0;
        let frameCount = 0;

        const animate = (currentTime) => {
            this.animationId = requestAnimationFrame(animate);

            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            frameCount++;

            // MODIFIED: Always render, but use speed for system updates
            if (this.sceneManager) {
                this.updateSystems(deltaTime);

                if (frameCount % 60 === 0) {
                    this.updatePerformanceStats(currentTime);
                }

                this.render();
            }
        };

        animate(0);

        if (window.Helpers) {
            window.Helpers.log('Enhanced render loop started with speed-based animation', 'debug');
        }
    }

    /**
     * Update all systems - MODIFIED to use speed multiplier
     */
    updateSystems(deltaTime) {
        // Debug log occasionally
        if (Math.random() < 0.005) { // 0.5% chance each frame
            //console.log('SolarSystemApp.updateSystems - animationSpeed:', this.animationSpeed, 'deltaTime:', deltaTime);
        }

        // MODIFIED: Apply speed multiplier to all time-based updates
        const effectiveDeltaTime = deltaTime * this.animationSpeed;

        // Update particle systems (always animate regardless of speed)
        if (this.particleManager) {
            this.particleManager.update(deltaTime); // Particles always animate
        }

        // Update orbital mechanics with speed-adjusted time
        if (this.orbitalMechanics) {
            // Pass the speed to orbital mechanics via the update method
            this.orbitalMechanics.update(deltaTime, this.animationSpeed);
        }

        // Update planet factory with speed-adjusted time
        if (this.planetFactory) {
            this.planetFactory.update(effectiveDeltaTime);
        }

        // Update lighting system (always animate)
        if (this.lightingSystem) {
            this.lightingSystem.update(deltaTime);
        }

        // Update camera controls (always responsive)
        if (this.cameraControls) {
            this.cameraControls.update();
        }

        // Update interaction manager (always responsive)
        if (this.interactionManager) {
            this.interactionManager.update(deltaTime);
        }

        // Update scene manager (always render)
        if (this.sceneManager) {
            this.sceneManager.render();
        }
    }

    /**
     * Render with advanced effects
     */
    render() {
        if (this.lightingSystem && this.lightingSystem.BloomEnabled) {
            this.lightingSystem.render();
        } else {
            this.sceneManager.render();
        }
    }

    /**
     * Update performance statistics
     */
    updatePerformanceStats(currentTime) {
        if (this.sceneManager) {
            const stats = this.sceneManager.getStats();
            this.performanceStats = {
                ...this.performanceStats,
                ...stats
            };
        }

        this.updateSimulationTime(currentTime);
        this.updatePerformanceDisplay();
    }

    /**
     * Update simulation time display
     */
    updateSimulationTime(currentTime) {
        if (window.ControlPanel && this.orbitalMechanics) {
            const timeString = this.orbitalMechanics.getFormattedTime();
            window.ControlPanel.updateSimulationTime(timeString);
        }
    }

    /**
     * Update performance display
     */
    updatePerformanceDisplay() {
        if (window.SolarSystemConfig?.debug) {
            const fpsElement = document.getElementById('fps-counter');
            if (fpsElement) {
                fpsElement.textContent = Math.round(this.performanceStats.fps);
            }

            const triangleElement = document.getElementById('triangle-counter');
            if (triangleElement) {
                triangleElement.textContent = this.performanceStats.triangles || 0;
            }
        }
    }

    /**
     * Toggle feature visibility
     */
    toggleFeature(feature, enabled) {
        switch (feature) {
            case 'stars':
                if (this.particleManager) {
                    this.particleManager.setSystemVisible('starfield', enabled);
                }
                break;

            case 'asteroids':
                if (this.particleManager) {
                    this.particleManager.setSystemVisible('asteroidBelt', enabled);
                }
                break;

            case 'nebulae':
                if (this.particleManager) {
                    this.particleManager.setSystemVisible('nebula', enabled);
                }
                break;

            case 'atmospheres':
                this.planetInstances.forEach((planetGroup, planetName) => {
                    const atmosphere = planetGroup.getObjectByName(`${planetName}_atmosphere`);
                    if (atmosphere) {
                        atmosphere.visible = enabled;
                    }
                });
                break;

            case 'rings':
                this.planetInstances.forEach((planetGroup, planetName) => {
                    const rings = planetGroup.getObjectByName(`${planetName}_rings`);
                    if (rings) {
                        rings.visible = enabled;
                    }
                });
                break;

            case 'bloom':
                if (this.lightingSystem) {
                    this.lightingSystem.setBloomEnabled(enabled);
                }
                break;

            case 'orbits':
                if (this.orbitalMechanics) {
                    this.orbitalMechanics.setOrbitalPathsVisible(enabled);
                }
                break;

            case 'labels':
                if (this.planetLabels) {
                    this.planetLabels.setVisible(enabled);
                }
                break;
        }
    }

    /**
     * Set quality level
     */
    setQualityLevel(quality) {
        this.options.qualityLevel = quality;

        if (this.sceneManager) {
            this.sceneManager.setQuality(this.getQualityMultiplier());
        }

        if (this.lightingSystem) {
            this.lightingSystem.setQuality(quality);
        }

        if (this.planetFactory) {
            this.planetFactory.setQuality(quality);
        }

        if (this.particleManager && this.particleManager.setQuality) {
            this.particleManager.setQuality(quality);
        }

        if (window.NotificationSystem) {
            window.NotificationSystem.showInfo(`Quality set to ${quality.toUpperCase()}`);
        }
    }

    /**
     * Set performance mode
     */
    setPerformanceMode(enabled) {
        this.options.performanceMode = enabled;

        if (enabled) {
            this.setQualityLevel('low');
            if (this.lightingSystem) {
                this.lightingSystem.setBloomEnabled(false);
            }
        } else {
            this.setQualityLevel('medium');
        }

        if (window.NotificationSystem) {
            window.NotificationSystem.showInfo(`Performance mode ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    /**
     * Take screenshot of current view
     */
    takeScreenshot() {
        if (this.sceneManager) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `solar-system-${timestamp}.png`;
            this.sceneManager.takeScreenshot(filename);

            if (window.NotificationSystem) {
                window.NotificationSystem.showSuccess('Screenshot saved!');
            }
        }
    }

    /**
     * Get quality multiplier for rendering
     */
    getQualityMultiplier() {
        const qualityMap = {
            'low': 0.7,
            'medium': 1.0,
            'high': 1.3
        };
        return qualityMap[this.options.qualityLevel] || 1.0;
    }

    /**
     * Calculate scaled distance for planet positioning
     */
    calculateScaledDistance(planetData) {
        const DISTANCE_SCALE_FACTOR = 25;
        const DISTANCE_MULTIPLIERS = {
            'mercury': 2.0,
            'venus': 2.5,
            'earth': 3.0,
            'mars': 4.5,
            'jupiter': 2.5,
            'saturn': 2.2,
            'uranus': 1.8,
            'neptune': 1.5,
            'pluto': 1.2,
            'sun': 0.0
        };

        const planetName = planetData.name.toLowerCase();

        if (planetName === 'sun') {
            return 0;
        }

        const multiplier = DISTANCE_MULTIPLIERS[planetName] || 1.0;

        return Math.max(
            planetData.distance_from_sun * DISTANCE_SCALE_FACTOR * multiplier,
            20
        );
    }

    /**
     * Enhanced fallback planet data with better scaling
     */
    getEnhancedFallbackPlanetData() {
        return [
            {
                name: 'Sun', display_order: 0, color_hex: '#FDB813',
                distance_from_sun: 0.0, diameter: 1392700,
                planet_type: 'star', has_rings: false, has_moons: false,
                orbital_period: 0, rotation_period: 609.12
            },
            {
                name: 'Mercury', display_order: 1, color_hex: '#8C7853',
                distance_from_sun: 0.39, diameter: 4879,
                planet_type: 'terrestrial', has_rings: false, has_moons: false,
                orbital_period: 87.97, rotation_period: 1407.6
            },
            {
                name: 'Venus', display_order: 2, color_hex: '#FC649F',
                distance_from_sun: 0.72, diameter: 12104,
                planet_type: 'terrestrial', has_rings: false, has_moons: false,
                orbital_period: 224.7, rotation_period: -5832.5
            },
            {
                name: 'Earth', display_order: 3, color_hex: '#4F94CD',
                distance_from_sun: 1.0, diameter: 12756,
                planet_type: 'terrestrial', has_rings: false, has_moons: true,
                orbital_period: 365.25, rotation_period: 23.93, moon_count: 1
            },
            {
                name: 'Mars', display_order: 4, color_hex: '#CD5C5C',
                distance_from_sun: 1.52, diameter: 6792,
                planet_type: 'terrestrial', has_rings: false, has_moons: true,
                orbital_period: 686.98, rotation_period: 24.62, moon_count: 2
            },
            {
                name: 'Jupiter', display_order: 5, color_hex: '#D2691E',
                distance_from_sun: 5.20, diameter: 142984,
                planet_type: 'gas_giant', has_rings: true, has_moons: true,
                orbital_period: 4332.59, rotation_period: 9.93, moon_count: 95
            },
            {
                name: 'Saturn', display_order: 6, color_hex: '#FAD5A5',
                distance_from_sun: 9.54, diameter: 120536,
                planet_type: 'gas_giant', has_rings: true, has_moons: true,
                orbital_period: 10759.22, rotation_period: 10.66, moon_count: 146
            },
            {
                name: 'Uranus', display_order: 7, color_hex: '#4FD0FF',
                distance_from_sun: 19.19, diameter: 51118,
                planet_type: 'ice_giant', has_rings: true, has_moons: true,
                orbital_period: 30688.5, rotation_period: -17.24, moon_count: 28
            },
            {
                name: 'Neptune', display_order: 8, color_hex: '#4169E1',
                distance_from_sun: 30.07, diameter: 49528,
                planet_type: 'ice_giant', has_rings: true, has_moons: true,
                orbital_period: 60182, rotation_period: 16.11, moon_count: 16
            },
            {
                name: 'Pluto', display_order: 9, color_hex: '#EEE8AA',
                distance_from_sun: 39.48, diameter: 2376,
                planet_type: 'dwarf_planet', has_rings: false, has_moons: true,
                orbital_period: 90560, rotation_period: -153.3, moon_count: 5,
                is_dwarf_planet: true
            }
        ];
    }

    getFallbackSystemInfo() {
        return {
            total_planets: 10,
            total_moons: 200,
            system_age: '4.6 billion years'
        };
    }

    // Utility methods
    addEventListener(type, handler) {
        document.addEventListener(type, handler);
        this.eventListeners.push({ type, handler });
    }

    handleResize() {
        try {
            if (this.sceneManager) {
                this.sceneManager.updateSize();
            }

            if (this.lightingSystem && this.sceneManager?.Container) {
                const container = this.sceneManager.Container;
                if (container) {
                    this.lightingSystem.handleResize(container.clientWidth, container.clientHeight);
                }
            }
        } catch (error) {
            console.warn('Resize error (non-critical):', error.message);
        }
    }

    handleVisibilityChange(hidden) {
        // MODIFIED: Don't change animation state based on visibility
        // Animation always continues, just potentially at speed 0
        if (window.Helpers) {
            window.Helpers.log(`Page visibility changed: ${hidden ? 'hidden' : 'visible'}`, 'debug');
        }
    }

    handleKeyPress(event) {
        if (window.ControlPanel && window.ControlPanel.handleKeyPress) {
            window.ControlPanel.handleKeyPress(event);
        }
    }

    /**
     * Get comprehensive performance stats - MODIFIED for speed-based state
     */
    getPerformanceStats() {
        const stats = {
            isInitialized: this.isInitialized,
            isAnimating: true, // MODIFIED: Always animating, but speed may be 0
            animationSpeed: this.animationSpeed, // Current speed (can be 0)
            isAtZeroSpeed: this.animationSpeed === 0, // NEW: Indicates if "paused"
            qualityLevel: this.options.qualityLevel,
            performanceMode: this.options.performanceMode,
            planetCount: this.planets.length,
            ...this.performanceStats
        };

        if (this.sceneManager) {
            Object.assign(stats, this.sceneManager.getStats());
        }

        if (this.particleManager && this.particleManager.getStats) {
            stats.particleSystems = this.particleManager.getStats();
        }

        if (this.lightingSystem) {
            stats.lighting = this.lightingSystem.getStats();
        }

        if (this.planetFactory) {
            stats.planets = this.planetFactory.getStats();
        }

        if (this.planetLabels) {
            stats.labels = this.planetLabels.getStats();
        }

        return stats;
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.eventListeners.forEach(({ type, handler }) => {
            document.removeEventListener(type, handler);
        });
        this.eventListeners = [];

        if (this.interactionManager) {
            this.interactionManager.dispose();
        }

        if (this.planetLabels) {
            this.planetLabels.dispose();
        }

        if (this.cameraControls) {
            this.cameraControls.dispose();
        }

        if (this.orbitalMechanics) {
            this.orbitalMechanics.dispose();
        }

        if (this.planetFactory) {
            this.planetFactory.dispose();
        }

        if (this.particleManager) {
            this.particleManager.dispose();
        }

        if (this.lightingSystem) {
            this.lightingSystem.dispose();
        }

        if (this.sceneManager) {
            this.sceneManager.dispose();
        }

        this.planetInstances.clear();
        this.isInitialized = false;

        if (window.Helpers) {
            window.Helpers.log('Enhanced Solar System App disposed', 'debug');
        }
    }

    // Public getters - MODIFIED for speed-based approach
    get Scene() { return this.sceneManager?.Scene; }
    get Camera() { return this.sceneManager?.Camera; }
    get Renderer() { return this.sceneManager?.Renderer; }
    get Planets() { return this.planets; }
    get PlanetInstances() { return this.planetInstances; }
    get SystemInfo() { return this.systemInfo; }
    get IsInitialized() { return this.isInitialized; }
    get AnimationSpeed() { return this.animationSpeed; }
    get IsAnimating() { return true; } // MODIFIED: Always true, check speed instead
    get IsAtZeroSpeed() { return this.animationSpeed === 0; } // NEW: Check if "paused"
    get QualityLevel() { return this.options.qualityLevel; }
    get PerformanceMode() { return this.options.performanceMode; }
};

console.log('Enhanced SolarSystemApp with speed-based animation control loaded successfully');