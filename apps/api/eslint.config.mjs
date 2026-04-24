import baseConfig from '../../eslint.config.mjs';

/** Clean-architecture layer boundaries.
 * domain         → (nothing)
 * application    → domain
 * infrastructure → domain, application
 * api            → application, domain (types only)
 */
const layerRules = [
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/application/**',
                '**/infrastructure/**',
                '**/api/**',
                '**/config/**',
                '@nestjs/*',
                '@mikro-orm/*',
                '@anthropic-ai/*',
              ],
              message:
                'domain must be framework-free: no imports from outer layers or framework packages.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/application/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/infrastructure/**', '**/api/**'],
              message:
                'application may only depend on domain. Use ports, not adapters.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/api/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/infrastructure/**'],
              message:
                'api must not import infrastructure directly. Go through application use-cases.',
            },
          ],
        },
      ],
    },
  },
];

export default [...baseConfig, ...layerRules];
