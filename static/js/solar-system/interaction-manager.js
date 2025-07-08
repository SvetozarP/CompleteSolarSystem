import * as THREE from 'three';

export class InteractionManager {
    constructor(domElement, options = {}) {
        this.domElement = domElement;
        this.options = {
            ...options
        };

        this.raycaster = new THREE.Raycaster();
        this.hoveredPlanet = null;
        this.lastFocusedPlanet = null;
        this.isInitialized = false;
        this.eventListeners = [];

        this.focusDebounceDelay = 500; // 500ms debounce delay
        this.lastFocusTime = 0;
    }

    /**
     * Update cursor based on hover state
     */
    updateCursor(intersectedPlanet) {
        if (this.domElement) {
            this.domElement.style.cursor = intersectedPlanet ? 'pointer' : 'grab';
        }
    }

    /**
     * Handle planet click - SINGLE SOURCE OF TRUTH
     */
    handlePlanetClick(planetData) {
        console.log('InteractionManager.handlePlanetClick:', planetData.name);

        // Select the planet
        this.selectPlanet(planetData);

        // Show info panel
        if (this.infoPanel && this.infoPanel.show) {
            this.infoPanel.show(planetData);
        }

        // Emit selection event for UI updates
        document.dispatchEvent(new CustomEvent('planetSelected', {
            detail: { planet: planetData }
        }));

        if (window.Helpers) {
            window.Helpers.log(`Planet selected (UI only): ${planetData.name}`, 'debug');
        }
    }

    /**
     * Handle planet double click - focuses camera
     */
    handlePlanetDoubleClick(planetData) {
        console.log('InteractionManager.handlePlanetDoubleClick:', planetData.name);

        // Double-click focuses camera with debouncing
        this.focusAndFollowPlanet(planetData);

        if (window.Helpers) {
            window.Helpers.log(`Double-clicked planet: ${planetData.name}`, 'debug');
        }
    }

    /**
     * FIXED: Focus camera on planet with debouncing to prevent duplicate calls
     */
    focusAndFollowPlanet(planetData) {
        const currentTime = Date.now();

        // FIXED: Debounce rapid focus calls
        if (this.lastFocusedPlanet === planetData.name &&
            currentTime - this.lastFocusTime < this.focusDebounceDelay) {
            console.log(`⏭️ Ignoring duplicate focus call for ${planetData.name} (debounced)`);
            return;
        }

        // Update debounce tracking
        this.lastFocusTime = currentTime;
        this.lastFocusedPlanet = planetData.name;

        console.log(`🎯 Focusing and following: ${planetData.name}`);

        // Get app reference for camera controls
        const app = window.solarSystemApp;
        if (!app || !app.cameraControls) {
            console.warn('Cannot focus on planet - camera controls not available');
            return;
        }

        // Get planet instance
        const planetGroup = app.planetInstances.get(planetData.name);
        if (!planetGroup) {
            console.warn(`Planet instance not found: ${planetData.name}`);
            return;
        }

        // Use camera controls to focus and follow
        app.cameraControls.focusAndFollowPlanet(planetGroup, planetData);

        // Update control panel
        if (window.ControlPanel) {
            window.ControlPanel.updateSelectedPlanet(planetData.name);

            const distance = app.cameraControls.followDistance || 50;
            window.ControlPanel.updateCameraDistance(distance);
        }

        console.log(`✅ Camera focused and following: ${planetData.name}`);
    }

    /**
     * Select a planet (UI only)
     */
    selectPlanet(planetData) {
        // Deselect previous planet if exists
        if (this.selectedPlanet) {
            this.selectedPlanet = null;
        }

        // Set new selected planet
        this.selectedPlanet = planetData;
    }

    initialize() {
        if (this.infoPanel) {
            this.infoPanel.init();
        }
        this.isInitialized = true;
    }
}

// For backward compatibility
if (typeof window !== 'undefined') {
    window.InteractionManager = {
        create: (options) => new InteractionManager(options)
    }
}
