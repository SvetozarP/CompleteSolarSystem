// Procedural texture generation for fallbacks
window.initializeTexturesWithFallbacks = function() {
    console.log('Creating procedural planet textures...');

    const planets = [
        { name: 'Sun', color: '#FDB813', type: 'star' },
        { name: 'Mercury', color: '#8C7853', type: 'terrestrial' },
        { name: 'Venus', color: '#FC649F', type: 'terrestrial' },
        { name: 'Earth', color: '#4F94CD', type: 'terrestrial' },
        { name: 'Mars', color: '#CD5C5C', type: 'terrestrial' },
        { name: 'Jupiter', color: '#D2691E', type: 'gas_giant' },
        { name: 'Saturn', color: '#FAD5A5', type: 'gas_giant' },
        { name: 'Uranus', color: '#4FD0FF', type: 'ice_giant' },
        { name: 'Neptune', color: '#4169E1', type: 'ice_giant' },
        { name: 'Pluto', color: '#EEE8AA', type: 'dwarf_planet' }
    ];

    planets.forEach(planetInfo => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 256;
        const context = canvas.getContext('2d');

        // Simple colored texture with noise
        context.fillStyle = planetInfo.color;
        context.fillRect(0, 0, 256, 256);

        // Add noise pattern
        const imageData = context.getImageData(0, 0, 256, 256);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 30;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }

        context.putImageData(imageData, 0, 0);

        console.log(`Created texture for ${planetInfo.name}`);
    });
};