const tailwindcssAnimate = require("tailwindcss-animate"); // eslint-disable-line @typescript-eslint/no-require-imports

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{ts,tsx}",
      "./components/**/*.{ts,tsx}",
      "./pages/**/*.{ts,tsx}",
      "./src/**/*.{ts,tsx}"
    ],
    theme: {
      extend: {},
    },
    plugins: [
      tailwindcssAnimate
    ],
  }