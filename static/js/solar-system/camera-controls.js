// static/js/solar-system/camera-controls.js
// Mouse camera controls for solar system navigation

window.CameraControls = (function() {
    'use strict';

    /**
     * Camera control system for orbital and free-look navigation
     */
    class CameraControls {
        constructor(camera, canvas, options = {}) {
            this.camera = camera;
            this.canvas = canvas;

            this.options = {
                enableRotate: true,
                enableZoom: true,
                enablePan: true,
                rotateSpeed: 1.0,
                zoomSpeed: 1.0,
                panSpeed: 1.0,
                minDistance: 10,
                maxDistance: 500,
                minPolarAngle: 0,
                maxPolarAngle: Math.PI,
                autoRotate: false,
                autoRotateSpeed: 2.0,
                dampingFactor: 0.05,
                ...options
            };

            // Internal state
            this.target = new THREE.Vector3(0, 0, 0);
            this.spherical = new THREE.Spherical();
            this.sphericalDelta = new THREE.Spherical();
            this.scale = 1;
            this.panOffset = new THREE.Vector3();
            this.zoomChanged = false;

            // Mouse state
            this.mouseState = {
                isDown: false,
                button: -1,
                startX: 0,
                startY: 0,
                endX: 0,
                endY: 0
            };

            // Touch state for mobile support
            this.touchState = {
                touches: []
            };

            // Control state
            this.enabled = true;
            this.isUserInteracting = false;

            // Initialize
            this.init();
        }

        /**
         * Initialize camera controls
         */
        init() {
            // Set initial camera position relative to target
            this.updateSphericalFromCamera();

            // Bind event listeners
            this.bindEventListeners();

            if (window.Helpers) {
                window.Helpers.log('Camera controls initialized', 'debug');
            }
        }

        /**
         * Update spherical coordinates from camera position
         */
        updateSphericalFromCamera() {
            const offset = new THREE.Vector3();
            offset.copy(this.camera.position).sub(this.target);
            this.spherical.setFromVector3(offset);
        }

        /**
         * Bind mouse and keyboard event listeners
         */
        bindEventListeners() {
            // Ensure canvas exists
            if (!this.canvas) {
                console.error('Canvas element not found for camera controls');
                return;
            }

            // Mouse events
            this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this), false);
            this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this), false);
            this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this), false);

            // Wheel event with passive option to fix Chrome warning
            this.canvas.addEventListener('wheel', this.onMouseWheel.bind(this), { passive: false });

            // Touch events with passive option to fix Chrome warnings
            this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
            this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
            this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this), false);

            // Context menu prevention
            this.canvas.addEventListener('contextmenu', this.onContextMenu.bind(this), false);

            // Focus events
            this.canvas.addEventListener('focus', () => this.canvas.style.outline = 'none', false);
        }

        /**
         * Mouse down handler
         * @param {MouseEvent} event - Mouse event
         */
        onMouseDown(event) {
            if (!this.enabled) return;

            event.preventDefault();

            this.mouseState.isDown = true;
            this.mouseState.button = event.button;
            this.mouseState.startX = event.clientX;
            this.mouseState.startY = event.clientY;
            this.isUserInteracting = true;

            // Change cursor based on button
            switch (event.button) {
                case 0: // Left button - rotate
                    this.canvas.style.cursor = 'grabbing';
                    break;
                case 1: // Middle button - pan
                    this.canvas.style.cursor = 'move';
                    break;
                case 2: // Right button - pan
                    this.canvas.style.cursor = 'move';
                    break;
            }
        }

        /**
         * Mouse move handler
         * @param {MouseEvent} event - Mouse event
         */
        onMouseMove(event) {
            if (!this.enabled) return;

            event.preventDefault();

            if (this.mouseState.isDown) {
                this.mouseState.endX = event.clientX;
                this.mouseState.endY = event.clientY;

                const deltaX = this.mouseState.endX - this.mouseState.startX;
                const deltaY = this.mouseState.endY - this.mouseState.startY;

                switch (this.mouseState.button) {
                    case 0: // Left button - rotate
                        if (this.options.enableRotate) {
                            this.rotateLeft(2 * Math.PI * deltaX / this.canvas.clientWidth * this.options.rotateSpeed);
                            this.rotateUp(2 * Math.PI * deltaY / this.canvas.clientHeight * this.options.rotateSpeed);
                        }
                        break;
                    case 1: // Middle button - pan
                    case 2: // Right button - pan
                        if (this.options.enablePan) {
                            this.pan(deltaX, deltaY);
                        }
                        break;
                }

                this.mouseState.startX = this.mouseState.endX;
                this.mouseState.startY = this.mouseState.endY;

                this.update();
            } else {
                // Update cursor when hovering
                this.canvas.style.cursor = 'grab';
            }
        }

        /**
         * Mouse up handler
         * @param {MouseEvent} event - Mouse event
         */
        onMouseUp(event) {
            if (!this.enabled) return;

            event.preventDefault();

            this.mouseState.isDown = false;
            this.mouseState.button = -1;
            this.isUserInteracting = false;
            this.canvas.style.cursor = 'grab';
        }

        /**
         * Mouse wheel handler for zooming
         * @param {WheelEvent} event - Wheel event
         */
        onMouseWheel(event) {
            if (!this.enabled || !this.options.enableZoom) return;

            event.preventDefault();
            event.stopPropagation();

            const delta = event.deltaY;

            if (delta < 0) {
                this.dollyIn(this.getZoomScale());
            } else if (delta > 0) {
                this.dollyOut(this.getZoomScale());
            }

            this.update();
        }

        /**
         * Touch start handler
         * @param {TouchEvent} event - Touch event
         */
        onTouchStart(event) {
            if (!this.enabled) return;

            event.preventDefault();

            this.touchState.touches = Array.from(event.touches);
            this.isUserInteracting = true;

            if (this.touchState.touches.length === 1) {
                // Single touch - rotate
                this.mouseState.startX = this.touchState.touches[0].clientX;
                this.mouseState.startY = this.touchState.touches[0].clientY;
            }
        }

        /**
         * Touch move handler
         * @param {TouchEvent} event - Touch event
         */
        onTouchMove(event) {
            if (!this.enabled) return;

            event.preventDefault();

            const touches = Array.from(event.touches);

            if (touches.length === 1 && this.touchState.touches.length === 1) {
                // Single touch - rotate
                const deltaX = touches[0].clientX - this.mouseState.startX;
                const deltaY = touches[0].clientY - this.mouseState.startY;

                if (this.options.enableRotate) {
                    this.rotateLeft(2 * Math.PI * deltaX / this.canvas.clientWidth * this.options.rotateSpeed);
                    this.rotateUp(2 * Math.PI * deltaY / this.canvas.clientHeight * this.options.rotateSpeed);
                }

                this.mouseState.startX = touches[0].clientX;
                this.mouseState.startY = touches[0].clientY;

                this.update();
            } else if (touches.length === 2 && this.touchState.touches.length === 2) {
                // Two finger pinch - zoom
                const dx = touches[0].clientX - touches[1].clientX;
                const dy = touches[0].clientY - touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                const prevDx = this.touchState.touches[0].clientX - this.touchState.touches[1].clientX;
                const prevDy = this.touchState.touches[0].clientY - this.touchState.touches[1].clientY;
                const prevDistance = Math.sqrt(prevDx * prevDx + prevDy * prevDy);

                if (prevDistance > 0) {
                    const scale = distance / prevDistance;
                    if (scale > 1) {
                        this.dollyIn(scale);
                    } else {
                        this.dollyOut(1 / scale);
                    }
                    this.update();
                }
            }

            this.touchState.touches = touches;
        }

        /**
         * Touch end handler
         * @param {TouchEvent} event - Touch event
         */
        onTouchEnd(event) {
            if (!this.enabled) return;

            event.preventDefault();

            this.touchState.touches = Array.from(event.touches);
            this.isUserInteracting = false;
        }

        /**
         * Context menu handler
         * @param {Event} event - Context menu event
         */
        onContextMenu(event) {
            if (!this.enabled) return;
            event.preventDefault();
        }

        /**
         * Rotate camera left (around Y axis)
         * @param {number} angle - Rotation angle in radians
         */
        rotateLeft(angle) {
            this.sphericalDelta.theta -= angle;
        }

        /**
         * Rotate camera up (around X axis)
         * @param {number} angle - Rotation angle in radians
         */
        rotateUp(angle) {
            this.sphericalDelta.phi -= angle;
        }

        /**
         * Pan camera
         * @param {number} deltaX - X delta
         * @param {number} deltaY - Y delta
         */
        pan(deltaX, deltaY) {
            const offset = new THREE.Vector3();

            // Calculate pan distance
            const position = this.camera.position.clone();
            offset.copy(position).sub(this.target);

            let targetDistance = offset.length();
            targetDistance *= Math.tan((this.camera.fov / 2) * Math.PI / 180.0);

            // Pan left/right
            const panLeft = new THREE.Vector3();
            panLeft.setFromMatrixColumn(this.camera.matrix, 0);
            panLeft.multiplyScalar(-2 * deltaX * targetDistance / this.canvas.clientHeight);

            // Pan up/down
            const panUp = new THREE.Vector3();
            panUp.setFromMatrixColumn(this.camera.matrix, 1);
            panUp.multiplyScalar(2 * deltaY * targetDistance / this.canvas.clientHeight);

            this.panOffset.add(panLeft).add(panUp);
        }

        /**
         * Zoom in
         * @param {number} dollyScale - Dolly scale factor
         */
        dollyIn(dollyScale) {
            this.scale /= dollyScale;
        }

        /**
         * Zoom out
         * @param {number} dollyScale - Dolly scale factor
         */
        dollyOut(dollyScale) {
            this.scale *= dollyScale;
        }

        /**
         * Get zoom scale factor
         * @returns {number} Zoom scale
         */
        getZoomScale() {
            return Math.pow(0.95, this.options.zoomSpeed);
        }

        /**
         * Update camera position and orientation
         */
        update() {
            const offset = new THREE.Vector3();

            // Apply spherical delta
            this.spherical.theta += this.sphericalDelta.theta;
            this.spherical.phi += this.sphericalDelta.phi;

            // Restrict phi to be between desired limits
            this.spherical.phi = Math.max(this.options.minPolarAngle,
                                        Math.min(this.options.maxPolarAngle, this.spherical.phi));

            this.spherical.makeSafe();

            // Apply scale
            this.spherical.radius *= this.scale;

            // Restrict radius to be between desired limits
            this.spherical.radius = Math.max(this.options.minDistance,
                                           Math.min(this.options.maxDistance, this.spherical.radius));

            // Move target to panned location
            this.target.add(this.panOffset);

            // Convert spherical to cartesian
            offset.setFromSpherical(this.spherical);

            // Rotate offset back to "camera-up-vector-is-up" space
            offset.applyQuaternion(this.getUpQuaternion());

            // Update camera position
            this.camera.position.copy(this.target).add(offset);

            // Look at target
            this.camera.lookAt(this.target);

            // Apply damping
            if (this.options.dampingFactor > 0 && !this.isUserInteracting) {
                this.sphericalDelta.theta *= (1 - this.options.dampingFactor);
                this.sphericalDelta.phi *= (1 - this.options.dampingFactor);
                this.panOffset.multiplyScalar(1 - this.options.dampingFactor);
            } else {
                this.sphericalDelta.set(0, 0, 0);
                this.panOffset.set(0, 0, 0);
            }

            this.scale = 1;

            // Auto rotate
            if (this.options.autoRotate && !this.isUserInteracting) {
                this.rotateLeft(this.getAutoRotationAngle());
            }

            // Update camera if it moved
            if (this.zoomChanged ||
                this.lastPosition === undefined || !this.camera.position.equals(this.lastPosition) ||
                this.lastQuaternion === undefined || !this.camera.quaternion.equals(this.lastQuaternion)) {

                this.lastPosition = this.camera.position.clone();
                this.lastQuaternion = this.camera.quaternion.clone();
                this.zoomChanged = false;

                return true;
            }

            return false;
        }

        /**
         * Get up quaternion for camera orientation
         * @returns {THREE.Quaternion} Up quaternion
         */
        getUpQuaternion() {
            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(this.camera.up, new THREE.Vector3(0, 1, 0));
            return quaternion;
        }

        /**
         * Get auto rotation angle
         * @returns {number} Auto rotation angle
         */
        getAutoRotationAngle() {
            return 2 * Math.PI / 60 / 60 * this.options.autoRotateSpeed;
        }

        /**
         * Reset camera to default position
         */
        reset() {
            this.target.set(0, 0, 0);
            this.camera.position.set(0, 50, 100);
            this.camera.lookAt(this.target);
            this.updateSphericalFromCamera();
            this.update();

            if (window.Helpers) {
                window.Helpers.log('Camera controls reset to default position', 'debug');
            }
        }

        /**
         * Set camera target
         * @param {THREE.Vector3} target - New target position
         */
        setTarget(target) {
            this.target.copy(target);
            this.update();
        }

        /**
         * Focus camera on object
         * @param {THREE.Object3D} object - Object to focus on
         * @param {number} distance - Distance from object
         */
        focusOnObject(object, distance = null) {
            if (!object) return;

            // Get object position
            const objectPosition = new THREE.Vector3();
            object.getWorldPosition(objectPosition);

            // Set as new target
            this.setTarget(objectPosition);

            // Calculate appropriate distance if not provided
            if (distance === null) {
                const boundingBox = new THREE.Box3().setFromObject(object);
                const size = boundingBox.getSize(new THREE.Vector3()).length();
                distance = size * 3; // 3x object size
            }

            // Set camera distance
            this.spherical.radius = Math.max(this.options.minDistance,
                                           Math.min(this.options.maxDistance, distance));
            this.update();

            if (window.Helpers) {
                window.Helpers.log(`Camera focused on object at distance: ${distance.toFixed(2)}`, 'debug');
            }
        }

        /**
         * Get camera distance from target
         * @returns {number} Distance
         */
        getDistance() {
            return this.spherical.radius;
        }

        /**
         * Set camera distance
         * @param {number} distance - New distance
         */
        setDistance(distance) {
            this.spherical.radius = Math.max(this.options.minDistance,
                                           Math.min(this.options.maxDistance, distance));
            this.update();
        }

        /**
         * Enable or disable controls
         * @param {boolean} enabled - Controls enabled
         */
        setEnabled(enabled) {
            this.enabled = enabled;
            this.canvas.style.cursor = enabled ? 'grab' : 'default';
        }

        /**
         * Set auto rotate
         * @param {boolean} enabled - Auto rotate enabled
         */
        setAutoRotate(enabled) {
            this.options.autoRotate = enabled;
        }

        /**
         * Get control state
         * @returns {Object} Control state
         */
        getState() {
            return {
                enabled: this.enabled,
                isUserInteracting: this.isUserInteracting,
                target: this.target.clone(),
                distance: this.getDistance(),
                autoRotate: this.options.autoRotate
            };
        }

        /**
         * Dispose of camera controls
         */
        dispose() {
            // Remove event listeners with proper options
            this.canvas.removeEventListener('mousedown', this.onMouseDown);
            this.canvas.removeEventListener('mousemove', this.onMouseMove);
            this.canvas.removeEventListener('mouseup', this.onMouseUp);
            this.canvas.removeEventListener('wheel', this.onMouseWheel);
            this.canvas.removeEventListener('touchstart', this.onTouchStart);
            this.canvas.removeEventListener('touchmove', this.onTouchMove);
            this.canvas.removeEventListener('touchend', this.onTouchEnd);
            this.canvas.removeEventListener('contextmenu', this.onContextMenu);

            if (window.Helpers) {
                window.Helpers.log('Camera controls disposed', 'debug');
            }
        }
    }

    // Public API
    return {
        CameraControls,

        // Factory function
        create: (camera, canvas, options = {}) => {
            return new CameraControls(camera, canvas, options);
        }
    };
})();

console.log('CameraControls module loaded successfully');