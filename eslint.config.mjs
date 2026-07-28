import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  {
    files: ["src/modules/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "react", message: "modules/ es backend puro, sin React." },
            { name: "next/navigation", message: "modules/ no conoce HTTP." },
          ],
          patterns: [
            {
              group: ["@/components/*", "@/features/*", "@/app/*"],
              message: "modules/ no puede depender de la capa de UI.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
