// backend/jest.config.cjs
module.exports = {
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  testEnvironment: 'node',
  silent: true,
  transform: {}                         
};
