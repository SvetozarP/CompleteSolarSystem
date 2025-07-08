// Common test utilities and mocks
export const createMockPlanet = (name = 'Earth') => ({
    name,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
});

export const createMockCamera = () => ({
    position: { x: 0, y: 0, z: 100 },
    lookAt: jest.fn(),
    updateProjectionMatrix: jest.fn()
});

export const createMockRenderer = () => ({
    setSize: jest.fn(),
    render: jest.fn(),
    domElement: document.createElement('canvas')
});
