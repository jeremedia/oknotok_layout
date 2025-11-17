// eslint.config.js - ESLint flat config for OKNOTOK Layout

import js from '@eslint/js';

export default [
    // Apply recommended rules to all JS files
    js.configs.recommended,

    {
        // Global configuration
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                // Browser globals
                console: 'readonly',
                document: 'readonly',
                window: 'readonly',
                navigator: 'readonly',
                fetch: 'readonly',
                localStorage: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                // Node.js globals (for config files)
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                // Rails UJS
                Rails: 'readonly'
            }
        },

        rules: {
            // Error Prevention
            'no-unused-vars': ['warn', {
                'argsIgnorePattern': '^_',
                'varsIgnorePattern': '^_',
                'caughtErrorsIgnorePattern': '^_'
            }],
            'no-undef': 'error',
            'no-console': 'off', // Allow console for debugging
            'no-debugger': 'warn',

            // Best Practices
            'eqeqeq': ['error', 'always'],
            'curly': ['error', 'all'],
            'no-var': 'error',
            'prefer-const': 'warn',
            'no-unused-expressions': 'error',

            // Style (matching existing codebase)
            'indent': ['warn', 4, { 'SwitchCase': 1 }],
            'quotes': ['warn', 'single', { 'avoidEscape': true }],
            'semi': ['warn', 'always'],
            'comma-dangle': ['warn', 'never'],
            'no-trailing-spaces': 'warn',
            'eol-last': ['warn', 'always'],

            // Three.js specific allowances
            'no-unused-vars': ['warn', {
                'argsIgnorePattern': '^_',
                'varsIgnorePattern': '^_|^(THREE|scene|camera|renderer|controls)',
                'caughtErrorsIgnorePattern': '^_'
            }]
        }
    },

    {
        // Ignore build outputs and dependencies
        ignores: [
            'node_modules/**',
            'app/assets/builds/**',
            'public/**',
            'vendor/**',
            'tmp/**',
            'log/**',
            'storage/**'
        ]
    }
];
