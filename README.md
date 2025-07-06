# 🌌 Interactive Solar System Visualization

A comprehensive 3D educational astronomy application built with Django and Three.js, featuring realistic planet rendering, orbital mechanics, and interactive controls.

![Solar System Demo](https://img.shields.io/badge/Demo-Live-brightgreen)
![Django](https://img.shields.io/badge/Django-4.2+-blue)
![Three.js](https://img.shields.io/badge/Three.js-r128-orange)
![Python](https://img.shields.io/badge/Python-3.8+-green)

## ✨ Features

### 🎯 Interactive 3D Visualization
- **Real-time 3D rendering** with WebGL using Three.js
- **Smooth orbital mechanics** with accurate planetary motion
- **Interactive camera controls** with planet following capability
- **High-quality textures** and realistic planet materials
- **Particle systems** for starfields, nebulae, and asteroid belts

### 🪐 Astronomical Accuracy
- **Real NASA data** for planet properties and orbital characteristics
- **Accurate relative scales** for educational visualization
- **Proper orbital periods** and rotational mechanics
- **Moon systems** for major planets (Earth's Moon, Galilean moons, etc.)
- **Ring systems** for Saturn, Jupiter, Uranus, and Neptune

### 🎮 User Experience
- **Intuitive mouse and keyboard controls**
- **Planet information panels** with detailed astronomical data
- **Speed controls** for time-lapse orbital motion
- **Multiple viewing modes** (top, side, angled views)
- **Screenshot functionality** for capturing views

### 📱 Modern Web Technologies
- **Responsive design** that works on desktop and mobile
- **Progressive loading** with real-time progress indicators
- **Performance optimizations** with adaptive quality settings
- **Toast notifications** for user feedback
- **Keyboard shortcuts** for power users

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Django 4.2+
- Modern web browser with WebGL support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/svetozarp/CompleteSolarSystem.git
   cd CompleteSolarSystem
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Load sample data**
   ```bash
   python manage.py populate_enchanced_planets
   ```

6. **Start development server**
   ```bash
   python manage.py runserver
   ```

7. **Open your browser**
   ```
   http://localhost:8000
   ```

## 🎯 Usage Guide

### Basic Controls

#### Mouse Controls
- **Left Click + Drag**: Rotate around the solar system
- **Mouse Wheel**: Zoom in/out
- **Right Click + Drag**: Pan the view
- **Click Planet**: Select and view information
- **Double-click Planet**: Focus camera and follow planet

#### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Space` | Play/Pause animation |
| `R` | Reset camera view |
| `1-9` | Focus on planets (Mercury to Pluto) |
| `0` | Focus on Sun |
| `H` | Toggle help panel |
| `F` | Toggle fullscreen |
| `I` | Show planet information |
| `L` | Toggle planet labels |
| `Ctrl+S` | Take screenshot |
| `Escape` | Close panels/stop following |

### Control Panel Features
- **Animation Speed**: Adjust from 0x (pause) to 5x speed
- **Display Options**: Toggle orbits, labels, asteroids, starfield
- **Quick Navigation**: Direct planet selection buttons
- **System Information**: Live simulation stats

## 🏗️ Project Structure

```
solar_system_project/
├── solar_system/                 # Main Django app
│   ├── models.py                 # Planet data models
│   ├── views.py                  # API endpoints
│   └── urls.py                   # URL routing
├── static/
│   ├── css/                      # Stylesheets
│   │   ├── base.css             # Core styling
│   │   ├── solar-system.css     # 3D visualization styles
│   │   └── normalize.css        # CSS reset
│   └── js/                       # JavaScript modules
│       ├── utils/               # Utility functions
│       │   ├── helpers.js       # General utilities
│       │   ├── math-utils.js    # Mathematical calculations
│       │   ├── api-client.js    # Django API interface
│       │   └── texture-loader.js # Advanced texture loading
│       ├── ui/                  # User interface components
│       │   ├── control-panel.js # Animation controls
│       │   ├── notification-system.js # Toast notifications
│       │   ├── info-panel-system.js # Planet information
│       │   └── header-controls.js # Navigation controls
│       └── solar-system/        # Core 3D engine
│           ├── scene-manager.js # Three.js scene setup
│           ├── planet-factory.js # Planet creation with textures
│           ├── lighting-system.js # Advanced lighting & bloom
│           ├── orbital-mechanics.js # Physics simulation
│           ├── camera-controls.js # Camera interaction
│           ├── interaction-manager.js # User input handling
│           ├── particle-systems.js # Starfield & effects
│           ├── planet-labels.js # Dynamic labeling
│           └── solar-system-app.js # Main application
└── templates/
    ├── base.html                # Base template
    └── solar_system/
        └── home.html            # Main visualization page
```

## 🔧 Technical Architecture

### Backend (Django)
- **RESTful API** for planet data delivery
- **Model-based** planet information storage
- **JSON responses** with comprehensive astronomical data
- **CORS-enabled** for frontend integration

### Frontend (JavaScript/Three.js)
- **Modular architecture** with clear separation of concerns
- **Event-driven communication** between components
- **Performance monitoring** and adaptive quality settings
- **Memory management** with proper resource disposal

### 3D Rendering Pipeline
1. **Scene Setup**: Three.js scene with realistic lighting
2. **Planet Creation**: Textured spheres with proper scaling
3. **Orbital Animation**: Physics-based movement simulation
4. **Post-processing**: Bloom effects for enhanced visuals
5. **User Interaction**: Mouse/keyboard input handling

## 🎨 Customization

### Adding New Planets
1. Add planet data to Django models
2. Include orbital parameters and physical properties
3. Add texture files to `/static/textures/`
4. Update texture paths in `planet-factory.js`

### Modifying Visual Effects
- **Lighting**: Edit `lighting-system.js` for bloom and shadows
- **Particles**: Customize `particle-systems.js` for starfields
- **Materials**: Modify `planet-factory.js` for surface appearance
- **Scaling**: Adjust factors in `math-utils.js`

### Adding Features
- **New Controls**: Extend `control-panel.js`
- **Information Panels**: Modify `info-panel-system.js`
- **Interactions**: Enhance `interaction-manager.js`
- **Animations**: Add to `orbital-mechanics.js`

## 📊 Performance Optimization

### Rendering Performance
- **Adaptive quality** based on device capabilities
- **Level-of-detail** for distant objects
- **Efficient particle systems** with instancing
- **Optimized shaders** for mobile devices

### Memory Management
- **Texture caching** with intelligent disposal
- **Geometry sharing** between similar objects
- **Event listener cleanup** to prevent leaks
- **Resource monitoring** in debug mode

### Loading Optimization
- **Progressive asset loading** with priority queues
- **Texture compression** for faster downloads
- **Lazy loading** of detailed planet information
- **Cached API responses** for repeated requests

## 🌟 Educational Features

### Astronomical Data
- **Real planetary facts** from NASA and IAU sources
- **Scale comparisons** to help understand relative sizes
- **Orbital mechanics** education through visualization
- **Historical context** and exploration information

### Interactive Learning
- **Guided tours** of the solar system
- **Comparative analysis** tools
- **Real-time statistics** display
- **Educational tooltips** and information panels

## 🛠️ Development

### Debug Mode
Enable debug features by setting in Django settings:
```python
DEBUG = True
```

## 📱 Browser Compatibility

### Recommended Browsers
- **Chrome 90+** (Best performance)
- **Firefox 88+** (Good performance)
- **Safari 14+** (Good performance)
- **Edge 90+** (Good performance)

### Requirements
- **WebGL 2.0** support (fallback to WebGL 1.0)
- **Modern JavaScript** (ES6+)
- **CSS Grid** support
- **3D acceleration** enabled

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Contribution Areas
- 🌍 **Planetary data** accuracy improvements
- 🎨 **Visual enhancements** and new effects
- 📱 **Mobile optimization** and responsive design
- 🧪 **Testing** and quality assurance
- 📚 **Documentation** and tutorials
- 🌐 **Internationalization** support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NASA** for planetary data and imagery
- **International Astronomical Union (IAU)** for astronomical standards
- **Three.js** community for excellent 3D web graphics
- **Django** team for the robust web framework
- **Educational astronomy** resources worldwide

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/svetozarp/CompleteSolarSystem/issues)
- **Discussions**: [GitHub Discussions](https://github.com/svetozarp/CompleteSolarSystem/discussions)
- **Documentation**: [Wiki](https://github.com/svetozarp/CompleteSolarSystem/wiki)

---

**Made with ❤️ for astronomy education and interactive learning**

![Solar System](https://img.shields.io/badge/Explore-The%20Solar%20System-blueviolet)
![Educational](https://img.shields.io/badge/Purpose-Educational-green)
![Open Source](https://img.shields.io/badge/Open-Source-orange)