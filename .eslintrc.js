module.exports = {
    "env": {
        "es6": true,
        "node": true,
        "browser": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "rules": {
        "indent": [
            "error",
            "space",
            4,
            {
                "SwitchCase": 1
            }
        ],
        "no-console": "off",
        "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
        "no-useless-escape": "warn",
        "no-constant-condition": "off",
        "no-multiple-empty-lines": ["error", { "max": 1, "maxEOF": 1 }],
        "no-var": "error",
        "prefer-const": "error",
        "linebreak-style": [
            "error",
            "windows"
        ],
        "quotes": [
            "error",
            "single",
            {
                "avoidEscape": true,
                "allowTemplateLiterals": true
            }
        ],
        "semi": [
            "error",
            "always"
        ],
        "comma-dangle": ["error", {
            "arrays": "never",
            "objects": "never",
            "imports": "never",
            "exports": "never",
            "functions": "ignore"
        }],
        "no-trailing-spaces": "error"
    }
}