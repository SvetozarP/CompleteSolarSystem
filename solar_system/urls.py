from django.urls import path
from . import views

app_name = 'solar_system'

urlpatterns = [
    # Main solar system visualization page
    path('', views.SolarSystemView.as_view(), name='home'),

    # API endpoints for Three.js data consumption
    path('api/planets/', views.PlanetsAPIView.as_view(), name='planets_api'),
    path('api/planets/<int:planet_id>/', views.PlanetDetailAPIView.as_view(), name='planet_detail_api'),

    # Additional utility endpoints
    path('api/system-info/', views.SystemInfoAPIView.as_view(), name='system_info_api'),
]