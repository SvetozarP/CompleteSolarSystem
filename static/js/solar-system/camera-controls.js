// static/js/solar-system/camera-controls.js
// FIXED: Complete camera controls with planet following capability

window.CameraControls = (function() {
    'use strict';

    /**
     * Camera controls class for smooth 3D navigation with planet following
     */
    class CameraControls {
        constructor(options = {}) {
            this.options = {
                enableDamping: true,
                dampingFactor: 0.05,
                enableZoom: true,
                enableRotate: true,
                enablePan: true,
                maxDistance: 500,
                minDistance: 5,
                maxPolarAngle: Math.PI,
                minPolarAngle: 0,
                followSmoothness: 0.05,
                ...options
            };

            // Required parameters
            this.camera = options.camera;
            this.domElement = options.domElement;

            if (!this.camera || !this.domElement) {
                throw new Error('CameraControls requires camera and domElement');
            }

            // Control state
            this.target = new THREE.Vector3(0, 0, 0);
            this.spherical = new THREE.Spherical();
            this.sphericalDelta = new THREE.Spherical();

            // Planet following system
            this.followedPlanet = null;
            this.followOffset = new THREE.Vector3();
            this.isFollowing = false;
            this.followDistance = 50;
            this.lastPlanetPosition = new THREE.Vector3();

            // Mouse state
            this.rotateStart = new THREE.Vector2();
            this.rotateEnd = new THREE.Vector2();
            this.rotateDelta = new THREE.Vector2();

            this.panStart = new THREE.Vector2();
            this.panEnd = new THREE.Vector2();
            this.panDelta = new THREE.Vector2();

            this.zoomStart = new THREE.Vector2();
            this.zoomEnd = new THREE.Vector2();
            this.zoomDelta = new THREE.Vector2();

            // Touch state
            this.dollyStart = new THREE.Vector2();
            this.dollyEnd = new THREE.Vector2();
            this.dollyDelta = new THREE.Vector2();

            // Control states
            this.STATE = {
                NONE: -1,
                ROTATE: 0,
                DOLLY: 1,
                PAN: 2,
                TOUCH_ROTATE: 3,
                TOUCH_PAN: 4,
                TOUCH_DOLLY_PAN: 5,
                TOUCH_DOLLY_ROTATE: 6
            };

            this.state = this.STATE.NONE;

            // Speed settings
            this.rotateSpeed = 1.0;
            this.zoomSpeed = 1.0;
            this.panSpeed = 1.0;

            // Event listeners
            this.eventListeners = [];

            // Animation
            this.isAnimating = false;
            this.animationId = null;

            this.isInitialized = false;
        }

        /**
         * Initialize camera controls
         */
        async init() {
            try {
                // Set initial spherical coordinates from camera position
                this.updateSphericalFromCamera();

                // Setup event listeners
                this.setupEventListeners();

                this.isInitialized = true;

                if (window.Helpers) {
                    window.Helpers.log('Camera controls with planet following initialized', 'debug');
                }

            } catch (error) {
                if (window.Helpers) {
                    window.Helpers.handleError(error, 'CameraControls.init');
                }
                throw error;
            }
        }

        /**
         * FIXED: Update spherical coordinates from current camera position
         */
        updateSphericalFromCamera() {
            const offset = new THREE.Vector3();
            offset.copy(this.camera.position).sub(this.target);
            this.spherical.setFromVector3(offset);
        }

        /**
         * Setup event listeners for mouse and keyboard
         */
        setupEventListeners() {
            // Mouse events
            this.addEventListener('contextmenu', this.onContextMenu.bind(this));
            this.addEventListener('mousedown', this.onMouseDown.bind(this));
            this.addEventListener('wheel', this.onMouseWheel.bind(this));

            // Touch events
            this.addEventListener('touchstart', this.onTouchStart.bind(this));
            this.addEventListener('touchend', this.onTouchEnd.bind(this));
            this.addEventListener('touchmove', this.onTouchMove.bind(this));

            // Window events
            this.addEventListener('keydown', this.onKeyDown.bind(this), window);
        }

        /**
         * Add event listener with cleanup tracking
         */
        addEventListener(type, listener, element = null) {
            const target = element || this.domElement;
            target.addEventListener(type, listener);
            this.eventListeners.push({ target, type, listener });
        }

        /**
         * Focus on and follow a planet
         */
        focusAndFollowPlanet(planetObject, planetData, distance = null, duration = 2000) {
            if (!planetObject) {
                console.warn('No planet object provided for following');
                return;
            }

            // Calculate appropriate distance if not provided
            if (distance === null) {
                const planetSize = planetData ? this.calculatePlanetViewDistance(planetData) : 50;
                distance = planetSize;
            }

            this.followDistance = distance;
            this.followedPlanet = planetObject;
            this.isFollowing = true;

            // Get current planet position
            const planetPosition = new THREE.Vector3();
            planetObject.getWorldPosition(planetPosition);
            this.lastPlanetPosition.copy(planetPosition);

            // Calculate offset from planet to current camera position
            this.followOffset.copy(this.camera.position).sub(planetPosition).normalize().multiplyScalar(distance);

            // Smooth transition to following position
            this.animateToFollowPosition(planetPosition, duration);

            if (window.Helpers) {
                window.Helpers.log(`Following planet: ${planetData?.name || 'Unknown'}`, 'debug');
            }
        }

        /**
         * Stop following the current planet
         */
        stopFollowing() {
            this.isFollowing = false;
            this.followedPlanet = null;

            if (window.Helpers) {
                window.Helpers.log('Stopped following planet', 'debug');
            }
        }

        /**
         * Calculate appropriate viewing distance for a planet
         */
        calculatePlanetViewDistance(planetData) {
            if (!planetData) return 50;

            // Base distance on planet size
            const earthDiameter = 12756;
            const planetSize = planetData.diameter || earthDiameter;
            const sizeRatio = planetSize / earthDiameter;

            // Minimum distance for small planets, scaled distance for large ones
            let distance = Math.max(15, sizeRatio * 25);

            // Special cases for very large planets
            if (planetData.name === 'Jupiter') distance = 60;
            if (planetData.name === 'Saturn') distance = 70;
            if (planetData.name === 'Sun') distance = 100;

            return distance;
        }

        /**
         * Animate camera to follow position
         */
        animateToFollowPosition(targetPosition, duration = 2000) {
            if (this.isAnimating) {
                cancelAnimationFrame(this.animationId);
            }

            const startPosition = this.camera.position.clone();
            const endPosition = targetPosition.clone().add(this.followOffset);
            const startTarget = this.target.clone();
            const endTarget = targetPosition.clone();

            const startTime = performance.now();
            this.isAnimating = true;

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = this.easeInOutCubic(progress);

                // Interpolate camera position and target
                this.camera.position.lerpVectors(startPosition, endPosition, easedProgress);
                this.target.lerpVectors(startTarget, endTarget, easedProgress);
                this.camera.lookAt(this.target);

                this.updateSphericalFromCamera();

                if (progress < 1) {
                    this.animationId = requestAnimationFrame(animate);
                } else {
                    this.isAnimating = false;
                }
            };

            this.animationId = requestAnimationFrame(animate);
        }

        /**
         * Mouse event handlers
         */
        onContextMenu(event) {
            event.preventDefault();
        }

        onMouseDown(event) {
            event.preventDefault();

            switch (event.button) {
                case 0: // Left button
                    if (this.options.enableRotate) {
                        this.handleMouseDownRotate(event);
                        this.state = this.STATE.ROTATE;
                    }
                    break;

                case 1: // Middle button
                    if (this.options.enablePan) {
                        this.handleMouseDownPan(event);
                        this.state = this.STATE.PAN;
                    }
                    break;

                case 2: // Right button
                    if (this.options.enablePan) {
                        this.handleMouseDownPan(event);
                        this.state = this.STATE.PAN;
                    }
                    break;
            }

            if (this.state !== this.STATE.NONE) {
                const mouseMoveHandler = this.onMouseMove.bind(this);
                const mouseUpHandler = this.onMouseUp.bind(this);

                document.addEventListener('mousemove', mouseMoveHandler);
                document.addEventListener('mouseup', mouseUpHandler);

                // Store handlers for cleanup
                this.currentMouseMoveHandler = mouseMoveHandler;
                this.currentMouseUpHandler = mouseUpHandler;
            }
        }

        onMouseMove(event) {
            event.preventDefault();

            // If following a planet, modify behavior
            if (this.isFollowing && this.followedPlanet) {
                switch (this.state) {
                    case this.STATE.ROTATE:
                        if (this.options.enableRotate) {
                            this.handleMouseMoveRotateFollowing(event);
                        }
                        break;
                    case this.STATE.PAN:
                        // Disable panning while following
                        break;
                }
            } else {
                // Original mouse move behavior
                switch (this.state) {
                    case this.STATE.ROTATE:
                        if (this.options.enableRotate) {
                            this.handleMouseMoveRotate(event);
                        }
                        break;
                    case this.STATE.PAN:
                        if (this.options.enablePan) {
                            this.handleMouseMovePan(event);
                        }
                        break;
                }
            }
        }

        onMouseUp(event) {
            event.preventDefault();

            if (this.currentMouseMoveHandler) {
                document.removeEventListener('mousemove', this.currentMouseMoveHandler);
            }
            if (this.currentMouseUpHandler) {
                document.removeEventListener('mouseup', this.currentMouseUpHandler);
            }

            this.state = this.STATE.NONE;
        }

        onMouseWheel(event) {
            event.preventDefault();

            if (!this.options.enableZoom) return;

            const zoomScale = this.getZoomScale();

            if (this.isFollowing && this.followedPlanet) {
                // Zoom towards/away from followed planet
                if (event.deltaY < 0) {
                    this.followDistance = Math.max(this.options.minDistance, this.followDistance / zoomScale);
                } else {
                    this.followDistance = Math.min(this.options.maxDistance, this.followDistance * zoomScale);
                }

                // Update follow offset to maintain distance
                this.followOffset.normalize().multiplyScalar(this.followDistance);

                // Update camera position
                const planetPosition = new THREE.Vector3();
                this.followedPlanet.getWorldPosition(planetPosition);
                this.camera.position.copy(planetPosition).add(this.followOffset);
                this.camera.lookAt(planetPosition);
            } else {
                // Original zoom behavior
                if (event.deltaY < 0) {
                    this.dollyOut(zoomScale);
                } else {
                    this.dollyIn(zoomScale);
                }
                this.update();
            }
        }

        /**
         * Mouse action handlers
         */
        handleMouseDownRotate(event) {
            this.rotateStart.set(event.clientX, event.clientY);
        }

        handleMouseMoveRotate(event) {
            this.rotateEnd.set(event.clientX, event.clientY);
            this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);

            const element = this.domElement;

            // Rotate around Y axis (azimuth)
            this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientHeight);

            // Rotate around X axis (polar)
            this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight);

            this.rotateStart.copy(this.rotateEnd);
            this.update();
        }

        handleMouseMoveRotateFollowing(event) {
            this.rotateEnd.set(event.clientX, event.clientY);
            this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);

            const element = this.domElement;

            // Get current planet position
            const planetPosition = new THREE.Vector3();
            if (this.followedPlanet) {
                this.followedPlanet.getWorldPosition(planetPosition);
            }

            // Calculate rotation around the planet
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(this.camera.position.clone().sub(planetPosition));

            // Apply rotation
            spherical.theta -= 2 * Math.PI * this.rotateDelta.x / element.clientHeight;
            spherical.phi += 2 * Math.PI * this.rotateDelta.y / element.clientHeight;

            // Clamp phi
            spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, spherical.phi));

            // Update camera position around the planet
            const newPosition = new THREE.Vector3();
            newPosition.setFromSpherical(spherical);
            newPosition.add(planetPosition);

            this.camera.position.copy(newPosition);
            this.camera.lookAt(planetPosition);

            // Update follow offset
            this.followOffset.copy(this.camera.position).sub(planetPosition);

            this.rotateStart.copy(this.rotateEnd);
        }

        handleMouseDownPan(event) {
            this.panStart.set(event.clientX, event.clientY);
        }

        handleMouseMovePan(event) {
            this.panEnd.set(event.clientX, event.clientY);
            this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);

            this.pan(this.panDelta.x, this.panDelta.y);

            this.panStart.copy(this.panEnd);
            this.update();
        }

        /**
         * Touch event handlers
         */
        onTouchStart(event) {
            switch (event.touches.length) {
                case 1:
                    if (this.options.enableRotate) {
                        this.handleTouchStartRotate(event);
                        this.state = this.STATE.TOUCH_ROTATE;
                    }
                    break;

                case 2:
                    if (this.options.enableZoom && this.options.enablePan) {
                        this.handleTouchStartDollyPan(event);
                        this.state = this.STATE.TOUCH_DOLLY_PAN;
                    }
                    break;
            }
        }

        onTouchMove(event) {
            event.preventDefault();

            switch (this.state) {
                case this.STATE.TOUCH_ROTATE:
                    if (this.options.enableRotate) {
                        this.handleTouchMoveRotate(event);
                    }
                    break;

                case this.STATE.TOUCH_DOLLY_PAN:
                    if (this.options.enableZoom && this.options.enablePan) {
                        this.handleTouchMoveDollyPan(event);
                    }
                    break;
            }
        }

        onTouchEnd(event) {
            this.state = this.STATE.NONE;
        }

        handleTouchStartRotate(event) {
            this.rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
        }

        handleTouchMoveRotate(event) {
            this.rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
            this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);

            const element = this.domElement;

            this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientHeight);
            this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight);

            this.rotateStart.copy(this.rotateEnd);
            this.update();
        }

        handleTouchStartDollyPan(event) {
            if (this.options.enableZoom) {
                const dx = event.touches[0].pageX - event.touches[1].pageX;
                const dy = event.touches[0].pageY - event.touches[1].pageY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                this.dollyStart.set(0, distance);
            }

            if (this.options.enablePan) {
                const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
                const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
                this.panStart.set(x, y);
            }
        }

        handleTouchMoveDollyPan(event) {
            if (this.options.enableZoom) {
                const dx = event.touches[0].pageX - event.touches[1].pageX;
                const dy = event.touches[0].pageY - event.touches[1].pageY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                this.dollyEnd.set(0, distance);
                this.dollyDelta.set(0, Math.pow(this.dollyEnd.y / this.dollyStart.y, this.zoomSpeed));

                this.dollyIn(this.dollyDelta.y);
                this.dollyStart.copy(this.dollyEnd);
            }

            if (this.options.enablePan) {
                const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
                const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);

                this.panEnd.set(x, y);
                this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);

                this.pan(this.panDelta.x, this.panDelta.y);
                this.panStart.copy(this.panEnd);
            }

            this.update();
        }

        /**
         * Keyboard event handler
         */
        onKeyDown(event) {
            // Handle keyboard shortcuts
            switch (event.code) {
                case 'ArrowUp':
                    this.pan(0, this.panSpeed * 10);
                    this.update();
                    break;
                case 'ArrowDown':
                    this.pan(0, -this.panSpeed * 10);
                    this.update();
                    break;
                case 'ArrowLeft':
                    this.pan(this.panSpeed * 10, 0);
                    this.update();
                    break;
                case 'ArrowRight':
                    this.pan(-this.panSpeed * 10, 0);
                    this.update();
                    break;
            }
        }

        /**
         * Camera movement methods
         */
        rotateLeft(angle) {
            this.sphericalDelta.theta -= angle;
        }

        rotateUp(angle) {
            this.sphericalDelta.phi -= angle;
        }

        pan(deltaX, deltaY) {
            const offset = new THREE.Vector3();
            offset.copy(this.camera.position).sub(this.target);

            // Half of the fov is center to top of screen
            let targetDistance = offset.length();
            targetDistance *= Math.tan((this.camera.fov / 2) * Math.PI / 180.0);

            // Pan left/right
            const panLeft = new THREE.Vector3();
            panLeft.setFromMatrixColumn(this.camera.matrix, 0);
            panLeft.multiplyScalar(-2 * deltaX * targetDistance / this.domElement.clientHeight);

            // Pan up/down
            const panUp = new THREE.Vector3();
            panUp.setFromMatrixColumn(this.camera.matrix, 1);
            panUp.multiplyScalar(2 * deltaY * targetDistance / this.domElement.clientHeight);

            // Apply pan
            this.target.add(panLeft);
            this.target.add(panUp);
        }

        dollyIn(dollyScale) {
            this.spherical.radius /= dollyScale;
        }

        dollyOut(dollyScale) {
            this.spherical.radius *= dollyScale;
        }

        getZoomScale() {
            return Math.pow(0.95, this.zoomSpeed);
        }

        /**
         * Update camera position and handle planet following
         */
        update() {
            // Handle planet following
            if (this.isFollowing && this.followedPlanet && !this.isAnimating) {
                this.updatePlanetFollowing();
                return true;
            }

            // Original update logic
            const offset = new THREE.Vector3();

            // Apply spherical delta
            this.spherical.theta += this.sphericalDelta.theta;
            this.spherical.phi += this.sphericalDelta.phi;

            // Restrict phi to valid range
            this.spherical.phi = Math.max(this.options.minPolarAngle, Math.min(this.options.maxPolarAngle, this.spherical.phi));

            // Restrict radius to valid range
            this.spherical.radius = Math.max(this.options.minDistance, Math.min(this.options.maxDistance, this.spherical.radius));

            // Move target to panned location
            offset.setFromSpherical(this.spherical);
            offset.add(this.target);

            this.camera.position.copy(offset);
            this.camera.lookAt(this.target);

            // Apply damping
            if (this.options.enableDamping) {
                this.sphericalDelta.theta *= (1 - this.options.dampingFactor);
                this.sphericalDelta.phi *= (1 - this.options.dampingFactor);
            } else {
                this.sphericalDelta.set(0, 0, 0);
            }

            return true;
        }

        /**
         * Update camera position to follow planet
         */
        updatePlanetFollowing() {
            if (!this.followedPlanet) return;

            // Get current planet position
            const currentPlanetPosition = new THREE.Vector3();
            this.followedPlanet.getWorldPosition(currentPlanetPosition);

            // Calculate how much the planet has moved
            const planetMovement = new THREE.Vector3()
                .subVectors(currentPlanetPosition, this.lastPlanetPosition);

            // Only update if planet has moved significantly
            if (planetMovement.length() > 0.1) {
                // Smoothly move the target to the new planet position
                this.target.lerp(currentPlanetPosition, this.options.followSmoothness);

                // Update camera position to maintain the follow offset
                const desiredCameraPosition = currentPlanetPosition.clone().add(this.followOffset);
                this.camera.position.lerp(desiredCameraPosition, this.options.followSmoothness);

                // Always look at the planet
                this.camera.lookAt(this.target);

                // Update spherical coordinates to match new position
                this.updateSphericalFromCamera();

                // Store the new planet position
                this.lastPlanetPosition.copy(currentPlanetPosition);
            }
        }

        /**
         * Set camera position
         */
        setPosition(x, y, z) {
            this.stopFollowing(); // Stop following when manually setting position
            this.camera.position.set(x, y, z);
            this.updateSphericalFromCamera();
            this.update();
        }

        /**
         * Set camera target
         */
        lookAt(x, y, z) {
            this.stopFollowing(); // Stop following when manually setting target
            this.target.set(x, y, z);
            this.camera.lookAt(this.target);
            this.updateSphericalFromCamera();
        }

        /**
         * Focus camera on a specific target with smooth animation
         */
        focusOn(targetPosition, distance = 50, duration = 2000) {
            if (this.isAnimating) {
                cancelAnimationFrame(this.animationId);
            }

            const startTarget = this.target.clone();
            const startPosition = this.camera.position.clone();

            const endTarget = targetPosition.clone();
            const direction = startPosition.clone().sub(startTarget).normalize();
            const endPosition = endTarget.clone().add(direction.multiplyScalar(distance));

            const startTime = performance.now();
            this.isAnimating = true;

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Smooth easing function
                const easedProgress = this.easeInOutCubic(progress);

                // Interpolate target and position
                this.target.lerpVectors(startTarget, endTarget, easedProgress);
                this.camera.position.lerpVectors(startPosition, endPosition, easedProgress);
                this.camera.lookAt(this.target);

                this.updateSphericalFromCamera();

                if (progress < 1) {
                    this.animationId = requestAnimationFrame(animate);
                } else {
                    this.isAnimating = false;
                }
            };

            this.animationId = requestAnimationFrame(animate);
        }

        /**
         * Easing function for smooth animations
         */
        easeInOutCubic(t) {
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        }

        /**
         * Get current camera distance from target
         */
        getDistance() {
            return this.camera.position.distanceTo(this.target);
        }

        /**
         * Enable or disable controls
         */
        setEnabled(enabled) {
            this.options.enableRotate = enabled;
            this.options.enableZoom = enabled;
            this.options.enablePan = enabled;
        }

        /**
         * Dispose of controls and cleanup
         */
        dispose() {
            // Cancel any ongoing animation
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }

            // Remove current mouse handlers if active
            if (this.currentMouseMoveHandler) {
                document.removeEventListener('mousemove', this.currentMouseMoveHandler);
            }
            if (this.currentMouseUpHandler) {
                document.removeEventListener('mouseup', this.currentMouseUpHandler);
            }

            // Remove all event listeners
            this.eventListeners.forEach(({ target, type, listener }) => {
                target.removeEventListener(type, listener);
            });
            this.eventListeners = [];

            this.isInitialized = false;

            if (window.Helpers) {
                window.Helpers.log('Camera controls disposed', 'debug');
            }
        }

        // Getters
        get Camera() { return this.camera; }
        get Target() { return this.target; }
        get IsInitialized() { return this.isInitialized; }
        get IsAnimating() { return this.isAnimating; }
        get IsFollowing() { return this.isFollowing; }
        get FollowedPlanet() { return this.followedPlanet; }
    }

    // Public API
    return {
        CameraControls,

        // Factory function
        create: (options = {}) => {
            return new CameraControls(options);
        }
    };
})();

// Make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.CameraControls;
}

console.log('FIXED CameraControls module with planet following loaded successfully');