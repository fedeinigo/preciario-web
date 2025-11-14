// src/app/components/ui/Tooltip.tsx
"use client";

import React from "react";
import { HelpCircle } from "lucide-react";

type TooltipProps = {
  content: string;
  children?: React.ReactNode;
  showIcon?: boolean;
};

export default function Tooltip({ content, children, showIcon = true }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div className="relative inline-flex items-center">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children || (showIcon && <HelpCircle className="h-4 w-4 text-slate-400 hover:text-purple-600 transition" />)}
      </div>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 animate-in fade-in slide-in-from-bottom-1 duration-200">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}
