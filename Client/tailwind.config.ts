import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "blurred-ellipse": 'url("/path-to-your-ellipse.svg")',
      },
      colors: {
        "custom-purple": "#894799",
        "light-2": "#894799",
        "light-1": "#da7fc6",
        "light-3": "#c9a7d3",
        "dark-1": "#4d2c5b",
        "dark-2": "#2a1a2f",
      },
      blur: {
        "500": "500px",
      },

      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        bubbler: ["Bubbler One", "sans-serif"],
        biryani: ["Biryani", "sans-serif"],
        pacifico: ["Pacifico", "cursive"],
        sans: ["Poppins"], // Set Poppins as the default sans font family
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities(
        {
          ".ellipse": {
            width: "733.5px",
            height: "592px",
            flexShrink: "0",
            backgroundColor: "#894799",
            filter: "blur(500px)",
            borderRadius: "50%", // Makes the element an ellipse if the width and height are different
          },
        },
        ["responsive", "hover"]
      );
    },
  ],
};
export default config;
