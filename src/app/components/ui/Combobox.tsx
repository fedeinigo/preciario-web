"use client";

import React, { useEffect, useMemo, useRef, useState, useId } from "react";

interface ComboboxProps {
  options: string[];
  value: string;                   // siempre un valor válido (o "")
  onChange: (val: string) => void; // sólo se llama con valores de la lista
  placeholder?: string;
  className?: string;
  noResultsText?: string;
}

export default function Combobox({
  options,
  value,
  onChange,
  placeholder = "Seleccionar…",
  className = "",
  noResultsText = "Sin resultados",
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // IDs ARIA
  const listboxId = useId();
  const optionId = (idx: number) => `${listboxId}-opt-${idx}`;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        setHighlight(0);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const displayValue = open ? query : value;

  function selectOption(opt: string) {
    onChange(opt); // sólo valores válidos
    setOpen(false);
    setQuery("");
    setHighlight(0);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && filtered[highlight]) selectOption(filtered[highlight]);
      else setOpen(true);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      setHighlight(0);
    }
  }

  function onBlur() {
    setTimeout(() => {
      if (!wrapperRef.current?.contains(document.activeElement)) {
        setOpen(false);
        setQuery("");
        setHighlight(0);
      }
    }, 0);
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={open && filtered[highlight] ? optionId(highlight) : undefined}
        placeholder={placeholder}
        className="input pr-10"
        value={displayValue}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      />
      {/* Flechita */}
      <button
        type="button"
        aria-label="Abrir"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-gray-100"
        onMouseDown={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
          setOpen((v) => !v);
        }}
      >
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={placeholder}
          className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-soft max-h-64 overflow-auto"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">{noResultsText}</div>
          ) : (
            filtered.map((opt, idx) => {
              const active = idx === highlight;
              return (
                <div
                  key={opt}
                  id={optionId(idx)}
                  role="option"
                  aria-selected={active}
                  className={`cursor-pointer w-full text-left px-3 py-2 text-sm ${
                    active ? "bg-primarySoft/60" : "hover:bg-gray-50"
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectOption(opt);
                  }}
                  onMouseEnter={() => setHighlight(idx)}
                >
                  {opt}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
