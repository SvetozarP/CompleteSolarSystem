# solar_system/models.py

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import logging

logger = logging.getLogger(__name__)


class PlanetManager(models.Manager):
    """Custom manager for Planet model with utility methods."""

    def get_ordered_planets(self):
        """Return planets ordered by display order."""
        return self.filter(is_active=True).order_by('display_order')

    def get_terrestrial_planets(self):
        """Return terrestrial (rocky) planets."""
        return self.filter(
            planet_type='terrestrial',
            is_active=True
        ).order_by('display_order')

    def get_gas_giants(self):
        """Return gas giant planets."""
        return self.filter(
            planet_type='gas_giant',
            is_active=True
        ).order_by('display_order')


class Planet(models.Model):
    """
    Model representing a planet or celestial body in our solar system.

    Follows SOLID principles with single responsibility for storing
    planetary data and providing access methods.
    """

    PLANET_TYPE_CHOICES = [
        ('terrestrial', 'Terrestrial Planet'),
        ('gas_giant', 'Gas Giant'),
        ('ice_giant', 'Ice Giant'),
        ('dwarf_planet', 'Dwarf Planet'),
    ]

    # Basic identification
    name = models.CharField(
        max_length=50,
        unique=True,
        help_text="Official name of the celestial body"
    )

    display_order = models.IntegerField(
        unique=True,
        help_text="Order for display (1=Mercury, 2=Venus, etc.)"
    )

    planet_type = models.CharField(
        max_length=20,
        choices=PLANET_TYPE_CHOICES,
        default='terrestrial',
        help_text="Classification of the planet"
    )

    # Physical characteristics
    distance_from_sun = models.FloatField(
        validators=[MinValueValidator(0.1)],
        help_text="Average distance from sun in Astronomical Units (AU)"
    )

    diameter = models.FloatField(
        validators=[MinValueValidator(100)],
        help_text="Diameter in kilometers"
    )

    mass = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0.001)],
        help_text="Mass relative to Earth (Earth = 1.0)"
    )

    # Orbital characteristics
    orbital_period = models.FloatField(
        validators=[MinValueValidator(0.1)],
        help_text="Time to orbit sun in Earth days"
    )

    orbital_eccentricity = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Orbital eccentricity (0 = perfect circle, >0 = elliptical)"
    )

    # Rotational characteristics
    rotation_period = models.FloatField(
        validators=[MinValueValidator(0.1)],
        help_text="Rotation period in hours"
    )

    axial_tilt = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(180.0)],
        help_text="Axial tilt in degrees"
    )

    # Composition and atmosphere
    composition = models.TextField(
        help_text="Primary composition and notable characteristics"
    )

    atmosphere = models.TextField(
        blank=True,
        help_text="Atmospheric composition (if any)"
    )

    # Visual representation
    color_hex = models.CharField(
        max_length=7,
        default='#888888',
        help_text="Hex color code for basic rendering (e.g., #FF6B47)"
    )

    texture_filename = models.CharField(
        max_length=100,
        blank=True,
        help_text="Filename for planet texture (without path)"
    )

    albedo = models.FloatField(
        default=0.3,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Surface reflectivity (0 = black, 1 = perfect reflector)"
    )

    # Classification flags
    is_dwarf_planet = models.BooleanField(
        default=False,
        help_text="Is this classified as a dwarf planet?"
    )

    has_rings = models.BooleanField(
        default=False,
        help_text="Does this planet have ring systems?"
    )

    has_moons = models.BooleanField(
        default=False,
        help_text="Does this planet have natural satellites?"
    )

    moon_count = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Number of known moons"
    )

    # System management
    is_active = models.BooleanField(
        default=True,
        help_text="Should this planet be displayed in the simulation?"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Custom manager
    objects = PlanetManager()

    class Meta:
        ordering = ['display_order']
        verbose_name = 'Planet'
        verbose_name_plural = 'Planets'

    def __str__(self):
        return f"{self.name} ({self.get_planet_type_display()})"

    def get_orbital_period_years(self):
        """Return orbital period in Earth years."""
        return round(self.orbital_period / 365.25, 2)

    def get_rotation_period_days(self):
        """Return rotation period in Earth days."""
        return round(self.rotation_period / 24, 2)

    def get_diameter_earth_relative(self):
        """Return diameter relative to Earth."""
        earth_diameter = 12742  # km
        return round(self.diameter / earth_diameter, 2)

    def get_scaled_size(self, scale_factor=1000):
        """
        Get scaled size for 3D rendering.

        Args:
            scale_factor: Factor to scale down real sizes for visibility

        Returns:
            float: Scaled radius for Three.js sphere
        """
        # Convert diameter to radius and scale
        radius = (self.diameter / 2) / scale_factor
        # Ensure minimum visible size
        return max(radius, 0.1)

    def get_scaled_distance(self, scale_factor=10):
        """
        Get scaled orbital distance for 3D rendering.

        Args:
            scale_factor: Factor to compress orbital distances

        Returns:
            float: Scaled distance from sun
        """
        # Scale AU to reasonable viewing distance
        scaled_distance = self.distance_from_sun * scale_factor
        return max(scaled_distance, 1.0)  # Minimum distance

    def to_dict(self):
        """
        Convert planet to dictionary for JSON serialization.

        Returns:
            dict: Planet data suitable for Three.js consumption
        """
        return {
            'id': self.id,
            'name': self.name,
            'display_order': self.display_order,
            'planet_type': self.planet_type,
            'distance_from_sun': self.distance_from_sun,
            'diameter': self.diameter,
            'mass': self.mass,
            'orbital_period': self.orbital_period,
            'orbital_eccentricity': self.orbital_eccentricity,
            'rotation_period': self.rotation_period,
            'axial_tilt': self.axial_tilt,
            'composition': self.composition,
            'atmosphere': self.atmosphere,
            'color_hex': self.color_hex,
            'texture_filename': self.texture_filename,
            'albedo': self.albedo,
            'is_dwarf_planet': self.is_dwarf_planet,
            'has_rings': self.has_rings,
            'has_moons': self.has_moons,
            'moon_count': self.moon_count,
            'orbital_period_years': self.get_orbital_period_years(),
            'rotation_period_days': self.get_rotation_period_days(),
            'diameter_earth_relative': self.get_diameter_earth_relative(),
            'scaled_size': self.get_scaled_size(),
            'scaled_distance': self.get_scaled_distance(),
        }

    def save(self, *args, **kwargs):
        """Override save to add logging."""
        logger.info(f"Saving planet: {self.name}")
        super().save(*args, **kwargs)