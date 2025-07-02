// static/js/solar-system/planet-labels.js
// Complete planet labels system with positioning and visibility management

window.PlanetLabels = (function() {
    'use strict';

    /**
     * Planet Labels System for displaying planet names in 3D space
     */
    class PlanetLabelsSystem {
        constructor(options = {}) {
            this.options = {
                containerId: 'planet-labels',
                enabled: true,
                fadeDistance: 200,
                minDistance: 10,
                maxDistance: 500,
                fontSize: '14px',
                fontFamily: 'Orbitron, monospace',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: 'rgba(74, 158, 255, 0.6)',
                textColor: 'white',
                padding: '6px 12px',
                borderRadius: '6px',
                ...options
            };

            this.labelsContainer = null;
            this.planetLabels = new Map();
            this.camera = null;
            this.planetInstances = null;
            this.isVisible = true;
            this.isInitialized = false;

            // Animation frame tracking
            this.animationId = null;
            this.lastUpdateTime = 0;
            this.updateInterval = 16; // ~60fps
        }

        /**
         * Initialize the labels system
         */
        init(camera, planetInstances) {
            this.camera = camera;
            this.planetInstances = planetInstances;

            try {
                this.createLabelsContainer();
                this.createPlanetLabels();
                this.startUpdateLoop();

                this.isInitialized = true;

                if (window.Helpers) {
                    window.Helpers.log('Planet Labels System initialized', 'debug');
                }

                return true;
            } catch (error) {
                if (window.Helpers) {
                    window.Helpers.handleError(error, 'PlanetLabels.init');
                }
                return false;
            }
        }

        /**
         * Create the labels container
         */
        createLabelsContainer() {
            this.labelsContainer = document.getElementById(this.options.containerId);

            if (!this.labelsContainer) {
                this.labelsContainer = document.createElement('div');
                this.labelsContainer.id = this.options.containerId;
                this.labelsContainer.className = 'planet-labels';

                // Apply container styles
                this.labelsContainer.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 10;
                    display: ${this.isVisible ? 'block' : 'none'};
                `;

                // Find canvas container to append labels
                const canvasContainer = document.getElementById('canvas-container');
                if (canvasContainer) {
                    canvasContainer.appendChild(this.labelsContainer);
                } else {
                    document.body.appendChild(this.labelsContainer);
                }
            }

            // Set initial visibility
            this.labelsContainer.style.display = this.isVisible ? 'block' : 'none';
        }

        /**
         * Create labels for all planets
         */
        createPlanetLabels() {
            if (!this.planetInstances || !this.labelsContainer) return;

            this.planetInstances.forEach((planetGroup, planetName) => {
                const planetData = planetGroup.userData.planetData;
                if (planetData) {
                    this.createPlanetLabel(planetData);
                }
            });
        }

        /**
         * Create a label for a specific planet
         */
        createPlanetLabel(planetData) {
            const labelElement = document.createElement('div');
            labelElement.className = 'planet-label';
            labelElement.textContent = planetData.name;
            labelElement.id = `label-${planetData.name.toLowerCase()}`;

            // Apply label styles
            labelElement.style.cssText = `
                position: absolute;
                background: ${this.options.backgroundColor};
                backdrop-filter: blur(8px);
                color: ${this.options.textColor};
                padding: ${this.options.padding};
                border-radius: ${this.options.borderRadius};
                border: 1px solid ${this.options.borderColor};
                font-size: ${this.options.fontSize};
                font-family: ${this.options.fontFamily};
                font-weight: 500;
                white-space: nowrap;
                transform: translate(-50%, -100%);
                transition: opacity 0.3s ease, transform 0.1s ease;
                opacity: 0;
                user-select: none;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 100;
            `;

            // Add arrow pointer
            const arrow = document.createElement('div');
            arrow.style.cssText = `
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 6px solid ${this.options.borderColor};
            `;
            labelElement.appendChild(arrow);

            this.labelsContainer.appendChild(labelElement);
            this.planetLabels.set(planetData.name, {
                element: labelElement,
                planetData: planetData,
                isVisible: false
            });
        }

        /**
         * Start the update loop for positioning labels
         */
        startUpdateLoop() {
            const updateLabels = (currentTime) => {
                if (currentTime - this.lastUpdateTime >= this.updateInterval) {
                    this.updateLabelPositions();
                    this.lastUpdateTime = currentTime;
                }

                if (this.isInitialized) {
                    this.animationId = requestAnimationFrame(updateLabels);
                }
            };

            this.animationId = requestAnimationFrame(updateLabels);
        }

        /**
         * Update label positions based on planet positions
         */
        updateLabelPositions() {
            if (!this.camera || !this.planetInstances || !this.isVisible) return;

            const canvasContainer = document.getElementById('canvas-container');
            if (!canvasContainer) return;

            const containerRect = canvasContainer.getBoundingClientRect();
            const tempVector = new THREE.Vector3();

            this.planetLabels.forEach((labelInfo, planetName) => {
                const planetGroup = this.planetInstances.get(planetName);
                if (!planetGroup || !labelInfo.element) return;

                // Get planet world position
                planetGroup.getWorldPosition(tempVector);

                // Calculate distance from camera
                const distance = this.camera.position.distanceTo(tempVector);

                // Check if planet is visible (not behind camera)
                const cameraDirection = new THREE.Vector3();
                this.camera.getWorldDirection(cameraDirection);
                const toPlanet = tempVector.clone().sub(this.camera.position).normalize();
                const dot = cameraDirection.dot(toPlanet);

                const isInFront = dot > 0;
                const isInRange = distance >= this.options.minDistance && distance <= this.options.maxDistance;

                if (isInFront && isInRange) {
                    // Project 3D position to 2D screen coordinates
                    const screenPosition = this.projectToScreen(tempVector, containerRect);

                    if (screenPosition) {
                        // Position the label
                        labelInfo.element.style.left = `${screenPosition.x}px`;
                        labelInfo.element.style.top = `${screenPosition.y - 20}px`; // Offset above planet

                        // Calculate opacity based on distance
                        let opacity = 1.0;
                        if (distance > this.options.fadeDistance) {
                            opacity = Math.max(0, 1.0 - (distance - this.options.fadeDistance) / (this.options.maxDistance - this.options.fadeDistance));
                        }

                        // Show label with calculated opacity
                        labelInfo.element.style.opacity = opacity.toString();
                        labelInfo.element.style.visibility = 'visible';
                        labelInfo.isVisible = true;
                    } else {
                        // Hide if projection failed
                        this.hidePlanetLabel(labelInfo);
                    }
                } else {
                    // Hide if out of range or behind camera
                    this.hidePlanetLabel(labelInfo);
                }
            });
        }

        /**
         * Project 3D world position to 2D screen coordinates
         */
        projectToScreen(worldPosition, containerRect) {
            const tempVector = worldPosition.clone();

            // Project to normalized device coordinates
            tempVector.project(this.camera);

            // Check if point is within view frustum
            if (tempVector.x < -1 || tempVector.x > 1 || tempVector.y < -1 || tempVector.y > 1 || tempVector.z < 0 || tempVector.z > 1) {
                return null;
            }

            // Convert to screen coordinates
            const screenX = (tempVector.x + 1) * containerRect.width / 2;
            const screenY = (-tempVector.y + 1) * containerRect.height / 2;

            return { x: screenX, y: screenY };
        }

        /**
         * Hide a specific planet label
         */
        hidePlanetLabel(labelInfo) {
            if (labelInfo.element && labelInfo.isVisible) {
                labelInfo.element.style.opacity = '0';
                labelInfo.element.style.visibility = 'hidden';
                labelInfo.isVisible = false;
            }
        }

        /**
         * Show or hide all planet labels
         */
        setVisible(visible) {
            this.isVisible = visible;

            if (this.labelsContainer) {
                this.labelsContainer.style.display = visible ? 'block' : 'none';
            }

            if (!visible) {
                // Hide all individual labels when system is disabled
                this.planetLabels.forEach((labelInfo) => {
                    this.hidePlanetLabel(labelInfo);
                });
            }

            if (window.Helpers) {
                window.Helpers.log(`Planet labels ${visible ? 'enabled' : 'disabled'}`, 'debug');
            }
        }

        /**
         * Toggle label visibility
         */
        toggle() {
            this.setVisible(!this.isVisible);
            return this.isVisible;
        }

        /**
         * Add label for a new planet
         */
        addPlanetLabel(planetData) {
            if (!this.planetLabels.has(planetData.name)) {
                this.createPlanetLabel(planetData);
            }
        }

        /**
         * Remove label for a planet
         */
        removePlanetLabel(planetName) {
            const labelInfo = this.planetLabels.get(planetName);
            if (labelInfo && labelInfo.element) {
                labelInfo.element.remove();
                this.planetLabels.delete(planetName);
            }
        }

        /**
         * Update camera reference
         */
        updateCamera(camera) {
            this.camera = camera;
        }

        /**
         * Update planet instances reference
         */
        updatePlanetInstances(planetInstances) {
            this.planetInstances = planetInstances;

            // Clear existing labels
            this.planetLabels.forEach((labelInfo) => {
                if (labelInfo.element) {
                    labelInfo.element.remove();
                }
            });
            this.planetLabels.clear();

            // Create new labels
            this.createPlanetLabels();
        }

        /**
         * Set label style options
         */
        setStyle(styleOptions) {
            Object.assign(this.options, styleOptions);

            // Update existing labels with new styles
            this.planetLabels.forEach((labelInfo) => {
                if (labelInfo.element) {
                    this.applyStylesToLabel(labelInfo.element);
                }
            });
        }

        /**
         * Apply styles to a label element
         */
        applyStylesToLabel(labelElement) {
            labelElement.style.backgroundColor = this.options.backgroundColor;
            labelElement.style.color = this.options.textColor;
            labelElement.style.fontSize = this.options.fontSize;
            labelElement.style.fontFamily = this.options.fontFamily;
            labelElement.style.padding = this.options.padding;
            labelElement.style.borderRadius = this.options.borderRadius;
            labelElement.style.borderColor = this.options.borderColor;
        }

        /**
         * Get label statistics
         */
        getStats() {
            return {
                isInitialized: this.isInitialized,
                isVisible: this.isVisible,
                totalLabels: this.planetLabels.size,
                visibleLabels: Array.from(this.planetLabels.values()).filter(info => info.isVisible).length
            };
        }

        /**
         * Dispose of the labels system
         */
        dispose() {
            // Cancel animation frame
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }

            // Remove all labels
            this.planetLabels.forEach((labelInfo) => {
                if (labelInfo.element) {
                    labelInfo.element.remove();
                }
            });
            this.planetLabels.clear();

            // Remove container if we created it
            if (this.labelsContainer && this.labelsContainer.parentNode) {
                this.labelsContainer.parentNode.removeChild(this.labelsContainer);
            }

            // Clear references
            this.camera = null;
            this.planetInstances = null;
            this.labelsContainer = null;
            this.isInitialized = false;

            if (window.Helpers) {
                window.Helpers.log('Planet Labels System disposed', 'debug');
            }
        }

        // Getters
        get IsVisible() { return this.isVisible; }
        get IsInitialized() { return this.isInitialized; }
        get LabelsCount() { return this.planetLabels.size; }
    }

    // Public API
    return {
        PlanetLabelsSystem,

        // Factory function
        create: (options = {}) => {
            return new PlanetLabelsSystem(options);
        }
    };
})();

// Make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.PlanetLabels;
}

console.log('PlanetLabels module loaded successfully');