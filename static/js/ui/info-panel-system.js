// static/js/ui/info-panel-system.js
// Information panel system for displaying detailed planet data

window.InfoPanelSystem = (function() {
    'use strict';

    /**
     * Information panel system for planet details
     */
    class InfoPanelSystem {
        constructor(options = {}) {
            this.options = {
                panelId: 'info-panel',
                titleId: 'info-panel-title',
                contentId: 'info-panel-content',
                closeButtonId: 'close-info-panel',
                animationDuration: 300,
                ...options
            };

            this.panel = null;
            this.titleElement = null;
            this.contentElement = null;
            this.closeButton = null;
            this.isVisible = false;
            this.currentPlanetData = null;

            this.init();
        }

        /**
         * Initialize the info panel system
         */
        init() {
            this.findElements();
            this.bindEventListeners();
            this.setupEventHandlers();

            if (window.Helpers) {
                window.Helpers.log('InfoPanelSystem initialized', 'debug');
            }
        }

        /**
         * Find DOM elements
         */
        findElements() {
            this.panel = document.getElementById(this.options.panelId);
            this.titleElement = document.getElementById(this.options.titleId);
            this.contentElement = document.getElementById(this.options.contentId);
            this.closeButton = document.getElementById(this.options.closeButtonId);

            if (!this.panel) {
                console.warn('Info panel element not found, creating one');
                this.createPanel();
            }
        }

        /**
         * Create info panel if it doesn't exist
         */
        createPanel() {
            this.panel = document.createElement('div');
            this.panel.id = this.options.panelId;
            this.panel.className = 'info-panel hidden';
            this.panel.innerHTML = `
                <div class="info-panel-header">
                    <h3 id="${this.options.titleId}">Planet Information</h3>
                    <button id="${this.options.closeButtonId}" class="close-btn">&times;</button>
                </div>
                <div id="${this.options.contentId}" class="info-panel-content">
                    <!-- Content will be dynamically generated -->
                </div>
            `;

            document.body.appendChild(this.panel);

            // Re-find elements
            this.titleElement = document.getElementById(this.options.titleId);
            this.contentElement = document.getElementById(this.options.contentId);
            this.closeButton = document.getElementById(this.options.closeButtonId);
        }

        /**
         * Bind event listeners
         */
        bindEventListeners() {
            if (this.closeButton) {
                this.closeButton.addEventListener('click', this.hide.bind(this));
            }

            // Close on escape key
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && this.isVisible) {
                    this.hide();
                }
            });

            // Close on outside click
            document.addEventListener('click', (event) => {
                if (this.isVisible && this.panel && !this.panel.contains(event.target)) {
                    // Don't close if clicking on a planet (let interaction manager handle it)
                    if (!event.target.closest('canvas')) {
                        this.hide();
                    }
                }
            });
        }

        /**
         * Setup custom event handlers
         */
        setupEventHandlers() {
            document.addEventListener('showPlanetInfo', (event) => {
                this.show(event.detail.planetData);
            });

            document.addEventListener('hidePlanetInfo', () => {
                this.hide();
            });
        }

        /**
         * Show info panel with planet data
         * @param {Object} planetData - Planet data to display
         */
        show(planetData) {
            if (!planetData || !this.panel) return;

            this.currentPlanetData = planetData;
            this.updateContent(planetData);

            this.panel.classList.remove('hidden');
            this.panel.classList.add('fade-in');
            this.isVisible = true;

            if (window.Helpers) {
                window.Helpers.log(`Showing info panel for ${planetData.name}`, 'debug');
            }
        }

        /**
         * Hide info panel
         */
        hide() {
            if (!this.panel || !this.isVisible) return;

            this.panel.classList.add('hidden');
            this.panel.classList.remove('fade-in');
            this.isVisible = false;
            this.currentPlanetData = null;

            if (window.Helpers) {
                window.Helpers.log('Info panel hidden', 'debug');
            }
        }

        /**
         * Update panel content with planet data
         * @param {Object} planetData - Planet data
         */
        updateContent(planetData) {
            if (!planetData || !this.titleElement || !this.contentElement) return;

            // Update title
            this.titleElement.textContent = planetData.name;

            // Generate content
            const content = this.generatePlanetContent(planetData);
            this.contentElement.innerHTML = content;
        }

        /**
         * Generate HTML content for planet information
         * @param {Object} planetData - Planet data
         * @returns {string} HTML content
         */
        generatePlanetContent(planetData) {
            const sections = [];

            // Basic Information Section
            sections.push(this.createBasicInfoSection(planetData));

            // Physical Characteristics Section
            sections.push(this.createPhysicalSection(planetData));

            // Orbital Information Section
            sections.push(this.createOrbitalSection(planetData));

            // Composition and Atmosphere Section
            sections.push(this.createCompositionSection(planetData));

            // Fun Facts Section
            sections.push(this.createFunFactsSection(planetData));

            // Exploration Section
            sections.push(this.createExplorationSection(planetData));

            return sections.join('');
        }

        /**
         * Create basic information section
         * @param {Object} planetData - Planet data
         * @returns {string} HTML content
         */
        createBasicInfoSection(planetData) {
            const planetType = planetData.planet_type ?
                planetData.planet_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) :
                'Unknown';

            return `
                <div class="info-section">
                    <h4>Basic Information</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Type:</span>
                            <span class="info-value">${planetType}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Distance from Sun:</span>
                            <span class="info-value">${planetData.distance_from_sun?.toFixed(3)} AU</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Distance (km):</span>
                            <span class="info-value">${(planetData.distance_from_sun * 149597870.7)?.toLocaleString()} km</span>
                        </div>
                        ${planetData.is_dwarf_planet ? 
                            '<div class="info-item"><span class="info-label">Classification:</span><span class="info-value">Dwarf Planet</span></div>' : 
                            ''
                        }
                    </div>
                </div>
            `;
        }

        /**
         * Create physical characteristics section
         * @param {Object} planetData - Planet data
         * @returns {string} HTML content
         */
        createPhysicalSection(planetData) {
            const earthComparison = planetData.diameter ? (planetData.diameter / 12742).toFixed(2) : 'Unknown';
            const massComparison = planetData.mass || 'Unknown';

            return `
                <div class="info-section">
                    <h4>Physical Characteristics</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Diameter:</span>
                            <span class="info-value">${planetData.diameter?.toLocaleString()} km</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Size vs Earth:</span>
                            <span class="info-value">${earthComparison}× Earth</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Mass vs Earth:</span>
                            <span class="info-value">${massComparison}× Earth</span>
                        </div>
                        ${planetData.has_moons ? `
                            <div class="info-item">
                                <span class="info-label">Moons:</span>
                                <span class="info-value">${planetData.moon_count || 'Unknown'}</span>
                            </div>
                        ` : ''}
                        ${planetData.has_rings ? `
                            <div class="info-item">
                                <span class="info-label">Ring System:</span>
                                <span class="info-value">Yes</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        /**
         * Create orbital information section
         * @param {Object} planetData - Planet data
         * @returns {string} HTML content
         */
        createOrbitalSection(planetData) {
            const orbitalPeriodYears = planetData.orbital_period ?
                (planetData.orbital_period / 365.25).toFixed(2) : 'Unknown';

            const rotationPeriodDays = planetData.rotation_period ?
                Math.abs(planetData.rotation_period / 24).toFixed(2) : 'Unknown';

            const isRetrograde = planetData.rotation_period < 0;

            return `
                <div class="info-section">
                    <h4>Orbital & Rotational Data</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Orbital Period:</span>
                            <span class="info-value">${orbitalPeriodYears} Earth years</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Orbital Period (days):</span>
                            <span class="info-value">${planetData.orbital_period?.toFixed(1)} days</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Rotation Period:</span>
                            <span class="info-value">${rotationPeriodDays} Earth days${isRetrograde ? ' (retrograde)' : ''}</span>
                        </div>
                        ${planetData.axial_tilt !== undefined ? `
                            <div class="info-item">
                                <span class="info-label">Axial Tilt:</span>
                                <span class="info-value">${planetData.axial_tilt.toFixed(1)}°</span>
                            </div>
                        ` : ''}
                        ${planetData.orbital_eccentricity !== undefined ? `
                            <div class="info-item">
                                <span class="info-label">Orbital Eccentricity:</span>
                                <span class="info-value">${planetData.orbital_eccentricity.toFixed(3)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        /**
         * Create composition and atmosphere section
         * @param {Object} planetData - Planet data
         * @returns {string} HTML content
         */
        createCompositionSection(planetData) {
            return `
                <div class="info-section">
                    <h4>Composition & Atmosphere</h4>
                    ${planetData.composition ? `
                        <div class="info-subsection">
                            <h5>Composition</h5>
                            <p>${planetData.composition}</p>
                        </div>
                    ` : ''}
                    ${planetData.atmosphere ? `
                        <div class="info-subsection">
                            <h5>Atmosphere</h5>
                            <p>${planetData.atmosphere}</p>
                        </div>
                    ` : ''}
                    ${planetData.albedo !== undefined ? `
                        <div class="info-item">
                            <span class="info-label">Albedo (Reflectivity):</span>
                            <span class="info-value">${(planetData.albedo * 100).toFixed(1)}%</span>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Create fun facts section
         * @param {Object} planetData - Planet data
         * @returns {string} HTML content
         */
        createFunFactsSection(planetData) {
            const facts = this.getFunFacts(planetData);

            if (facts.length === 0) return '';

            return `
                <div class="info-section">
                    <h4>Fun Facts</h4>
                    <ul class="fun-facts-list">
                        ${facts.map(fact => `<li>${fact}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        /**
         * Create exploration section
         * @param {Object} planetData - Planet data
         * @returns {string} HTML content
         */
        createExplorationSection(planetData) {
            const exploration = this.getExplorationInfo(planetData);

            if (!exploration) return '';

            return `
                <div class="info-section">
                    <h4>Exploration</h4>
                    <p>${exploration}</p>
                </div>
            `;
        }

        /**
         * Get fun facts for a planet
         * @param {Object} planetData - Planet data
         * @returns {Array} Array of fun facts
         */
        getFunFacts(planetData) {
            const facts = [];
            const planetName = planetData.name.toLowerCase();

            switch (planetName) {
                case 'sun':
                    facts.push("The Sun contains 99.86% of the Solar System's mass");
                    facts.push("Light from the Sun takes about 8 minutes to reach Earth");
                    facts.push("The Sun's core temperature is about 15 million°C");
                    facts.push("The Sun converts 4 million tons of matter into energy every second");
                    break;

                case 'mercury':
                    facts.push("Has the most extreme temperature variations in the solar system");
                    facts.push("One day on Mercury lasts about 176 Earth days");
                    facts.push("Has a very large iron core relative to its size");
                    facts.push("Has almost no atmosphere to retain heat");
                    break;

                case 'venus':
                    facts.push("Hottest planet in the solar system due to greenhouse effect");
                    facts.push("Rotates backwards (retrograde rotation)");
                    facts.push("Surface pressure is 90 times that of Earth");
                    facts.push("A day on Venus is longer than its year");
                    break;

                case 'earth':
                    facts.push("The only known planet with life");
                    facts.push("71% of surface is covered by water");
                    facts.push("Has a strong magnetic field that protects from solar radiation");
                    facts.push("The Moon is unusually large compared to Earth");
                    break;

                case 'mars':
                    facts.push("Home to the largest volcano in the solar system (Olympus Mons)");
                    facts.push("Has seasons similar to Earth due to axial tilt");
                    facts.push("Evidence suggests it once had flowing water");
                    facts.push("Has polar ice caps made of water and carbon dioxide");
                    break;

                case 'jupiter':
                    facts.push("More massive than all other planets combined");
                    facts.push("Great Red Spot is a storm larger than Earth");
                    facts.push("Acts as a 'cosmic vacuum cleaner' protecting inner planets");
                    facts.push("Has at least 95 known moons");
                    break;

                case 'saturn':
                    facts.push("Less dense than water - it would float!");
                    facts.push("Ring system spans up to 282,000 km but only ~1 km thick");
                    facts.push("Has hexagonal storm at its north pole");
                    facts.push("Has 146 known moons");
                    break;

                case 'uranus':
                    facts.push("Rotates on its side with 98° axial tilt");
                    facts.push("Coldest planetary atmosphere in solar system");
                    facts.push("Was the first planet discovered with a telescope");
                    facts.push("Has a faint ring system");
                    break;

                case 'neptune':
                    facts.push("Has the strongest winds in the solar system (up to 2,100 km/h)");
                    facts.push("Takes 165 Earth years to complete one orbit");
                    facts.push("Its largest moon Triton orbits backwards");
                    facts.push("Is 30 times farther from the Sun than Earth");
                    break;

                case 'pluto':
                    facts.push("Reclassified as a dwarf planet in 2006");
                    facts.push("Has a heart-shaped feature on its surface");
                    facts.push("Its moon Charon is half the size of Pluto itself");
                    facts.push("Has a highly elliptical and tilted orbit");
                    break;
            }

            return facts;
        }

        /**
         * Get exploration information for a planet
         * @param {Object} planetData - Planet data
         * @returns {string} Exploration information
         */
        getExplorationInfo(planetData) {
            const planetName = planetData.name.toLowerCase();
            const explorationData = {
                'sun': 'Studied by numerous solar observatories including SOHO, Parker Solar Probe, and Solar Dynamics Observatory.',
                'mercury': 'Visited by Mariner 10 and MESSENGER, BepiColombo mission ongoing since 2018.',
                'venus': 'Multiple Soviet Venera missions, Magellan orbiter, current: Akatsuki orbiter.',
                'earth': 'Continuously monitored by numerous satellites and the International Space Station.',
                'mars': 'Multiple rovers including Curiosity and Perseverance, many orbiters including Mars Reconnaissance Orbiter.',
                'jupiter': 'Visited by Pioneer, Voyager, Galileo, Cassini, current: Juno orbiter studying its interior.',
                'saturn': 'Visited by Pioneer, Voyager, and the successful Cassini mission (2004-2017).',
                'uranus': 'Only visited by Voyager 2 in 1986, future missions under consideration.',
                'neptune': 'Only visited by Voyager 2 in 1989, future missions being planned.',
                'pluto': 'Visited by New Horizons flyby mission in 2015, providing detailed images and data.'
            };

            return explorationData[planetName] || 'Limited or no direct exploration missions.';
        }

        /**
         * Toggle panel visibility
         */
        toggle() {
            if (this.isVisible) {
                this.hide();
            } else if (this.currentPlanetData) {
                this.show(this.currentPlanetData);
            }
        }

        /**
         * Check if panel is visible
         * @returns {boolean} Is visible
         */
        isOpen() {
            return this.isVisible;
        }

        /**
         * Get current planet data
         * @returns {Object|null} Current planet data
         */
        getCurrentPlanet() {
            return this.currentPlanetData;
        }

        /**
         * Update panel with new data (if visible)
         * @param {Object} planetData - New planet data
         */
        update(planetData) {
            if (this.isVisible && planetData) {
                this.show(planetData);
            }
        }

        /**
         * Dispose of info panel system
         */
        dispose() {
            // Remove event listeners
            if (this.closeButton) {
                this.closeButton.removeEventListener('click', this.hide);
            }

            // Remove panel from DOM
            if (this.panel && this.panel.parentNode) {
                this.panel.parentNode.removeChild(this.panel);
            }

            // Clear references
            this.panel = null;
            this.titleElement = null;
            this.contentElement = null;
            this.closeButton = null;
            this.currentPlanetData = null;

            if (window.Helpers) {
                window.Helpers.log('InfoPanelSystem disposed', 'debug');
            }
        }
    }

    // Public API
    return {
        InfoPanelSystem,

        // Factory function
        create: (options = {}) => {
            return new InfoPanelSystem(options);
        }
    };
})();

console.log('InfoPanelSystem module loaded successfully');