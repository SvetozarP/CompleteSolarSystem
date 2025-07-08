# solar_system/views.py

from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.generic import TemplateView
from django.views import View
from django.core.serializers.json import DjangoJSONEncoder
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
import json
import logging

from .models import Planet

logger = logging.getLogger(__name__)


class SolarSystemView(TemplateView):
    """
    Main view for the solar system visualization page.

    Renders the primary template with Three.js canvas and controls.
    Follows single responsibility principle - only handles template rendering.
    """

    template_name = 'solar_system/home.html'

    def get_context_data(self, **kwargs):
        """Add context data for the template."""
        context = super().get_context_data(**kwargs)

        context.update({
            'page_title': 'Interactive Solar System',
            'total_planets': Planet.objects.filter(is_active=True).count(),
            'has_dwarf_planets': Planet.objects.filter(
                is_dwarf_planet=True,
                is_active=True
            ).exists(),
        })

        logger.info("Solar system home page rendered")
        return context


class BasePlanetAPIView(View):
    """
    Base class for planet API views.

    Provides common functionality for JSON responses and error handling.
    Follows DRY principle by centralizing common API logic.
    """

    def dispatch(self, request, *args, **kwargs):
        """Override dispatch to ensure JSON content type."""
        response = super().dispatch(request, *args, **kwargs)
        if hasattr(response, 'content'):
            response['Content-Type'] = 'application/json'
        return response

    def json_response(self, data, status=200):
        """Helper method to create JSON responses."""
        return JsonResponse(
            data,
            status=status,
            encoder=DjangoJSONEncoder,
            safe=False
        )

    def error_response(self, message, status=400):
        """Helper method to create error responses."""
        return self.json_response({
            'error': True,
            'message': message
        }, status=status)


@method_decorator(cache_page(60 * 15), name='dispatch')  # Cache for 15 minutes
class PlanetsAPIView(BasePlanetAPIView):
    """
    API view to return all active planets data for Three.js consumption.

    Returns comprehensive planet data including scaled values for 3D rendering.
    Cached to improve performance for frequent requests.
    """

    def get(self, request):
        """Return all active planets as JSON."""
        try:
            planets = Planet.objects.get_ordered_planets()

            # Convert to list of dictionaries
            planets_data = []
            for planet in planets:
                planet_dict = planet.to_dict()
                planets_data.append(planet_dict)

            response_data = {
                'success': True,
                'count': len(planets_data),
                'planets': planets_data,
                'metadata': {
                    'scale_info': {
                        'size_scale_factor': 1000,
                        'distance_scale_factor': 10,
                        'note': 'Sizes and distances are scaled for visualization'
                    },
                    'data_source': 'NASA/IAU Planetary Fact Sheets',
                    'last_updated': '2024'
                }
            }

            logger.info(f"Served planet data for {len(planets_data)} planets")
            return self.json_response(response_data)

        except Exception as e:
            logger.error(f"Error in PlanetsAPIView: {e}")
            return self.error_response(
                "Failed to retrieve planet data",
                status=500
            )


