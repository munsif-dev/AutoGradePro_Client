module.exports = {
  root: true, // Indicates this is the root configuration
  extends: [
    "eslint:recommended", // Use recommended ESLint rules
    "plugin:react/recommended", // Enable React-specific linting rules (optional)
    "plugin:@typescript-eslint/recommended", // Enable TypeScript-specific linting rules (optional)
  ],
  parser: "@babel/eslint-parser", // Optional: If you're using Babel, you may need this parser
  env: {
    browser: true, // Enables browser-related global variables like 'window'
    node: true, // Enables Node.js-related global variables
  },
  parserOptions: {
    ecmaVersion: 2020, // Allows parsing of ECMAScript 2020 syntax
    sourceType: "module", // Enables support for ES modules
  },
  plugins: ["react", "@typescript-eslint"], // Add the necessary ESLint plugins
  rules: {
    // Customize rules here if necessary
  },
};
