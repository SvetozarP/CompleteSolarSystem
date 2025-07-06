// static/js/ui/control-panel.js
// FIXED: Consolidated keyboard handling with all functionality

window.ControlPanel = (function() {
    'use strict';

    let isCollapsed = false;
    let controls = {};
    let currentSpeed = 1.0;

    function initializeControls() {
        // Get control elements - EXPLICITLY EXCLUDE play-pause button
        controls = {
            panel: document.getElementById('control-panel') ||
                   document.querySelector('.control-panel'),

            collapseBtn: document.getElementById('collapse-panel') ||
                        document.querySelector('.collapse-btn'),

            resetBtn: document.getElementById('reset-btn') ||
                      document.querySelector('.reset-btn'),

            speedSlider: document.getElementById('speed-slider') ||
                        document.querySelector('.slider'),

            speedValue: document.getElementById('speed-value') ||
                       document.querySelector('.speed-display'),

            speedButtons: document.querySelectorAll('.speed-btn'),

            checkboxes: {
                orbits: document.getElementById('show-orbits'),
                labels: document.getElementById('show-labels'),
                asteroids: document.getElementById('show-asteroids'),
                stars: document.getElementById('show-stars')
            },

            planetNavigation: document.getElementById('planet-navigation') ||
                             document.querySelector('.planet-buttons'),

            simTime: document.getElementById('sim-time'),
            selectedPlanet: document.getElementById('selected-planet'),
            cameraDistance: document.getElementById('camera-distance')
        };

        // FIRST: Remove any existing play-pause button
        removePlayPauseButton();

        // THEN: Create speed buttons (including speed 0)
        ensureSpeedButtons();

        // Create planet navigation buttons
        createPlanetNavigationButtons();

        console.log('Control elements found:', {
            panel: !!controls.panel,
            speedSlider: !!controls.speedSlider,
            speedButtons: controls.speedButtons.length,
            resetBtn: !!controls.resetBtn
        });
    }

    function removePlayPauseButton() {
        // Find and remove any play-pause button
        const playPauseSelectors = [
            '#play-pause-btn',
            '.play-pause-btn',
            '[id*="play-pause"]',
            '[class*="play-pause"]'
        ];

        playPauseSelectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                console.log('Removing play-pause button:', selector);
                element.remove();
            }
        });
    }

    function ensureSpeedButtons() {
        // Force recreate speed buttons with speed 0
        let speedContainer = document.querySelector('.speed-presets');

        if (!speedContainer) {
            speedContainer = document.createElement('div');
            speedContainer.className = 'speed-presets';
            speedContainer.style.cssText = `
                display: flex;
                gap: 8px;
                margin-top: 12px;
                flex-wrap: wrap;
                justify-content: center;
            `;

            // Find where to insert the speed buttons
            const insertTarget = controls.speedSlider?.parentNode ||
                                controls.panel?.querySelector('.panel-content') ||
                                controls.panel;

            if (insertTarget) {
                insertTarget.appendChild(speedContainer);
                console.log('Created speed buttons container');
            }
        } else {
            // Clear existing buttons
            speedContainer.innerHTML = '';
        }

        // Create the speed buttons including speed 0
        const speedConfigs = [
            { speed: 0, label: '⏸️', title: 'Pause (Speed 0)', class: 'pause' },
            { speed: 0.5, label: '0.5x', title: 'Half Speed', class: 'slow' },
            { speed: 1, label: '1x', title: 'Normal Speed', class: 'normal' },
            { speed: 2, label: '2x', title: 'Double Speed', class: 'fast' },
            { speed: 5, label: '5x', title: 'Very Fast', class: 'fastest' }
        ];

        speedConfigs.forEach(({ speed, label, title, class: btnClass }) => {
            const button = document.createElement('button');
            button.className = `speed-btn speed-${btnClass}`;
            button.dataset.speed = speed;
            button.textContent = label;
            button.title = title;

            // Base styles
            button.style.cssText = `
                padding: 8px 12px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                background: rgba(0, 0, 0, 0.3);
                color: #cbd5e1;
                cursor: pointer;
                transition: all 0.15s ease-in-out;
                font-size: 0.85rem;
                min-width: 45px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: inherit;
            `;

            // Special styling for different speed types
            if (speed === 0) {
                button.style.background = 'rgba(239, 68, 68, 0.15)';
                button.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                button.style.color = '#ef4444';
                button.style.fontWeight = 'bold';
            } else if (speed === 1) {
                // Default active for normal speed
                button.classList.add('active');
                button.style.background = '#4a9eff';
                button.style.borderColor = '#4a9eff';
                button.style.color = 'white';
                button.style.boxShadow = '0 2px 8px rgba(74, 158, 255, 0.3)';
            }

            // Add hover effects
            button.addEventListener('mouseenter', () => {
                if (!button.classList.contains('active')) {
                    if (speed === 0) {
                        button.style.background = 'rgba(239, 68, 68, 0.25)';
                        button.style.borderColor = '#ef4444';
                    } else {
                        button.style.background = 'rgba(74, 158, 255, 0.2)';
                        button.style.borderColor = '#4a9eff';
                        button.style.color = '#4a9eff';
                    }
                    button.style.transform = 'translateY(-1px)';
                }
            });

            button.addEventListener('mouseleave', () => {
                if (!button.classList.contains('active')) {
                    if (speed === 0) {
                        button.style.background = 'rgba(239, 68, 68, 0.15)';
                        button.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                        button.style.color = '#ef4444';
                    } else {
                        button.style.background = 'rgba(0, 0, 0, 0.3)';
                        button.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        button.style.color = '#cbd5e1';
                    }
                    button.style.transform = 'translateY(0)';
                }
            });

            speedContainer.appendChild(button);
        });

        // Update controls reference
        controls.speedButtons = speedContainer.querySelectorAll('.speed-btn');

        console.log(`Created ${controls.speedButtons.length} speed buttons including speed 0`);
    }

    function createPlanetNavigationButtons() {
        if (!controls.planetNavigation) return;

        const planets = [
            { name: 'Sun', key: '0' },
            { name: 'Mercury', key: '1' },
            { name: 'Venus', key: '2' },
            { name: 'Earth', key: '3' },
            { name: 'Mars', key: '4' },
            { name: 'Jupiter', key: '5' },
            { name: 'Saturn', key: '6' },
            { name: 'Uranus', key: '7' },
            { name: 'Neptune', key: '8' },
            { name: 'Pluto', key: '9' }
        ];

        controls.planetNavigation.innerHTML = '';

        planets.forEach(planet => {
            const button = document.createElement('button');
            button.className = 'planet-btn';
            button.textContent = planet.name;
            button.dataset.planet = planet.name.toLowerCase();
            button.dataset.key = planet.key;
            button.title = `Focus on ${planet.name} (${planet.key})`;

            button.addEventListener('click', () => {
                focusOnPlanet(planet.name);
                updateSelectedPlanetButton(button);
            });

            controls.planetNavigation.appendChild(button);
        });
    }

    function setupEventListeners() {
        // Collapse panel
        if (controls.collapseBtn) {
            controls.collapseBtn.addEventListener('click', togglePanel);
        }

        // Speed slider
        if (controls.speedSlider) {
            controls.speedSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                setSpeed(value);
            });
        }

        // Speed preset buttons - INCLUDING SPEED 0
        if (controls.speedButtons) {
            controls.speedButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const speed = parseFloat(btn.dataset.speed);
                    console.log(`Speed button clicked: ${speed}`);
                    setSpeedFromUI(speed);
                });
            });
        }

        // Reset button
        if (controls.resetBtn) {
            controls.resetBtn.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('resetView'));
                if (window.NotificationSystem) {
                    window.NotificationSystem.showInfo('View reset to default position');
                }
            });
        }

        // Checkboxes
        Object.keys(controls.checkboxes).forEach(key => {
            const checkbox = controls.checkboxes[key];
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    const enabled = e.target.checked;

                    document.dispatchEvent(new CustomEvent('toggleFeature', {
                        detail: { feature: key, enabled: enabled }
                    }));

                    if (window.NotificationSystem) {
                        const featureName = key.charAt(0).toUpperCase() + key.slice(1);
                        const status = enabled ? 'enabled' : 'disabled';
                        window.NotificationSystem.showInfo(`${featureName} ${status}`);
                    }
                });
            }
        });

        console.log('Event listeners setup complete');
    }


    function togglePanel() {
        isCollapsed = !isCollapsed;
        if (controls.panel) {
            controls.panel.classList.toggle('collapsed', isCollapsed);
            if (controls.collapseBtn) {
                controls.collapseBtn.textContent = isCollapsed ? '+' : '−';
                controls.collapseBtn.title = isCollapsed ? 'Expand Panel' : 'Collapse Panel';
            }
        }
    }

    function setSpeed(speed) {
        currentSpeed = speed;

        // Update speed display
        if (controls.speedValue) {
            if (speed === 0) {
                controls.speedValue.textContent = 'Paused';
                controls.speedValue.style.color = '#ef4444';
            } else {
                controls.speedValue.textContent = speed.toFixed(1) + 'x';
                controls.speedValue.style.color = '#4a9eff';
            }
        }

        // Update speed slider
        if (controls.speedSlider) {
            controls.speedSlider.value = speed;
        }

        // Update button states
        updateSpeedButtons(speed);

        console.log('Speed set to:', speed);

        // Emit speed change event
        document.dispatchEvent(new CustomEvent('speedChanged', {
            detail: { speed: speed }
        }));

        // Show notification
        if (window.NotificationSystem) {
            if (speed === 0) {
                window.NotificationSystem.showInfo('⏸️ Animation paused');
            } else {
                window.NotificationSystem.showInfo(`🚀 Speed: ${speed.toFixed(1)}x`);
            }
        }
    }

    function setSpeedFromUI(speed) {
        setSpeed(speed);
    }

    function updateSpeedButtons(currentSpeed) {
        if (!controls.speedButtons) return;

        controls.speedButtons.forEach(btn => {
            const btnSpeed = parseFloat(btn.dataset.speed);
            const isActive = Math.abs(btnSpeed - currentSpeed) < 0.1;

            btn.classList.toggle('active', isActive);

            // Update visual styling
            if (isActive) {
                if (btnSpeed === 0) {
                    // Active pause button
                    btn.style.background = '#ef4444';
                    btn.style.borderColor = '#ef4444';
                    btn.style.color = 'white';
                    btn.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.4)';
                } else {
                    // Active speed button
                    btn.style.background = '#4a9eff';
                    btn.style.borderColor = '#4a9eff';
                    btn.style.color = 'white';
                    btn.style.boxShadow = '0 2px 8px rgba(74, 158, 255, 0.3)';
                }
                btn.style.transform = 'translateY(0)';
            } else {
                // Inactive button
                if (btnSpeed === 0) {
                    btn.style.background = 'rgba(239, 68, 68, 0.15)';
                    btn.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                    btn.style.color = '#ef4444';
                } else {
                    btn.style.background = 'rgba(0, 0, 0, 0.3)';
                    btn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    btn.style.color = '#cbd5e1';
                }
                btn.style.boxShadow = 'none';
                btn.style.transform = 'translateY(0)';
            }
        });
    }

    function focusOnPlanet(planetName) {
        document.dispatchEvent(new CustomEvent('focusPlanet', {
            detail: { planet: planetName }
        }));
    }

    function updateSelectedPlanetButton(selectedButton) {
        if (!controls.planetNavigation) return;

        const allButtons = controls.planetNavigation.querySelectorAll('.planet-btn');
        allButtons.forEach(btn => btn.classList.remove('selected'));

        if (selectedButton) {
            selectedButton.classList.add('selected');
        }
    }

    // Helper functions for keyboard shortcuts
    function toggleLabels() {
        const labelsCheckbox = controls.checkboxes.labels;
        if (labelsCheckbox) {
            labelsCheckbox.checked = !labelsCheckbox.checked;
            labelsCheckbox.dispatchEvent(new Event('change'));
        }
    }

    function togglePlanetInfo() {
        if (window.solarSystemApp && window.solarSystemApp.interactionManager) {
            const selectedPlanet = window.solarSystemApp.interactionManager.SelectedPlanet;
            if (selectedPlanet) {
                const infoPanel = document.getElementById('info-panel');
                if (infoPanel) {
                    infoPanel.classList.toggle('hidden');

                    if (window.NotificationSystem) {
                        const isVisible = !infoPanel.classList.contains('hidden');
                        window.NotificationSystem.showInfo(
                            `ℹ️ Planet info ${isVisible ? 'shown' : 'hidden'}`
                        );
                    }
                }
            } else {
                if (window.NotificationSystem) {
                    window.NotificationSystem.showWarning('No planet selected');
                }
            }
        }
    }

    function togglePlanetFollowing() {
        if (window.solarSystemApp && window.solarSystemApp.togglePlanetFollowing) {
            window.solarSystemApp.togglePlanetFollowing();
        }
    }

    function takeScreenshot() {
        if (window.solarSystemApp && window.solarSystemApp.sceneManager) {
            try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `solar-system-${timestamp}.png`;
                window.solarSystemApp.sceneManager.takeScreenshot(filename);

                if (window.NotificationSystem) {
                    window.NotificationSystem.showSuccess('📷 Screenshot saved!');
                }
            } catch (error) {
                console.error('Screenshot failed:', error);
                if (window.NotificationSystem) {
                    window.NotificationSystem.showError('Screenshot failed');
                }
            }
        }
    }

    function performZoom(direction) {
        // direction: 'in' or 'out'
        const zoomBtn = document.getElementById(direction === 'in' ? 'zoom-in' : 'zoom-out');
        if (zoomBtn) {
            zoomBtn.click();
        } else {
            // Direct zoom implementation if buttons not available
            if (window.solarSystemApp && window.solarSystemApp.cameraControls) {
                const controls = window.solarSystemApp.cameraControls;
                const camera = controls.camera;
                const zoomFactor = direction === 'in' ? 0.8 : 1.25;

                if (controls.IsFollowing) {
                    controls.followDistance = direction === 'in' ?
                        Math.max(controls.followDistance * zoomFactor, 5) :
                        Math.min(controls.followDistance * zoomFactor, 200);

                    if (controls.followedPlanet) {
                        const planetPosition = new THREE.Vector3();
                        controls.followedPlanet.getWorldPosition(planetPosition);
                        controls.followOffset.normalize().multiplyScalar(controls.followDistance);
                        camera.position.copy(planetPosition).add(controls.followOffset);
                        camera.lookAt(planetPosition);
                    }
                } else {
                    const direction = new THREE.Vector3();
                    camera.getWorldDirection(direction);
                    const zoomDistance = camera.position.distanceTo(controls.target) * 0.2;
                    camera.position.add(direction.multiplyScalar(
                        direction === 'in' ? zoomDistance : -zoomDistance
                    ));
                }

                controls.updateSphericalFromCamera();
            }
        }
    }

    function resetZoom() {
        const zoomResetBtn = document.getElementById('zoom-reset');
        if (zoomResetBtn) {
            zoomResetBtn.click();
        } else if (window.solarSystemApp && window.solarSystemApp.resetCameraView) {
            window.solarSystemApp.resetCameraView();
        }
    }

    function stopFollowing() {
        if (window.solarSystemApp && window.solarSystemApp.stopFollowingPlanet) {
            window.solarSystemApp.stopFollowingPlanet();
        }

        // Close any open panels
        const panels = ['help-modal', 'system-info-modal', 'info-panel'];
        panels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel && !panel.classList.contains('hidden')) {
                panel.classList.add('hidden');
            }
        });
    }

    return {
        init: function() {
            console.log('🎮 Initializing ControlPanel with consolidated keyboard handling...');

            // Wait a moment for DOM to be ready
            setTimeout(() => {
                initializeControls();
                setupEventListeners();
                console.log('✅ ControlPanel initialization complete');
            }, 100);

            if (window.Helpers) {
                window.Helpers.log('Enhanced Control Panel with consolidated controls initialized', 'debug');
            }
        },

        // Panel management
        togglePanel: togglePanel,
        collapse: () => {
            if (!isCollapsed) togglePanel();
        },
        expand: () => {
            if (isCollapsed) togglePanel();
        },

        // Speed controls
        setSpeed: setSpeedFromUI,
        getSpeed: () => currentSpeed,
        pause: () => setSpeedFromUI(0),
        resume: () => setSpeedFromUI(currentSpeed > 0 ? currentSpeed : 1.0),
        isPlaying: () => currentSpeed > 0,

        // Feature toggles
        setFeature: function(feature, enabled) {
            const checkbox = controls.checkboxes[feature];
            if (checkbox) {
                checkbox.checked = enabled;
                checkbox.dispatchEvent(new Event('change'));
            }
        },

        getFeature: function(feature) {
            const checkbox = controls.checkboxes[feature];
            return checkbox ? checkbox.checked : false;
        },

        // Planet navigation
        focusOnPlanet: focusOnPlanet,
        selectPlanet: function(planetName) {
            if (!controls.planetNavigation) return;
            const button = controls.planetNavigation.querySelector(`[data-planet="${planetName.toLowerCase()}"]`);
            if (button) {
                updateSelectedPlanetButton(button);
            }
        },

        // Information display updates
        updateSimulationTime: function(timeString) {
            if (controls.simTime) {
                controls.simTime.textContent = timeString;
            }
        },

        updateSelectedPlanet: function(planetName) {
            if (controls.selectedPlanet) {
                controls.selectedPlanet.textContent = planetName || 'None';
            }
        },

        updateCameraDistance: function(distance) {
            if (controls.cameraDistance) {
                controls.cameraDistance.textContent = distance.toFixed(1) + ' AU';
            }
        },

        // CONSOLIDATED KEYBOARD SHORTCUTS - All functionality in one place
        handleKeyPress: function(event) {
            console.log('Handling key press:', event.code);

            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    event.stopPropagation();
                    if (currentSpeed === 0) {
                        this.setSpeed(1.0);
                    } else {
                        this.setSpeed(0);
                    }
                    return true; // Handled

                case 'KeyR':
                    event.preventDefault();
                    event.stopPropagation();
                    document.dispatchEvent(new CustomEvent('resetView'));
                    return true; // Handled

                case 'KeyH':
                    event.preventDefault();
                    event.stopPropagation();
                    // Emit event for HeaderControls to handle
                    document.dispatchEvent(new CustomEvent('toggleHelp'));
                    return true; // Handled

                case 'KeyI':
                    event.preventDefault();
                    event.stopPropagation();
                    togglePlanetInfo();
                    return true; // Handled

                case 'KeyF':
                    if (!event.ctrlKey && !event.metaKey && !event.altKey) {
                        event.preventDefault();
                        event.stopPropagation();
                        // Emit event for HeaderControls to handle fullscreen
                        document.dispatchEvent(new CustomEvent('toggleFullscreen'));
                        return true; // Handled
                    }
                    break;

                case 'KeyL':
                    event.preventDefault();
                    event.stopPropagation();
                    toggleLabels();
                    return true; // Handled

                case 'KeyS':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        event.stopPropagation();
                        takeScreenshot();
                        return true; // Handled
                    }
                    break;

                case 'Equal':
                case 'NumpadAdd':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        event.stopPropagation();
                        performZoom('in');
                        return true; // Handled
                    }
                    break;

                case 'Minus':
                case 'NumpadSubtract':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        event.stopPropagation();
                        performZoom('out');
                        return true; // Handled
                    }
                    break;

                case 'Digit0':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        event.stopPropagation();
                        resetZoom();
                        return true; // Handled
                    } else {
                        // Focus on Sun
                        event.preventDefault();
                        event.stopPropagation();
                        focusOnPlanet('Sun');
                        const button = controls.planetNavigation?.querySelector(`[data-key="0"]`);
                        if (button) updateSelectedPlanetButton(button);
                        return true; // Handled
                    }

                case 'Escape':
                    event.preventDefault();
                    event.stopPropagation();
                    stopFollowing();
                    return true; // Handled

                default:
                    if (event.code.startsWith('Digit')) {
                        const digit = event.code.replace('Digit', '');
                        if (controls.planetNavigation) {
                            const button = controls.planetNavigation.querySelector(`[data-key="${digit}"]`);
                            if (button) {
                                event.preventDefault();
                                event.stopPropagation();
                                const planetName = button.textContent;
                                focusOnPlanet(planetName);
                                updateSelectedPlanetButton(button);
                                return true; // Handled
                            }
                        }
                    }
                    break;
            }
            return false; // Not handled
        },

        // State management
        getState: function() {
            return {
                isCollapsed,
                currentSpeed,
                isPlaying: currentSpeed > 0,
                features: {
                    orbits: this.getFeature('orbits'),
                    labels: this.getFeature('labels'),
                    asteroids: this.getFeature('asteroids'),
                    stars: this.getFeature('stars')
                }
            };
        },

        // Debug method
        debugControls: function() {
            console.log('🔍 Control Panel Debug Info:', {
                panel: !!controls.panel,
                speedSlider: !!controls.speedSlider,
                speedButtons: controls.speedButtons?.length || 0,
                currentSpeed,
                speedButtonsData: Array.from(controls.speedButtons || []).map(btn => ({
                    speed: btn.dataset.speed,
                    text: btn.textContent,
                    active: btn.classList.contains('active')
                }))
            });
        }
    };
})();

console.log('✅ CONSOLIDATED ControlPanel with unified keyboard handling loaded successfully');