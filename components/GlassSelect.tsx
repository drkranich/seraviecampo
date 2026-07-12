"use client";

import { useEffect, useId, useRef, useState } from "react";

export type GlassSelectOption = { value: string; label: string };

export function GlassSelect({
  id,
  name,
  value,
  defaultValue,
  options,
  placeholder = "Selecione",
  className = "",
  buttonClassName = "",
  onChange,
}: {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string | null;
  options: GlassSelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  onChange?: (value: string) => void;
}) {
  const generatedId = useId();
  const buttonId = id ?? generatedId;
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedValue = controlled ? value : internalValue;
  const selected = options.find((option) => option.value === selectedValue);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function choose(nextValue: string) {
    if (!controlled) setInternalValue(nextValue);
    onChange?.(nextValue);
    setOpen(false);
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={selectedValue ?? ""} />}
      <button
        id={buttonId}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-left text-sm text-forest-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none backdrop-blur transition hover:border-gold/50 hover:bg-white/[0.08] focus:border-gold/70 focus:bg-white/[0.09] ${buttonClassName}`}
      >
        <span className={selected ? "" : "text-stone-400"}>{selected ? selected.label : placeholder}</span>
        <span className={`text-xs text-gold transition-transform ${open ? "rotate-180" : ""}`}>v</span>
      </button>
      {open && (
        <div
          role="listbox"
          aria-labelledby={buttonId}
          className="absolute left-0 right-0 top-full z-[70] mt-1 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-[#10140E]/95 p-1 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
        >
          {options.map((option) => {
            const active = option.value === selectedValue;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => choose(option.value)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  active ? "bg-gold/15 text-gold" : "text-stone-200 hover:bg-white/[0.08] hover:text-forest-50"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
