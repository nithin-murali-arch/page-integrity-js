module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/**/index.ts'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
}; 