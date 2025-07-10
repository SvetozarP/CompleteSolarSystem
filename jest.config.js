module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    "static/js/solar-system/*.{js,ts,jsx,tsx}", // Main structure files
    "static/js/ui/*.{js,ts,jsx,tsx}",           // UI
    "static/js/utils/*.{js,ts,jsx,tsx}",    // Utilities
  ],
  coverageDirectory: "coverage", // Output directory for coverage reports
  coverageReporters: ["text", "lcov", "html"], // Formats of the report
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': ['babel-jest', { rootMode: 'upward' }]
  },
  moduleNameMapper: {
    '^three$': '<rootDir>/node_modules/three',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/static/js/__mocks__/fileMock.js'
  },
  setupFilesAfterEnv: ['<rootDir>/static/js/__tests__/setup.js'], // Changed from setupFiles
  moduleFileExtensions: ['js', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(three)/)'
  ],
  testMatch: [
  '<rootDir>/static/js/__tests__/**/*.test.js'
  ],
  testPathIgnorePatterns: [
  '/node_modules/',
  '/static/js/__tests__/setup.js',
  '/static/js/__tests__/test-utils.js'
  ],

};