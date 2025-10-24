/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        // OKLCH color space custom colors will be added here
        'oklch-primary': 'oklch(0.7 0.15 180)',
        'oklch-secondary': 'oklch(0.6 0.12 240)',
        'oklch-accent': 'oklch(0.8 0.20 60)',
      },
    },
  },
  plugins: [],
};
