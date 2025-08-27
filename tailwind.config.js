/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3c038c",
        primaryDark: "#2c0069",
        primarySoft: "#efe7fb",
      },
      boxShadow: {
        soft: "0 2px 12px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};
