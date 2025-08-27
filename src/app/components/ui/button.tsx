import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: React.FC<Props> = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`btn ${className}`}
  >
    {children}
  </button>
);
