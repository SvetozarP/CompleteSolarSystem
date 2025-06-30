# solar_system/management/commands/populate_planets.py

from django.core.management.base import BaseCommand, CommandError
from solar_system.models import Planet
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """
    Management command to populate the database with accurate planetary data.

    Usage: python manage.py populate_planets
    """

    help = 'Populate the database with solar system planetary data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing planet data before populating',
        )

        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Enable verbose output',
        )

    def handle(self, *args, **options):
        """Main command handler."""

        verbose = options['verbose']

        if options['clear']:
            self.stdout.write('Clearing existing planet data...')
            Planet.objects.all().delete()

        try:
            self._populate_planets(verbose)
            self.stdout.write(
                self.style.SUCCESS('Successfully populated planetary data!')
            )
        except Exception as e:
            logger.error(f"Error populating planets: {e}")
            raise CommandError(f'Failed to populate planets: {e}')

    def _populate_planets(self, verbose=False):
        """Create all planet objects with scientifically accurate data."""

        planets_data = self._get_planetary_data()

        for planet_data in planets_data:
            planet, created = Planet.objects.get_or_create(
                name=planet_data['name'],
                defaults=planet_data
            )

            if created:
                action = 'Created'
            else:
                # Update existing planet with new data
                for key, value in planet_data.items():
                    setattr(planet, key, value)
                planet.save()
                action = 'Updated'

            if verbose:
                self.stdout.write(f'{action}: {planet.name}')

        # Create the Sun as a special case
        self._create_sun(verbose)

    def _create_sun(self, verbose=False):
        """Create the Sun object for the center of our solar system."""

        sun_data = {
            'name': 'Sun',
            'display_order': 0,
            'planet_type': 'terrestrial',  # Special case
            'distance_from_sun': 0.0,
            'diameter': 1392700,  # km
            'mass': 333000,  # Earth masses
            'orbital_period': 0,  # The Sun doesn't orbit
            'orbital_eccentricity': 0.0,
            'rotation_period': 609.12,  # hours (about 25.4 days)
            'axial_tilt': 7.25,
            'composition': 'Hydrogen (73%), Helium (25%), heavier elements (2%)',
            'atmosphere': 'Corona: extremely hot ionized gas',
            'color_hex': '#FDB813',
            'texture_filename': 'sun_texture.jpg',
            'albedo': 0.0,  # The Sun emits light, doesn\'t reflect it
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

        if not created:
            for key, value in sun_data.items():
                setattr(sun, key, value)
            sun.save()

        if verbose:
            action = 'Created' if created else 'Updated'
            self.stdout.write(f'{action}: {sun.name} (Central Star)')

    def _get_planetary_data(self):
        """
        Return list of dictionaries containing accurate planetary data.

        Data sources: NASA, IAU, and peer-reviewed astronomical sources.
        """

        return [
            {
                'name': 'Mercury',
                'display_order': 1,
                'planet_type': 'terrestrial',
                'distance_from_sun': 0.387,  # AU
                'diameter': 4879,  # km
                'mass': 0.055,  # Earth masses
                'orbital_period': 87.97,  # Earth days
                'orbital_eccentricity': 0.206,
                'rotation_period': 1407.6,  # hours (58.6 Earth days)
                'axial_tilt': 0.034,
                'composition': 'Iron core (75% of radius), thin silicate mantle, no atmosphere',
                'atmosphere': 'Extremely thin exosphere (oxygen, sodium, hydrogen, helium)',
                'color_hex': '#8C7853',
                'texture_filename': 'mercury_texture.jpg',
                'albedo': 0.088,
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
                'distance_from_sun': 0.723,
                'diameter': 12104,
                'mass': 0.815,
                'orbital_period': 224.7,
                'orbital_eccentricity': 0.007,
                'rotation_period': -5832.5,  # Negative: retrograde rotation
                'axial_tilt': 177.4,
                'composition': 'Iron core, rocky mantle, thick atmosphere',
                'atmosphere': 'CO2 (96.5%), N2 (3.5%), extreme greenhouse effect',
                'color_hex': '#FC649F',
                'texture_filename': 'venus_texture.jpg',
                'albedo': 0.689,
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
                'distance_from_sun': 1.0,
                'diameter': 12756,
                'mass': 1.0,
                'orbital_period': 365.25,
                'orbital_eccentricity': 0.017,
                'rotation_period': 23.93,
                'axial_tilt': 23.44,
                'composition': 'Iron-nickel core, silicate mantle and crust, 71% water surface',
                'atmosphere': 'N2 (78%), O2 (21%), Ar (0.93%), CO2 (0.04%)',
                'color_hex': '#4F94CD',
                'texture_filename': 'earth_texture.jpg',
                'albedo': 0.367,
                'is_dwarf_planet': False,
                'has_rings': False,
                'has_moons': True,
                'moon_count': 1,
                'is_active': True,
            },
            {
                'name': 'Mars',
                'display_order': 4,
                'planet_type': 'terrestrial',
                'distance_from_sun': 1.524,
                'diameter': 6792,
                'mass': 0.107,
                'orbital_period': 686.98,
                'orbital_eccentricity': 0.094,
                'rotation_period': 24.62,
                'axial_tilt': 25.19,
                'composition': 'Iron core, basaltic mantle, iron oxide surface (rust)',
                'atmosphere': 'CO2 (95%), N2 (2.8%), Ar (2%), very thin',
                'color_hex': '#CD5C5C',
                'texture_filename': 'mars_texture.jpg',
                'albedo': 0.170,
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
                'distance_from_sun': 5.204,
                'diameter': 142984,
                'mass': 317.8,
                'orbital_period': 4332.59,  # ~11.86 years
                'orbital_eccentricity': 0.049,
                'rotation_period': 9.93,
                'axial_tilt': 3.13,
                'composition': 'Hydrogen (89%), Helium (10%), traces of methane, ammonia',
                'atmosphere': 'H2, He, CH4, NH3, complex storm systems',
                'color_hex': '#D2691E',
                'texture_filename': 'jupiter_texture.jpg',
                'albedo': 0.538,
                'is_dwarf_planet': False,
                'has_rings': True,
                'has_moons': True,
                'moon_count': 95,  # As of 2023
                'is_active': True,
            },
            {
                'name': 'Saturn',
                'display_order': 6,
                'planet_type': 'gas_giant',
                'distance_from_sun': 9.537,
                'diameter': 120536,
                'mass': 95.2,
                'orbital_period': 10759.22,  # ~29.46 years
                'orbital_eccentricity': 0.057,
                'rotation_period': 10.66,
                'axial_tilt': 26.73,
                'composition': 'Hydrogen (96%), Helium (3%), traces of methane, ammonia',
                'atmosphere': 'H2, He, CH4, NH3, prominent ring system',
                'color_hex': '#FAD5A5',
                'texture_filename': 'saturn_texture.jpg',
                'albedo': 0.499,
                'is_dwarf_planet': False,
                'has_rings': True,
                'has_moons': True,
                'moon_count': 146,  # As of 2023
                'is_active': True,
            },
            {
                'name': 'Uranus',
                'display_order': 7,
                'planet_type': 'ice_giant',
                'distance_from_sun': 19.191,
                'diameter': 51118,
                'mass': 14.5,
                'orbital_period': 30688.5,  # ~84.01 years
                'orbital_eccentricity': 0.046,
                'rotation_period': -17.24,  # Retrograde
                'axial_tilt': 97.77,  # Nearly sideways
                'composition': 'Water, methane, ammonia ices; hydrogen, helium atmosphere',
                'atmosphere': 'H2 (83%), He (15%), CH4 (2%), gives blue color',
                'color_hex': '#4FD0FF',
                'texture_filename': 'uranus_texture.jpg',
                'albedo': 0.488,
                'is_dwarf_planet': False,
                'has_rings': True,
                'has_moons': True,
                'moon_count': 28,
                'is_active': True,
            },
            {
                'name': 'Neptune',
                'display_order': 8,
                'planet_type': 'ice_giant',
                'distance_from_sun': 30.069,
                'diameter': 49528,
                'mass': 17.1,
                'orbital_period': 60182,  # ~164.8 years
                'orbital_eccentricity': 0.010,
                'rotation_period': 16.11,
                'axial_tilt': 28.32,
                'composition': 'Water, methane, ammonia ices; hydrogen, helium atmosphere',
                'atmosphere': 'H2 (80%), He (19%), CH4 (1%), strongest winds in solar system',
                'color_hex': '#4169E1',
                'texture_filename': 'neptune_texture.jpg',
                'albedo': 0.442,
                'is_dwarf_planet': False,
                'has_rings': True,
                'has_moons': True,
                'moon_count': 16,
                'is_active': True,
            },
            {
                'name': 'Pluto',
                'display_order': 9,
                'planet_type': 'dwarf_planet',
                'distance_from_sun': 39.482,
                'diameter': 2376,
                'mass': 0.00218,
                'orbital_period': 90560,  # ~248 years
                'orbital_eccentricity': 0.244,
                'rotation_period': -153.3,  # Retrograde, tidally locked with Charon
                'axial_tilt': 119.6,
                'composition': 'Rock and ice, nitrogen-methane atmosphere',
                'atmosphere': 'N2, CH4, CO, very thin',
                'color_hex': '#EEE8AA',
                'texture_filename': 'pluto_texture.jpg',
                'albedo': 0.49,
                'is_dwarf_planet': True,
                'has_rings': False,
                'has_moons': True,
                'moon_count': 5,  # Charon and 4 smaller moons
                'is_active': True,
            },
        ]