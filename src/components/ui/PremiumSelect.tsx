import React, { useState, useRef, useEffect, ReactNode, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check } from "lucide-react";

interface PremiumSelectProps {
  id?: string;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  className?: string;
  children: ReactNode;
  disabled?: boolean;
  required?: boolean;
}

export function PremiumSelect({ id, value, onChange, className, children, disabled }: PremiumSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const options: { value: string; label: string }[] = [];
  
  const childArray = React.Children.toArray(children);
  childArray.forEach(child => {
    if (!React.isValidElement(child)) return;
    if (child.type === 'option') {
      options.push({
        value: child.props.value || "",
        label: child.props.children as string
      });
    }
  });

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  const updateRect = useCallback(() => {
    if (containerRef.current) {
      setRect(containerRef.current.getBoundingClientRect());
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateRect();
      window.addEventListener("scroll", updateRect, true);
      window.addEventListener("resize", updateRect);
      return () => {
        window.removeEventListener("scroll", updateRect, true);
        window.removeEventListener("resize", updateRect);
      };
    }
  }, [isOpen, updateRect]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(event.target as Node);
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(event.target as Node);
      if (isOutsideContainer && isOutsideMenu) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    if (onChange && val !== value) {
      onChange({ target: { value: val } });
    }
    setIsOpen(false);
  };

  const triggerClasses = className?.includes("bg-") ? className : `${className || ""} bg-white border border-slate-200/60 shadow-3xs`.trim();

  return (
    <div className="relative inline-block w-full" ref={containerRef} id={id}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 text-left transition-all ${triggerClasses} ${isOpen ? 'ring-4 ring-blue-500/20 border-blue-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="truncate">{selectedOption?.label || "Select..."}</span>
        <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && rect && createPortal(
        <div 
          ref={menuRef}
          style={{
            position: "fixed",
            top: rect.bottom + 8,
            left: rect.left,
            width: Math.max(rect.width, 200),
            zIndex: 999999
          }}
        >
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
              className="bg-white/95 backdrop-blur-3xl border border-white/60 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.15)] rounded-2xl overflow-hidden"
            >
              <div className="p-1.5 max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
                {options.map((opt, i) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={`${opt.value}-${i}`}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 text-white font-bold shadow-md"
                          : "text-slate-700 font-semibold hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span className="truncate text-[13px]">{opt.label}</span>
                      {isSelected && <Check size={14} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>,
        document.body
      )}
    </div>
  );
}
