// static/js/ui/header-controls.js
// Header navigation button functionality - FIXED to match planet info modal exactly

window.HeaderControls = (function() {
    'use strict';

    let isFullscreen = false;
    let helpModal = null;
    let systemInfoModal = null;

    function init() {
        setupHelpButton();
        setupFullscreenButton();
        setupSystemInfoButton();
        createModals();
        setupKeyboardShortcuts();

        if (window.Helpers) {
            window.Helpers.log('Header controls initialized', 'debug');
        }
    }

    function setupHelpButton() {
        const helpBtn = document.getElementById('help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', toggleHelpModal);
        }
    }

    function setupFullscreenButton() {
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', toggleFullscreen);
        }

        // Listen for fullscreen change events
        document.addEventListener('fullscreenchange', updateFullscreenButton);
        document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
        document.addEventListener('mozfullscreenchange', updateFullscreenButton);
        document.addEventListener('MSFullscreenChange', updateFullscreenButton);
    }

    function setupSystemInfoButton() {
        const infoBtn = document.getElementById('info-btn');
        if (infoBtn) {
            infoBtn.addEventListener('click', toggleSystemInfoModal);
        }
    }

    function createModals() {
        createHelpModal();
        createSystemInfoModal();
    }

    function createHelpModal() {
        // Remove existing help modal if any
        const existing = document.getElementById('help-modal');
        if (existing) {
            existing.remove();
        }

        // Create help modal with EXACTLY the same structure as planet info modal
        helpModal = document.createElement('div');
        helpModal.id = 'help-modal';
        helpModal.className = 'info-panel hidden';

        // Add the exact positioning styles from planet info modal
        helpModal.style.cssText = `
            position: fixed !important;
            top: 10px;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            z-index: 100;
        `;

        helpModal.innerHTML = `
            <div class="info-panel-header">
                <h3 id="help-panel-title">🎮 Help & Controls</h3>
                <button id="close-help-modal" class="close-btn">&times;</button>
            </div>
            <div id="help-panel-content" class="info-panel-content">
                <div class="info-section">
                    <h4>🖱️ Mouse Controls</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Left Click + Drag:</span>
                            <span class="info-value">Rotate around solar system</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Mouse Wheel:</span>
                            <span class="info-value">Zoom in/out</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Right Click + Drag:</span>
                            <span class="info-value">Pan view</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Click Planet:</span>
                            <span class="info-value">Select and view information</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Double-click Planet:</span>
                            <span class="info-value">Focus camera on planet</span>
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <h4>⌨️ Keyboard Shortcuts</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Space:</span>
                            <span class="info-value">Play/Pause animation</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">R:</span>
                            <span class="info-value">Reset camera view</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">1-9:</span>
                            <span class="info-value">Focus on planets</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">0:</span>
                            <span class="info-value">Focus on Sun</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">H:</span>
                            <span class="info-value">Toggle this help</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">F:</span>
                            <span class="info-value">Toggle fullscreen</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">I:</span>
                            <span class="info-value">Planet information</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">L:</span>
                            <span class="info-value">Toggle labels</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Ctrl+S:</span>
                            <span class="info-value">Take screenshot</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Escape:</span>
                            <span class="info-value">Close panels</span>
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <h4>🎛️ Control Panel</h4>
                    <div class="info-subsection">
                        <h5>Animation Controls</h5>
                        <p>Use the control panel on the right to adjust orbital motion speed (0.5x to 5x), play/pause animation, and reset the view.</p>
                    </div>
                    <div class="info-subsection">
                        <h5>Display Options</h5>
                        <p>Toggle orbit paths, planet labels, asteroid belt, and starfield visibility using the checkboxes in the control panel.</p>
                    </div>
                    <div class="info-subsection">
                        <h5>Quick Navigation</h5>
                        <p>Click planet buttons in the control panel to instantly focus the camera on any planet.</p>
                    </div>
                </div>

                <div class="info-section">
                    <h4>🌌 About the Simulation</h4>
                    <div class="info-subsection">
                        <h5>Real Astronomical Data</h5>
                        <p>This simulation uses real data from NASA and the IAU. Planet sizes and orbital distances are scaled for visualization while maintaining accurate relative proportions.</p>
                    </div>
                    <div class="info-subsection">
                        <h5>Scale Information</h5>
                        <p>Planet sizes are scaled down by ~2,000,000 times and orbital distances are compressed by ~25 times. Time is accelerated for visible orbital motion.</p>
                    </div>
                    <div class="info-subsection">
                        <h5>Educational Note</h5>
                        <p>In reality, if Earth were the size of a marble, the Sun would be about 26 feet across and the nearest star would be roughly 4,000 miles away!</p>
                    </div>
                </div>

                <div class="info-section">
                    <h4>🔧 Tips & Troubleshooting</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Performance Issues:</span>
                            <span class="info-value">Close other browser tabs</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Black Screen:</span>
                            <span class="info-value">Enable WebGL in browser</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Controls Not Working:</span>
                            <span class="info-value">Click on 3D view area</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Best Browser:</span>
                            <span class="info-value">Chrome, Firefox, Safari, Edge</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(helpModal);

        // Setup close button event listener
        const closeBtn = helpModal.querySelector('#close-help-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideHelpModal);
        }

        // Close on outside click (same as planet info modal)
        document.addEventListener('click', (event) => {
            if (helpModal && !helpModal.classList.contains('hidden') &&
                !helpModal.contains(event.target) &&
                !document.getElementById('help-btn').contains(event.target)) {
                hideHelpModal();
            }
        });
    }

    function createSystemInfoModal() {
        // Remove existing system info modal if any
        const existing = document.getElementById('system-info-modal');
        if (existing) {
            existing.remove();
        }

        // Create system info modal with EXACTLY the same structure as planet info modal
        systemInfoModal = document.createElement('div');
        systemInfoModal.id = 'system-info-modal';
        systemInfoModal.className = 'info-panel hidden';

        // Add the exact positioning styles from planet info modal
        systemInfoModal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            z-index: 100;
        `;

        systemInfoModal.innerHTML = `
            <div class="info-panel-header">
                <h3 id="system-info-panel-title">🌌 Solar System Information</h3>
                <button id="close-system-info-modal" class="close-btn">&times;</button>
            </div>
            <div id="system-info-panel-content" class="info-panel-content">
                <div id="system-info-loading">
                    <div class="info-section">
                        <h4>📊 Loading System Information...</h4>
                        <p>Please wait while we gather the latest system data...</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(systemInfoModal);

        // Setup close button event listener
        const closeBtn = systemInfoModal.querySelector('#close-system-info-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideSystemInfoModal);
        }

        // Close on outside click (same as planet info modal)
        document.addEventListener('click', (event) => {
            if (systemInfoModal && !systemInfoModal.classList.contains('hidden') &&
                !systemInfoModal.contains(event.target) &&
                !document.getElementById('info-btn').contains(event.target)) {
                hideSystemInfoModal();
            }
        });
    }

    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyH':
                    if (!event.ctrlKey && !event.metaKey && !event.altKey) {
                        event.preventDefault();
                        toggleHelpModal();
                    }
                    break;
                case 'KeyF':
                    if (!event.ctrlKey && !event.metaKey && !event.altKey) {
                        event.preventDefault();
                        toggleFullscreen();
                    }
                    break;
                case 'Escape':
                    event.preventDefault();
                    hideAllModals();
                    break;
                case 'F11':
                    // Let F11 work normally but update our button
                    setTimeout(updateFullscreenButton, 100);
                    break;
            }
        });
    }

    function toggleHelpModal() {
        if (helpModal) {
            if (helpModal.classList.contains('hidden')) {
                showHelpModal();
            } else {
                hideHelpModal();
            }
        }
    }

    function showHelpModal() {
        if (helpModal) {
            // Hide other modals first
            hideSystemInfoModal();

            // Show help modal exactly like planet info modal
            helpModal.classList.remove('hidden');
            helpModal.classList.add('fade-in');

            if (window.NotificationSystem) {
                window.NotificationSystem.showInfo('📚 Help displayed - Press H or Escape to close');
            }
        }
    }

    function hideHelpModal() {
        if (helpModal) {
            helpModal.classList.add('hidden');
            helpModal.classList.remove('fade-in');
        }
    }

    function toggleSystemInfoModal() {
        if (systemInfoModal) {
            if (systemInfoModal.classList.contains('hidden')) {
                showSystemInfoModal();
            } else {
                hideSystemInfoModal();
            }
        }
    }

    function showSystemInfoModal() {
        if (systemInfoModal) {
            // Hide other modals first
            hideHelpModal();

            // Show system info modal exactly like planet info modal
            systemInfoModal.classList.remove('hidden');
            systemInfoModal.classList.add('fade-in');

            // Load the content after showing
            loadSystemInformation();

            if (window.NotificationSystem) {
                window.NotificationSystem.showInfo('📊 System information displayed');
            }
        }
    }

    function hideSystemInfoModal() {
        if (systemInfoModal) {
            systemInfoModal.classList.add('hidden');
            systemInfoModal.classList.remove('fade-in');
        }
    }

    function loadSystemInformation() {
        const content = systemInfoModal.querySelector('#system-info-panel-content');
        if (!content) return;

        // Get system information from the app
        let systemData = {
            totalPlanets: 'Loading...',
            totalMoons: 'Loading...',
            systemAge: '4.6 billion years',
            systemDiameter: '~100,000 AU (including Oort Cloud)',
            habitable_zone: '0.95 to 1.37 AU from Sun',
            fps: 'Loading...',
            qualityLevel: 'Loading...',
            performanceMode: 'Loading...',
            objects: 'Loading...',
            triangles: 'Loading...',
            isAnimating: 'Loading...',
            animationSpeed: 'Loading...'
        };

        if (window.solarSystemApp) {
            try {
                const stats = window.solarSystemApp.getPerformanceStats ? window.solarSystemApp.getPerformanceStats() : {};
                const planets = window.solarSystemApp.Planets || [];

                systemData = {
                    totalPlanets: planets.length || 10,
                    totalMoons: planets.reduce((sum, planet) => sum + (planet.moon_count || 0), 0) || 200,
                    systemAge: '4.6 billion years',
                    systemDiameter: '~100,000 AU (including Oort Cloud)',
                    habitable_zone: '0.95 to 1.37 AU from Sun',
                    fps: Math.round(stats.fps || 60),
                    qualityLevel: stats.qualityLevel || 'High',
                    performanceMode: stats.performanceMode ? 'Enabled' : 'Disabled',
                    objects: stats.objects || 'Unknown',
                    triangles: (stats.triangles || 0).toLocaleString(),
                    isAnimating: stats.isAnimating ? 'Yes' : 'No',
                    animationSpeed: (stats.animationSpeed || 1).toFixed(1) + 'x'
                };
            } catch (error) {
                console.warn('Could not get system stats:', error);
            }
        }

        // Generate content using the same format as planet info
        content.innerHTML = `
            <div class="info-section">
                <h4>🪐 Solar System Statistics</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Total Planets:</span>
                        <span class="info-value">${systemData.totalPlanets}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total Moons:</span>
                        <span class="info-value">${systemData.totalMoons}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">System Age:</span>
                        <span class="info-value">${systemData.systemAge}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">System Diameter:</span>
                        <span class="info-value">${systemData.systemDiameter}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Habitable Zone:</span>
                        <span class="info-value">${systemData.habitable_zone}</span>
                    </div>
                </div>
            </div>

            <div class="info-section">
                <h4>⚡ Performance Information</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Frame Rate:</span>
                        <span class="info-value">${systemData.fps} FPS</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Quality Level:</span>
                        <span class="info-value">${systemData.qualityLevel}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Performance Mode:</span>
                        <span class="info-value">${systemData.performanceMode}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">3D Objects:</span>
                        <span class="info-value">${systemData.objects}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Triangles:</span>
                        <span class="info-value">${systemData.triangles}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Animation Active:</span>
                        <span class="info-value">${systemData.isAnimating}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Animation Speed:</span>
                        <span class="info-value">${systemData.animationSpeed}</span>
                    </div>
                </div>
            </div>

            <div class="info-section">
                <h4>🔧 Browser Information</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">WebGL Version:</span>
                        <span class="info-value">${getWebGLVersion()}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Screen Resolution:</span>
                        <span class="info-value">${screen.width}×${screen.height}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Viewport Size:</span>
                        <span class="info-value">${window.innerWidth}×${window.innerHeight}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Device Pixel Ratio:</span>
                        <span class="info-value">${window.devicePixelRatio}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Hardware Cores:</span>
                        <span class="info-value">${navigator.hardwareConcurrency || 'Unknown'}</span>
                    </div>
                </div>
            </div>

            <div class="info-section">
                <h4>📚 Data Sources</h4>
                <div class="info-subsection">
                    <h5>Educational Resources</h5>
                    <p>This simulation uses real astronomical data from NASA Planetary Fact Sheets, the International Astronomical Union (IAU), JPL HORIZONS System, and various peer-reviewed astronomical sources.</p>
                </div>
                <div class="info-subsection">
                    <h5>Accuracy Note</h5>
                    <p>While this simulation uses real data, sizes and distances are scaled for visualization. The relative relationships between planets are maintained accurately.</p>
                </div>
            </div>
        `;
    }

    function getWebGLVersion() {
        const canvas = document.createElement('canvas');
        const gl2 = canvas.getContext('webgl2');
        const gl1 = canvas.getContext('webgl');

        if (gl2) return 'WebGL 2.0';
        if (gl1) return 'WebGL 1.0';
        return 'Not supported';
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement &&
            !document.mozFullScreenElement &&
            !document.webkitFullscreenElement &&
            !document.msFullscreenElement) {

            // Enter fullscreen
            const element = document.documentElement;

            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }

            if (window.NotificationSystem) {
                window.NotificationSystem.showInfo('🖥️ Entered fullscreen - Press F or Escape to exit');
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }

            if (window.NotificationSystem) {
                window.NotificationSystem.showInfo('🖥️ Exited fullscreen mode');
            }
        }
    }

    function updateFullscreenButton() {
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (!fullscreenBtn) return;

        const isCurrentlyFullscreen = !!(document.fullscreenElement ||
                                        document.mozFullScreenElement ||
                                        document.webkitFullscreenElement ||
                                        document.msFullscreenElement);

        const icon = fullscreenBtn.querySelector('span');
        if (icon) {
            icon.textContent = isCurrentlyFullscreen ? '🗗' : '⛶';
        }

        fullscreenBtn.title = isCurrentlyFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen';
        isFullscreen = isCurrentlyFullscreen;
    }

    function hideAllModals() {
        hideHelpModal();
        hideSystemInfoModal();

        // Also hide info panel if it exists
        const infoPanel = document.getElementById('info-panel');
        if (infoPanel && !infoPanel.classList.contains('hidden')) {
            infoPanel.classList.add('hidden');
        }
    }

    // Public API
    return {
        init,
        toggleHelpModal,
        showHelpModal,
        hideHelpModal,
        toggleSystemInfoModal,
        showSystemInfoModal,
        hideSystemInfoModal,
        toggleFullscreen,
        hideAllModals,
        isFullscreen: () => isFullscreen
    };
})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.HeaderControls) {
        window.HeaderControls.init();
    }
});

console.log('HeaderControls module loaded successfully');