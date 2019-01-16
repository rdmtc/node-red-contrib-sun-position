module.exports = {
  env: {
    es6: true,
    node: true,
    browser: true
  },
  plugins: [
    "html"
  ],
  extends: "eslint:recommended",
  "settings": {
    "html/html-extensions": [".html", ".htm", ".we"],  // consider .html and .we files as HTML
    "html/indent": "+2",
    "html/report-bad-indent": "warn",
    "import/resolver": {
      "node": {
        "extensions": [
          ".js",
          ".jsx"
        ]
      }
    }
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module"
  },
  rules: {
    indent: [
      "error",
      4,
      {
        SwitchCase: 1
      }
    ],
    "max-len": [
      "error",
      {
        code: 250,
        ignoreComments: true,
        ignoreTrailingComments: true,
        ignoreUrls: true,
        ignoreRegExpLiterals: true,
        ignoreTemplateLiterals: true
      }
    ],
    "no-eq-null": "error",
    "eqeqeq": "error",
    "no-else-return": "error",
    "prefer-arrow-callback": "error",
    "import/newline-after-import": ["warn", { "count": 1 }],
    "no-console": "off",
    "no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_"
      }
    ],
    "no-unused-expressions": "warn",
    "no-useless-escape": "warn",
    "no-constant-condition": "off",
    "no-multiple-empty-lines": [
      "error",
      {
        max: 1,
        maxEOF: 1
      }
    ],
    "no-var": "error",
    "prefer-const": "error",
    "linebreak-style": ["error", "windows"],
    "brace-style": [
      2,
      "1tbs",
      {
        allowSingleLine: true
      }
    ],
    quotes: [
      "warn",
      "single",
      {
        avoidEscape: true,
        allowTemplateLiterals: true
      }
    ],
    semi: ["error", "always"],
    "comma-dangle": [
      "error",
      {
        arrays: "never",
        objects: "never",
        imports: "never",
        exports: "never",
        functions: "ignore"
      }
    ],
    "no-trailing-spaces": "error",
    "spaced-comment":["warn", "always", {
          "line": {
            "markers": ["/"],
            "exceptions": ["-", "+", "*", "#"]
        },
        "block": {
            "markers": ["!"],
            "exceptions": ["-", "+", "*", "#"],
            "balanced": true
        }
    }],
    "eol-last": ["error", "never"]
  }
};
