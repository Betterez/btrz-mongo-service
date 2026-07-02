const btrzBaseConfig = require("eslint-config-btrz-base");

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "test/**",
      "eslint.config.js"
    ]
  },
  {
    files: [
      "**/*.js"
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly"
      }
    },
    ...btrzBaseConfig.configs.all
  }
];
