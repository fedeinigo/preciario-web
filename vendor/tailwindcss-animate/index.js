const plugin = require("tailwindcss/plugin");

module.exports = plugin(function ({ addUtilities, addVariant }) {
  addUtilities(
    {
      ".animate-in": {
        animationDuration: "var(--animate-duration, 150ms)",
        animationFillMode: "both",
      },
      ".fade-in": {
        opacity: 0,
        animation: "fade-in var(--animate-duration, 150ms) ease-out both",
      },
      ".zoom-in": {
        animation: "zoom-in var(--animate-duration, 150ms) ease-out both",
      },
    },
    { variants: ["responsive"] },
  );

  addUtilities({
    "@keyframes fade-in": {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    "@keyframes zoom-in": {
      from: { opacity: 0, transform: "scale(0.96)" },
      to: { opacity: 1, transform: "scale(1)" },
    },
  });

  addVariant("motion-safe", "@media (prefers-reduced-motion: no-preference)");
});
