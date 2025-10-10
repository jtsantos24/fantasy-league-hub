// tailwind.config.js

module.exports = {
  // CRITICAL: This line tells Tailwind to scan the root folder for class names
  content: [
    "./*.{js,jsx,ts,tsx}", 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};