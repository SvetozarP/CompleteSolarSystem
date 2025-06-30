// static/js/solar-system/interaction-manager.js
// Ray casting and planet selection system for Stage 4

window.InteractionManager = (function() {
    'use strict';

    /**
     * Interaction manager for planet selection and raycasting
     */
    class InteractionManager {
        constructor(camera, scene, canvas, options = {}) {
            this.camera = camera;
            this.scene = scene;
            this.canvas = canvas;

            this.options = {
                enableTooltips: true,
                enableSelection: true,
                enableHover: true,
                tooltipDelay: 500, // ms
                selectionColor: 0x00ff00,
                hoverColor: 0xffff00,
                ...options
            };

            // Raycasting
            this.raycaster = new THREE.Raycaster();
            this.mouse = new THREE.Vector2();
            this.touchPosition = new THREE.Vector2();

            // Selection state
            this.selectedObject = null;
            this.hoveredObject = null;
            this.selectableObjects = new Map(); // planetMesh -> planetData

            // Visual feedback
            this.selectionOutline = null;
            this.hoverOutline = null;

            // Tooltip system
            this.tooltip = null;
            this.tooltipTimeout = null;
            this.isTooltipVisible = false;

            // Event state
            this.isMouseDown = false;
            this.lastClickTime = 0;
            this.doubleClickThreshold = 300; // ms

            this.init();
        }

        /**
         * Initialize interaction manager
         */
        init() {
            this.createTooltip();
            this.bindEventListeners();

            if (window.Helpers) {
                window.Helpers.log('InteractionManager initialized', 'debug');
            }
        }

        /**
         * Create tooltip element
         */
        createTooltip() {
            this.tooltip = document.getElementById('planet-tooltip');
            if (!this.tooltip) {
                this.tooltip = document.createElement('div');
                this.tooltip.id = 'planet-tooltip';
                this.tooltip.className = 'planet-tooltip hidden';
                this.tooltip.innerHTML = `
                    <div class="tooltip-content">
                        <h4 id="tooltip-title"></h4>
                        <p id="tooltip-info"></p>
                    </div>
                `;
                document.body.appendChild(this.tooltip);
            }
        }

        /**
         * Bind event listeners for interaction
         */
        bindEventListeners() {
            // Mouse events
            this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this), false);
            this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this), false);
            this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this), false);
            this.canvas.addEventListener('click', this.onClick.bind(this), false);
            this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this), false);

            // Touch events
            this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), false);
            this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this), false);
            this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), false);

            // Hide tooltip when mouse leaves canvas
            this.canvas.addEventListener('mouseleave', this.hideTooltip.bind(this), false);
        }

        /**
         * Register a planet as selectable
         * @param {THREE.Mesh} planetMesh - Planet mesh
         * @param {Object} planetData - Planet data
         */
        addSelectableObject(planetMesh, planetData) {
            if (planetMesh && planetData) {
                this.selectableObjects.set(planetMesh, planetData);
                planetMesh.userData.isSelectable = true;
                planetMesh.userData.planetData = planetData;

                if (window.Helpers) {
                    window.Helpers.log(`Added selectable object: ${planetData.name}`, 'debug');
                }
            }
        }

        /**
         * Remove a planet from selectable objects
         * @param {THREE.Mesh} planetMesh - Planet mesh to remove
         */
        removeSelectableObject(planetMesh) {
            if (this.selectableObjects.has(planetMesh)) {
                this.selectableObjects.delete(planetMesh);
                planetMesh.userData.isSelectable = false;
            }
        }

        /**
         * Update mouse position for raycasting
         * @param {Event} event - Mouse event
         */
        updateMousePosition(event) {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        }

        /**
         * Update touch position for raycasting
         * @param {TouchEvent} event - Touch event
         */
        updateTouchPosition(event) {
            if (event.touches.length > 0) {
                const rect = this.canvas.getBoundingClientRect();
                const touch = event.touches[0];
                this.touchPosition.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
                this.touchPosition.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
            }
        }

        /**
         * Perform raycasting to find intersected objects
         * @param {THREE.Vector2} screenPosition - Screen position for raycasting
         * @returns {Array} Array of intersected objects
         */
        raycast(screenPosition) {
            this.raycaster.setFromCamera(screenPosition, this.camera);

            const selectableArray = Array.from(this.selectableObjects.keys());
            const intersects = this.raycaster.intersectObjects(selectableArray, false);

            return intersects;
        }

        /**
         * Mouse move handler
         * @param {MouseEvent} event - Mouse event
         */
        onMouseMove(event) {
            if (!this.options.enableHover && !this.options.enableTooltips) return;

            this.updateMousePosition(event);

            if (!this.isMouseDown) {
                this.handleHover();
            }

            // Update tooltip position
            if (this.isTooltipVisible) {
                this.updateTooltipPosition(event.clientX, event.clientY);
            }
        }

        /**
         * Mouse down handler
         * @param {MouseEvent} event - Mouse event
         */
        onMouseDown(event) {
            this.isMouseDown = true;
            this.hideTooltip();
        }

        /**
         * Mouse up handler
         * @param {MouseEvent} event - Mouse event
         */
        onMouseUp(event) {
            this.isMouseDown = false;
        }

        /**
         * Click handler
         * @param {MouseEvent} event - Mouse event
         */
        onClick(event) {
            if (!this.options.enableSelection) return;

            event.preventDefault();

            this.updateMousePosition(event);
            const intersects = this.raycast(this.mouse);

            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
                this.selectObject(clickedObject);
            } else {
                this.deselectObject();
            }
        }

        /**
         * Double click handler for focusing
         * @param {MouseEvent} event - Mouse event
         */
        onDoubleClick(event) {
            event.preventDefault();

            this.updateMousePosition(event);
            const intersects = this.raycast(this.mouse);

            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
                const planetData = this.selectableObjects.get(clickedObject);

                if (planetData) {
                    this.focusOnPlanet(planetData.name);
                }
            }
        }

        /**
         * Touch start handler
         * @param {TouchEvent} event - Touch event
         */
        onTouchStart(event) {
            if (event.touches.length === 1) {
                this.updateTouchPosition(event);
                this.isMouseDown = true;
            }
        }

        /**
         * Touch end handler
         * @param {TouchEvent} event - Touch event
         */
        onTouchEnd(event) {
            if (event.changedTouches.length === 1 && this.isMouseDown) {
                const intersects = this.raycast(this.touchPosition);

                if (intersects.length > 0) {
                    const touchedObject = intersects[0].object;
                    this.selectObject(touchedObject);
                }

                this.isMouseDown = false;
            }
        }

        /**
         * Touch move handler
         * @param {TouchEvent} event - Touch event
         */
        onTouchMove(event) {
            if (event.touches.length === 1) {
                this.updateTouchPosition(event);
            }
        }

        /**
         * Handle hover effects and tooltips
         */
        handleHover() {
            const intersects = this.raycast(this.mouse);

            if (intersects.length > 0) {
                const hoveredObject = intersects[0].object;

                if (hoveredObject !== this.hoveredObject) {
                    this.setHoveredObject(hoveredObject);
                }
            } else {
                if (this.hoveredObject) {
                    this.setHoveredObject(null);
                }
            }
        }

        /**
         * Set hovered object and show tooltip
         * @param {THREE.Mesh} object - Object being hovered
         */
        setHoveredObject(object) {
            // Clear previous hover
            if (this.hoveredObject) {
                this.removeHoverEffect(this.hoveredObject);
            }

            this.hoveredObject = object;

            if (object) {
                this.addHoverEffect(object);

                if (this.options.enableTooltips) {
                    this.showTooltipForObject(object);
                }
            } else {
                this.hideTooltip();
            }
        }

        /**
         * Select an object and show information
         * @param {THREE.Mesh} object - Object to select
         */
        selectObject(object) {
            // Clear previous selection
            if (this.selectedObject) {
                this.removeSelectionEffect(this.selectedObject);
            }

            this.selectedObject = object;

            if (object) {
                this.addSelectionEffect(object);

                const planetData = this.selectableObjects.get(object);
                if (planetData) {
                    this.showPlanetInformation(planetData);

                    // Emit selection event
                    document.dispatchEvent(new CustomEvent('planetSelected', {
                        detail: { planet: planetData }
                    }));

                    if (window.ControlPanel) {
                        window.ControlPanel.updateSelectedPlanet(planetData.name);
                    }

                    if (window.NotificationSystem) {
                        window.NotificationSystem.showInfo(`Selected ${planetData.name}`);
                    }
                }
            }
        }

        /**
         * Deselect current object
         */
        deselectObject() {
            if (this.selectedObject) {
                this.removeSelectionEffect(this.selectedObject);
                this.selectedObject = null;

                this.hidePlanetInformation();

                document.dispatchEvent(new CustomEvent('planetDeselected'));

                if (window.ControlPanel) {
                    window.ControlPanel.updateSelectedPlanet('None');
                }
            }
        }

        /**
         * Add visual hover effect to object
         * @param {THREE.Mesh} object - Object to add effect to
         */
        addHoverEffect(object) {
            if (!object.userData.originalEmissive) {
                object.userData.originalEmissive = object.material.emissive?.clone() || new THREE.Color(0x000000);
                object.userData.originalEmissiveIntensity = object.material.emissiveIntensity || 0;
            }

            // Add subtle glow
            object.material.emissive = new THREE.Color(this.options.hoverColor);
            object.material.emissiveIntensity = 0.1;

            // Change cursor
            this.canvas.style.cursor = 'pointer';
        }

        /**
         * Remove hover effect from object
         * @param {THREE.Mesh} object - Object to remove effect from
         */
        removeHoverEffect(object) {
            if (object.userData.originalEmissive) {
                object.material.emissive = object.userData.originalEmissive;
                object.material.emissiveIntensity = object.userData.originalEmissiveIntensity;
            }

            // Reset cursor
            this.canvas.style.cursor = 'grab';
        }

        /**
         * Add visual selection effect to object
         * @param {THREE.Mesh} object - Object to add effect to
         */
        addSelectionEffect(object) {
            if (!object.userData.originalEmissive) {
                object.userData.originalEmissive = object.material.emissive?.clone() || new THREE.Color(0x000000);
                object.userData.originalEmissiveIntensity = object.material.emissiveIntensity || 0;
            }

            // Add selection glow
            object.material.emissive = new THREE.Color(this.options.selectionColor);
            object.material.emissiveIntensity = 0.2;
        }

        /**
         * Remove selection effect from object
         * @param {THREE.Mesh} object - Object to remove effect from
         */
        removeSelectionEffect(object) {
            if (object.userData.originalEmissive) {
                object.material.emissive = object.userData.originalEmissive;
                object.material.emissiveIntensity = object.userData.originalEmissiveIntensity;
            }
        }

        /**
         * Show tooltip for object
         * @param {THREE.Mesh} object - Object to show tooltip for
         */
        showTooltipForObject(object) {
            const planetData = this.selectableObjects.get(object);
            if (!planetData) return;

            // Clear existing timeout
            if (this.tooltipTimeout) {
                clearTimeout(this.tooltipTimeout);
            }

            // Show tooltip after delay
            this.tooltipTimeout = setTimeout(() => {
                this.showTooltip(planetData);
            }, this.options.tooltipDelay);
        }

        /**
         * Show tooltip with planet information
         * @param {Object} planetData - Planet data
         */
        showTooltip(planetData) {
            const titleElement = document.getElementById('tooltip-title');
            const infoElement = document.getElementById('tooltip-info');

            if (titleElement && infoElement) {
                titleElement.textContent = planetData.name;

                const info = [];
                info.push(`Distance: ${planetData.distance_from_sun.toFixed(2)} AU`);
                info.push(`Diameter: ${planetData.diameter.toLocaleString()} km`);
                if (planetData.orbital_period) {
                    const years = (planetData.orbital_period / 365.25).toFixed(1);
                    info.push(`Orbital Period: ${years} years`);
                }

                infoElement.textContent = info.join(' • ');

                this.tooltip.classList.remove('hidden');
                this.isTooltipVisible = true;
            }
        }

        /**
         * Hide tooltip
         */
        hideTooltip() {
            if (this.tooltipTimeout) {
                clearTimeout(this.tooltipTimeout);
                this.tooltipTimeout = null;
            }

            if (this.tooltip) {
                this.tooltip.classList.add('hidden');
                this.isTooltipVisible = false;
            }
        }

        /**
         * Update tooltip position
         * @param {number} x - Screen X position
         * @param {number} y - Screen Y position
         */
        updateTooltipPosition(x, y) {
            if (this.tooltip && this.isTooltipVisible) {
                // Offset to avoid cursor
                const offsetX = 15;
                const offsetY = -10;

                // Keep tooltip within viewport
                const rect = this.tooltip.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                let tooltipX = x + offsetX;
                let tooltipY = y + offsetY;

                // Adjust if tooltip would go off screen
                if (tooltipX + rect.width > viewportWidth) {
                    tooltipX = x - rect.width - offsetX;
                }
                if (tooltipY < 0) {
                    tooltipY = y - offsetY + 20;
                }

                this.tooltip.style.left = tooltipX + 'px';
                this.tooltip.style.top = tooltipY + 'px';
            }
        }

        /**
         * Show detailed planet information panel
         * @param {Object} planetData - Planet data
         */
        showPlanetInformation(planetData) {
            // This will trigger the info panel system
            document.dispatchEvent(new CustomEvent('showPlanetInfo', {
                detail: { planetData }
            }));
        }

        /**
         * Hide planet information panel
         */
        hidePlanetInformation() {
            document.dispatchEvent(new CustomEvent('hidePlanetInfo'));
        }

        /**
         * Focus camera on planet
         * @param {string} planetName - Name of planet to focus on
         */
        focusOnPlanet(planetName) {
            document.dispatchEvent(new CustomEvent('focusPlanet', {
                detail: { planet: planetName.toLowerCase() }
            }));
        }

        /**
         * Get currently selected planet
         * @returns {Object|null} Selected planet data
         */
        getSelectedPlanet() {
            if (this.selectedObject) {
                return this.selectableObjects.get(this.selectedObject);
            }
            return null;
        }

        /**
         * Get currently hovered planet
         * @returns {Object|null} Hovered planet data
         */
        getHoveredPlanet() {
            if (this.hoveredObject) {
                return this.selectableObjects.get(this.hoveredObject);
            }
            return null;
        }

        /**
         * Get interaction statistics
         * @returns {Object} Interaction stats
         */
        getStats() {
            return {
                selectableObjects: this.selectableObjects.size,
                hasSelection: !!this.selectedObject,
                hasHover: !!this.hoveredObject,
                selectedPlanet: this.getSelectedPlanet()?.name || null,
                hoveredPlanet: this.getHoveredPlanet()?.name || null,
                tooltipsEnabled: this.options.enableTooltips,
                selectionEnabled: this.options.enableSelection
            };
        }

        /**
         * Enable or disable interaction features
         * @param {Object} features - Features to enable/disable
         */
        setFeatures(features) {
            Object.assign(this.options, features);
        }

        /**
         * Dispose of interaction manager
         */
        dispose() {
            // Remove event listeners
            this.canvas.removeEventListener('mousemove', this.onMouseMove);
            this.canvas.removeEventListener('mousedown', this.onMouseDown);
            this.canvas.removeEventListener('mouseup', this.onMouseUp);
            this.canvas.removeEventListener('click', this.onClick);
            this.canvas.removeEventListener('dblclick', this.onDoubleClick);
            this.canvas.removeEventListener('touchstart', this.onTouchStart);
            this.canvas.removeEventListener('touchend', this.onTouchEnd);
            this.canvas.removeEventListener('touchmove', this.onTouchMove);
            this.canvas.removeEventListener('mouseleave', this.hideTooltip);

            // Clear timeouts
            if (this.tooltipTimeout) {
                clearTimeout(this.tooltipTimeout);
            }

            // Remove tooltip
            if (this.tooltip && this.tooltip.parentNode) {
                this.tooltip.parentNode.removeChild(this.tooltip);
            }

            // Clear references
            this.selectableObjects.clear();
            this.selectedObject = null;
            this.hoveredObject = null;

            if (window.Helpers) {
                window.Helpers.log('InteractionManager disposed', 'debug');
            }
        }
    }

    // Public API
    return {
        InteractionManager,

        // Factory function
        create: (camera, scene, canvas, options = {}) => {
            return new InteractionManager(camera, scene, canvas, options);
        }
    };
})();

console.log('InteractionManager module loaded successfully');