/**
 * Alert component - Display important messages
 */

import React from "react";
import styles from "./Alert.module.css";

export interface AlertProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "warning" | "success";
}

export interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export interface AlertTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  className = "",
  variant = "default",
}) => {
  return (
    <div className={`${styles.alert} ${styles[variant]} ${className}`} role="alert">
      {children}
    </div>
  );
};

export const AlertDescription: React.FC<AlertDescriptionProps> = ({
  children,
  className = "",
}) => {
  return <div className={`${styles.alertDescription} ${className}`}>{children}</div>;
};

export const AlertTitle: React.FC<AlertTitleProps> = ({ children, className = "" }) => {
  return <h3 className={`${styles.alertTitle} ${className}`}>{children}</h3>;
};
