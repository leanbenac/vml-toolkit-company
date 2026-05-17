import React from 'react';
import styles from './ToolGrid.module.css';

interface ToolGridProps {
  children: React.ReactNode;
}

export const ToolGrid: React.FC<ToolGridProps> = ({ children }) => {
  return (
    <section className={styles.grid}>
      {children}
    </section>
  );
};
