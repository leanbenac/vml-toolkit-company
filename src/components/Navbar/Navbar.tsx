import React from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';

export const Navbar = () => {
  return (
    <nav className={`${styles.navbar} glass`}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className="accent-gradient">VML</span>
          <span className="text-gradient">Tools</span>
        </Link>
        
        <div className={styles.links}>
          <Link href="/admin" className={`${styles.link} ${styles.adminBtn}`}>
            Subir Herramienta
          </Link>
        </div>
      </div>
    </nav>
  );
};
