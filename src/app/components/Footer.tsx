import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-primary text-white shadow-md mt-10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between text-sm gap-2">
        <div>© {new Date().getFullYear()} Wise CX — Soluciones Inteligentes</div>
        <div className="text-center sm:text-right">
          Desarrollado por <span className="font-medium">Federico Iñigo</span> ·{" "}
          <a
            href="mailto:federico.i@wisecx.com"
            className="underline-offset-4 hover:underline"
          >
            federico.i@wisecx.com
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
