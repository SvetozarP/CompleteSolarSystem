// Test for info-panel-system.js
// Mock console methods to prevent spam during tests
const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error
};

beforeEach(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
});

afterEach(() => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
});

// Mock DOM elements
const mockElement = (props = {}) => ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    click: jest.fn(),
    dispatchEvent: jest.fn(),
    remove: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    contains: jest.fn(() => false),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    closest: jest.fn(),
    classList: {
        add: jest.fn(),
        remove: jest.fn(),
        toggle: jest.fn(),
        contains: jest.fn(() => false)
    },
    style: {},
    textContent: '',
    innerHTML: '',
    title: '',
    id: '',
    className: '',
    parentNode: null,
    nodeType: 1,
    nodeName: 'DIV',
    ...props
});

// Store original values
const originalDocument = global.document;
const originalWindow = global.window;

// Set up mocks before loading the module
beforeAll(() => {
    // Mock window
    global.window = {
        Helpers: {
            log: jest.fn()
        }
    };

    // Mock document
    global.document = {
        getElementById: jest.fn(),
        querySelector: jest.fn(),
        createElement: jest.fn(() => mockElement()),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        body: mockElement()
    };
});

// Restore original values
afterAll(() => {
    global.document = originalDocument;
    global.window = originalWindow;
});

// Load the module
require('../ui/info-panel-system.js');

