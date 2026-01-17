export default {
  // Test environment
  testEnvironment: 'node',
  
  // ESM support
  extensionsToTreatAsEsm: ['.ts'],
  preset: 'ts-jest/presets/default-esm',
  
  // Transform configuration for ESM
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        target: 'ES2020',
        allowJs: true,
        esModuleInterop: true,
        skipLibCheck: true
      }
    }]
  },
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  // Coverage thresholds - MUST be 80%
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/cli/**/*.ts',           // CLI modules require integration tests
    '!src/locales/backup-*.ts',   // Backup locale files
    '!src/locales/af.ts',         // Non-English locales (translations only)
    '!src/locales/ar.ts',
    '!src/locales/bn.ts',
    '!src/locales/da.ts',
    '!src/locales/de.ts',
    '!src/locales/es.ts',
    '!src/locales/es-MX.ts',
    '!src/locales/fi.ts',
    '!src/locales/fr.ts',
    '!src/locales/hi.ts',
    '!src/locales/id.ts',
    '!src/locales/it.ts',
    '!src/locales/ja.ts',
    '!src/locales/ko.ts',
    '!src/locales/nl.ts',
    '!src/locales/no.ts',
    '!src/locales/pl.ts',
    '!src/locales/pt.ts',
    '!src/locales/pt-BR.ts',
    '!src/locales/ru.ts',
    '!src/locales/sv.ts',
    '!src/locales/sw.ts',
    '!src/locales/th.ts',
    '!src/locales/tr.ts',
    '!src/locales/vi.ts',
    '!src/locales/zh.ts',
    '!**/node_modules/**'
  ],
  
  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/test/**/*.test.ts'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Module name mapper for imports
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // Test timeout
  testTimeout: 10000
};