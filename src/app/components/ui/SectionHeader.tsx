"use client";

import * as React from "react";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface SectionHeaderProps {
  title: string;
  icon?: IconType;           // opcional: pasar un ícono de lucide-react
  actions?: React.ReactNode; // opcional: botones/contenido a la derecha
  className?: string;
}

export default function SectionHeader({
  title,
  icon: Icon,
  actions,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`heading-bar ${className}`}>
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="w-5 h-5 opacity-90" aria-hidden /> : null}
        <h2 className="m-0 leading-none text-white">{title}</h2>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
