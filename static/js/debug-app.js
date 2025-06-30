// Debug version to test loading
console.log('Debug app starting...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');

    // Test if modules are loading
    console.log('Helpers available:', typeof window.Helpers);
    console.log('MathUtils available:', typeof window.MathUtils);
    console.log('SceneManager available:', typeof window.SceneManager);
    console.log('ParticleSystems available:', typeof window.ParticleSystems);
    console.log('ApiClient available:', typeof window.ApiClient);

    // Test API call
    if (window.ApiClient) {
        window.ApiClient.getPlanets()
            .then(planets => {
                console.log('API test successful:', planets.length, 'planets loaded');
                completeLoading();
            })
            .catch(error => {
                console.error('API test failed:', error);
                completeLoading(); // Complete anyway for testing
            });
    } else {
        console.error('ApiClient not available');
        completeLoading();
    }
});

function completeLoading() {
    console.log('Completing loading...');

    const loadingScreen = document.getElementById('loading-screen');
    const appContainer = document.getElementById('app-container');

    if (loadingScreen && appContainer) {
        console.log('Hiding loading screen...');
        loadingScreen.style.display = 'none';
        appContainer.style.display = 'flex';
        console.log('Loading complete!');
    } else {
        console.error('Loading screen or app container not found');
        console.log('Loading screen element:', loadingScreen);
        console.log('App container element:', appContainer);
    }
}