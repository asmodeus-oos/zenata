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

  const triggerClasses = className?.includes("bg-") ? className : `${className || ""} bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-700/50 shadow-3xs`.trim();

  return (
    <div className="relative inline-block w-full" ref={containerRef} id={id}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full h-11 flex items-center justify-between gap-3 text-left transition-all ${triggerClasses} ${isOpen ? 'ring-4 ring-blue-500/20 border-blue-500 z-10' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300 dark:hover:border-slate-600'} cursor-pointer active:scale-[0.98] px-4 rounded-xl`}
      >
        <span className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{selectedOption?.label || "Select..."}</span>
        <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && rect && createPortal(
        <div 
          ref={menuRef}
          style={{
            position: "fixed",
            top: rect.bottom + 8,
            left: rect.left,
            width: Math.max(rect.width, 220),
            zIndex: 999999
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-white/60 dark:border-slate-700/50 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.2)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden"
            >
              <div className="p-1.5 max-h-[320px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
                {options.map((opt, i) => {
                  const isSelected = opt.value === value;
                  return (
                    <motion.button
                      key={`${opt.value}-${i}`}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer group ${
                        isSelected
                          ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20"
                          : "text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span className="truncate text-[13px]">{opt.label}</span>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", bounce: 0.5 }}
                        >
                          <Check size={14} className="shrink-0" />
                        </motion.div>
                      )}
                    </motion.button>
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
