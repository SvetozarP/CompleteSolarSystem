import * as THREE from 'three';

export class SceneManager {
    constructor(options = {}) {
        this.options = {
            containerId: 'canvas-container',
            canvasId: 'solar-system-canvas',
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            precision: 'highp',
            logarithmicDepthBuffer: true,
            preserveDrawingBuffer: false,
            enableShadows: false,
            shadowMapSize: 2048,
            ...options
        };

        // Core Three.js objects
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        this.container = null;

        // Performance monitoring
        this.stats = {
            fps: 60,
            frameTime: 0,
            geometries: 0,
            textures: 0,
            programs: 0,
            calls: 0,
            triangles: 0,
            points: 0,
            lines: 0
        };

        // Animation and timing
        this.clock = new THREE.Clock();
        this.frameCount = 0;
        this.lastTime = 0;
        this.deltaTime = 0;

        // Render settings
        this.isAnimating = true;
        this.needsResize = false;
        this.quality = 1.0; // Render quality multiplier

        // Event listeners storage for cleanup
        this.eventListeners = [];

        // FIXED: Add initialization state tracking
        this.isInitialized = false;
        this.initializationPromise = null;
    }

    /**
     * FIXED: Initialize the Three.js scene with proper timing
     * @returns {Promise<boolean>} Success status
     */
    async init() {
        // FIXED: Return existing promise if already initializing
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._performInitialization();
        return this.initializationPromise;
    }

    /**
     * FIXED: Actual initialization logic with proper DOM waiting
     */
    async _performInitialization() {
        try {
            // FIXED: Wait for DOM to be fully ready and container to have dimensions
            await this.waitForContainer();

            // Get container element with validation
            this.container = document.getElementById(this.options.containerId);
            if (!this.container) {
                throw new Error(`Container element '${this.options.containerId}' not found`);
            }

            // FIXED: Ensure container has dimensions before proceeding
            await this.ensureContainerDimensions();

            // Initialize Three.js components in correct order
            await this.initRenderer();
            this.initScene();
            this.initCamera();
            this.setupEventListeners();

            // FIXED: Force initial size update after everything is created
            this.updateSize();

            this.isInitialized = true;

            if (window.Helpers) {
                window.Helpers.log('SceneManager initialized successfully', 'debug');
            }

            return true;
        } catch (error) {
            if (window.Helpers) {
                window.Helpers.handleError(error, 'SceneManager.init');
            }
            throw error;
        }
    }

    /**
     * FIXED: Wait for container to be available (with timeout to prevent freeze)
     */
    async waitForContainer() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 100; // Prevent infinite waiting

            const checkContainer = () => {
                const container = document.getElementById(this.options.containerId);
                attempts++;

                if (container) {
                    // Container exists, that's enough - don't wait for dimensions
                    console.log(`Container found after ${attempts} attempts`);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.warn('Container check timeout, proceeding anyway');
                    resolve();
                } else {
                    requestAnimationFrame(checkContainer);
                }
            };

