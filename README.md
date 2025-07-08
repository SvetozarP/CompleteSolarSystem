# 🌌 Interactive Solar System Visualization

A comprehensive 3D educational astronomy application built with Django and Three.js, featuring realistic planet rendering, orbital mechanics, interactive controls, and comprehensive testing.

![Solar System Demo](https://img.shields.io/badge/Demo-Live-brightgreen)
![Django](https://img.shields.io/badge/Django-4.2+-blue)
![Three.js](https://img.shields.io/badge/Three.js-r128-orange)
![Python](https://img.shields.io/badge/Python-3.8+-green)
![Tests](https://img.shields.io/badge/Tests-Passing-success)
![Coverage](https://img.shields.io/badge/Coverage-85%25-green)

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

### Screenshots:

![image](https://github.com/user-attachments/assets/9a93431a-8a73-40db-8cda-a29f56f7fae2)

![image](https://github.com/user-attachments/assets/5d7a4d48-9b2e-43be-bf6d-bc43c7dcad71)

![image](https://github.com/user-attachments/assets/1b5a0d70-baf7-4e3c-b64a-cd93d5aa2ea0)

![image](https://github.com/user-attachments/assets/a98a2372-1360-4e38-a9ec-5ff5af8d7551)

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Django 4.2+
- Node.js 16+ (for testing)
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
   npm install  # Install JavaScript testing dependencies
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Load sample data**
   ```bash
   python manage.py populate_enhanced_planets
   ```

6. **Start development server**
   ```bash
   python manage.py runserver
   ```

7. **Open your browser**
   ```
   http://localhost:8000
   ```

## 🧪 Testing

### Running Tests

The project includes comprehensive testing for both backend and frontend components.

#### Python/Django Tests
```bash
# Run all Django tests
python manage.py test
# Run specific test modules
python manage.py test solar_system.tests
python manage.py test solar_system.tests.PlanetModelTests
```

#### JavaScript Tests
```bash
# Run all JavaScript tests
npm test
# Run specific test files
npm test -- camera-controls.test.js
npm test -- orbital-mechanics.test.js
```

### Test Structure

#### Backend Tests (`solar_system/tests.py`)
- **Model Tests**: Planet data validation, calculations, and relationships
- **View Tests**: API endpoints, template rendering, and responses
- **API Tests**: Planet data retrieval, system information, and error handling

#### Frontend Tests (`static/js/__tests__/`)
- **Camera Controls**: Mouse interaction, following mechanics, zooming
- **Orbital Mechanics**: Planet positioning, animation, time scaling
- **Interaction Manager**: Planet selection, tooltips, event handling

### Test Configuration

#### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': ['babel-jest', { rootMode: 'upward' }]
  },
  moduleNameMapping: {
    '^three$': '<rootDir>/node_modules/three',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/static/js/__mocks__/fileMock.js'
  },
  setupFilesAfterEnv: ['<rootDir>/static/js/__tests__/setup.js'],
  testMatch: ['<rootDir>/static/js/__tests__/**/*.test.js']
};
```

#### Test Setup (`static/js/__tests__/setup.js`)
- Browser environment mocking
- WebGL context simulation
- Three.js texture loading mocks
- Performance API polyfills


### Continuous Integration

The project is configured for CI/CD with automated testing:

```yaml
# Example GitHub Actions workflow
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.8
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          npm install
      - name: Run Python tests
        run: python manage.py test
      - name: Run JavaScript tests
        run: npm test
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
│   ├── tests.py                  # Backend tests
│   └── management/commands/      # Management commands
├── static/
│   ├── css/                      # Stylesheets
│   └── js/                       # JavaScript modules
│       ├── __tests__/            # Frontend tests
│       │   ├── setup.js          # Test environment setup
│       │   ├── camera-controls.test.js
│       │   ├── orbital-mechanics.test.js
│       │   └── interaction-manager.test.js
│       ├── utils/                # Utility functions
│       ├── ui/                   # User interface components
│       └── solar-system/         # Core 3D engine
├── templates/                    # Django templates
├── jest.config.js               # JavaScript test configuration
├── babel.config.js              # Babel configuration
└── requirements.txt             # Python dependencies
```

## 🔧 Technical Architecture

### Backend (Django)
- **RESTful API** for planet data delivery
- **Model-based** planet information storage
- **JSON responses** with comprehensive astronomical data
- **CORS-enabled** for frontend integration
- **Comprehensive test coverage**

### Frontend (JavaScript/Three.js)
- **Modular architecture** with clear separation of concerns
- **Event-driven communication** between components
- **Performance monitoring** and adaptive quality settings
- **Memory management** with proper resource disposal
- **Extensive unit and integration tests**

## 🎨 Customization

### Adding New Planets
1. Add planet data to Django models
2. Include orbital parameters and physical properties
3. Add texture files to `/static/textures/`
4. Update texture paths in `planet-factory.js`
5. **Write tests** for new planet data validation

### Testing New Features
1. Write unit tests for individual components
2. Add integration tests for component interactions
3. Update test fixtures with new data
4. Run full test suite to ensure compatibility

## 📊 Performance Optimization

### Rendering Performance
- **Adaptive quality** based on device capabilities
- **Level-of-detail** for distant objects
- **Efficient particle systems** with instancing
- **Optimized shaders** for mobile devices
- **Performance monitoring** in tests

## 🌟 Educational Features

### Astronomical Data
- **Real planetary facts** from NASA and IAU sources
- **Scale comparisons** to help understand relative sizes
- **Orbital mechanics** education through visualization
- **Historical context** and exploration information
- **Data accuracy verified through tests**

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

### Test-Driven Development Workflow
1. Write failing tests for new features
2. Implement minimal code to pass tests
3. Refactor while maintaining test coverage
4. Add integration tests for component interactions

## 📱 Browser Compatibility

### Recommended Browsers
- **Chrome 90+** (Best performance, full test coverage)
- **Firefox 88+** (Good performance, tested)
- **Safari 14+** (Good performance, tested)
- **Edge 90+** (Good performance, tested)

### Requirements
- **WebGL 2.0** support (fallback to WebGL 1.0)
- **Modern JavaScript** (ES6+)
- **CSS Grid** support
- **3D acceleration** enabled

### Testing Across Browsers
- **Automated cross-browser testing** with Selenium
- **WebGL compatibility checks**
- **Performance benchmarks** per browser
- **Feature detection** and graceful degradation

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Write tests** for your new feature
4. **Implement the feature** and ensure tests pass
5. **Run the full test suite**: `npm test && python manage.py test`
6. **Commit changes**: `git commit -m 'Add amazing feature with tests'`
7. **Push to branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Testing Requirements for Contributions
- **All new features must include tests**
- **Maintain or improve code coverage**
- **Follow existing test patterns**
- **Include both unit and integration tests**
- **Update documentation for test procedures**

### Contribution Areas
- 🌍 **Planetary data** accuracy improvements
- 🎨 **Visual enhancements** and new effects
- 📱 **Mobile optimization** and responsive design
- 🧪 **Testing** and quality assurance
- 📚 **Documentation** and tutorials
- 🌐 **Internationalization** support

## 🧪 Quality Assurance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NASA** for planetary data and imagery
- **International Astronomical Union (IAU)** for astronomical standards
- **Three.js** community for excellent 3D web graphics
- **Django** team for the robust web framework
- **Jest** and **Testing Library** for testing frameworks
- **Educational astronomy** resources worldwide

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/svetozarp/CompleteSolarSystem/issues)
- **Discussions**: [GitHub Discussions](https://github.com/svetozarp/CompleteSolarSystem/discussions)
- **Documentation**: [Wiki](https://github.com/svetozarp/CompleteSolarSystem/wiki)
- **Testing Guide**: See `/docs/testing.md` for detailed testing instructions

## 🔍 Testing Quick Reference

```bash
# Quick test commands
npm test                    # Run all JavaScript tests
python manage.py test      # Run all Django tests

```

---

**Made with ❤️ for astronomy education, interactive learning, and quality software engineering**

![Solar System](https://img.shields.io/badge/Explore-The%20Solar%20System-blueviolet)
![Educational](https://img.shields.io/badge/Purpose-Educational-green)
![Open Source](https://img.shields.io/badge/Open-Source-orange)
![Tested](https://img.shields.io/badge/Quality-Tested-success)