class PlanetDetailAPIView(BasePlanetAPIView):
    """
    API view to return detailed information for a specific planet.

    Provides comprehensive data for information panels and tooltips.
    """

    def get(self, request, planet_id):
        """Return detailed data for a specific planet."""
        try:
            try:
                planet = Planet.objects.get(id=planet_id, is_active=True)
            except Planet.DoesNotExist:
                logger.info(f"Planet with ID {planet_id} not found")
                return self.error_response(
                    "Planet not found",
                    status=404
                )

            # Get detailed planet data
            detailed_data = planet.to_dict()

            # Add additional computed fields for detailed view
            detailed_data.update({
                'fun_facts': self._get_planet_fun_facts(planet),
                'comparison_to_earth': self._get_earth_comparison(planet),
                'exploration_status': self._get_exploration_info(planet),
            })

            response_data = {
                'success': True,
                'planet': detailed_data
            }

            logger.info(f"Served detailed data for planet: {planet.name}")
            return self.json_response(response_data)

        except Exception as e:
            logger.error(f"Error in PlanetDetailAPIView: {e}")
            return self.error_response(
                "Failed to retrieve planet data",
                status=500
            )

    def _get_planet_fun_facts(self, planet):
        """Generate interesting facts about the planet."""
        facts = []

        if planet.name == 'Mercury':
            facts = [
                "Has the most extreme temperature variations in the solar system",
                "One day on Mercury lasts about 176 Earth days",
                "Has a very large iron core relative to its size"
            ]
        elif planet.name == 'Venus':
            facts = [
                "Hottest planet in the solar system due to greenhouse effect",
                "Rotates backwards (retrograde rotation)",
                "Surface pressure is 90 times that of Earth"
            ]
        elif planet.name == 'Earth':
            facts = [
                "The only known planet with life",
                "71% of surface is covered by water",
                "Has a strong magnetic field that protects from solar radiation"
            ]
        elif planet.name == 'Mars':
            facts = [
                "Home to the largest volcano in the solar system (Olympus Mons)",
                "Has seasons similar to Earth due to axial tilt",
                "Evidence suggests it once had flowing water"
            ]
        elif planet.name == 'Jupiter':
            facts = [
                "More massive than all other planets combined",
                "Great Red Spot is a storm larger than Earth",
                "Acts as a 'cosmic vacuum cleaner' protecting inner planets"
            ]
        elif planet.name == 'Saturn':
            facts = [
                "Less dense than water - it would float!",
                "Ring system spans up to 282,000 km but only ~1 km thick",
                "Has hexagonal storm at its north pole"
            ]
        elif planet.name == 'Uranus':
            facts = [
                "Rotates on its side with 98° axial tilt",
                "Coldest planetary atmosphere in solar system",
                "Was the first planet discovered with a telescope"
            ]
        elif planet.name == 'Neptune':
            facts = [
                "Has the strongest winds in the solar system (up to 2,100 km/h)",
                "Takes 165 Earth years to complete one orbit",
                "Its largest moon Triton orbits backwards"
            ]
        elif planet.name == 'Pluto':
            facts = [
                "Reclassified as a dwarf planet in 2006",
                "Has a heart-shaped feature on its surface",
                "Its moon Charon is half the size of Pluto itself"
            ]

        return facts

    def _get_earth_comparison(self, planet):
        """Generate Earth comparison data."""
        earth = Planet.objects.filter(name='Earth').first()
        if not earth:
            return {}

        return {
            'size_ratio': round(planet.diameter / earth.diameter, 2),
            'mass_ratio': planet.mass if planet.mass else 'Unknown',
            'distance_ratio': round(planet.distance_from_sun / earth.distance_from_sun, 2),
            'year_length_ratio': round(planet.orbital_period / earth.orbital_period, 2),
            'day_length_ratio': round(abs(planet.rotation_period) / earth.rotation_period, 2),
        }

    def _get_exploration_info(self, planet):
        """Return exploration mission information."""
        exploration_data = {
            'Mercury': 'Visited by Mariner 10 and MESSENGER, BepiColombo mission ongoing',
            'Venus': 'Multiple Soviet Venera missions, Magellan orbiter, current: Akatsuki',
            'Earth': 'Continuously monitored by numerous satellites and space stations',
            'Mars': 'Multiple rovers including Curiosity and Perseverance, many orbiters',
            'Jupiter': 'Visited by Pioneer, Voyager, Galileo, Cassini, current: Juno',
            'Saturn': 'Visited by Pioneer, Voyager, Cassini mission (2004-2017)',
            'Uranus': 'Only visited by Voyager 2 in 1986',
            'Neptune': 'Only visited by Voyager 2 in 1989',
            'Pluto': 'Visited by New Horizons flyby mission in 2015',
        }

        return exploration_data.get(planet.name, 'Limited or no direct exploration')


class SystemInfoAPIView(BasePlanetAPIView):
    """
    API view to return general solar system information and statistics.

    Provides metadata about the solar system for educational displays.
    """

    def get(self, request):
        """Return solar system statistics and information."""
        try:
            planets = Planet.objects.filter(is_active=True).exclude(name='Sun')
            sun = Planet.objects.filter(name='Sun').first()

            # Calculate statistics
            terrestrial_count = planets.filter(planet_type='terrestrial').count()
            gas_giant_count = planets.filter(planet_type='gas_giant').count()
            ice_giant_count = planets.filter(planet_type='ice_giant').count()
            dwarf_planet_count = planets.filter(is_dwarf_planet=True).count()

            total_moons = sum(planet.moon_count for planet in planets)

            response_data = {
                'success': True,
                'system_info': {
                    'total_planets': planets.count(),
                    'planet_types': {
                        'terrestrial': terrestrial_count,
                        'gas_giants': gas_giant_count,
                        'ice_giants': ice_giant_count,
                        'dwarf_planets': dwarf_planet_count,
                    },
                    'total_moons': total_moons,
                    'central_star': sun.to_dict() if sun else None,
                    'system_age': '4.6 billion years',
                    'system_diameter': '~100,000 AU (including Oort Cloud)',
                    'habitable_zone': '0.95 to 1.37 AU from Sun',
                }
            }

            logger.info("Served solar system information")
            return self.json_response(response_data)

        except Exception as e:
            logger.error(f"Error in SystemInfoAPIView: {e}")
            return self.error_response(
                "Failed to retrieve system information",
                status=500
            )