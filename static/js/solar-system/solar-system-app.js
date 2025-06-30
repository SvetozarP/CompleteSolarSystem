// static/js/solar-system/solar-system-app.js
// Main Solar System Application - Stage 4 with full interactivity

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
        this.planetFactory = null;
        this.lightingSystem = null;
        this.cameraControls = null;
        this.orbitalMechanics = null;
        this.interactionManager = null;
        this.infoPanelSystem = null;

        // Data
        this.planets = [];
        this.systemInfo = null;
        this.planetInstances = new Map();

        // State
        this.isInitialized = false;
        this.animationSpeed = 1.0;
        this.isAnimating = true;
        this.lastDebugTime = 0;

        // Event listeners for cleanup
        this.eventListeners = [];
    }

    async init() {
        try {
            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Initializing 3D environment...', 5);
            }

            // Initialize scene manager
            await this.initSceneManager();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Loading textures...', 15);
            }

            // Initialize texture loader
            await this.initTextureLoader();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Creating particle systems...', 25);
            }

            // Initialize particle systems
            await this.initParticleSystems();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Loading planetary data...', 35);
            }

            // Load data from Django API
            await this.loadData();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Creating planets...', 50);
            }

            // Initialize planet factory and create planets
            await this.initPlanetFactory();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Setting up lighting...', 65);
            }

            // Initialize lighting system
            await this.initLightingSystem();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Configuring camera controls...', 75);
            }

            // Initialize camera controls
            await this.initCameraControls();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Starting orbital mechanics...', 80);
            }

            // Initialize orbital mechanics
            await this.initOrbitalMechanics();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Setting up interactions...', 85);
            }

            // Initialize interaction system
            await this.initInteractionSystem();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Creating information panels...', 90);
            }

            // Initialize info panel system
            await this.initInfoPanelSystem();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Setting up controls...', 95);
            }

            // Setup UI and controls
            this.setupEventListeners();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Starting animation...', 98);
            }

            // Start render loop
            this.startRenderLoop();

            if (window.LoadingManager) {
                window.LoadingManager.updateProgress('Complete!', 100);
            }

            this.isInitialized = true;

            if (window.Helpers) {
                window.Helpers.log('Solar System App with full interactivity initialized successfully', 'debug');
            }

            if (window.NotificationSystem) {
                window.NotificationSystem.showSuccess('Interactive Solar System loaded! Click planets for information.');
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
            this.planets = await window.ApiClient.getPlanets();
            this.systemInfo = await window.ApiClient.getSystemInfo();

            if (window.Helpers) {
                window.Helpers.log(`Loaded ${this.planets.length} planets and system info`, 'debug');
            }

        } catch (error) {
            if (window.Helpers) {
                window.Helpers.log('Failed to load data from API, using fallback', 'warn');
            }

            this.planets = this.getFallbackPlanetData();
            this.systemInfo = this.getFallbackSystemInfo();
        }
    }

    async initPlanetFactory() {
        this.planetFactory = window.PlanetFactory.create(window.TextureLoader);

        // Create the Sun first
        const sunData = this.planets.find(p => p.name.toLowerCase() === 'sun') || this.getFallbackSunData();
        const sunGroup = await this.planetFactory.createSun(sunData, this.sceneManager.Scene);
        this.planetInstances.set('sun', sunGroup);

        // Create all planets
        for (const planetData of this.planets) {
            if (planetData.name.toLowerCase() !== 'sun') {
                try {
                    const planetGroup = await this.planetFactory.createPlanet(planetData, this.sceneManager.Scene);
                    this.planetInstances.set(planetData.name.toLowerCase(), planetGroup);
                } catch (error) {
                    if (window.Helpers) {
                        window.Helpers.log(`Failed to create planet ${planetData.name}: ${error.message}`, 'warn');
                    }
                }
            }
        }

        if (window.Helpers) {
            window.Helpers.log(`Created ${this.planetInstances.size} celestial bodies`, 'debug');
        }
    }

    async initLightingSystem() {
        this.lightingSystem = window.LightingSystem.create({
            enableShadows: false,
            sunLightIntensity: 2.0,
            ambientLightIntensity: 0.4,
            enableSunGlow: true
        });

        const sunGroup = this.planetInstances.get('sun');
        const sunMesh = sunGroup ? sunGroup.children[0] : null;

        this.lightingSystem.init(this.sceneManager.Scene, sunMesh);
        this.lightingSystem.setLightingPreset('space');

        if (window.Helpers) {
            window.Helpers.log('Lighting system initialized with space preset', 'debug');
        }
    }

    async initCameraControls() {
        const canvas = this.sceneManager?.Canvas || document.getElementById(this.options.canvasId);

        if (!canvas) {
            throw new Error(`Canvas element not found: ${this.options.canvasId}`);
        }

        this.cameraControls = window.CameraControls.create(
            this.sceneManager.Camera,
            canvas,
            {
                enableRotate: true,
                enableZoom: true,
                enablePan: true,
                minDistance: 15,
                maxDistance: 1500,
                autoRotate: false,
                dampingFactor: 0.05
            }
        );

        if (window.Helpers) {
            window.Helpers.log('Camera controls initialized', 'debug');
        }
    }

    async initOrbitalMechanics() {
        this.orbitalMechanics = window.OrbitalMechanics.create({
            timeScale: 20,
            showOrbitalPaths: true,
            pathOpacity: 0.3
        });

        this.orbitalMechanics.init(this.sceneManager.Scene);

        // Add all planets to orbital system
        this.planets.forEach(planetData => {
            if (planetData.name.toLowerCase() !== 'sun') {
                const planetGroup = this.planetInstances.get(planetData.name.toLowerCase());
                if (planetGroup && planetGroup.children[0]) {
                    this.orbitalMechanics.addOrbitingBody(planetGroup.children[0], planetData);
                }
            }
        });

        if (window.Helpers) {
            window.Helpers.log(`Orbital mechanics initialized with ${this.orbitalMechanics.OrbitingBodyCount} orbiting bodies`, 'debug');
        }
    }

    async initInteractionSystem() {
        const canvas = this.sceneManager?.Canvas || document.getElementById(this.options.canvasId);

        this.interactionManager = window.InteractionManager.create(
            this.sceneManager.Camera,
            this.sceneManager.Scene,
            canvas,
            {
                enableTooltips: true,
                enableSelection: true,
                enableHover: true,
                tooltipDelay: 800,
                selectionColor: 0x00ff88,
                hoverColor: 0xffff44
            }
        );

        // Register all planets as selectable
        this.planetInstances.forEach((planetGroup, planetName) => {
            const planetMesh = planetGroup.children[0];
            const planetData = this.planets.find(p => p.name.toLowerCase() === planetName);

            if (planetMesh && planetData) {
                this.interactionManager.addSelectableObject(planetMesh, planetData);
            }
        });

        if (window.Helpers) {
            window.Helpers.log(`Interaction system initialized with ${this.planetInstances.size} selectable objects`, 'debug');
        }
    }

    async initInfoPanelSystem() {
        this.infoPanelSystem = window.InfoPanelSystem.create();

        if (window.Helpers) {
            window.Helpers.log('Info panel system initialized', 'debug');
        }
    }

    setupEventListeners() {
        // Animation control events
        this.addEventListener('toggleAnimation', (e) => {
            this.isAnimating = e.detail.playing;
            if (this.orbitalMechanics) {
                this.orbitalMechanics.setPlaying(this.isAnimating);
            }
            if (window.Helpers) {
                window.Helpers.log(`Animation ${this.isAnimating ? 'started' : 'paused'}`, 'debug');
            }
        });

        this.addEventListener('speedChanged', (e) => {
            this.animationSpeed = e.detail.speed;
            if (this.orbitalMechanics) {
                this.orbitalMechanics.setSpeed(this.animationSpeed);
            }
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

        // Planet selection events
        this.addEventListener('planetSelected', (e) => {
            const planetData = e.detail.planet;
            if (window.Helpers) {
                window.Helpers.log(`Planet selected: ${planetData.name}`, 'debug');
            }
        });

        this.addEventListener('planetDeselected', () => {
            if (window.Helpers) {
                window.Helpers.log('Planet deselected', 'debug');
            }
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

            if (this.sceneManager && this.sceneManager.IsAnimating) {
                // Update camera controls
                if (this.cameraControls) {
                    this.cameraControls.update();
                }

                if (this.isAnimating) {
                    // Update particle systems
                    if (this.particleManager) {
                        this.particleManager.update(deltaTime * this.animationSpeed);
                    }

                    // Update orbital mechanics
                    if (this.orbitalMechanics) {
                        this.orbitalMechanics.update(deltaTime, this.animationSpeed);
                    }

                    // Update planet rotations
                    if (this.planetFactory) {
                        this.planetFactory.updatePlanetRotations(deltaTime);
                    }

                    // Update lighting
                    if (this.lightingSystem) {
                        this.lightingSystem.update(deltaTime);
                    }
                }

                // Update UI every 60 frames
                if (frameCount % 60 === 0) {
                    this.updateUI();
                }

                // Render scene
                this.sceneManager.render();
            }
        };

        animate(0);

        if (window.Helpers) {
            window.Helpers.log('Enhanced render loop started with full interactivity', 'debug');
        }
    }

    updateUI() {
        // Update simulation time based on actual orbital mechanics
        if (this.orbitalMechanics && window.ControlPanel) {
            const timeString = this.orbitalMechanics.getFormattedTime();
            window.ControlPanel.updateSimulationTime(timeString);

            // Debug: Log Earth orbit verification every 10 seconds
            if (window.SolarSystemConfig?.debug && Math.floor(Date.now() / 10000) !== this.lastDebugTime) {
                this.lastDebugTime = Math.floor(Date.now() / 10000);
                const stats = this.orbitalMechanics.getStats();
                console.log(`Debug: ${stats.simulationTime} = ${stats.earthCompletedOrbits} Earth years`);
            }
        }

        // Update camera distance
        if (this.cameraControls && window.ControlPanel) {
            const distance = this.cameraControls.getDistance();
            const distanceAU = distance / 25;
            window.ControlPanel.updateCameraDistance(distanceAU);
        }
    }

    toggleFeature(feature, enabled) {
        switch (feature) {
            case 'stars':
                if (this.particleManager) {
                    this.particleManager.setSystemVisible('starfield', enabled);
                    this.particleManager.setSystemVisible('nebula', enabled);
                }
                break;
            case 'asteroids':
                if (this.particleManager) {
                    this.particleManager.setSystemVisible('asteroidBelt', enabled);
                }
                break;
            case 'orbits':
                if (this.orbitalMechanics) {
                    this.orbitalMechanics.setOrbitalPathsVisible(enabled);
                }
                break;
            case 'labels':
                // Planet labels functionality
                this.togglePlanetLabels(enabled);
                break;
        }
    }

    togglePlanetLabels(enabled) {
        // For Stage 4, we'll implement a simple label system
        if (enabled) {
            this.showPlanetLabels();
        } else {
            this.hidePlanetLabels();
        }
    }

    showPlanetLabels() {
        // Create or show planet labels
        const labelsContainer = document.getElementById('planet-labels');
        if (labelsContainer) {
            labelsContainer.style.display = 'block';
        }

        if (window.Helpers) {
            window.Helpers.log('Planet labels enabled', 'debug');
        }
    }

    hidePlanetLabels() {
        // Hide planet labels
        const labelsContainer = document.getElementById('planet-labels');
        if (labelsContainer) {
            labelsContainer.style.display = 'none';
        }

        if (window.Helpers) {
            window.Helpers.log('Planet labels disabled', 'debug');
        }
    }

    resetCameraView() {
        if (this.cameraControls) {
            this.cameraControls.reset();

            if (window.ControlPanel) {
                window.ControlPanel.updateSelectedPlanet('None');
            }
        }
    }

    focusOnPlanet(planetName) {
        const planetGroup = this.planetInstances.get(planetName.toLowerCase());

        if (planetGroup && this.cameraControls) {
            const planetMesh = planetGroup.children[0];
            if (planetMesh) {
                const planetData = this.planets.find(p => p.name.toLowerCase() === planetName.toLowerCase());
                let focusDistance = 30;

                if (planetData) {
                    const scaledSize = this.planetFactory.calculateScaledSize(planetData);
                    focusDistance = Math.max(scaledSize * 8, 20);
                }

                this.cameraControls.focusOnObject(planetMesh, focusDistance);

                // Also select the planet in the interaction system
                if (this.interactionManager) {
                    this.interactionManager.selectObject(planetMesh);
                }

                if (window.ControlPanel) {
                    window.ControlPanel.updateSelectedPlanet(planetData ? planetData.name : planetName);
                }

                if (window.NotificationSystem) {
                    window.NotificationSystem.showInfo(`Focused on ${planetName}`);
                }

                if (window.Helpers) {
                    window.Helpers.log(`Camera focused on ${planetName} at distance ${focusDistance.toFixed(2)}`, 'debug');
                }
            }
        }
    }

    closeAllPanels() {
        // Close info panel
        if (this.infoPanelSystem) {
            this.infoPanelSystem.hide();
        }

        // Close help modal
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
            helpModal.classList.add('hidden');
        }

        // Deselect any selected planet
        if (this.interactionManager) {
            this.interactionManager.deselectObject();
        }
    }

    toggleHelpModal() {
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
            helpModal.classList.toggle('hidden');
        }
    }

    detectPerformanceMode() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

        if (!gl) return true;

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            const isIntegratedGPU = renderer.toLowerCase().includes('intel') &&
                                   !renderer.toLowerCase().includes('iris pro');
            return isIntegratedGPU;
        }

        return false;
    }

    getFallbackPlanetData() {
        return [
            { name: 'Sun', color_hex: '#FDB813', distance_from_sun: 0, diameter: 1392700, orbital_period: 0, rotation_period: 609.12, planet_type: 'star' },
            { name: 'Mercury', color_hex: '#8C7853', distance_from_sun: 0.39, diameter: 4879, orbital_period: 87.97, rotation_period: 1407.6, planet_type: 'terrestrial' },
            { name: 'Venus', color_hex: '#FC649F', distance_from_sun: 0.72, diameter: 12104, orbital_period: 224.7, rotation_period: -5832.5, planet_type: 'terrestrial' },
            { name: 'Earth', color_hex: '#4F94CD', distance_from_sun: 1.0, diameter: 12756, orbital_period: 365.25, rotation_period: 23.93, planet_type: 'terrestrial' },
            { name: 'Mars', color_hex: '#CD5C5C', distance_from_sun: 1.52, diameter: 6792, orbital_period: 686.98, rotation_period: 24.62, planet_type: 'terrestrial' },
            { name: 'Jupiter', color_hex: '#D2691E', distance_from_sun: 5.20, diameter: 142984, orbital_period: 4332.59, rotation_period: 9.93, planet_type: 'gas_giant' },
            { name: 'Saturn', color_hex: '#FAD5A5', distance_from_sun: 9.54, diameter: 120536, orbital_period: 10759.22, rotation_period: 10.66, planet_type: 'gas_giant' },
            { name: 'Uranus', color_hex: '#4FD0FF', distance_from_sun: 19.19, diameter: 51118, orbital_period: 30688.5, rotation_period: -17.24, planet_type: 'ice_giant' },
            { name: 'Neptune', color_hex: '#4169E1', distance_from_sun: 30.07, diameter: 49528, orbital_period: 60182, rotation_period: 16.11, planet_type: 'ice_giant' },
            { name: 'Pluto', color_hex: '#EEE8AA', distance_from_sun: 39.48, diameter: 2376, orbital_period: 90560, rotation_period: -153.3, planet_type: 'dwarf_planet' }
        ];
    }

    getFallbackSunData() {
        return {
            name: 'Sun',
            color_hex: '#FDB813',
            distance_from_sun: 0,
            diameter: 1392700,
            orbital_period: 0,
            rotation_period: 609.12,
            planet_type: 'star',
            texture_filename: 'sun_texture.jpg'
        };
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
            planetCount: this.planets.length,
            planetInstanceCount: this.planetInstances.size
        };

        if (this.sceneManager) {
            Object.assign(stats, this.sceneManager.getStats());
        }

        if (this.particleManager) {
            stats.particleSystems = this.particleManager.getStats();
        }

        if (this.orbitalMechanics) {
            stats.orbitalMechanics = this.orbitalMechanics.getStats();
        }

        if (this.lightingSystem) {
            stats.lighting = this.lightingSystem.getStats();
        }

        if (this.interactionManager) {
            stats.interactions = this.interactionManager.getStats();
        }

        return stats;
    }

    // Educational methods
    getEducationalInfo() {
        return {
            totalPlanets: this.planets.length,
            planetTypes: this.getPlanetTypeCount(),
            selectedPlanet: this.interactionManager?.getSelectedPlanet(),
            systemAge: this.systemInfo?.system_age || '4.6 billion years',
            systemSize: 'About 100,000 AU including Oort Cloud'
        };
    }

    getPlanetTypeCount() {
        const types = {};
        this.planets.forEach(planet => {
            const type = planet.planet_type || 'unknown';
            types[type] = (types[type] || 0) + 1;
        });
        return types;
    }

    // Take screenshot functionality
    takeScreenshot(filename = 'solar-system-screenshot.png') {
        if (this.sceneManager) {
            this.sceneManager.takeScreenshot(filename);

            if (window.NotificationSystem) {
                window.NotificationSystem.showSuccess('Screenshot saved!');
            }
        }
    }

    // Cleanup
    dispose() {
        // Remove event listeners
        this.eventListeners.forEach(({ type, handler }) => {
            document.removeEventListener(type, handler);
        });
        this.eventListeners = [];

        // Dispose of systems in reverse order
        if (this.infoPanelSystem) {
            this.infoPanelSystem.dispose();
        }

        if (this.interactionManager) {
            this.interactionManager.dispose();
        }

        if (this.orbitalMechanics) {
            this.orbitalMechanics.dispose();
        }

        if (this.cameraControls) {
            this.cameraControls.dispose();
        }

        if (this.lightingSystem) {
            this.lightingSystem.dispose();
        }

        if (this.planetFactory) {
            this.planetFactory.dispose();
        }

        if (this.particleManager) {
            this.particleManager.dispose();
        }

        if (this.sceneManager) {
            this.sceneManager.dispose();
        }

        if (window.TextureLoader) {
            window.TextureLoader.clear();
        }

        this.planetInstances.clear();
        this.isInitialized = false;

        if (window.Helpers) {
            window.Helpers.log('Enhanced Solar System App with full interactivity disposed', 'debug');
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
    get PlanetInstances() { return this.planetInstances; }
    get OrbitalMechanics() { return this.orbitalMechanics; }
    get CameraControls() { return this.cameraControls; }
    get LightingSystem() { return this.lightingSystem; }
    get InteractionManager() { return this.interactionManager; }
    get InfoPanelSystem() { return this.infoPanelSystem; }
};

console.log('Enhanced SolarSystemApp with full Stage 4 interactivity loaded successfully');