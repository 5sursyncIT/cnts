import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

function toWarnRules(rules) {
  return Object.fromEntries(
    Object.entries(rules).map(([key, value]) => {
      if (Array.isArray(value)) return [key, ["warn", ...value.slice(1)]];
      return [key, "warn"];
    })
  );
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      ...toWarnRules(jsxA11y.configs.recommended.rules),
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/purity": "off"
    }
  }
]);

export default eslintConfig;
