import * as THREE from 'three';

export class CameraControls {
    constructor(camera, domElement, options = {}) {
        this.camera = camera;
        this.domElement = domElement;

        this.options = {
            enableDamping: true,
            maxDistance: 500,
            followSmoothness: 0.05,
            ...options
        };

        this.panSpeed = 1.0;
        this.followDistance = 50;
        this.isInitialized = false;

        // Initialize vectors and state
        this.rotateStart = new THREE.Vector2();
        this.dollyStart = new THREE.Vector2();
        this.panDelta = new THREE.Vector2();
        this.zoomDelta = new THREE.Vector2();

        // Initialize spherical coordinates
        this.spherical = new THREE.Spherical();
        this.sphericalDelta = new THREE.Spherical();

        this.lastPlanetPosition = new THREE.Vector3();
        this.followedPlanet = null;
    }

    pan(deltaX, deltaY) {
        const targetDistance = this.spherical.radius;

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

    update() {
        if (!this.camera || !this.domElement) {
            return false;
        }

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
}
