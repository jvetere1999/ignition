/**
 * Select component - Dropdown selection
 */

import React, { useState, useRef, useEffect } from "react";
import styles from "./Select.module.css";

interface SelectContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  value?: string;
  setValue: (value: string) => void;
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

const useSelectContext = () => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("useSelectContext must be used within Select");
  return context;
};

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value);

  const setValue = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  return (
    <SelectContext.Provider value={{ isOpen, setIsOpen, value: internalValue, setValue }}>
      <div className={styles.select}>{children}</div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className = "" }) => {
  const { isOpen, setIsOpen } = useSelectContext();

  return (
    <button
      className={`${styles.trigger} ${className}`}
      onClick={() => setIsOpen(!isOpen)}
      type="button"
    >
      {children}
    </button>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder = "Select...", className = "" }) => {
  const { value } = useSelectContext();

  return (
    <span className={`${styles.value} ${className}`}>
      {value || placeholder}
    </span>
  );
};

export const SelectContent: React.FC<SelectContentProps> = ({ children, className = "" }) => {
  const { isOpen, setIsOpen } = useSelectContext();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div ref={ref} className={`${styles.content} ${className}`}>
      {children}
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps> = ({ value, children, className = "" }) => {
  const { setValue } = useSelectContext();

  return (
    <button
      type="button"
      className={`${styles.item} ${className}`}
      onClick={() => setValue(value)}
      role="option"
    >
      {children}
    </button>
  );
};
