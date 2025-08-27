import React from "react";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div {...props} className={`card ${className}`}>
    {children}
  </div>
);
