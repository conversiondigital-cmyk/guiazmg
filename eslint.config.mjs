import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "error",
      // Imágenes dinámicas de usuario (avatares/thumbnails con URL remota): se
      // permite <img>. Convertir a next/Image queda pendiente como mejora de perf.
      "@next/next/no-img-element": "off",
      "react-hooks/immutability": "off",
      // React Compiler optimization hints (no afectan correctitud): se permite
      // usar librerías no optimizables (p.ej. @tanstack/react-table) y memoización
      // manual que el compilador no puede preservar.
      "react-hooks/incompatible-library": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
