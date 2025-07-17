# 🌌 Complete Solar System

> **An immersive 3D educational astronomy application that brings the wonders of our solar system to your browser**

A comprehensive interactive visualization built with Django and Three.js, featuring scientifically accurate planetary data, realistic orbital mechanics, and extensive educational content. Perfect for students, educators, and space enthusiasts.

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-4.2+-092E20?style=for-the-badge&logo=django)](https://www.djangoproject.com/)
[![Three.js](https://img.shields.io/badge/Three.js-r178-000000?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Tests](https://img.shields.io/badge/Tests-Passing-success?style=for-the-badge)](https://github.com/SvetozarP/CompleteSolarSystem)
[![Coverage](https://img.shields.io/badge/Coverage-85%25-green?style=for-the-badge)](https://github.com/SvetozarP/CompleteSolarSystem)

</div>

## ✨ Key Features

### 🎯 **Immersive 3D Experience**
- **WebGL-powered rendering** with Three.js for smooth 60fps performance
- **Realistic orbital mechanics** with accurate planetary motion and rotation
- **Interactive camera system** with smooth following and targeting
- **High-resolution textures** from NASA imagery for all celestial bodies
- **Advanced particle systems** for starfields, nebulae, and asteroid belts

### 🪐 **Scientific Accuracy**
- **Authentic NASA/IAU data** for all planetary properties and characteristics
- **Proportional scaling** system for educational visualization
- **Accurate orbital periods** and rotational mechanics
- **Complete moon systems** including Earth's Moon and Galilean satellites
- **Detailed ring systems** for gas giants with realistic textures

### 🎮 **Intuitive Controls**
- **Mouse + keyboard navigation** with customizable controls
- **Planet information panels** displaying comprehensive astronomical data
- **Speed controls** for time-lapse observation (0.1x to 5x speed)
- **Multiple camera modes** and viewing angles
- **Screenshot capture** functionality

### 📱 **Modern Architecture**
- **Responsive design** optimized for desktop and mobile devices
- **Progressive loading** with visual progress indicators
- **Performance monitoring** with adaptive quality settings
- **Toast notifications** for seamless user feedback
- **Comprehensive keyboard shortcuts** for power users

## 📸 Screenshots

<div align="center">

### Main Solar System View
![Solar System Overview](https://github.com/user-attachments/assets/9a93431a-8a73-40db-8cda-a29f56f7fae2)

### Planet Details & Information Panel
![Planet Information Panel](https://github.com/user-attachments/assets/5d7a4d48-9b2e-43be-bf6d-bc43c7dcad71)

### Interactive Controls & Navigation
![Interactive Controls](https://github.com/user-attachments/assets/1b5a0d70-baf7-4e3c-b64a-cd93d5aa2ea0)

### Ring Systems & Particle Effects
![Ring Systems](https://github.com/user-attachments/assets/a98a2372-1360-4e38-a9ec-5ff5af8d7551)

</div>

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** with pip
- **Modern web browser** with WebGL 2.0 support
- **Node.js 16+** (for testing and development)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/SvetozarP/CompleteSolarSystem.git
cd CompleteSolarSystem

# 2. Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Install JavaScript testing dependencies
npm install

# 5. Set up the database
python manage.py migrate

# 6. Load planetary data
python manage.py populate_enhanced_planets

# 7. Start the development server
python manage.py runserver
```

**🌐 Open your browser and navigate to:** `http://localhost:8000`

### Docker Setup (Alternative)

```bash
# Build and run with Docker
docker-compose up --build

# Access at http://localhost:8000
```

## 🧪 Testing & Quality Assurance

### Test Suite Overview

The project maintains **85%+ test coverage** across both backend and frontend components, ensuring reliability and maintainability.

### Running Tests

```bash
# Run all tests
npm test && python manage.py test

# Backend tests only
python manage.py test

# Frontend tests only
npm test

# Coverage reports
npm run test:coverage
```

### Test Architecture

<table>
<tr>
<th>Component</th>
<th>Test Files</th>
<th>Coverage</th>
</tr>
<tr>
<td><strong>Backend (Django)</strong></td>
<td><code>solar_system/tests.py</code></td>
<td>90%+</td>
</tr>
<tr>
<td><strong>Frontend (JavaScript)</strong></td>
<td><code>static/js/__tests__/</code></td>
<td>85%+</td>
</tr>
<tr>
<td><strong>API Integration</strong></td>
<td>Planet data, system info</td>
<td>95%+</td>
</tr>
</table>

### Key Test Categories

#### 🔧 **Backend Tests**
- **Planet Model Validation**: Data integrity, calculations, relationships
- **API Endpoints**: JSON responses, error handling, caching
- **Database Operations**: CRUD operations, migrations, data consistency

#### 🎮 **Frontend Tests**
- **3D Graphics**: Camera controls, orbital mechanics, rendering
- **User Interactions**: Mouse/keyboard input, planet selection
- **UI Components**: Control panels, notifications, info displays

#### 🔗 **Integration Tests**
- **API Communication**: Data flow between Django and Three.js
- **Real-time Updates**: Animation synchronization, performance monitoring
- **Cross-browser Compatibility**: WebGL support, feature detection

## 🎯 Usage Guide

### Navigation Controls

<table>
<tr>
<th>Control</th>
<th>Action</th>
<th>Description</th>
</tr>
<tr>
<td><kbd>Left Click + Drag</kbd></td>
<td>Rotate View</td>
<td>Orbit around the solar system</td>
</tr>
<tr>
<td><kbd>Mouse Wheel</kbd></td>
<td>Zoom</td>
<td>Zoom in/out of the scene</td>
</tr>
<tr>
<td><kbd>Right Click + Drag</kbd></td>
<td>Pan</td>
<td>Move the view laterally</td>
</tr>
<tr>
<td><kbd>Click Planet</kbd></td>
<td>Select</td>
<td>View planet information</td>
</tr>
<tr>
<td><kbd>Double-click Planet</kbd></td>
<td>Follow</td>
<td>Camera follows planet orbit</td>
</tr>
</table>

### Keyboard Shortcuts

<table>
<tr>
<th>Key</th>
<th>Action</th>
<th>Key</th>
<th>Action</th>
</tr>
<tr>
<td><kbd>Space</kbd></td>
<td>Play/Pause animation</td>
<td><kbd>R</kbd></td>
<td>Reset camera view</td>
</tr>
<tr>
<td><kbd>1-9</kbd></td>
<td>Focus on planets</td>
<td><kbd>0</kbd></td>
<td>Focus on Sun</td>
</tr>
<tr>
<td><kbd>H</kbd></td>
<td>Toggle help panel</td>
<td><kbd>F</kbd></td>
<td>Toggle fullscreen</td>
</tr>
<tr>
<td><kbd>I</kbd></td>
<td>Planet information</td>
<td><kbd>L</kbd></td>
<td>Toggle planet labels</td>
</tr>
<tr>
<td><kbd>Ctrl+S</kbd></td>
<td>Take screenshot</td>
<td><kbd>Escape</kbd></td>
<td>Close panels</td>
</tr>
</table>

### Control Panel Features
- **🎮 Animation Speed**: Adjust from 0.1x to 5x speed
- **👁️ Display Options**: Toggle orbits, labels, asteroids, starfield
- **🚀 Quick Navigation**: Direct planet selection buttons
- **📊 System Information**: Live simulation statistics

## 🏗️ Technical Architecture

### Project Structure
```
CompleteSolarSystem/
├── 🐍 Backend (Django)
│   ├── solar_system/
│   │   ├── models.py              # Planet data models with validation
│   │   ├── views.py               # RESTful API endpoints
│   │   ├── tests.py               # Comprehensive backend tests
│   │   └── management/commands/   # Data population scripts
│   └── solar_system_project/      # Django project configuration
│
├── 🎨 Frontend (JavaScript/Three.js)
│   ├── static/js/
│   │   ├── solar-system/          # Core 3D engine modules
│   │   │   ├── solar-system-app.js
│   │   │   ├── orbital-mechanics.js
│   │   │   ├── camera-controls.js
│   │   │   └── scene-manager.js
│   │   ├── ui/                    # User interface components
│   │   └── utils/                 # Utility functions & helpers
│   └── static/css/                # Responsive stylesheets
│
├── 🧪 Testing Suite
│   ├── static/js/__tests__/       # Frontend Jest tests
│   ├── coverage/                  # Test coverage reports
│   └── jest.config.js             # Test configuration
│
└── 📦 Configuration
    ├── requirements.txt           # Python dependencies
    ├── package.json              # JavaScript dependencies
    └── babel.config.js           # Babel configuration
```

### Core Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | Django 4.2+ | RESTful API, data models, admin interface |
| **Frontend** | Three.js r178 | 3D graphics, WebGL rendering, animations |
| **Database** | SQLite | Planet data storage and retrieval |
| **Testing** | Jest + Django Test | Frontend and backend test suites |
| **Build** | Babel + npm | JavaScript transpilation and package management |

## 🎨 Educational Content

### Astronomical Data Sources
- **NASA Planetary Fact Sheets** - Official planetary data and characteristics
- **International Astronomical Union (IAU)** - Official naming conventions and classifications
- **NASA/JPL Imagery** - High-resolution planet and moon textures
- **Scientific Literature** - Peer-reviewed orbital mechanics and composition data

### Educational Features
- **Interactive Learning**: Click planets to explore detailed information
- **Scale Understanding**: Proportional sizing helps visualize relative planet sizes
- **Orbital Mechanics**: Watch real-time planetary motion and rotation
- **Comparative Analysis**: Direct comparison tools between planets
- **Historical Context**: Exploration missions and discovery information

## ⚡ Performance & Optimization

### Performance Features
- **Adaptive Quality Settings**: Automatically adjusts based on device capabilities
- **Level of Detail (LOD)**: Optimizes distant object rendering
- **Efficient Particle Systems**: Uses instancing for better performance
- **Memory Management**: Proper resource cleanup and disposal
- **Frame Rate Monitoring**: Real-time performance tracking

### Browser Compatibility

| Browser | Support | Performance | Notes |
|---------|---------|-------------|-------|
| Chrome 90+ | ✅ Full | Excellent | Best performance, all features |
| Firefox 88+ | ✅ Full | Good | Full WebGL 2.0 support |
| Safari 14+ | ✅ Full | Good | iOS compatibility |
| Edge 90+ | ✅ Full | Excellent | Chromium-based |

### System Requirements
- **WebGL 2.0** support (fallback to WebGL 1.0)
- **Modern JavaScript** (ES6+) support
- **Minimum 2GB RAM** for optimal performance
- **Dedicated Graphics** recommended for best experience

## 🛠️ Development & Contributing

### Development Setup

```bash
# Enable Django debug mode
export DEBUG=True

# Run development server with auto-reload
python manage.py runserver --settings=solar_system_project.settings

# Run tests in watch mode
npm run test:watch
```

### Contributing Guidelines

We welcome contributions! Here's how to get started:

1. **Fork the repository** and create your feature branch
2. **Write tests first** - Follow TDD principles
3. **Implement your feature** ensuring tests pass
4. **Update documentation** if needed
5. **Submit a pull request** with clear description

### Code Style & Standards
- **Python**: Follow PEP 8 guidelines
- **JavaScript**: Use ES6+ features and consistent formatting
- **Testing**: Maintain 85%+ test coverage
- **Documentation**: Update README for new features

### Areas for Contribution
- 🌍 **Planetary Data**: Accuracy improvements and new celestial bodies
- 🎨 **Visual Effects**: Enhanced graphics and animations
- 📱 **Mobile Optimization**: Touch controls and responsive design
- 🧪 **Testing**: Expand test coverage and add edge cases
- 🌐 **Internationalization**: Multi-language support
- 📚 **Educational Content**: Learning materials and tutorials

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Special thanks to the following organizations and communities:

- **[NASA](https://www.nasa.gov/)** - For planetary data, imagery, and scientific resources
- **[International Astronomical Union (IAU)](https://www.iau.org/)** - For astronomical standards and classifications
- **[Three.js Community](https://threejs.org/)** - For the excellent 3D graphics library
- **[Django Team](https://www.djangoproject.com/)** - For the robust web framework
- **[Jest Testing Framework](https://jestjs.io/)** - For comprehensive JavaScript testing
- **Educational Astronomy Resources** - Worldwide contributors to space education

## 🆘 Support & Resources

### Getting Help
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/SvetozarP/CompleteSolarSystem/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/SvetozarP/CompleteSolarSystem/discussions)
- **📖 Documentation**: [Project Wiki](https://github.com/SvetozarP/CompleteSolarSystem/wiki)
- **📧 Contact**: Create an issue for direct support

### Quick Commands Reference
```bash
# Development
python manage.py runserver          # Start development server
python manage.py populate_enhanced_planets  # Load planet data

# Testing
npm test                           # Run JavaScript tests
python manage.py test             # Run Django tests
npm run test:coverage             # Generate coverage report

# Deployment
python manage.py collectstatic    # Collect static files
python manage.py migrate          # Run database migrations
```

---

<div align="center">

### 🌟 **Explore the Cosmos from Your Browser** 🌟

**Built with passion for astronomy education and interactive learning**

[![GitHub Stars](https://img.shields.io/github/stars/SvetozarP/CompleteSolarSystem?style=social)](https://github.com/SvetozarP/CompleteSolarSystem)
[![GitHub Forks](https://img.shields.io/github/forks/SvetozarP/CompleteSolarSystem?style=social)](https://github.com/SvetozarP/CompleteSolarSystem)

![Educational](https://img.shields.io/badge/Purpose-Educational-4CAF50?style=for-the-badge)
![Open Source](https://img.shields.io/badge/Open-Source-FF9800?style=for-the-badge)
![Well Tested](https://img.shields.io/badge/Quality-Well%20Tested-2196F3?style=for-the-badge)

</div>
