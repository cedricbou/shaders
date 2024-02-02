module.exports = {
  extends: ["eslint:recommended", "plugin:vue/recommended"],
  plugins: ["vue", "prettier"],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    "prettier/prettier": "error",
  },
};
