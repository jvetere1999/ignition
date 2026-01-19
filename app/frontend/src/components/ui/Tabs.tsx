/**
 * Tabs component - Organize content in tabbed interface
 */

import React, { useState, createContext, useContext } from "react";
import styles from "./Tabs.module.css";

// Types
export interface TabsProps {
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
}

export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

// Context for managing active tab
interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("useTabsContext must be used within Tabs component");
  }
  return context;
};

// Tabs component
export const Tabs: React.FC<TabsProps & { defaultValue?: string; value?: string; onValueChange?: (v: string) => void }> = ({
  defaultValue = "",
  value,
  onValueChange,
  children,
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState(value || defaultValue);

  const handleChange = (newValue: string) => {
    setActiveTab(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab: value || activeTab, setActiveTab: handleChange }}>
      <div className={`${styles.tabs} ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
};

// TabsList component
export const TabsList: React.FC<TabsListProps> = ({ children, className = "" }) => {
  return <div className={`${styles.tabsList} ${className}`}>{children}</div>;
};

// TabsTrigger component
export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  className = "",
}) => {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      className={`${styles.tabsTrigger} ${isActive ? styles.active : ""} ${className}`}
      onClick={() => setActiveTab(value)}
      role="tab"
      aria-selected={isActive}
    >
      {children}
    </button>
  );
};

// TabsContent component
export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  className = "",
}) => {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) return null;

  return <div className={`${styles.tabsContent} ${className}`}>{children}</div>;
};
