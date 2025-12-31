// Test setup file for Jest
// 测试设置文件

// Mock console methods to reduce noise in tests
const originalConsole = global.console;

global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test timeout
jest.setTimeout(10000);