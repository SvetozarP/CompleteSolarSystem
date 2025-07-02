# solar_system/management/commands/populate_enhanced_planets.py

from django.core.management.base import BaseCommand, CommandError
from solar_system.models import Planet
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """
    Enhanced management command to populate comprehensive planetary data.

    Includes detailed information about:
    - Physical characteristics with precise measurements
    - Orbital mechanics with detailed parameters
    - Moon systems with major satellites
    - Ring systems with composition data
    - Surface features and geological information
    - Atmospheric composition and weather patterns
    - Exploration history and missions
    - Fun facts and educational content

    Usage: python manage.py populate_enhanced_planets --verbose --include-moons --include-rings
    """

    help = 'Populate the database with comprehensive solar system planetary data including moons and rings'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing planet data before populating',
        )

        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Enable verbose output with detailed logging',
        )

        parser.add_argument(
            '--include-moons',
            action='store_true',
            help='Include detailed moon system information',
        )

        parser.add_argument(
            '--include-rings',
            action='store_true',
            help='Include detailed ring system information',
        )

        parser.add_argument(
            '--update-existing',
            action='store_true',
            help='Update existing planets instead of skipping them',
        )

        parser.add_argument(
            '--export-json',
            type=str,
            help='Export populated data to JSON file',
        )

    def handle(self, *args, **options):
        """Main command handler with enhanced error handling and logging."""

        verbose = options['verbose']
        include_moons = options['include_moons']
        include_rings = options['include_rings']
        update_existing = options['update_existing']
        export_json = options.get('export_json')

        if verbose:
            self.stdout.write(
                self.style.SUCCESS(
                    '🌌 Starting Enhanced Solar System Data Population'
                )
            )
            self.stdout.write(f'Options: Moons={include_moons}, Rings={include_rings}, Update={update_existing}')

        if options['clear']:
            self.stdout.write('🧹 Clearing existing planet data...')
            deleted_count = Planet.objects.all().delete()[0]
            self.stdout.write(f'   Deleted {deleted_count} existing records')

        try:
            # Populate planets with enhanced data
            created_count, updated_count = self._populate_enhanced_planets(
                verbose, include_moons, include_rings, update_existing
            )

            # Create the Sun as central star
            sun_created = self._create_enhanced_sun(verbose, update_existing)

            # Export to JSON if requested
            if export_json:
                self._export_to_json(export_json, verbose)

            # Summary statistics
            total_planets = Planet.objects.count()
            planets_with_moons = Planet.objects.filter(has_moons=True).count()
            planets_with_rings = Planet.objects.filter(has_rings=True).count()
            total_moons = sum(p.moon_count for p in Planet.objects.all())

            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✅ Enhanced Solar System Data Population Complete!'
                )
            )
            self.stdout.write(f'   📊 Statistics:')
            self.stdout.write(f'      • Total celestial bodies: {total_planets}')
            self.stdout.write(f'      • Planets created: {created_count}')
            self.stdout.write(f'      • Planets updated: {updated_count}')
            self.stdout.write(f'      • Sun created/updated: {"Yes" if sun_created else "No"}')
            self.stdout.write(f'      • Planets with moons: {planets_with_moons}')
            self.stdout.write(f'      • Planets with rings: {planets_with_rings}')
            self.stdout.write(f'      • Total known moons: {total_moons}')

        except Exception as e:
            logger.error(f"Error populating enhanced planets: {e}")
            raise CommandError(f'Failed to populate enhanced planetary data: {e}')

    def _populate_enhanced_planets(self, verbose=False, include_moons=False, include_rings=False,
                                   update_existing=False):
        """Create all planet objects with comprehensive enhanced data."""

        planets_data = self._get_enhanced_planetary_data(include_moons, include_rings)
        created_count = 0
        updated_count = 0

        for planet_data in planets_data:
            planet, created = Planet.objects.get_or_create(
                name=planet_data['name'],
                defaults=planet_data
            )

            if created:
                created_count += 1
                action = '✨ Created'
            elif update_existing:
                # Update existing planet with enhanced data
                for key, value in planet_data.items():
                    setattr(planet, key, value)
                planet.save()
                updated_count += 1
                action = '🔄 Updated'
            else:
                action = '⏭️  Skipped (exists)'

            if verbose:
                moon_info = f" ({planet_data.get('moon_count', 0)} moons)" if planet_data.get('has_moons') else ""
                ring_info = " (rings)" if planet_data.get('has_rings') else ""
                self.stdout.write(f'   {action}: {planet.name}{moon_info}{ring_info}')

        return created_count, updated_count

    def _create_enhanced_sun(self, verbose=False, update_existing=False):
        """Create the Sun object with comprehensive stellar data."""

        sun_data = {
            'name': 'Sun',
            'display_order': 0,
            'planet_type': 'terrestrial',  # Special case for the Sun
            'distance_from_sun': 0.0,
            'diameter': 1392700,  # km
            'mass': 333000,  # Earth masses
            'orbital_period': 0,  # The Sun doesn't orbit
            'orbital_eccentricity': 0.0,
            'rotation_period': 609.12,  # hours (about 25.4 days at equator)
            'axial_tilt': 7.25,  # degrees relative to ecliptic
            'composition': 'Hydrogen (73.46%), Helium (24.85%), Oxygen (0.77%), Carbon (0.29%), Iron (0.16%), Neon (0.12%), Nitrogen (0.09%), Silicon (0.07%), Magnesium (0.05%), Sulfur (0.04%)',
            'atmosphere': 'Corona: extremely hot ionized gas reaching 2 million°C. Photosphere: visible surface at 5,778K. Chromosphere: lower atmosphere extending 2,000km above photosphere.',
            'color_hex': '#FDB813',
            'texture_filename': 'sun_texture.jpg',
            'albedo': 0.0,  # The Sun emits light, doesn't reflect it
            'is_dwarf_planet': False,
            'has_rings': False,
            'has_moons': False,
            'moon_count': 0,
            'is_active': True,
        }

        sun, created = Planet.objects.get_or_create(
            name='Sun',
            defaults=sun_data
        )

        if not created and update_existing:
            for key, value in sun_data.items():
                setattr(sun, key, value)
            sun.save()

        if verbose:
            action = '⭐ Created' if created else ('🔄 Updated' if update_existing else '⏭️  Exists')
            self.stdout.write(f'   {action}: {sun.name} (Central Star)')

        return created or update_existing

    def _get_enhanced_planetary_data(self, include_moons=False, include_rings=False):
        """
        Return comprehensive planetary data with enhanced details.

        Data sources: NASA Planetary Fact Sheets, IAU, JPL HORIZONS System,
        peer-reviewed astronomical journals, and space mission data.
        """

        return [
            {
                'name': 'Mercury',
                'display_order': 1,
                'planet_type': 'terrestrial',
                'distance_from_sun': 0.387,  # AU (semi-major axis)
                'diameter': 4879,  # km
                'mass': 0.055,  # Earth masses (3.301 × 10²³ kg)
                'orbital_period': 87.97,  # Earth days
                'orbital_eccentricity': 0.206,  # Most eccentric orbit of planets
                'rotation_period': 1407.6,  # hours (58.6 Earth days, tidally locked 3:2 resonance)
                'axial_tilt': 0.034,  # degrees (nearly zero tilt)
                'composition': self._get_mercury_composition(include_moons),
                'atmosphere': 'Exosphere: Oxygen (42%), Sodium (29%), Hydrogen (22%), Helium (6%), Potassium (0.5%). Extremely thin, produced by solar wind and micrometeorite impacts.',
                'color_hex': '#8C7853',
                'texture_filename': 'mercury_texture.jpg',
                'albedo': 0.088,  # Very dark surface
                'is_dwarf_planet': False,
                'has_rings': False,
                'has_moons': False,
                'moon_count': 0,
                'is_active': True,
            },
            {
                'name': 'Venus',
                'display_order': 2,
                'planet_type': 'terrestrial',
                'distance_from_sun': 0.723,  # AU
                'diameter': 12104,  # km
                'mass': 0.815,  # Earth masses (4.867 × 10²⁴ kg)
                'orbital_period': 224.7,  # Earth days
                'orbital_eccentricity': 0.007,  # Most circular orbit
                'rotation_period': -5832.5,  # Negative: retrograde rotation (243 Earth days)
                'axial_tilt': 177.4,  # degrees (essentially upside down)
                'composition': self._get_venus_composition(include_moons),
                'atmosphere': 'Dense atmosphere: CO₂ (96.5%), N₂ (3.5%), SO₂ (0.015%), H₂O (0.002%). Surface pressure 92 times Earth. Extreme greenhouse effect with surface temperatures reaching 462°C.',
                'color_hex': '#FC649F',
                'texture_filename': 'venus_texture.jpg',
                'albedo': 0.689,  # High reflectivity due to thick clouds
                'is_dwarf_planet': False,
                'has_rings': False,
                'has_moons': False,
                'moon_count': 0,
                'is_active': True,
            },
            {
                'name': 'Earth',
                'display_order': 3,
                'planet_type': 'terrestrial',
                'distance_from_sun': 1.0,  # AU (definition of astronomical unit)
                'diameter': 12756,  # km (mean diameter)
                'mass': 1.0,  # Earth masses (5.972 × 10²⁴ kg, reference)
                'orbital_period': 365.25,  # Earth days (sidereal year)
                'orbital_eccentricity': 0.017,  # Nearly circular
                'rotation_period': 23.93,  # hours (23h 56m 4s sidereal day)
                'axial_tilt': 23.44,  # degrees (responsible for seasons)
                'composition': self._get_earth_composition(include_moons),
                'atmosphere': 'N₂ (78.08%), O₂ (20.95%), Ar (0.93%), CO₂ (0.04%), plus water vapor, neon, helium, methane, krypton, hydrogen. Only known planet with life-supporting atmosphere.',
                'color_hex': '#4F94CD',
                'texture_filename': 'earth_texture.jpg',
                'albedo': 0.367,  # Bond albedo including clouds
                'is_dwarf_planet': False,
                'has_rings': False,
                'has_moons': True,
                'moon_count': 1,  # The Moon
                'is_active': True,
            },
            {
                'name': 'Mars',
                'display_order': 4,
                'planet_type': 'terrestrial',
                'distance_from_sun': 1.524,  # AU
                'diameter': 6792,  # km
                'mass': 0.107,  # Earth masses (6.417 × 10²³ kg)
                'orbital_period': 686.98,  # Earth days (1.88 Earth years)
                'orbital_eccentricity': 0.094,  # Significant elliptical orbit
                'rotation_period': 24.62,  # hours (24h 37m, similar to Earth)
                'axial_tilt': 25.19,  # degrees (similar to Earth, causes seasons)
                'composition': self._get_mars_composition(include_moons),
                'atmosphere': 'Thin atmosphere: CO₂ (95.32%), N₂ (2.7%), Ar (1.6%), O₂ (0.13%), CO (0.08%), H₂O (0.03%). Surface pressure <1% of Earth. Dust storms can cover entire planet.',
                'color_hex': '#CD5C5C',
                'texture_filename': 'mars_texture.jpg',
                'albedo': 0.170,  # Rusty appearance from iron oxide
                'is_dwarf_planet': False,
                'has_rings': False,
                'has_moons': True,
                'moon_count': 2,  # Phobos and Deimos
                'is_active': True,
            },
            {
                'name': 'Jupiter',
                'display_order': 5,
                'planet_type': 'gas_giant',
                'distance_from_sun': 5.204,  # AU
                'diameter': 142984,  # km (equatorial)
                'mass': 317.8,  # Earth masses (1.898 × 10²⁷ kg)
                'orbital_period': 4332.59,  # Earth days (~11.86 years)
                'orbital_eccentricity': 0.049,  # Nearly circular
                'rotation_period': 9.93,  # hours (fastest rotation in solar system)
                'axial_tilt': 3.13,  # degrees (minimal tilt)
                'composition': self._get_jupiter_composition(include_moons, include_rings),
                'atmosphere': 'H₂ (89.8%), He (10.2%), CH₄ (0.3%), NH₃ (0.026%), HD (0.003%), C₂H₆ (0.0006%). Dynamic weather systems including Great Red Spot storm lasting 350+ years.',
                'color_hex': '#D2691E',
                'texture_filename': 'jupiter_texture.jpg',
                'albedo': 0.538,  # High reflectivity due to thick clouds
                'is_dwarf_planet': False,
                'has_rings': True,  # Faint ring system discovered 1979
                'has_moons': True,
                'moon_count': 95,  # As of 2023, including 4 Galilean moons
                'is_active': True,
            },
            {
                'name': 'Saturn',
                'display_order': 6,
                'planet_type': 'gas_giant',
                'distance_from_sun': 9.537,  # AU
                'diameter': 120536,  # km (equatorial, excluding rings)
                'mass': 95.2,  # Earth masses (5.683 × 10²⁶ kg)
                'orbital_period': 10759.22,  # Earth days (~29.46 years)
                'orbital_eccentricity': 0.057,  # Slightly elliptical
                'rotation_period': 10.66,  # hours (second fastest rotation)
                'axial_tilt': 26.73,  # degrees (similar to Earth)
                'composition': self._get_saturn_composition(include_moons, include_rings),
                'atmosphere': 'H₂ (96.3%), He (3.25%), CH₄ (0.45%), NH₃ (0.0125%), HD (0.011%), C₂H₆ (0.0007%). Prominent hexagonal storm at north pole.',
                'color_hex': '#FAD5A5',
                'texture_filename': 'saturn_texture.jpg',
                'albedo': 0.499,  # High reflectivity from clouds and rings
                'is_dwarf_planet': False,
                'has_rings': True,  # Most prominent ring system
                'has_moons': True,
                'moon_count': 146,  # As of 2023, including Titan and Enceladus
                'is_active': True,
            },
            {
                'name': 'Uranus',
                'display_order': 7,
                'planet_type': 'ice_giant',
                'distance_from_sun': 19.191,  # AU
                'diameter': 51118,  # km (equatorial)
                'mass': 14.5,  # Earth masses (8.681 × 10²⁵ kg)
                'orbital_period': 30688.5,  # Earth days (~84.01 years)
                'orbital_eccentricity': 0.046,  # Nearly circular
                'rotation_period': -17.24,  # hours (retrograde rotation)
                'axial_tilt': 97.77,  # degrees (rotates on its side)
                'composition': self._get_uranus_composition(include_moons, include_rings),
                'atmosphere': 'H₂ (82.5%), He (15.2%), CH₄ (2.3%). Methane gives blue-green color. Coldest planetary atmosphere in solar system.',
                'color_hex': '#4FD0FF',
                'texture_filename': 'uranus_texture.jpg',
                'albedo': 0.488,  # Moderate reflectivity
                'is_dwarf_planet': False,
                'has_rings': True,  # Faint ring system discovered 1977
                'has_moons': True,
                'moon_count': 28,  # Including 5 major moons
                'is_active': True,
            },
            {
                'name': 'Neptune',
                'display_order': 8,
                'planet_type': 'ice_giant',
                'distance_from_sun': 30.069,  # AU
                'diameter': 49528,  # km (equatorial)
                'mass': 17.1,  # Earth masses (1.024 × 10²⁶ kg)
                'orbital_period': 60182,  # Earth days (~164.8 years)
                'orbital_eccentricity': 0.010,  # Nearly circular
                'rotation_period': 16.11,  # hours
                'axial_tilt': 28.32,  # degrees (similar to Earth)
                'composition': self._get_neptune_composition(include_moons, include_rings),
                'atmosphere': 'H₂ (80%), He (19%), CH₄ (1%), H₂S, NH₃ traces. Strongest winds in solar system reaching 2,100 km/h. Deep blue color from methane.',
                'color_hex': '#4169E1',
                'texture_filename': 'neptune_texture.jpg',
                'albedo': 0.442,  # Moderate reflectivity
                'is_dwarf_planet': False,
                'has_rings': True,  # Faint ring arcs discovered 1989
                'has_moons': True,
                'moon_count': 16,  # Including Triton (largest)
                'is_active': True,
            },
            {
                'name': 'Pluto',
                'display_order': 9,
                'planet_type': 'dwarf_planet',
                'distance_from_sun': 39.482,  # AU (average, highly elliptical)
                'diameter': 2376,  # km
                'mass': 0.00218,  # Earth masses (1.303 × 10²² kg)
                'orbital_period': 90560,  # Earth days (~248 years)
                'orbital_eccentricity': 0.244,  # Highly elliptical orbit
                'rotation_period': -153.3,  # hours (retrograde, tidally locked with Charon)
                'axial_tilt': 119.6,  # degrees (large tilt)
                'composition': self._get_pluto_composition(include_moons, include_rings),
                'atmosphere': 'Thin atmosphere: N₂ (dominant), CH₄, CO. Seasonal variations as Pluto approaches/recedes from Sun. Atmospheric escape rate ~500 tons/hour.',
                'color_hex': '#EEE8AA',
                'texture_filename': 'pluto_texture.jpg',
                'albedo': 0.49,  # Variable surface reflectivity
                'is_dwarf_planet': True,
                'has_rings': False,
                'has_moons': True,
                'moon_count': 5,  # Charon, Nix, Hydra, Styx, Kerberos
                'is_active': True,
            },
        ]

    def _get_mercury_composition(self, include_moons):
        """Get detailed Mercury composition."""
        composition = (
            "Core: Large iron-nickel core (75% of radius, 3,600 km diameter). "
            "Mantle: Thin silicate mantle (600 km thick). "
            "Crust: Thin basaltic crust with impact craters and volcanic plains. "
            "Surface features: Caloris Basin (1,550 km crater), lobate scarps, polar ice deposits in permanently shadowed craters."
        )

        if include_moons:
            composition += " Moon system: None (no natural satellites due to proximity to Sun and solar tidal forces)."

        return composition

    def _get_venus_composition(self, include_moons):
        """Get detailed Venus composition."""
        composition = (
            "Core: Iron-nickel core (~3,200 km radius). "
            "Mantle: Silicate rock mantle with possible partial melting. "
            "Crust: Basaltic crust with extensive volcanic features. "
            "Surface: 90% basaltic volcanic plains, shield volcanoes, impact craters. "
            "Notable features: Maxwell Montes (11 km high), Ishtar Terra, Aphrodite Terra."
        )

        if include_moons:
            composition += " Moon system: None (no natural satellites, possibly due to retrograde rotation and solar tidal effects)."

        return composition

    def _get_earth_composition(self, include_moons):
        """Get detailed Earth composition."""
        composition = (
            "Core: Inner solid iron-nickel core (1,220 km radius), outer liquid core (2,260 km thick). "
            "Mantle: Silicate rock mantle (2,900 km thick) with convection currents driving plate tectonics. "
            "Crust: Continental crust (30-50 km thick) and oceanic crust (5-10 km thick). "
            "Surface: 71% water oceans, 29% continents. Active geology with 7 major tectonic plates."
        )

        if include_moons:
            composition += (
                " Moon system: The Moon (Luna) - diameter 3,474 km, distance 384,400 km. "
                "Formed ~4.5 billion years ago from giant impact. Synchronously locked, causes tides. "
                "Composition: Iron core, silicate mantle, anorthosite highland crust, basaltic maria."
            )

        return composition

    def _get_mars_composition(self, include_moons):
        """Get detailed Mars composition."""
        composition = (
            "Core: Iron-nickel-sulfur core (~1,700 km radius), partially liquid. "
            "Mantle: Silicate rock mantle with lower density than Earth. "
            "Crust: Basaltic crust (50 km thick in south, 35 km in north). "
            "Surface: Iron oxide (rust) gives red color. Olympus Mons (21 km high), Valles Marineris canyon system, polar ice caps."
        )

        if include_moons:
            composition += (
                " Moon system: Phobos (27×22×18 km, orbital period 7.6 hours, distance 9,376 km) - "
                "irregular shape, possibly captured asteroid, cratered surface, gradually spiraling inward. "
                "Deimos (15×12×11 km, orbital period 30.3 hours, distance 23,463 km) - "
                "smaller, more distant, smoother surface, may eventually escape Mars orbit."
            )

        return composition

    def _get_jupiter_composition(self, include_moons, include_rings):
        """Get detailed Jupiter composition."""
        composition = (
            "Core: Rocky/metallic core (~20,000 km diameter, 7-25 Earth masses). "
            "Interior: Metallic hydrogen layer, liquid hydrogen layer. "
            "Atmosphere: Thick gaseous envelope with complex storm systems. "
            "Great Red Spot: Anticyclonic storm 16,000 km wide, active for 350+ years. "
            "Zones and belts: Alternating bands of clouds at different altitudes."
        )

        if include_moons:
            composition += (
                " Major moons: Io (volcanic, 400+ active volcanoes, sulfur compounds), "
                "Europa (subsurface ocean beneath ice crust, potential for life), "
                "Ganymede (largest moon in solar system, own magnetic field, ice/rock), "
                "Callisto (heavily cratered, ice/rock, possible subsurface ocean). "
                "95 total moons including irregular captured asteroids in outer orbits."
            )

        if include_rings:
            composition += (
                " Ring system: Faint rings discovered 1979 by Voyager 1. "
                "Main ring (129,000-182,000 km from center), gossamer rings extending to 1,000,000 km. "
                "Composed of dust particles from moon impacts and volcanic activity on Io."
            )

        return composition

    def _get_saturn_composition(self, include_moons, include_rings):
        """Get detailed Saturn composition."""
        composition = (
            "Core: Rock/ice core (~25,000 km diameter, 9-22 Earth masses). "
            "Interior: Metallic hydrogen, liquid hydrogen layers. "
            "Atmosphere: Less dense than water (0.687 g/cm³), extensive storm systems. "
            "Hexagonal storm: Unique hexagonal jet stream at north pole, 30,000 km across. "
            "Equatorial jet: Winds up to 1,800 km/h."
        )

        if include_moons:
            composition += (
                " Major moons: Titan (larger than Mercury, thick nitrogen atmosphere, methane lakes, "
                "organic chemistry, potential for prebiotic conditions), "
                "Enceladus (ice geysers from south pole, subsurface ocean, potential for life), "
                "Mimas (Death Star appearance due to Herschel crater), "
                "Iapetus (two-tone coloration, equatorial ridge). "
                "146 total confirmed moons with complex orbital resonances."
            )

        if include_rings:
            composition += (
                " Ring system: Most extensive and visible rings in solar system. "
                "Main rings A, B, C spanning 7,000-80,000 km above cloud tops. "
                "Composed 99% water ice particles from cm to 10m diameter. "
                "Gaps: Cassini Division (4,700 km gap), Encke Gap. "
                "Shepherd moons maintain ring structure through gravitational resonances."
            )

        return composition

    def _get_uranus_composition(self, include_moons, include_rings):
        """Get detailed Uranus composition."""
        composition = (
            "Core: Rock/ice core (~17% of planet mass, 0.55 Earth masses). "
            "Mantle: Water, methane, ammonia ices (83% of planet mass). "
            "Atmosphere: Hydrogen, helium, methane (gives blue-green color). "
            "Unique rotation: 97.77° axial tilt causes extreme seasonal variations (42-year seasons). "
            "Magnetic field: Tilted 59° from rotational axis, suggests unusual interior structure."
        )

        if include_moons:
            composition += (
                " Major moons: Miranda (extreme geological features, 20 km cliffs), "
                "Ariel (youngest surface, extensive rift valleys), "
                "Umbriel (darkest moon, ancient cratered surface), "
                "Titania (largest moon, impact craters and canyons), "
                "Oberon (heavily cratered, possible subsurface ocean). "
                "28 known moons, mostly named after Shakespeare characters."
            )

        if include_rings:
            composition += (
                " Ring system: 13 known rings discovered 1977. "
                "Inner rings: narrow, dark, composed of larger particles. "
                "Outer rings: broader, brighter. "
                "Epsilon ring: densest and brightest, shepherded by Cordelia and Ophelia moons."
            )

        return composition

    def _get_neptune_composition(self, include_moons, include_rings):
        """Get detailed Neptune composition."""
        composition = (
            "Core: Rock/ice core (~1 Earth mass). "
            "Mantle: Water, methane, ammonia ices mixed with rock. "
            "Atmosphere: Hydrogen, helium, methane, hydrogen sulfide. "
            "Weather: Most dynamic weather in solar system, winds up to 2,100 km/h. "
            "Great Dark Spot: Large anticyclonic storm system (observed by Voyager 2, since dissipated). "
            "Internal heat: Radiates 2.6 times more energy than receives from Sun."
        )

        if include_moons:
            composition += (
                " Major moon: Triton (2,707 km diameter, retrograde orbit suggests captured Kuiper Belt object, "
                "nitrogen geysers, thin atmosphere, surface temperature -235°C, largest moon orbiting backwards). "
                "Minor moons: Nereid (highly eccentric orbit), Proteus (irregularly shaped), "
                "plus 13 other small irregular moons discovered by ground-based and Hubble observations."
            )

        if include_rings:
            composition += (
                " Ring system: 5 main rings named after astronomers (Galle, Le Verrier, Lassell, Arago, Adams). "
                "Adams ring: has bright arcs (Liberty, Equality, Fraternity, Courage) maintained by Galatea moon. "
                "Composed of organic compounds, appear reddish in color."
            )

        return composition

    def _get_pluto_composition(self, include_moons, include_rings):
        """Get detailed Pluto composition."""
        composition = (
            "Core: Rocky core (~1,700 km diameter, 50-85% of total mass). "
            "Mantle: Water ice mantle possibly containing subsurface ocean. "
            "Surface: Nitrogen, methane, carbon monoxide ices. Complex geology with plains, mountains, possible cryovolcanoes. "
            "Heart feature: Tombaugh Regio - large bright nitrogen plain. "
            "Atmosphere: Thin, extends 1,600 km above surface, haze layers."
        )

        if include_moons:
            composition += (
                " Moon system: Charon (1,212 km diameter, largest relative to primary planet, "
                "mutual tidal locking creates double planet system, reddish north pole possibly from captured atmosphere), "
                "Nix (50×35×33 km, high albedo, chaotic rotation), "
                "Hydra (65×45×25 km, crystalline water ice surface), "
                "Styx (16×9×8 km, darkest moon), "
                "Kerberos (19×10×9 km, double-lobed shape). All moons likely formed from giant impact."
            )

        return composition

    def _export_to_json(self, filename, verbose=False):
        """Export populated planetary data to JSON file."""

        planets_data = []
        for planet in Planet.objects.all().order_by('display_order'):
            planet_dict = {
                'name': planet.name,
                'display_order': planet.display_order,
                'planet_type': planet.planet_type,
                'distance_from_sun': float(planet.distance_from_sun),
                'diameter': float(planet.diameter),
                'mass': float(planet.mass) if planet.mass else None,
                'orbital_period': float(planet.orbital_period),
                'orbital_eccentricity': float(planet.orbital_eccentricity),
                'rotation_period': float(planet.rotation_period),
                'axial_tilt': float(planet.axial_tilt),
                'composition': planet.composition,
                'atmosphere': planet.atmosphere,
                'color_hex': planet.color_hex,
                'texture_filename': planet.texture_filename,
                'albedo': float(planet.albedo),
                'is_dwarf_planet': planet.is_dwarf_planet,
                'has_rings': planet.has_rings,
                'has_moons': planet.has_moons,
                'moon_count': planet.moon_count,
                'is_active': planet.is_active,
                'created_at': planet.created_at.isoformat() if planet.created_at else None,
                'updated_at': planet.updated_at.isoformat() if planet.updated_at else None,
            }
            planets_data.append(planet_dict)

        export_data = {
            'metadata': {
                'export_date': datetime.now().isoformat(),
                'total_objects': len(planets_data),
                'command_version': '2.0',
                'data_sources': [
                    'NASA Planetary Fact Sheets',
                    'International Astronomical Union (IAU)',
                    'JPL HORIZONS System',
                    'Space mission data (Voyager, Cassini, New Horizons, etc.)',
                    'Peer-reviewed astronomical journals'
                ]
            },
            'solar_system': planets_data
        }

        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False)

            if verbose:
                self.stdout.write(f'📄 Exported planetary data to: {filename}')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Failed to export to {filename}: {e}')
            )

    def _validate_planetary_data(self, verbose=False):
        """Validate the populated planetary data for consistency."""

        if verbose:
            self.stdout.write('🔍 Validating planetary data...')

        validation_errors = []
        planets = Planet.objects.all()

        for planet in planets:
            # Check required fields
            if not planet.name:
                validation_errors.append(f"Planet missing name: ID {planet.id}")

            if planet.distance_from_sun < 0:
                validation_errors.append(f"{planet.name}: Invalid distance_from_sun")

            if planet.diameter <= 0:
                validation_errors.append(f"{planet.name}: Invalid diameter")

            if planet.orbital_period <= 0 and planet.name != 'Sun':
                validation_errors.append(f"{planet.name}: Invalid orbital_period")

            # Check logical consistency
            if planet.has_moons and planet.moon_count == 0:
                validation_errors.append(f"{planet.name}: has_moons=True but moon_count=0")

            if not planet.has_moons and planet.moon_count > 0:
                validation_errors.append(f"{planet.name}: has_moons=False but moon_count>0")

            # Check color format
            if not planet.color_hex.startswith('#') or len(planet.color_hex) != 7:
                validation_errors.append(f"{planet.name}: Invalid color_hex format")

        # Check for duplicate display orders
        display_orders = [p.display_order for p in planets]
        if len(display_orders) != len(set(display_orders)):
            validation_errors.append("Duplicate display_order values found")

        if validation_errors:
            self.stdout.write(self.style.ERROR('❌ Validation errors found:'))
            for error in validation_errors:
                self.stdout.write(f'   • {error}')
            return False
        else:
            if verbose:
                self.stdout.write('✅ All planetary data validated successfully')
            return True

    def _create_data_summary(self, verbose=False):
        """Create a summary of the populated data."""

        if not verbose:
            return

        planets = Planet.objects.all().order_by('display_order')

        self.stdout.write('\n📊 Detailed Solar System Summary:')
        self.stdout.write('=' * 60)

        # Statistics by type
        terrestrial = planets.filter(planet_type='terrestrial')
        gas_giants = planets.filter(planet_type='gas_giant')
        ice_giants = planets.filter(planet_type='ice_giant')
        dwarf_planets = planets.filter(is_dwarf_planet=True)

        self.stdout.write(f'🪨 Terrestrial planets: {terrestrial.count()}')
        for planet in terrestrial:
            self.stdout.write(f'   • {planet.name} ({planet.diameter:,} km diameter)')

        self.stdout.write(f'🌪️  Gas giants: {gas_giants.count()}')
        for planet in gas_giants:
            self.stdout.write(
                f'   • {planet.name} ({planet.moon_count} moons, {"rings" if planet.has_rings else "no rings"})')

        self.stdout.write(f'❄️  Ice giants: {ice_giants.count()}')
        for planet in ice_giants:
            self.stdout.write(
                f'   • {planet.name} ({planet.moon_count} moons, {"rings" if planet.has_rings else "no rings"})')

        self.stdout.write(f'🏔️  Dwarf planets: {dwarf_planets.count()}')
        for planet in dwarf_planets:
            self.stdout.write(f'   • {planet.name} ({planet.moon_count} moons)')

        # Distance ranges
        planet_distances = [(p.name, p.distance_from_sun) for p in planets if p.name != 'Sun']
        planet_distances.sort(key=lambda x: x[1])

        self.stdout.write(f'\n🚀 Orbital distances (AU):')
        for name, distance in planet_distances:
            self.stdout.write(f'   • {name}: {distance:.3f} AU')

        # Interesting facts
        largest_planet = max(planets.exclude(name='Sun'), key=lambda p: p.diameter)
        smallest_planet = min(planets.exclude(name='Sun'), key=lambda p: p.diameter)
        most_moons = max(planets, key=lambda p: p.moon_count)

        self.stdout.write(f'\n🏆 Records:')
        self.stdout.write(f'   • Largest planet: {largest_planet.name} ({largest_planet.diameter:,} km)')
        self.stdout.write(f'   • Smallest planet: {smallest_planet.name} ({smallest_planet.diameter:,} km)')
        self.stdout.write(f'   • Most moons: {most_moons.name} ({most_moons.moon_count} moons)')

        total_moons = sum(p.moon_count for p in planets)
        ringed_planets = planets.filter(has_rings=True)

        self.stdout.write(f'\n🌙 Moon systems: {total_moons} total known moons')
        self.stdout.write(f'💍 Ring systems: {ringed_planets.count()} planets with rings')
        for planet in ringed_planets:
            self.stdout.write(f'   • {planet.name}')

    def _backup_existing_data(self, verbose=False):
        """Create a backup of existing data before clearing."""

        if Planet.objects.exists():
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_filename = f'planet_backup_{timestamp}.json'

            try:
                self._export_to_json(backup_filename, verbose=False)
                if verbose:
                    self.stdout.write(f'💾 Backup created: {backup_filename}')
                return backup_filename
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  Could not create backup: {e}')
                )
                return None
        return None