describe('InfoPanelSystem', () => {
    let mockElements;
    let infoPanelSystem;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Reset window objects
        global.window.Helpers = {
            log: jest.fn()
        };

        // Reset document event listener calls
        global.document.addEventListener = jest.fn();

        // Create mock elements
        mockElements = {
            panel: mockElement({ id: 'info-panel' }),
            title: mockElement({ id: 'info-panel-title' }),
            content: mockElement({ id: 'info-panel-content' }),
            closeButton: mockElement({ id: 'close-info-panel' })
        };

        // Set up DOM queries
        global.document.getElementById = jest.fn().mockImplementation((id) => {
            const elementMap = {
                'info-panel': mockElements.panel,
                'info-panel-title': mockElements.title,
                'info-panel-content': mockElements.content,
                'close-info-panel': mockElements.closeButton
            };
            return elementMap[id] || null;
        });

        // Set up parentNode relationship
        mockElements.panel.parentNode = mockElement();
    });

    afterEach(() => {
        if (infoPanelSystem) {
            infoPanelSystem.dispose();
        }
    });

    describe('Module Loading', () => {
        test('InfoPanelSystem is available on window', () => {
            expect(window.InfoPanelSystem).toBeDefined();
            expect(typeof window.InfoPanelSystem).toBe('object');
        });

        test('InfoPanelSystem has InfoPanelSystem class', () => {
            expect(window.InfoPanelSystem.InfoPanelSystem).toBeDefined();
            expect(typeof window.InfoPanelSystem.InfoPanelSystem).toBe('function');
        });

        test('InfoPanelSystem has create factory function', () => {
            expect(window.InfoPanelSystem.create).toBeDefined();
            expect(typeof window.InfoPanelSystem.create).toBe('function');
        });
    });

    describe('Constructor and Initialization', () => {
        test('can create InfoPanelSystem with default options', () => {
            infoPanelSystem = new window.InfoPanelSystem.InfoPanelSystem();
            expect(infoPanelSystem).toBeDefined();
            expect(infoPanelSystem.options.panelId).toBe('info-panel');
            expect(infoPanelSystem.options.titleId).toBe('info-panel-title');
            expect(infoPanelSystem.options.contentId).toBe('info-panel-content');
            expect(infoPanelSystem.options.closeButtonId).toBe('close-info-panel');
        });

        test('can create InfoPanelSystem with custom options', () => {
            const customOptions = {
                panelId: 'custom-panel',
                titleId: 'custom-title',
                contentId: 'custom-content',
                closeButtonId: 'custom-close',
                animationDuration: 500
            };
            infoPanelSystem = new window.InfoPanelSystem.InfoPanelSystem(customOptions);
            expect(infoPanelSystem.options.panelId).toBe('custom-panel');
            expect(infoPanelSystem.options.titleId).toBe('custom-title');
            expect(infoPanelSystem.options.contentId).toBe('custom-content');
            expect(infoPanelSystem.options.closeButtonId).toBe('custom-close');
            expect(infoPanelSystem.options.animationDuration).toBe(500);
        });

        test('can create InfoPanelSystem using factory function', () => {
            infoPanelSystem = window.InfoPanelSystem.create();
            expect(infoPanelSystem).toBeDefined();
            expect(infoPanelSystem.options.panelId).toBe('info-panel');
        });

        test('can create InfoPanelSystem using factory function with options', () => {
            const customOptions = { panelId: 'factory-panel' };
            infoPanelSystem = window.InfoPanelSystem.create(customOptions);
            expect(infoPanelSystem.options.panelId).toBe('factory-panel');
        });

        test('initializes with correct initial state', () => {
            infoPanelSystem = new window.InfoPanelSystem.InfoPanelSystem();
            expect(infoPanelSystem.isVisible).toBe(false);
            expect(infoPanelSystem.currentPlanetData).toBe(null);
            expect(infoPanelSystem.panel).toBe(mockElements.panel);
            expect(infoPanelSystem.titleElement).toBe(mockElements.title);
            expect(infoPanelSystem.contentElement).toBe(mockElements.content);
            expect(infoPanelSystem.closeButton).toBe(mockElements.closeButton);
        });

        test('calls helper log when available', () => {
            infoPanelSystem = new window.InfoPanelSystem.InfoPanelSystem();
            expect(window.Helpers.log).toHaveBeenCalledWith('InfoPanelSystem initialized', 'debug');
        });

        test('handles missing helpers gracefully', () => {
            window.Helpers = null;
            expect(() => {
                infoPanelSystem = new window.InfoPanelSystem.InfoPanelSystem();
            }).not.toThrow();
        });
    });

    describe('Panel Creation', () => {
        test('handles missing panel gracefully', () => {
            global.document.getElementById = jest.fn().mockReturnValue(null);
            expect(() => {
                infoPanelSystem = new window.InfoPanelSystem.InfoPanelSystem();
            }).not.toThrow();
        });
    });

    describe('Event Listeners', () => {
        beforeEach(() => {
            infoPanelSystem = new window.InfoPanelSystem.InfoPanelSystem();
        });

        test('binds close button click event', () => {
            expect(mockElements.closeButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        });

        test('binds escape key event', () => {
            // Check if keydown event was bound
            const keydownCalls = global.document.addEventListener.mock.calls.filter(call => call[0] === 'keydown');
            expect(keydownCalls.length).toBeGreaterThan(0);
        });

        test('binds outside click event', () => {
            // Check if click event was bound  
            const clickCalls = global.document.addEventListener.mock.calls.filter(call => call[0] === 'click');
            expect(clickCalls.length).toBeGreaterThan(0);
        });

        test('binds custom event handlers', () => {
            // Check if custom events were bound
            const showPlanetInfoCalls = global.document.addEventListener.mock.calls.filter(call => call[0] === 'showPlanetInfo');
            const hidePlanetInfoCalls = global.document.addEventListener.mock.calls.filter(call => call[0] === 'hidePlanetInfo');
            expect(showPlanetInfoCalls.length).toBeGreaterThan(0);
            expect(hidePlanetInfoCalls.length).toBeGreaterThan(0);
        });

        test('handles missing close button gracefully', () => {
            global.document.getElementById = jest.fn().mockImplementation((id) => {
                if (id === 'close-info-panel') return null;
                return mockElements[id.replace('-', '_')] || mockElements.panel;
            });
            
            expect(() => {
                infoPanelSystem = new window.InfoPanelSystem.InfoPanelSystem();
            }).not.toThrow();
        });
    });

    describe('Show and Hide Methods', () => {
        beforeEach(() => {
            infoPanelSystem = new window.InfoPanelSystem.InfoPanelSystem();
        });

        test('show method displays panel with planet data', () => {
            const planetData = { name: 'Mars', distance_from_sun: 1.5 };
            const updateContentSpy = jest.spyOn(infoPanelSystem, 'updateContent');
            
            infoPanelSystem.show(planetData);
            
            expect(infoPanelSystem.currentPlanetData).toBe(planetData);
            expect(updateContentSpy).toHaveBeenCalledWith(planetData);
            expect(mockElements.panel.classList.remove).toHaveBeenCalledWith('hidden');
            expect(mockElements.panel.classList.add).toHaveBeenCalledWith('fade-in');
            expect(infoPanelSystem.isVisible).toBe(true);
            expect(window.Helpers.log).toHaveBeenCalledWith('Showing info panel for Mars', 'debug');
        });

        test('show method does nothing with null planet data', () => {
            infoPanelSystem.show(null);
            expect(infoPanelSystem.currentPlanetData).toBe(null);
            expect(infoPanelSystem.isVisible).toBe(false);
        });

        test('show method does nothing with missing panel', () => {
            infoPanelSystem.panel = null;
            const planetData = { name: 'Mars', distance_from_sun: 1.5 };
            
            infoPanelSystem.show(planetData);
            expect(infoPanelSystem.isVisible).toBe(false);
        });

        test('hide method hides panel', () => {
            infoPanelSystem.isVisible = true;
            infoPanelSystem.currentPlanetData = { name: 'Mars' };
            
            infoPanelSystem.hide();
            
            expect(mockElements.panel.classList.add).toHaveBeenCalledWith('hidden');
            expect(mockElements.panel.classList.remove).toHaveBeenCalledWith('fade-in');
            expect(infoPanelSystem.isVisible).toBe(false);
            expect(infoPanelSystem.currentPlanetData).toBe(null);
            expect(window.Helpers.log).toHaveBeenCalledWith('Info panel hidden', 'debug');
        });

        test('hide method does nothing when panel not visible', () => {
            infoPanelSystem.isVisible = false;
            
            infoPanelSystem.hide();
            
            expect(mockElements.panel.classList.add).not.toHaveBeenCalled();
            expect(mockElements.panel.classList.remove).not.toHaveBeenCalled();
        });

        test('hide method does nothing with missing panel', () => {
            infoPanelSystem.panel = null;
            infoPanelSystem.isVisible = true;
            
            infoPanelSystem.hide();
            expect(infoPanelSystem.isVisible).toBe(true);
        });

        test('show method handles missing helpers gracefully', () => {
            window.Helpers = null;
            const planetData = { name: 'Mars', distance_from_sun: 1.5 };
            
            expect(() => infoPanelSystem.show(planetData)).not.toThrow();
        });

        test('hide method handles missing helpers gracefully', () => {
            window.Helpers = null;
            infoPanelSystem.isVisible = true;
            
            expect(() => infoPanelSystem.hide()).not.toThrow();
        });
    });

    describe('Update Content Methods', () => {
        beforeEach(() => {
            infoPanelSystem = new window.InfoPanelSystem.InfoPanelSystem();
        });

        test('updateContent updates title and content', () => {
            const planetData = { name: 'Jupiter', distance_from_sun: 5.2 };
            const generateContentSpy = jest.spyOn(infoPanelSystem, 'generatePlanetContent').mockReturnValue('<div>Test Content</div>');
            
            infoPanelSystem.updateContent(planetData);
            
            expect(mockElements.title.textContent).toBe('Jupiter');
            expect(generateContentSpy).toHaveBeenCalledWith(planetData);
            expect(mockElements.content.innerHTML).toBe('<div>Test Content</div>');
        });

        test('updateContent does nothing with null planet data', () => {
            infoPanelSystem.updateContent(null);
            expect(mockElements.title.textContent).toBe('');
            expect(mockElements.content.innerHTML).toBe('');
        });

        test('updateContent does nothing with missing elements', () => {
            infoPanelSystem.titleElement = null;
            infoPanelSystem.contentElement = null;
            const planetData = { name: 'Jupiter', distance_from_sun: 5.2 };
            
            expect(() => infoPanelSystem.updateContent(planetData)).not.toThrow();
        });

        test('generatePlanetContent creates complete content', () => {
            const planetData = {
                name: 'Earth',
                distance_from_sun: 1.0,
                diameter: 12742,
                mass: 1.0,
                orbital_period: 365.25,
                rotation_period: 24,
                planet_type: 'terrestrial_planet',
                has_moons: true,
                moon_count: 1,
                composition: 'Rocky',
                atmosphere: 'Nitrogen and Oxygen'
            };
            
            const content = infoPanelSystem.generatePlanetContent(planetData);
            
            expect(content).toContain('Basic Information');
            expect(content).toContain('Physical Characteristics');
            expect(content).toContain('Orbital & Rotational Data');
            expect(content).toContain('Composition & Atmosphere');
            expect(content).toContain('Fun Facts');
            expect(content).toContain('Exploration');
        });
    });

    describe('Content Section Generation', () => {
        beforeEach(() => {
            infoPanelSystem = new window.InfoPanelSystem.InfoPanelSystem();
        });

        test('createBasicInfoSection generates basic info', () => {
            const planetData = {
                name: 'Venus',
                distance_from_sun: 0.72,
                planet_type: 'terrestrial_planet',
                is_dwarf_planet: false
            };
            
            const content = infoPanelSystem.createBasicInfoSection(planetData);
            
            expect(content).toContain('Basic Information');
            expect(content).toContain('Terrestrial Planet');
            expect(content).toContain('0.720 AU');
            // Check for distance section
            expect(content).toContain('Distance (km)');
        });

        test('createBasicInfoSection handles dwarf planet', () => {
            const planetData = {
                name: 'Pluto',
                distance_from_sun: 39.48,
                planet_type: 'dwarf_planet',
                is_dwarf_planet: true
            };
            
            const content = infoPanelSystem.createBasicInfoSection(planetData);
            
            expect(content).toContain('Dwarf Planet');
            expect(content).toContain('Classification');
        });

        test('createBasicInfoSection handles missing data', () => {
            const planetData = { name: 'Unknown' };
            
            const content = infoPanelSystem.createBasicInfoSection(planetData);
            
            expect(content).toContain('Unknown');
        });

        test('createPhysicalSection generates physical characteristics', () => {
            const planetData = {
                name: 'Mars',
                diameter: 6779,
                mass: 0.107,
                has_moons: true,
                moon_count: 2,
                has_rings: false
            };
            
            const content = infoPanelSystem.createPhysicalSection(planetData);
            
            expect(content).toContain('Physical Characteristics');
            expect(content).toContain('6,779 km');
            expect(content).toContain('0.53× Earth');
            expect(content).toContain('0.107× Earth');
            expect(content).toContain('Moons');
            expect(content).toContain('2');
        });

        test('createPhysicalSection handles rings', () => {
            const planetData = {
                name: 'Saturn',
                diameter: 116460,
                mass: 95.16,
                has_rings: true
            };
            
            const content = infoPanelSystem.createPhysicalSection(planetData);
            
            expect(content).toContain('Ring System');
            expect(content).toContain('Yes');
        });

        test('createOrbitalSection generates orbital data', () => {
            const planetData = {
                name: 'Jupiter',
                orbital_period: 4333,
                rotation_period: 10,
                axial_tilt: 3.1,
                orbital_eccentricity: 0.049
            };
            
            const content = infoPanelSystem.createOrbitalSection(planetData);
            
            expect(content).toContain('Orbital & Rotational Data');
            expect(content).toContain('11.86 Earth years');
            expect(content).toContain('4333.0 days');
            expect(content).toContain('0.42 Earth days');
            expect(content).toContain('3.1°');
            expect(content).toContain('0.049');
        });

        test('createOrbitalSection handles retrograde rotation', () => {
            const planetData = {
                name: 'Venus',
                orbital_period: 225,
                rotation_period: -243 * 24,
                axial_tilt: 177.4
            };
            
            const content = infoPanelSystem.createOrbitalSection(planetData);
            
            expect(content).toContain('243.00 Earth days (retrograde)');
        });

        test('createCompositionSection generates composition data', () => {
            const planetData = {
                name: 'Earth',
                composition: 'Iron, nickel, and rock',
                atmosphere: 'Nitrogen (78%), Oxygen (21%)',
                albedo: 0.3
            };
            
            const content = infoPanelSystem.createCompositionSection(planetData);
            
            expect(content).toContain('Composition & Atmosphere');
            expect(content).toContain('Iron, nickel, and rock');
            expect(content).toContain('Nitrogen (78%), Oxygen (21%)');
            expect(content).toContain('30.0%');
        });

        test('createCompositionSection handles missing data', () => {
            const planetData = { name: 'Unknown' };
            
            const content = infoPanelSystem.createCompositionSection(planetData);
            
            expect(content).toContain('Composition & Atmosphere');
            // Should not contain subsections for missing data
            expect(content).not.toContain('<h5>Composition</h5>');
            expect(content).not.toContain('<h5>Atmosphere</h5>');
        });
    });

    describe('Fun Facts Generation', () => {
        beforeEach(() => {
            infoPanelSystem = new window.InfoPanelSystem.InfoPanelSystem();
        });

        test('createFunFactsSection generates facts for known planets', () => {
            const planetData = { name: 'Mars' };
            
            const content = infoPanelSystem.createFunFactsSection(planetData);
            
            expect(content).toContain('Fun Facts');
            expect(content).toContain('Olympus Mons');
            expect(content).toContain('seasons similar to Earth');
        });

        test('createFunFactsSection returns empty for unknown planets', () => {
            const planetData = { name: 'Unknown Planet' };
            
            const content = infoPanelSystem.createFunFactsSection(planetData);
            
            expect(content).toBe('');
        });

        test('getFunFacts returns facts for all known planets', () => {
            const planets = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
            
            planets.forEach(planet => {
                const facts = infoPanelSystem.getFunFacts({ name: planet });
                expect(facts.length).toBeGreaterThan(0);
            });
        });

        test('getFunFacts returns empty array for unknown planets', () => {
            const facts = infoPanelSystem.getFunFacts({ name: 'unknown' });
            expect(facts).toEqual([]);
        });

        test('getFunFacts handles case insensitivity', () => {
            const facts = infoPanelSystem.getFunFacts({ name: 'EARTH' });
            expect(facts.length).toBeGreaterThan(0);
            expect(facts[0]).toContain('only known planet with life');
        });
    });

    describe('Exploration Information', () => {
        beforeEach(() => {
            infoPanelSystem = new window.InfoPanelSystem.InfoPanelSystem();
        });

        test('createExplorationSection generates exploration info', () => {
            const planetData = { name: 'Mars' };
            
            const content = infoPanelSystem.createExplorationSection(planetData);
            
            expect(content).toContain('Exploration');
            expect(content).toContain('Curiosity');
            expect(content).toContain('Perseverance');
        });

        test('createExplorationSection returns empty for unknown planets', () => {
            const planetData = { name: 'Unknown Planet' };
            
            const content = infoPanelSystem.createExplorationSection(planetData);
            
            // Should return content with default exploration info
            expect(content).toContain('Exploration');
            expect(content).toContain('Limited or no direct exploration missions');
        });

        test('getExplorationInfo returns info for all known planets', () => {
            const planets = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
            
            planets.forEach(planet => {
                const info = infoPanelSystem.getExplorationInfo({ name: planet });
                expect(info).toBeDefined();
                expect(info.length).toBeGreaterThan(0);
            });
        });

        test('getExplorationInfo returns default for unknown planets', () => {
            const info = infoPanelSystem.getExplorationInfo({ name: 'unknown' });
            expect(info).toBe('Limited or no direct exploration missions.');
        });

        test('getExplorationInfo handles case insensitivity', () => {
            const info = infoPanelSystem.getExplorationInfo({ name: 'MARS' });
            expect(info).toContain('Curiosity');
        });
    });

    describe('Public API Methods', () => {
        beforeEach(() => {
            infoPanelSystem = new window.InfoPanelSystem.InfoPanelSystem();
        });

        test('toggle method shows panel when hidden with data', () => {
            infoPanelSystem.isVisible = false;
            infoPanelSystem.currentPlanetData = { name: 'Earth' };
            const showSpy = jest.spyOn(infoPanelSystem, 'show');
            
            infoPanelSystem.toggle();
            
            expect(showSpy).toHaveBeenCalledWith({ name: 'Earth' });
        });

        test('toggle method hides panel when visible', () => {
            infoPanelSystem.isVisible = true;
            const hideSpy = jest.spyOn(infoPanelSystem, 'hide');
            
            infoPanelSystem.toggle();
            
            expect(hideSpy).toHaveBeenCalled();
        });

        test('toggle method does nothing when hidden and no data', () => {
            infoPanelSystem.isVisible = false;
            infoPanelSystem.currentPlanetData = null;
            const showSpy = jest.spyOn(infoPanelSystem, 'show');
            const hideSpy = jest.spyOn(infoPanelSystem, 'hide');
            
            infoPanelSystem.toggle();
            
            expect(showSpy).not.toHaveBeenCalled();
            expect(hideSpy).not.toHaveBeenCalled();
        });

        test('isOpen returns correct visibility state', () => {
            infoPanelSystem.isVisible = true;
            expect(infoPanelSystem.isOpen()).toBe(true);
            
            infoPanelSystem.isVisible = false;
            expect(infoPanelSystem.isOpen()).toBe(false);
        });

        test('getCurrentPlanet returns current planet data', () => {
            const planetData = { name: 'Saturn' };
            infoPanelSystem.currentPlanetData = planetData;
            
            expect(infoPanelSystem.getCurrentPlanet()).toBe(planetData);
        });

        test('getCurrentPlanet returns null when no data', () => {
            infoPanelSystem.currentPlanetData = null;
            
            expect(infoPanelSystem.getCurrentPlanet()).toBe(null);
        });

        test('update method shows panel when visible', () => {
            infoPanelSystem.isVisible = true;
            const planetData = { name: 'Neptune' };
            const showSpy = jest.spyOn(infoPanelSystem, 'show');
            
            infoPanelSystem.update(planetData);
            
            expect(showSpy).toHaveBeenCalledWith(planetData);
        });

        test('update method does nothing when not visible', () => {
            infoPanelSystem.isVisible = false;
            const planetData = { name: 'Neptune' };
            const showSpy = jest.spyOn(infoPanelSystem, 'show');
            
            infoPanelSystem.update(planetData);
            
            expect(showSpy).not.toHaveBeenCalled();
        });

        test('update method does nothing with null data', () => {
            infoPanelSystem.isVisible = true;
            const showSpy = jest.spyOn(infoPanelSystem, 'show');
            
            infoPanelSystem.update(null);
            
            expect(showSpy).not.toHaveBeenCalled();
        });
    });

    describe('Event Handler Functions', () => {
        beforeEach(() => {
            infoPanelSystem = new window.InfoPanelSystem.InfoPanelSystem();
        });

        test('escape key hides panel when visible', () => {
            infoPanelSystem.isVisible = true;
            const hideSpy = jest.spyOn(infoPanelSystem, 'hide');
            
            const keydownCalls = global.document.addEventListener.mock.calls.filter(call => call[0] === 'keydown');
            expect(keydownCalls.length).toBeGreaterThan(0);
            
            const keydownHandler = keydownCalls[0][1];
            keydownHandler({ key: 'Escape' });
            
            expect(hideSpy).toHaveBeenCalled();
        });

        test('escape key does nothing when panel not visible', () => {
            infoPanelSystem.isVisible = false;
            const hideSpy = jest.spyOn(infoPanelSystem, 'hide');
            
            const keydownCalls = global.document.addEventListener.mock.calls.filter(call => call[0] === 'keydown');
            expect(keydownCalls.length).toBeGreaterThan(0);
            
            const keydownHandler = keydownCalls[0][1];
            keydownHandler({ key: 'Escape' });
            
            expect(hideSpy).not.toHaveBeenCalled();
        });

        test('outside click hides panel when visible and not on canvas', () => {
            infoPanelSystem.isVisible = true;
            infoPanelSystem.panel = mockElements.panel;
            mockElements.panel.contains = jest.fn().mockReturnValue(false);
            
            const hideSpy = jest.spyOn(infoPanelSystem, 'hide');
            
            const clickCalls = global.document.addEventListener.mock.calls.filter(call => call[0] === 'click');
            expect(clickCalls.length).toBeGreaterThan(0);
            
            const clickHandler = clickCalls[0][1];
            const mockEvent = {
                target: mockElement({
                    closest: jest.fn().mockReturnValue(null)
                })
            };
            clickHandler(mockEvent);
            
            expect(hideSpy).toHaveBeenCalled();
        });

        test('outside click does nothing when clicking on canvas', () => {
            infoPanelSystem.isVisible = true;
            infoPanelSystem.panel = mockElements.panel;
            mockElements.panel.contains = jest.fn().mockReturnValue(false);
            
            const hideSpy = jest.spyOn(infoPanelSystem, 'hide');
            
            const clickCalls = global.document.addEventListener.mock.calls.filter(call => call[0] === 'click');
            expect(clickCalls.length).toBeGreaterThan(0);
            
            const clickHandler = clickCalls[0][1];
            const mockEvent = {
                target: mockElement({
                    closest: jest.fn().mockReturnValue(mockElement()) // Returns canvas element
                })
            };
            clickHandler(mockEvent);
            
            expect(hideSpy).not.toHaveBeenCalled();
        });

        test('showPlanetInfo event calls show method', () => {
            const showSpy = jest.spyOn(infoPanelSystem, 'show');
            const planetData = { name: 'Earth', distance_from_sun: 1.0 };
            
            const showPlanetInfoCalls = global.document.addEventListener.mock.calls.filter(call => call[0] === 'showPlanetInfo');
            expect(showPlanetInfoCalls.length).toBeGreaterThan(0);
            
            const showHandler = showPlanetInfoCalls[0][1];
            showHandler({ detail: { planetData } });
            
            expect(showSpy).toHaveBeenCalledWith(planetData);
        });

        test('hidePlanetInfo event calls hide method', () => {
            const hideSpy = jest.spyOn(infoPanelSystem, 'hide');
            
            const hidePlanetInfoCalls = global.document.addEventListener.mock.calls.filter(call => call[0] === 'hidePlanetInfo');
            expect(hidePlanetInfoCalls.length).toBeGreaterThan(0);
            
            const hideHandler = hidePlanetInfoCalls[0][1];
            hideHandler();
            
            expect(hideSpy).toHaveBeenCalled();
        });
    });

    describe('Dispose Method', () => {
        beforeEach(() => {
            infoPanelSystem = new window.InfoPanelSystem.InfoPanelSystem();
        });

        test('dispose removes event listeners', () => {
            infoPanelSystem.dispose();
            expect(mockElements.closeButton.removeEventListener).toHaveBeenCalledWith('click', infoPanelSystem.hide);
        });

        test('dispose removes panel from DOM', () => {
            infoPanelSystem.dispose();
            expect(mockElements.panel.parentNode.removeChild).toHaveBeenCalledWith(mockElements.panel);
        });

        test('dispose clears references', () => {
            infoPanelSystem.dispose();
            expect(infoPanelSystem.panel).toBe(null);
            expect(infoPanelSystem.titleElement).toBe(null);
            expect(infoPanelSystem.contentElement).toBe(null);
            expect(infoPanelSystem.closeButton).toBe(null);
            expect(infoPanelSystem.currentPlanetData).toBe(null);
        });

        test('dispose calls helper log when available', () => {
            infoPanelSystem.dispose();
            expect(window.Helpers.log).toHaveBeenCalledWith('InfoPanelSystem disposed', 'debug');
        });

        test('dispose handles missing helpers gracefully', () => {
            window.Helpers = null;
            expect(() => infoPanelSystem.dispose()).not.toThrow();
        });

        test('dispose handles missing close button gracefully', () => {
            infoPanelSystem.closeButton = null;
            expect(() => infoPanelSystem.dispose()).not.toThrow();
        });

        test('dispose handles missing panel gracefully', () => {
            infoPanelSystem.panel = null;
            expect(() => infoPanelSystem.dispose()).not.toThrow();
        });

        test('dispose handles panel without parent gracefully', () => {
            infoPanelSystem.panel.parentNode = null;
            expect(() => infoPanelSystem.dispose()).not.toThrow();
        });
    });
});