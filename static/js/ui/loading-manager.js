// static/js/ui/loading-manager.js
// Enhanced loading manager with progress tracking and smooth animations

window.LoadingManager = (function() {
    'use strict';

    let loadingScreen = null;
    let loadingProgress = null;
    let loadingStatus = null;
    let progressBar = null;
    let currentProgress = 0;
    let isComplete = false;

    return {
        init: function() {
            loadingScreen = document.getElementById('loading-screen');
            loadingProgress = document.getElementById('loading-progress');
            loadingStatus = document.getElementById('loading-status');
            progressBar = loadingProgress;

            if (window.Helpers) {
                window.Helpers.log('Enhanced Loading Manager initialized', 'debug');
            }
        },

        updateProgress: function(message, progress = null) {
            if (isComplete) return;

            if (loadingStatus) {
                loadingStatus.textContent = message;
            }

            if (progress !== null && progressBar) {
                currentProgress = Math.min(progress, 100);
                progressBar.style.width = currentProgress + '%';
            }

            if (window.Helpers) {
                window.Helpers.log(`Loading: ${currentProgress}% - ${message}`, 'debug');
            }
        },

        setProgress: function(percent) {
            if (isComplete) return;

            currentProgress = Math.min(percent, 100);
            if (progressBar) {
                progressBar.style.width = currentProgress + '%';
            }
        },

        complete: function() {
            if (isComplete) return;

            this.setProgress(100);
            this.updateProgress('Complete!', 100);
            isComplete = true;

            setTimeout(() => {
                const appContainer = document.getElementById('app-container');

                if (loadingScreen && appContainer) {
                    // Add smooth fade out animation
                    loadingScreen.style.transition = 'opacity 0.8s ease-out';
                    loadingScreen.style.opacity = '0';

                    // Show app container
                    appContainer.style.display = 'flex';
                    appContainer.style.opacity = '0';
                    appContainer.style.transition = 'opacity 0.6s ease-in';

                    setTimeout(() => {
                        appContainer.style.opacity = '1';
                    }, 200);

                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                        if (window.Helpers) {
                            window.Helpers.log('Loading sequence completed successfully', 'debug');
                        }
                    }, 800);
                }
            }, 500);
        },

        error: function(message) {
            if (loadingStatus) {
                loadingStatus.textContent = 'Error: ' + message;
                loadingStatus.style.color = '#ef4444';
            }

            if (window.Helpers) {
                window.Helpers.handleError(new Error(message), 'LoadingManager');
            }

            // Show error for a few seconds, then complete anyway
            setTimeout(() => {
                this.complete();
            }, 3000);
        },

        reset: function() {
            isComplete = false;
            currentProgress = 0;

            if (loadingScreen) {
                loadingScreen.style.display = 'flex';
                loadingScreen.style.opacity = '1';
            }

            if (progressBar) {
                progressBar.style.width = '0%';
            }

            if (loadingStatus) {
                loadingStatus.textContent = 'Initializing...';
                loadingStatus.style.color = '';
            }

            const appContainer = document.getElementById('app-container');
            if (appContainer) {
                appContainer.style.display = 'none';
            }
        },

        isLoading: function() {
            return !isComplete;
        },

        getCurrentProgress: function() {
            return currentProgress;
        }
    };
})();

console.log('Enhanced LoadingManager module loaded successfully');