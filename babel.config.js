module.exports = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                node: 'current'
            }
        }]
    ],
    plugins: ['@babel/plugin-transform-modules-commonjs'],
    sourceType: 'module',
    // Ignore node_modules except Three.js
    ignore: [/node_modules\/(?!three)/]
};
