// static/js/ui/notification-system.js
// Enhanced notification system with toast notifications

window.NotificationSystem = (function() {
    'use strict';

    let toastContainer = null;
    let toastCounter = 0;

    function createToastContainer() {
        if (!toastContainer) {
            toastContainer = document.getElementById('toast-container');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.id = 'toast-container';
                toastContainer.className = 'toast-container';
                toastContainer.style.cssText = `
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    z-index: 50;
                    max-width: 400px;
                    pointer-events: none;
                `;
                document.body.appendChild(toastContainer);
            }
        }
        return toastContainer;
    }

    function createToast(message, type = 'info', duration = 3000) {
        const container = createToastContainer();
        toastCounter++;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.id = `toast-${toastCounter}`;
        toast.innerHTML = `
            <div class="toast-content" style="display: flex; align-items: center; gap: 12px;">
                <span class="toast-icon" style="font-size: 18px;">${getIcon(type)}</span>
                <span class="toast-message" style="flex: 1;">${message}</span>
                <button class="toast-close" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 18px; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">&times;</button>
            </div>
        `;

        // Apply styles
        toast.style.cssText = `
            background: rgba(26, 26, 46, 0.95);
            border: 1px solid ${getBorderColor(type)};
            border-radius: 8px;
            color: white;
            padding: 12px 16px;
            margin-bottom: 8px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            pointer-events: auto;
            max-width: 100%;
            word-wrap: break-word;
        `;

        // Add close functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.onclick = () => removeToast(toast);

        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });

        // Auto remove
        if (duration > 0) {
            setTimeout(() => removeToast(toast), duration);
        }

        return toast;
    }

    function removeToast(toast) {
        if (!toast || !toast.parentNode) return;

        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    function getIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            debug: '🔧'
        };
        return icons[type] || icons.info;
    }

    function getBorderColor(type) {
        const colors = {
            info: '#4a9eff',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            debug: '#8b5cf6'
        };
        return colors[type] || colors.info;
    }

    return {
        init: function() {
            createToastContainer();
            if (window.Helpers) {
                window.Helpers.log('Enhanced Notification System initialized', 'debug');
            }
        },

        show: function(message, type = 'info', duration = 3000) {
            return createToast(message, type, duration);
        },

        showInfo: function(message, duration = 3000) {
            return this.show(message, 'info', duration);
        },

        showSuccess: function(message, duration = 3000) {
            return this.show(message, 'success', duration);
        },

        showWarning: function(message, duration = 4000) {
            return this.show(message, 'warning', duration);
        },

        showError: function(message, duration = 5000) {
            return this.show(message, 'error', duration);
        },

        showDebug: function(message, duration = 2000) {
            if (window.SolarSystemConfig?.debug) {
                return this.show(message, 'debug', duration);
            }
        },

        clear: function() {
            if (toastContainer) {
                const toasts = toastContainer.querySelectorAll('.toast');
                toasts.forEach(toast => removeToast(toast));
            }
        },

        getActiveToasts: function() {
            return toastContainer ? toastContainer.querySelectorAll('.toast').length : 0;
        }
    };
})();

console.log('Enhanced NotificationSystem module loaded successfully');