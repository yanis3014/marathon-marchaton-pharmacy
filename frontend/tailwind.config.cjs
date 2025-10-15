const colors = require("tailwindcss/colors");
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // remap complet des gammes
        indigo: colors.lime,
        violet: colors.lime,
        purple: colors.lime,
        // si tu veux que le bleu vire au vert aussi, décommente :
        // blue: colors.lime,
      },
    },
  },
  plugins: [],
};
