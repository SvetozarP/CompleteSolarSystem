// static/js/ui/control-panel.js
// Enhanced control panel with speed 0 instead of pause functionality

window.ControlPanel = (function() {
    'use strict';

    let isCollapsed = false;
    let controls = {};
    let currentSpeed = 1.0;
    let previousSpeed = 1.0; // Store previous speed for "resume"

    function initializeControls() {
        // Get control elements
        controls = {
            panel: document.getElementById('control-panel'),
            collapseBtn: document.getElementById('collapse-panel'),
            playPauseBtn: document.getElementById('play-pause-btn'),
            resetBtn: document.getElementById('reset-btn'),
            speedSlider: document.getElementById('speed-slider'),
            speedValue: document.getElementById('speed-value'),
            speedButtons: document.querySelectorAll('.speed-btn'),
            checkboxes: {
                orbits: document.getElementById('show-orbits'),
                labels: document.getElementById('show-labels'),
                asteroids: document.getElementById('show-asteroids'),
                stars: document.getElementById('show-stars')
            },
            planetNavigation: document.getElementById('planet-navigation'),
            simTime: document.getElementById('sim-time'),
            selectedPlanet: document.getElementById('selected-planet'),
            cameraDistance: document.getElementById('camera-distance')
        };

        // Create planet navigation buttons
        createPlanetNavigationButtons();
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

        // Speed preset buttons
        controls.speedButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const speed = parseFloat(btn.dataset.speed);
                setSpeedFromUI(speed);
            });
        });

        // MODIFIED: Play/pause button now uses speed 0 instead of pause
        if (controls.playPauseBtn) {
            controls.playPauseBtn.addEventListener('click', togglePlayPause);
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

        // FIXED: Checkboxes with proper labels integration
        Object.keys(controls.checkboxes).forEach(key => {
            const checkbox = controls.checkboxes[key];
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    const enabled = e.target.checked;

                    // Emit the toggle feature event
                    document.dispatchEvent(new CustomEvent('toggleFeature', {
                        detail: { feature: key, enabled: enabled }
                    }));

                    // Special handling for labels - also update the button state
                    if (key === 'labels') {
                        const toggleLabelsBtn = document.getElementById('toggle-labels');
                        if (toggleLabelsBtn) {
                            // Update button appearance to match checkbox state
                            if (enabled) {
                                toggleLabelsBtn.style.background = 'rgba(74, 158, 255, 0.2)';
                                toggleLabelsBtn.style.borderColor = '#4a9eff';
                                toggleLabelsBtn.style.color = '#4a9eff';
                            } else {
                                toggleLabelsBtn.style.background = '';
                                toggleLabelsBtn.style.borderColor = '';
                                toggleLabelsBtn.style.color = '';
                            }
                        }
                    }

                    // Show notification
                    if (window.NotificationSystem) {
                        const featureName = key.charAt(0).toUpperCase() + key.slice(1);
                        const status = enabled ? 'enabled' : 'disabled';
                        window.NotificationSystem.showInfo(`${featureName} ${status}`);
                    }
                });
            }
        });
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
        // Store previous speed if current speed is not 0
        if (currentSpeed !== 0) {
            previousSpeed = currentSpeed;
        }

        currentSpeed = speed;

        if (controls.speedValue) {
            controls.speedValue.textContent = speed.toFixed(1) + 'x';
        }

        updateSpeedButtons(speed);
        updatePlayPauseButton(speed);

        // Debug log
        console.log('Setting speed to:', speed, 'Previous speed:', previousSpeed);

        // Emit speed change event
        const event = new CustomEvent('speedChanged', {
            detail: { speed: speed }
        });

        console.log('Dispatching speedChanged event:', event.detail); // Debug log
        document.dispatchEvent(event);
    }

    function setSpeedFromUI(speed) {
        if (controls.speedSlider) {
            controls.speedSlider.value = speed;
        }
        setSpeed(speed);
    }

    function updateSpeedButtons(currentSpeed) {
        controls.speedButtons.forEach(btn => {
            const btnSpeed = parseFloat(btn.dataset.speed);
            btn.classList.toggle('active', Math.abs(btnSpeed - currentSpeed) < 0.1);
        });
    }

    // MODIFIED: Update play/pause button based on speed instead of play state
    function updatePlayPauseButton(speed) {
        const icon = document.getElementById('play-pause-icon');
        const text = document.getElementById('play-pause-text');

        if (icon && text) {
            const isPlaying = speed > 0;
            icon.textContent = isPlaying ? '⏸️' : '▶️';
            text.textContent = isPlaying ? 'Pause' : 'Play';
        }
    }

    // MODIFIED: Toggle between speed 0 and previous speed instead of pause/play
    function togglePlayPause() {
        console.log('togglePlayPause called. Current speed:', currentSpeed, 'Previous speed:', previousSpeed); // Debug log

        if (currentSpeed > 0) {
            // Currently playing - set speed to 0 (pause)
            previousSpeed = currentSpeed;
            console.log('Pausing: setting speed to 0, storing previous speed:', previousSpeed); // Debug log
            setSpeedFromUI(0);

            if (window.NotificationSystem) {
                window.NotificationSystem.showInfo('Animation paused (speed set to 0)');
            }
        } else {
            // Currently at speed 0 - restore previous speed (play)
            const resumeSpeed = previousSpeed > 0 ? previousSpeed : 1.0;
            console.log('Resuming: setting speed to:', resumeSpeed); // Debug log
            setSpeedFromUI(resumeSpeed);

            if (window.NotificationSystem) {
                window.NotificationSystem.showInfo(`Animation resumed (speed: ${resumeSpeed.toFixed(1)}x)`);
            }
        }
    }

    function focusOnPlanet(planetName) {
        // Emit event that the main app will handle
        document.dispatchEvent(new CustomEvent('focusPlanet', {
            detail: { planet: planetName }
        }));
    }

    function updateSelectedPlanetButton(selectedButton) {
        // Remove selection from all planet buttons
        const allButtons = controls.planetNavigation.querySelectorAll('.planet-btn');
        allButtons.forEach(btn => btn.classList.remove('selected'));

        // Add selection to clicked button
        if (selectedButton) {
            selectedButton.classList.add('selected');
        }
    }

    return {
        init: function() {
            initializeControls();
            setupEventListeners();

            if (window.Helpers) {
                window.Helpers.log('Enhanced Control Panel with speed-based pause initialized', 'debug');
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

        // Animation controls - MODIFIED to use speed instead of play/pause state
        setSpeed: setSpeedFromUI,
        getSpeed: () => currentSpeed,
        togglePlayPause: togglePlayPause,
        pause: () => {
            if (currentSpeed > 0) {
                previousSpeed = currentSpeed;
                setSpeedFromUI(0);
            }
        },
        play: () => {
            if (currentSpeed === 0) {
                const resumeSpeed = previousSpeed > 0 ? previousSpeed : 1.0;
                setSpeedFromUI(resumeSpeed);
            }
        },
        isPlaying: () => currentSpeed > 0, // MODIFIED: playing means speed > 0

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

        // Keyboard shortcuts
        handleKeyPress: function(event) {
            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'KeyR':
                    event.preventDefault();
                    document.dispatchEvent(new CustomEvent('resetView'));
                    break;
                case 'KeyH':
                    event.preventDefault();
                    document.dispatchEvent(new CustomEvent('toggleHelp'));
                    break;
                case 'Escape':
                    event.preventDefault();
                    document.dispatchEvent(new CustomEvent('closeAllPanels'));
                    break;
                default:
                    // Handle number keys for planet selection
                    if (event.code.startsWith('Digit')) {
                        const digit = event.code.replace('Digit', '');
                        const button = controls.planetNavigation.querySelector(`[data-key="${digit}"]`);
                        if (button) {
                            event.preventDefault();
                            button.click();
                        }
                    }
                    break;
            }
        },

        // Synchronize feature states (useful for external toggles)
        syncFeatureState: function(feature, enabled) {
            const checkbox = controls.checkboxes[feature];
            if (checkbox) {
                checkbox.checked = enabled;
                // Trigger the change event to update everything
                checkbox.dispatchEvent(new Event('change'));
            }
        },

        // Method to get all checkbox states
        getFeatureStates: function() {
            const states = {};
            Object.keys(controls.checkboxes).forEach(key => {
                const checkbox = controls.checkboxes[key];
                if (checkbox) {
                    states[key] = checkbox.checked;
                }
            });
            return states;
        },

        // Get current state - MODIFIED to reflect speed-based state
        getState: function() {
            return {
                isCollapsed,
                isPlaying: currentSpeed > 0, // MODIFIED: based on speed
                currentSpeed,
                previousSpeed, // NEW: track previous speed for resume
                features: {
                    orbits: this.getFeature('orbits'),
                    labels: this.getFeature('labels'),
                    asteroids: this.getFeature('asteroids'),
                    stars: this.getFeature('stars')
                }
            };
        }
    };
})();

console.log('Enhanced ControlPanel with speed-based pause loaded successfully');