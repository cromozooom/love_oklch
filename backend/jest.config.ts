import type { Config } from 'jest';

const config: Config = {
  // Test environment
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Root directory for tests and source files
  rootDir: './',
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/src/**/*.test.ts',
    '**/tests/**/*.spec.ts',
    '**/src/**/*.spec.ts',
  ],

  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/database/seed.ts',
  ],

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'clover'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],

  // Module paths to ignore for transformation
  transformIgnorePatterns: ['/node_modules/(?!(@prisma/client)/)'],

  // Global test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks after each test
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Error handling
  errorOnDeprecated: true,

  // Performance settings
  maxWorkers: '50%',

  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: {
        compilerOptions: {
          module: 'commonjs',
          target: 'es2020',
          lib: ['es2020'],
          allowJs: true,
          skipLibCheck: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          moduleResolution: 'node',
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          baseUrl: './src',
          paths: {
            '@/*': ['*'],
          },
        },
      },
    },
  },

  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],

  // Test environment options
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
};

export default config;
