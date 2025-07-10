// static/js/solar-system/interaction-manager.js
// FIXED: Prevent duplicate rapid focus calls with debouncing

window.InteractionManager = (function() {
    'use strict';

    /**
     * Interaction manager for handling planet selection and information display
     */
    class InteractionManager {
        constructor(options = {}) {
            this.options = {
                enablePlanetSelection: true,
                enableTooltips: true,
                enableHover: true,
                enableDoubleClick: true,
                tooltipDelay: 500,
                ...options
            };

            // Required parameters
            this.scene = options.scene;
            this.camera = options.camera;
            this.domElement = options.domElement;
            this.planets = options.planets || new Map();

            if (!this.scene || !this.camera || !this.domElement) {
                throw new Error('InteractionManager requires scene, camera, and domElement');
            }

            // Raycaster for object picking
            this.raycaster = new THREE.Raycaster();
            this.mouse = new THREE.Vector2();

            // Selection state
            this.selectedPlanet = null;
            this.hoveredPlanet = null;
            this.lastClickTime = 0;
            this.doubleClickThreshold = 300; // ms

            // FIXED: Add debouncing for focus calls
            this.lastFocusTime = 0;
            this.lastFocusedPlanet = null;
            this.focusDebounceDelay = 500; // 500ms debounce

            // UI elements
            this.tooltip = null;
            this.infoPanel = null;

            // Event listeners for cleanup
            this.eventListeners = [];

            // Tooltip state
            this.tooltipTimeout = null;
            this.isTooltipVisible = false;

            this.isInitialized = false;
        }

        /**
         * Initialize interaction manager
         */
        async init() {
            try {
                // Initialize UI elements
                this.initializeUIElements();

                // Bind event listeners
                this.bindEventListeners();

                this.isInitialized = true;

                if (window.Helpers) {
                    window.Helpers.log('Interaction manager initialized', 'debug');
                }

            } catch (error) {
                if (window.Helpers) {
                    window.Helpers.handleError(error, 'InteractionManager.init');
                }
                throw error;
            }
        }

        /**
         * Initialize UI elements
         */
        initializeUIElements() {
            // Create tooltip element
            this.createTooltip();

            // Initialize info panel system if available
            if (window.InfoPanelSystem) {
                this.infoPanel = window.InfoPanelSystem.create();
                this.infoPanel.init();
            }
        }

        /**
         * Create tooltip element
         */
        createTooltip() {
            this.tooltip = document.createElement('div');
            this.tooltip.id = 'planet-tooltip';
            this.tooltip.className = 'planet-tooltip hidden';
            this.tooltip.innerHTML = `
                <div class="tooltip-content">
                    <h4 id="tooltip-title"></h4>
                    <p id="tooltip-info"></p>
                </div>
            `;

            // Add tooltip styles
            this.tooltip.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(10px);
                color: white;
                padding: 8px 12px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                font-size: 14px;
                pointer-events: none;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
                max-width: 250px;
            `;

            document.body.appendChild(this.tooltip);
        }

        /**
         * Bind event listeners
         */
        bindEventListeners() {
            if (!this.domElement) {
                console.error('domElement is undefined in InteractionManager');
                return;
            }

            // Mouse events
            this.addEventListener('mousemove', this.onMouseMove.bind(this));
            this.addEventListener('click', this.onClick.bind(this));

            // Touch events for mobile
            this.addEventListener('touchstart', this.onTouchStart.bind(this));
            this.addEventListener('touchend', this.onTouchEnd.bind(this));

            // Keyboard events
            this.addEventListener('keydown', this.onKeyDown.bind(this), document);

            // Window events
            this.addEventListener('resize', this.onWindowResize.bind(this), window);
        }

        /**
         * Add event listener with cleanup tracking
         */
        addEventListener(type, listener, element = null) {
            const target = element || this.domElement;
            if (!target) {
                console.error(`Target element is undefined for event: ${type}`);
                return;
            }

            target.addEventListener(type, listener, { passive: false });
            this.eventListeners.push({ target, type, listener });
        }

        /**
         * Mouse move handler
         */
        onMouseMove(event) {
            if (!this.options.enableHover && !this.options.enableTooltips) return;

            // Update mouse coordinates
            this.updateMouseCoordinates(event);

            // Perform raycasting
            const intersectedPlanet = this.raycastPlanets();

            // Handle hover state changes
            this.handleHoverStateChange(intersectedPlanet);

            // Update tooltip
            if (this.options.enableTooltips) {
                this.updateTooltip(event, intersectedPlanet);
            }
        }

        /**
         * Mouse click handler
         */
        onClick(event) {
            if (!this.options.enablePlanetSelection) return;

            event.preventDefault();

            // Update mouse coordinates
            this.updateMouseCoordinates(event);

            // Perform raycasting
            const intersectedPlanet = this.raycastPlanets();

            if (intersectedPlanet) {
                // Check for double click
                const currentTime = Date.now();
                const isDoubleClick = (currentTime - this.lastClickTime) < this.doubleClickThreshold;
                this.lastClickTime = currentTime;

                if (isDoubleClick && this.options.enableDoubleClick) {
                    this.handlePlanetDoubleClick(intersectedPlanet);
                } else {
                    this.handlePlanetClick(intersectedPlanet);
                }
            } else {
                // Click on empty space - deselect
                this.deselectPlanet();
            }
        }

        /**
         * Touch event handlers
         */
        onTouchStart(event) {
            if (event.touches.length === 1) {
                // Convert touch to mouse coordinates
                const touch = event.touches[0];
                this.updateMouseCoordinates(touch);
            }
        }

        onTouchEnd(event) {
            if (!this.options.enablePlanetSelection) return;

            if (event.changedTouches.length === 1) {
                // Convert touch to mouse coordinates
                const touch = event.changedTouches[0];
                this.updateMouseCoordinates(touch);

                // Perform raycasting
                const intersectedPlanet = this.raycastPlanets();

                if (intersectedPlanet) {
                    this.handlePlanetClick(intersectedPlanet);
                } else {
                    this.deselectPlanet();
                }
            }
        }

        /**
         * Keyboard event handler
         */
        onKeyDown(event) {
            switch (event.code) {
                case 'Escape':
                    this.deselectPlanet();
                    this.hideTooltip();
                    if (this.infoPanel) {
                        this.infoPanel.hide();
                    }
                    break;

                case 'KeyI':
                    if (this.selectedPlanet && this.infoPanel) {
                        this.infoPanel.toggle();
                    }
                    break;

                // REMOVED: Number key handling to prevent conflicts with ControlPanel
                // The ControlPanel should be the only handler for number keys
            }
        }

        /**
         * Window resize handler
         */
        onWindowResize() {
            // Hide tooltip on resize
            this.hideTooltip();
        }

        /**
         * Update mouse coordinates for raycasting
         */
        updateMouseCoordinates(event) {
            const rect = this.domElement.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        }

        /**
         * Perform raycasting to find intersected planets
         */
        raycastPlanets() {
            // Update raycaster
            this.raycaster.setFromCamera(this.mouse, this.camera);

            // Create array of planet meshes to test
            const planetMeshes = [];
            this.planets.forEach((planetGroup) => {
                // Find the main planet mesh in the group
                planetGroup.traverse((child) => {
                    if (child.userData && child.userData.type === 'planetMesh') {
                        planetMeshes.push(child);
                    }
                });
            });

            // Perform intersection test
            const intersects = this.raycaster.intersectObjects(planetMeshes);

            if (intersects.length > 0) {
                const intersectedObject = intersects[0].object;
                return intersectedObject.userData.planetData;
            }

            return null;
        }

        /**
         * Handle hover state changes
         */
        handleHoverStateChange(intersectedPlanet) {
            if (intersectedPlanet !== this.hoveredPlanet) {
                // Remove hover effect from previous planet
                if (this.hoveredPlanet) {
                    this.removeHoverEffect(this.hoveredPlanet);
                }

                // Add hover effect to new planet
                if (intersectedPlanet) {
                    this.addHoverEffect(intersectedPlanet);
                }

                this.hoveredPlanet = intersectedPlanet;

                // Update cursor
                this.updateCursor(intersectedPlanet);
            }
        }

        /**
         * Add hover effect to planet
         */
        addHoverEffect(planetData) {
            const planetGroup = this.planets.get(planetData.name);
            if (planetGroup) {
                // Add subtle glow or outline effect
                planetGroup.traverse((child) => {
                    if (child.userData && child.userData.type === 'planetMesh') {
                        // Store original material properties
                        if (!child.userData.originalEmissive) {
                            child.userData.originalEmissive = child.material.emissive?.clone() || new THREE.Color(0x000000);
                        }

                        // Add hover glow
                        if (child.material.emissive) {
                            child.material.emissive.setHex(0x444444);
                        }
                    }
                });
            }
        }

        /**
         * Remove hover effect from planet
         */
        removeHoverEffect(planetData) {
            const planetGroup = this.planets.get(planetData.name);
            if (planetGroup) {
                planetGroup.traverse((child) => {
                    if (child.userData && child.userData.type === 'planetMesh') {
                        // Restore original emissive color
                        if (child.userData.originalEmissive && child.material.emissive) {
                            child.material.emissive.copy(child.userData.originalEmissive);
                        }
                    }
                });
            }
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

            // REMOVED: Focus camera call from here to prevent conflicts
            // Only emit selection event for UI updates
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
            // Deselect previous planet
            if (this.selectedPlanet) {
                this.removeSelectionEffect(this.selectedPlanet);
            }

            // Select new planet
            this.selectedPlanet = planetData;
            this.addSelectionEffect(planetData);

            // Update UI
            if (window.ControlPanel) {
                window.ControlPanel.updateSelectedPlanet(planetData.name);
            }
        }

        /**
         * Deselect current planet
         */
        deselectPlanet() {
            if (this.selectedPlanet) {
                this.removeSelectionEffect(this.selectedPlanet);
                this.selectedPlanet = null;

                // Update UI
                if (window.ControlPanel) {
                    window.ControlPanel.updateSelectedPlanet('None');
                }

                // Hide info panel
                if (this.infoPanel) {
                    this.infoPanel.hide();
                }
            }
        }

        /**
         * Add selection effect to planet
         */
        addSelectionEffect(planetData) {
            const planetGroup = this.planets.get(planetData.name);
            if (planetGroup) {
                planetGroup.traverse((child) => {
                    if (child.userData && child.userData.type === 'planetMesh') {
                        // Add selection indicator (could be enhanced with outline shader)
                        child.userData.isSelected = true;

                        // Simple selection effect - brighter emissive
                        if (child.material.emissive) {
                            child.material.emissive.setHex(0x006600); // Green tint
                        }
                    }
                });
            }
        }

        /**
         * Remove selection effect from planet
         */
        removeSelectionEffect(planetData) {
            const planetGroup = this.planets.get(planetData.name);
            if (planetGroup) {
                planetGroup.traverse((child) => {
                    if (child.userData && child.userData.type === 'planetMesh') {
                        child.userData.isSelected = false;

                        // Restore original emissive
                        if (child.userData.originalEmissive && child.material.emissive) {
                            child.material.emissive.copy(child.userData.originalEmissive);
                        }
                    }
                });
            }
        }

        /**
         * Update tooltip
         */
        updateTooltip(event, intersectedPlanet) {
            if (intersectedPlanet) {
                this.showTooltip(event, intersectedPlanet);
            } else {
                this.hideTooltip();
            }
        }

        /**
         * Show tooltip for planet
         */
        showTooltip(event, planetData) {
            if (this.tooltipTimeout) {
                clearTimeout(this.tooltipTimeout);
            }

            this.tooltipTimeout = setTimeout(() => {
                if (this.tooltip) {
                    // Update tooltip content
                    const title = this.tooltip.querySelector('#tooltip-title');
                    const info = this.tooltip.querySelector('#tooltip-info');

                    if (title && info) {
                        title.textContent = planetData.name;
                        info.textContent = `Distance: ${planetData.distance_from_sun} AU • Diameter: ${Math.round(planetData.diameter)} km`;
                    }

                    // Position tooltip
                    this.positionTooltip(event);

                    // Show tooltip
                    this.tooltip.classList.remove('hidden');
                    this.tooltip.style.opacity = '1';
                    this.isTooltipVisible = true;
                }
            }, this.options.tooltipDelay);
        }

        /**
         * Hide tooltip
         */
        hideTooltip() {
            if (this.tooltipTimeout) {
                clearTimeout(this.tooltipTimeout);
                this.tooltipTimeout = null;
            }

            if (this.tooltip && this.isTooltipVisible) {
                this.tooltip.style.opacity = '0';
                setTimeout(() => {
                    if (this.tooltip) {
                        this.tooltip.classList.add('hidden');
                    }
                }, 300);
                this.isTooltipVisible = false;
            }
        }

        /**
         * Position tooltip near mouse cursor
         */
        positionTooltip(event) {
            if (!this.tooltip) return;

            const offset = 10;
            let x = event.clientX + offset;
            let y = event.clientY - this.tooltip.offsetHeight - offset;

            // Keep tooltip within viewport
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            if (x + this.tooltip.offsetWidth > viewportWidth) {
                x = event.clientX - this.tooltip.offsetWidth - offset;
            }

            if (y < 0) {
                y = event.clientY + offset;
            }

            this.tooltip.style.left = `${x}px`;
            this.tooltip.style.top = `${y}px`;
        }

        /**
         * Update planet references
         */
        updatePlanets(planets) {
            this.planets = planets;
        }

        /**
         * Set labels visibility
         */
        setLabelsVisible(visible) {
            // This would control planet label visibility
            // Implementation depends on label system
            if (window.Helpers) {
                window.Helpers.log(`Planet labels ${visible ? 'enabled' : 'disabled'}`, 'debug');
            }
        }

        /**
         * Update interaction manager
         */
        update(deltaTime) {
            // Update any animations or time-based effects
            if (this.selectedPlanet) {
                // Could add pulsing effects or other animations
            }
        }

        /**
         * Get interaction statistics
         */
        getStats() {
            return {
                isInitialized: this.isInitialized,
                selectedPlanet: this.selectedPlanet?.name || null,
                hoveredPlanet: this.hoveredPlanet?.name || null,
                tooltipVisible: this.isTooltipVisible,
                planetsCount: this.planets.size,
                lastFocusTime: this.lastFocusTime,
                focusDebounceActive: this.lastFocusedPlanet !== null
            };
        }

        /**
         * FIXED: Reset focus debouncing (useful for external calls)
         */
        resetFocusDebounce() {
            this.lastFocusTime = 0;
            this.lastFocusedPlanet = null;
        }

        /**
         * Dispose of interaction manager
         */
        dispose() {
            // Clear timeouts
            if (this.tooltipTimeout) {
                clearTimeout(this.tooltipTimeout);
            }

            // Remove tooltip element
            if (this.tooltip && this.tooltip.parentNode) {
                this.tooltip.parentNode.removeChild(this.tooltip);
            }

            // Dispose info panel
            if (this.infoPanel) {
                this.infoPanel.dispose();
            }

            // Remove event listeners
            this.eventListeners.forEach(({ target, type, listener }) => {
                target.removeEventListener(type, listener);
            });
            this.eventListeners = [];

            // Clear references
            this.selectedPlanet = null;
            this.hoveredPlanet = null;
            this.planets.clear();

            this.isInitialized = false;

            if (window.Helpers) {
                window.Helpers.log('Interaction manager disposed', 'debug');
            }
        }

        // Getters
        get SelectedPlanet() { return this.selectedPlanet; }
        get HoveredPlanet() { return this.hoveredPlanet; }
        get IsInitialized() { return this.isInitialized; }
    }

    // Public API
    return {
        InteractionManager,

        // Factory function
        create: (options = {}) => {
            return new InteractionManager(options);
        }
    };
})();

// Make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.InteractionManager;
}

console.log('FIXED InteractionManager with debouncing loaded successfully');