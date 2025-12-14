import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
    {
        ignores: ['node_modules', 'out', '.vscode-test', 'dist', 'esbuild.js'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            parser: tseslint.parser
        },
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_'
                }
            ],
            'semi': [
                'error',
                'always'
            ],
            'quotes': [
                'warn',
                'single',
                {
                    avoidEscape: true,
                    allowTemplateLiterals: true
                }
            ],
            'no-throw-literal': 'error',
            'eqeqeq': 'error',
            'curly': 'error',
            'comma-spacing': 'error',
            'brace-style': 'error',
            '@typescript-eslint/no-non-null-assertion': 'off'
        }
    }
];
