/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#3C038C", // color corporativo (navbar/footer)
          dark: "#2B0268",
          accent: "#845ABF",
        },
      },
      boxShadow: {
        brand: "0 2px 8px rgba(60, 3, 140, 0.25)",
      },
    },
  },
  plugins: [],
};
