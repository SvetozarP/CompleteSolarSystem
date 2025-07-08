from django.test import TestCase, Client
from django.urls import reverse
from .models import Planet
import json

class PlanetModelTests(TestCase):
    def setUp(self):
        self.earth = Planet.objects.create(
            name="Earth",
            planet_type="terrestrial",
            diameter=12742,  # km
            mass=1.0,  # relative to Earth
            distance_from_sun=1.0,  # AU
            orbital_period=365.26,
            orbital_eccentricity=0.0167,
            rotation_period=24,
            display_order=3,
        )
        self.jupiter = Planet.objects.create(
            name="Jupiter",
            planet_type="gas_giant",
            diameter=139820,
            mass=317.8,
            distance_from_sun=5.20,
            orbital_period=4333,
            orbital_eccentricity=0.0489,
            rotation_period=10,
            display_order=5,
        )
        self.pluto = Planet.objects.create(
            name="Pluto",
            planet_type="dwarf_planet",
            diameter=2377,
            mass=0.002,
            distance_from_sun=39.5,
            orbital_period=90560,
            orbital_eccentricity=0.2488,
            rotation_period=153,
            display_order=9,
        )

    def test_planet_creation(self):
        """Test planet instance creation and field values"""
        self.assertEqual(self.earth.name, "Earth")
        self.assertEqual(self.earth.planet_type, "terrestrial")
        self.assertEqual(self.earth.display_order, 3)
        self.assertEqual(self.earth.mass, 1.0)

    def test_str_representation(self):
        """Test string representation of Planet model"""
        self.assertEqual(str(self.earth), "Earth (Terrestrial Planet)")

    def test_planet_manager_ordered_planets(self):
        """Test PlanetManager's get_ordered_planets method"""
        ordered_planets = Planet.objects.get_ordered_planets()
        self.assertEqual(len(ordered_planets), 3)
        self.assertEqual(ordered_planets[0], self.earth)
        self.assertEqual(ordered_planets[1], self.jupiter)

    def test_planet_manager_terrestrial_planets(self):
        """Test PlanetManager's get_terrestrial_planets method"""
        terrestrial = Planet.objects.get_terrestrial_planets()
        self.assertEqual(len(terrestrial), 1)
        self.assertEqual(terrestrial[0], self.earth)

    def test_planet_manager_gas_giants(self):
        """Test PlanetManager's get_gas_giants method"""
        gas_giants = Planet.objects.get_gas_giants()
        self.assertEqual(len(gas_giants), 1)
        self.assertEqual(gas_giants[0], self.jupiter)

    def test_orbital_characteristics(self):
        """Test orbital characteristics calculations"""
        self.assertGreater(self.jupiter.orbital_period, self.earth.orbital_period)
        self.assertGreater(self.pluto.orbital_eccentricity, self.earth.orbital_eccentricity)

class SolarSystemViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.earth = Planet.objects.create(
            name="Earth",
            planet_type="terrestrial",
            diameter=12742,
            mass=1.0,
            distance_from_sun=1.0,
            orbital_period=365.26,
            orbital_eccentricity=0.0167,
            rotation_period=24,
            display_order=3,
        )

    def test_home_page_status_code(self):
        """Test that home page loads successfully"""
        response = self.client.get(reverse('solar_system:home'))
        self.assertEqual(response.status_code, 200)

    def test_home_page_template(self):
        """Test that correct template is used"""
        response = self.client.get(reverse('solar_system:home'))
        self.assertTemplateUsed(response, 'solar_system/home.html')

    def test_home_page_contains_planet(self):
        """Test that planet data is present in context"""
        response = self.client.get(reverse('solar_system:home'))
        self.assertContains(response, "Earth")

class PlanetAPITests(TestCase):
    def setUp(self):
        """Clear any existing planets and create test data"""
        Planet.objects.all().delete()  # Clear existing planets
        self.client = Client()
        self.earth = Planet.objects.create(
            name="Earth",
            planet_type="terrestrial",
            diameter=12742,
            mass=1.0,
            distance_from_sun=1.0,
            orbital_period=365.26,
            orbital_eccentricity=0.0167,
            rotation_period=24,
            display_order=3,
        )

    def test_planet_list_api(self):
        """Test the planet list API endpoint"""
        response = self.client.get(reverse('solar_system:planets_api'))
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        # Check response structure
        self.assertTrue('success' in data)
        self.assertTrue('count' in data)
        self.assertTrue('planets' in data)
        self.assertTrue('metadata' in data)
        self.assertTrue(data['success'])

        # Check planets data
        planets = data['planets']
        self.assertEqual(len(planets), 1)
        planet = planets[0]
        self.assertEqual(planet['name'], 'Earth')
        self.assertEqual(planet['planet_type'], 'terrestrial')
        self.assertEqual(planet['diameter'], 12742)

    def test_planet_detail_api(self):
        """Test the planet detail API endpoint"""
        response = self.client.get(reverse('solar_system:planet_detail_api', args=[self.earth.id]))
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        # Check response structure
        self.assertTrue('success' in data)
        self.assertTrue('planet' in data)
        self.assertTrue(data['success'])

        # Check planet data
        planet = data['planet']
        self.assertEqual(planet['name'], 'Earth')
        self.assertEqual(planet['planet_type'], 'terrestrial')
        self.assertEqual(planet['diameter'], 12742)
        self.assertEqual(planet['mass'], 1.0)
        self.assertEqual(planet['distance_from_sun'], 1.0)

    def test_nonexistent_planet_detail(self):
        """Test the planet detail API with a non-existent planet ID"""
        response = self.client.get(reverse('solar_system:planet_detail_api', args=[999]))
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.content)
        self.assertTrue('error' in data)
        self.assertTrue('message' in data)
