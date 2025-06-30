# solar_system/admin.py

from django.contrib import admin
from django.db import models
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Planet


@admin.register(Planet)
class PlanetAdmin(admin.ModelAdmin):
    """
    Enhanced Django admin interface for Planet model.

    Provides comprehensive management interface with organized fieldsets,
    custom displays, and utility functions.
    """

    # List display configuration
    list_display = [
        'display_order',
        'name',
        'planet_type_badge',
        'distance_from_sun_formatted',
        'diameter_formatted',
        'orbital_period_years',
        'moon_count',
        'is_active_badge',
        'actions_column',
    ]

    list_filter = [
        'planet_type',
        'is_dwarf_planet',
        'has_rings',
        'has_moons',
        'is_active',
    ]

    search_fields = [
        'name',
        'composition',
        'atmosphere',
    ]

    ordering = ['display_order']

    # Form organization
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'name',
                'display_order',
                'planet_type',
                'is_active',
            )
        }),
        ('Physical Characteristics', {
            'fields': (
                'diameter',
                'mass',
                'composition',
                'atmosphere',
            )
        }),
        ('Orbital Properties', {
            'fields': (
                'distance_from_sun',
                'orbital_period',
                'orbital_eccentricity',
            )
        }),
        ('Rotational Properties', {
            'fields': (
                'rotation_period',
                'axial_tilt',
            )
        }),
        ('Visual Representation', {
            'fields': (
                'color_hex',
                'texture_filename',
                'albedo',
            )
        }),
        ('Classification & Features', {
            'fields': (
                'is_dwarf_planet',
                'has_rings',
                'has_moons',
                'moon_count',
            )
        }),
        ('Metadata', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )

    readonly_fields = ['created_at', 'updated_at']

    # Custom display methods
    def planet_type_badge(self, obj):
        """Display planet type with color coding."""
        colors = {
            'terrestrial': '#8B4513',  # Brown
            'gas_giant': '#FF6347',  # Orange-red
            'ice_giant': '#4169E1',  # Blue
            'dwarf_planet': '#DDA0DD',  # Plum
        }

        color = colors.get(obj.planet_type, '#808080')

        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_planet_type_display()
        )

    planet_type_badge.short_description = 'Type'
    planet_type_badge.admin_order_field = 'planet_type'

    def distance_from_sun_formatted(self, obj):
        """Display distance with proper formatting."""
        return f"{obj.distance_from_sun:.3f} AU"

    distance_from_sun_formatted.short_description = 'Distance'
    distance_from_sun_formatted.admin_order_field = 'distance_from_sun'

    def diameter_formatted(self, obj):
        """Display diameter with formatting and Earth comparison."""
        earth_ratio = obj.get_diameter_earth_relative()
        return f"{obj.diameter:,.0f} km ({earth_ratio}× Earth)"

    diameter_formatted.short_description = 'Diameter'
    diameter_formatted.admin_order_field = 'diameter'

    def orbital_period_years(self, obj):
        """Display orbital period in years."""
        years = obj.get_orbital_period_years()
        if years < 1:
            return f"{obj.orbital_period:.1f} days"
        return f"{years:.2f} years"

    orbital_period_years.short_description = 'Orbital Period'
    orbital_period_years.admin_order_field = 'orbital_period'

    def is_active_badge(self, obj):
        """Display active status with visual indicator."""
        if obj.is_active:
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ Active</span>'
            )
        else:
            return format_html(
                '<span style="color: red; font-weight: bold;">✗ Inactive</span>'
            )

    is_active_badge.short_description = 'Status'
    is_active_badge.admin_order_field = 'is_active'

    def actions_column(self, obj):
        """Custom actions column."""
        view_url = reverse('admin:solar_system_planet_change', args=[obj.pk])
        return format_html(
            '<a href="{}" style="color: #417690;">Edit</a>',
            view_url
        )

    actions_column.short_description = 'Actions'

    # Custom admin actions
    actions = ['activate_planets', 'deactivate_planets', 'reset_to_defaults']

    def activate_planets(self, request, queryset):
        """Bulk activate selected planets."""
        updated = queryset.update(is_active=True)
        self.message_user(
            request,
            f'{updated} planet(s) were successfully activated.'
        )

    activate_planets.short_description = 'Activate selected planets'

    def deactivate_planets(self, request, queryset):
        """Bulk deactivate selected planets."""
        updated = queryset.update(is_active=False)
        self.message_user(
            request,
            f'{updated} planet(s) were successfully deactivated.'
        )

    deactivate_planets.short_description = 'Deactivate selected planets'

    def reset_to_defaults(self, request, queryset):
        """Reset selected planets to default active state."""
        updated = queryset.update(is_active=True)
        self.message_user(
            request,
            f'{updated} planet(s) were reset to default settings.'
        )

    reset_to_defaults.short_description = 'Reset to default settings'

    # Override change form template for additional functionality
    def change_view(self, request, object_id, form_url='', extra_context=None):
        """Add extra context to the change view."""
        extra_context = extra_context or {}

        if object_id:
            obj = self.get_object(request, object_id)
            if obj:
                extra_context['planet_stats'] = {
                    'earth_size_ratio': obj.get_diameter_earth_relative(),
                    'orbital_period_years': obj.get_orbital_period_years(),
                    'rotation_period_days': obj.get_rotation_period_days(),
                    'scaled_size': obj.get_scaled_size(),
                    'scaled_distance': obj.get_scaled_distance(),
                }

        return super().change_view(
            request, object_id, form_url, extra_context=extra_context
        )

    # Custom validation
    def save_model(self, request, obj, form, change):
        """Custom save logic with validation."""
        # Ensure display_order is unique
        if Planet.objects.filter(
                display_order=obj.display_order
        ).exclude(pk=obj.pk).exists():
            # Find next available display order
            max_order = Planet.objects.aggregate(
                max_order=models.Max('display_order')
            )['max_order'] or 0
            obj.display_order = max_order + 1

        super().save_model(request, obj, form, change)

    # Add custom CSS and JavaScript
    class Media:
        css = {
            'all': ('admin/css/planet_admin.css',)
        }
        js = ('admin/js/planet_admin.js',)