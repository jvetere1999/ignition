/**
 * DropdownMenu component - Display a menu of options
 */

import React, { useState, useRef, useEffect } from "react";
import styles from "./DropdownMenu.module.css";

export interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
}

export interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
}

export interface DropdownMenuItemProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export interface DropdownMenuSeparatorProps {
  className?: string;
}

interface MenuContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  closeMenu: () => void;
}

const DropdownContext = React.createContext<MenuContextType | undefined>(undefined);

const useDropdownContext = () => {
  const context = React.useContext(DropdownContext);
  if (!context) {
    throw new Error("useDropdownContext must be used within DropdownMenu");
  }
  return context;
};

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, closeMenu }}>
      <div className={`${styles.dropdownMenu} ${className}`}>{children}</div>
    </DropdownContext.Provider>
  );
};

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({
  asChild,
  children,
  className = "",
}) => {
  const { isOpen, setIsOpen } = useDropdownContext();

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, {
      onClick: () => setIsOpen(!isOpen),
      className: `${child.props?.className || ""} ${className}`,
    });
  }

  return (
    <button
      className={`${styles.trigger} ${className}`}
      onClick={() => setIsOpen(!isOpen)}
    >
      {children}
    </button>
  );
};

export const DropdownMenuContent: React.FC<DropdownMenuContentProps & { align?: string }> = ({
  children,
  className = "",
  align,
}) => {
  const { isOpen, closeMenu } = useDropdownContext();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeMenu]);

  if (!isOpen) return null;

  return (
    <div ref={ref} className={`${styles.content} ${className}`}>
      {children}
    </div>
  );
};

export const DropdownMenuItem: React.FC<DropdownMenuItemProps & { asChild?: boolean }> = ({
  onClick,
  children,
  className = "",
  disabled = false,
  asChild,
}) => {
  const { closeMenu } = useDropdownContext();

  const handleClick = () => {
    if (!disabled) {
      onClick?.();
      closeMenu();
    }
  };

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, {
      onClick: handleClick,
      className: `${child.props?.className || ""} ${className}`,
    });
  }

  return (
    <button
      className={`${styles.item} ${disabled ? styles.disabled : ""} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      role="menuitem"
    >
      {children}
    </button>
  );
};

export const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({
  className = "",
}) => {
  return <div className={`${styles.separator} ${className}`} />;
};