            checkContainer();
        });
    }

    /**
     * FIXED: Ensure container has proper dimensions (with fallbacks)
     */
    async ensureContainerDimensions() {
        const container = this.container;

        // FIXED: Get dimensions or use fallback
        let width = container.clientWidth;
        let height = container.clientHeight;

        // If container has no dimensions, force them
        if (width === 0 || height === 0) {
            console.warn('Container has no dimensions, using viewport fallback');

            // Use viewport dimensions as fallback
            width = window.innerWidth;
            height = window.innerHeight - 80; // Account for header

            // Apply dimensions to container
            container.style.width = width + 'px';
            container.style.height = height + 'px';

            // Wait a frame for CSS to apply
            await new Promise(resolve => requestAnimationFrame(resolve));

            // Re-read dimensions
            width = container.clientWidth || width;
            height = container.clientHeight || height;
        }

        if (window.Helpers) {
            window.Helpers.log(`Container dimensions ensured: ${width}x${height}`, 'debug');
        }
    }

    /**
     * FIXED: Initialize WebGL renderer with proper container dimensions
     */
    async initRenderer() {
        // Get or create canvas
        this.canvas = document.getElementById(this.options.canvasId);
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = this.options.canvasId;
            this.canvas.className = 'solar-system-canvas';
            this.container.appendChild(this.canvas);
        }

        // Check WebGL support
        if (!this.checkWebGLSupport()) {
            throw new Error('WebGL is not supported in this browser');
        }

        // FIXED: Get actual container dimensions for renderer
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        if (width === 0 || height === 0) {
            throw new Error(`Invalid container dimensions: ${width}x${height}`);
        }

        // Create renderer with proper dimensions
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: this.options.antialias,
            alpha: this.options.alpha,
            powerPreference: this.options.powerPreference,
            precision: this.options.precision,
            logarithmicDepthBuffer: this.options.logarithmicDepthBuffer,
            preserveDrawingBuffer: this.options.preserveDrawingBuffer
        });

        // Configure renderer
        this.configureRenderer();

        // FIXED: Set size immediately with actual container dimensions
        this.renderer.setSize(width, height, false);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        if (window.Helpers) {
            window.Helpers.log(`WebGL Renderer initialized - Size: ${width}x${height}, Version: ${this.renderer.capabilities.glVersion}`, 'debug');
        }
    }

    /**
     * Configure renderer settings
     */
    configureRenderer() {
        // Basic settings
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 1);
        this.renderer.sortObjects = true;

        // Output encoding for realistic colors
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // Shadow settings (if enabled)
        if (this.options.enableShadows) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.shadowMap.autoUpdate = true;
        }

        // Performance optimizations
        this.renderer.info.autoReset = false;

        // Frustum culling
        this.renderer.localClippingEnabled = false;
    }

    /**
     * Initialize the Three.js scene
     */
    initScene() {
        this.scene = new THREE.Scene();

        // Set background to deep space black
        this.scene.background = new THREE.Color(0x000000);

        // Optional: Add fog for distant objects
        this.scene.fog = new THREE.Fog(0x000000, 500, 2000);

        if (window.Helpers) {
            window.Helpers.log('Scene initialized', 'debug');
        }
    }

    /**
     * FIXED: Initialize the camera with proper aspect ratio
     */
    initCamera() {
        // FIXED: Use actual container dimensions for aspect ratio
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        const aspect = width / height;

        this.camera = new THREE.PerspectiveCamera(
            45,     // Field of view
            aspect, // Aspect ratio from actual container
            0.1,    // Near clipping plane
            10000   // Far clipping plane
        );

        // Set initial camera position for good solar system overview
        this.camera.position.set(0, 50, 100);
        this.camera.lookAt(0, 0, 0);

        if (window.Helpers) {
            window.Helpers.log(`Camera initialized - Aspect: ${aspect.toFixed(2)}, FOV: 45°`, 'debug');
        }
    }

    /**
     * Setup event listeners for responsive behavior
     */
    setupEventListeners() {
        // FIXED: Improved resize handler with debouncing
        const resizeHandler = this.createDebouncedResizeHandler();
        window.addEventListener('resize', resizeHandler);
        this.eventListeners.push(() => window.removeEventListener('resize', resizeHandler));

        // Visibility change handler (pause when tab not visible)
        const visibilityHandler = () => {
            this.isAnimating = !document.hidden;
            if (this.isAnimating) {
                this.clock.start();
            } else {
                this.clock.stop();
            }
        };

        document.addEventListener('visibilitychange', visibilityHandler);
        this.eventListeners.push(() => document.removeEventListener('visibilitychange', visibilityHandler));

        // Performance monitoring
        if (window.SolarSystemConfig?.debug) {
            this.setupPerformanceMonitoring();
        }
    }

    /**
     * FIXED: Create debounced resize handler
     */
    createDebouncedResizeHandler() {
        let resizeTimeout;

        return () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.needsResize = true;
                // FIXED: Force immediate resize for critical dimension changes
                this.updateSize();
            }, 100);
        };
    }

    /**
     * Setup performance monitoring for debug mode
     */
    setupPerformanceMonitoring() {
        // FPS counter
        this.fpsCounter = window.Helpers?.Performance?.createFPSCounter();

        // Memory monitoring (if available)
        if (performance.memory) {
            this.memoryMonitor = {
                lastCheck: 0,
                checkInterval: 1000 // Check every second
            };
        }
    }

    /**
     * Check WebGL support and capabilities
     * @returns {boolean} WebGL is supported
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

            if (!gl) {
                return false;
            }

            // Log capabilities in debug mode
            if (window.SolarSystemConfig?.debug) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    window.Helpers?.log(`GPU: ${vendor} ${renderer}`, 'debug');
                }
            }

            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * FIXED: Update scene size with proper validation
     */
    updateSize() {
        if (!this.container || !this.camera || !this.renderer) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        // FIXED: Validate dimensions before updating
        if (width <= 0 || height <= 0) {
            console.warn(`Invalid dimensions for resize: ${width}x${height}`);
            return;
        }

        // Update camera
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        // Update renderer
        this.renderer.setSize(width, height, false);

        // Reset resize flag
        this.needsResize = false;

        if (window.Helpers) {
            window.Helpers.log(`Scene resized to ${width}x${height}`, 'debug');
        }

        // FIXED: Notify other systems of resize
        this.notifyResize(width, height);
    }

    /**
     * FIXED: Notify other systems of resize
     */
    notifyResize(width, height) {
        // Dispatch custom resize event for other systems
        document.dispatchEvent(new CustomEvent('sceneResize', {
            detail: { width, height }
        }));
    }

    /**
     * Main render loop
     */
    render() {
        if (!this.isAnimating || !this.isInitialized) return;

        // Handle resize if needed
        if (this.needsResize) {
            this.updateSize();
        }

        // Update timing
        this.deltaTime = this.clock.getDelta();
        this.frameCount++;

        // Update performance stats
        this.updateStats();

        // Render the scene
        this.renderer.render(this.scene, this.camera);

        // Update debug information
        if (window.SolarSystemConfig?.debug) {
            this.updateDebugInfo();
        }
    }

    /**
     * Update performance statistics
     */
    updateStats() {
        if (this.fpsCounter) {
            this.stats.fps = this.fpsCounter.update();
        }

        this.stats.frameTime = this.deltaTime * 1000;

        // WebGL stats
        const info = this.renderer.info;
        this.stats.geometries = info.memory.geometries;
        this.stats.textures = info.memory.textures;
        this.stats.programs = info.programs?.length || 0;
        this.stats.calls = info.render.calls;
        this.stats.triangles = info.render.triangles;
        this.stats.points = info.render.points;
        this.stats.lines = info.render.lines;

        // Reset renderer info for next frame
        this.renderer.info.reset();
    }

    /**
     * Update debug information display
     */
    updateDebugInfo() {
        // Update FPS counter
        const fpsElement = document.getElementById('fps-counter');
        if (fpsElement) {
            fpsElement.textContent = Math.round(this.stats.fps);
        }

        // Update object counter
        const objectElement = document.getElementById('object-counter');
        if (objectElement) {
            objectElement.textContent = this.scene.children.length;
        }

        // Update memory counter
        const memoryElement = document.getElementById('memory-counter');
        if (memoryElement && performance.memory) {
            const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
            memoryElement.textContent = `${memoryMB} MB`;
        }
    }

    /**
     * Add object to scene with automatic disposal tracking
     * @param {THREE.Object3D} object - Object to add
     * @param {string} name - Optional name for the object
     */
    addObject(object, name = null) {
        if (name) {
            object.name = name;
        }

        this.scene.add(object);

        if (window.Helpers) {
            window.Helpers.log(`Object added to scene: ${name || object.type}`, 'debug');
        }
    }

    /**
     * Remove object from scene with proper disposal
     * @param {THREE.Object3D|string} object - Object or object name to remove
     */
    removeObject(object) {
        let targetObject;

        if (typeof object === 'string') {
            targetObject = this.scene.getObjectByName(object);
        } else {
            targetObject = object;
        }

        if (targetObject) {
            this.scene.remove(targetObject);

            // Dispose of geometries and materials
            this.disposeObject(targetObject);

            if (window.Helpers) {
                window.Helpers.log(`Object removed from scene: ${targetObject.name || targetObject.type}`, 'debug');
            }
        }
    }

    /**
     * Recursively dispose of object resources
     * @param {THREE.Object3D} object - Object to dispose
     */
    disposeObject(object) {
        if (object.geometry) {
            object.geometry.dispose();
        }

        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(material => this.disposeMaterial(material));
            } else {
                this.disposeMaterial(object.material);
            }
        }

        // Recursively dispose children
        if (object.children) {
            object.children.forEach(child => this.disposeObject(child));
        }
    }

    /**
     * Dispose of material resources
     * @param {THREE.Material} material - Material to dispose
     */
    disposeMaterial(material) {
        material.dispose();

        // Dispose textures
        Object.keys(material).forEach(key => {
            if (material[key] && typeof material[key].dispose === 'function') {
                material[key].dispose();
            }
        });
    }

    /**
     * Set render quality (affects pixel ratio and other settings)
     * @param {number} quality - Quality level (0.5 - 2.0)
     */
    setQuality(quality) {
        this.quality = window.Helpers?.Math?.clamp(quality, 0.5, 2.0) || quality;

        if (this.renderer) {
            const pixelRatio = Math.min(window.devicePixelRatio * this.quality, 2);
            this.renderer.setPixelRatio(pixelRatio);
        }

        if (window.Helpers) {
            window.Helpers.log(`Render quality set to ${this.quality}`, 'debug');
        }
    }

    /**
     * Enable or disable performance mode
     * @param {boolean} enabled - Performance mode enabled
     */
    setPerformanceMode(enabled) {
        if (enabled) {
            this.setQuality(0.75);
            this.renderer.setPixelRatio(1);
            this.renderer.shadowMap.enabled = false;
        } else {
            this.setQuality(1.0);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = this.options.enableShadows;
        }

        if (window.Helpers) {
            window.Helpers.log(`Performance mode ${enabled ? 'enabled' : 'disabled'}`, 'debug');
        }
    }

    /**
     * Get scene statistics
     * @returns {Object} Scene statistics
     */
    getStats() {
        return {
            ...this.stats,
            objects: this.scene ? this.scene.children.length : 0,
            quality: this.quality,
            isAnimating: this.isAnimating,
            deltaTime: this.deltaTime,
            isInitialized: this.isInitialized
        };
    }

    /**
     * FIXED: Force update method for external triggers
     */
    forceUpdate() {
        if (this.isInitialized) {
            this.updateSize();
            this.render();
        }
    }

    /**
     * Take a screenshot of the current scene
     * @param {string} filename - Filename for download
     * @param {number} width - Screenshot width
     * @param {number} height - Screenshot height
     * @returns {boolean} Success status
     */
    takeScreenshot(filename = 'solar-system-screenshot.png', width = null, height = null) {
        if (!this.renderer || !this.scene || !this.camera) {
            console.warn('Cannot take screenshot: renderer, scene, or camera not available');
            return false;
        }

        try {
            // Use current canvas size if no dimensions specified
            const currentWidth = this.renderer.domElement.width;
            const currentHeight = this.renderer.domElement.height;

            const screenshotWidth = width || currentWidth;
            const screenshotHeight = height || currentHeight;

            // Store original size
            const originalWidth = currentWidth;
            const originalHeight = currentHeight;
            const originalAspect = this.camera.aspect;

            // Temporarily resize if needed
            if (width && height && (width !== currentWidth || height !== currentHeight)) {
                this.renderer.setSize(screenshotWidth, screenshotHeight, false);
                this.camera.aspect = screenshotWidth / screenshotHeight;
                this.camera.updateProjectionMatrix();
            }

            // Render frame for screenshot
            this.renderer.render(this.scene, this.camera);

            // Get data URL from canvas
            const dataURL = this.renderer.domElement.toDataURL('image/png', 1.0);

            // Restore original size if changed
            if (width && height && (width !== originalWidth || height !== originalHeight)) {
                this.renderer.setSize(originalWidth, originalHeight, false);
                this.camera.aspect = originalAspect;
                this.camera.updateProjectionMatrix();
            }

            // Create download link
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataURL;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            if (window.Helpers) {
                window.Helpers.log(`Screenshot saved: ${filename}`, 'debug');
            }

            return true;

        } catch (error) {
            console.error('Screenshot failed:', error);
            if (window.Helpers) {
                window.Helpers.handleError(error, 'SceneManager.takeScreenshot');
            }
            return false;
        }
    }

    /**
     * Dispose of all resources and cleanup
     */
    dispose() {
        // Stop animation
        this.isAnimating = false;

        // Remove event listeners
        this.eventListeners.forEach(cleanup => cleanup());
        this.eventListeners = [];

        // Dispose of scene objects
        if (this.scene) {
            while (this.scene.children.length > 0) {
                this.removeObject(this.scene.children[0]);
            }
        }

        // Dispose of renderer
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.forceContextLoss();
        }

        // Clear references
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        this.container = null;
        this.isInitialized = false;

        if (window.Helpers) {
            window.Helpers.log('SceneManager disposed', 'debug');
        }
    }

    // Getters for external access
    get Scene() { return this.scene; }
    get Camera() { return this.camera; }
    get Renderer() { return this.renderer; }
    get Canvas() { return this.canvas; }
    get Container() { return this.container; }
    get DeltaTime() { return this.deltaTime; }
    get IsAnimating() { return this.isAnimating; }
    get IsInitialized() { return this.isInitialized; }
}

// For backward compatibility
if (typeof window !== 'undefined') {
    window.SceneManager = {
        create: (options) => new SceneManager(options)
    };
}
