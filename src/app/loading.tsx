import React from 'react';
import styles from './loading.module.css';

export default function Loading() {
  // Generamos un array de 3 elementos para que se vea más limpio (una sola fila en desktop)
  const skeletons = Array.from({ length: 3 });

  return (
    <div className={styles.container}>
      <header className={styles.headerSkeleton}>
        <div className={`${styles.titleSkeleton} ${styles.shimmer}`} />
        <div className={`${styles.subtitleSkeleton} ${styles.shimmer}`} />
      </header>

      <div className={styles.filtersSkeleton}>
        <div className={`${styles.searchSkeleton} ${styles.shimmer}`} />
        <div className={styles.tabsSkeleton}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`${styles.tabSkeleton} ${styles.shimmer}`} />
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {skeletons.map((_, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIcon} ${styles.shimmer}`} />
              <div className={styles.cardTitleGroup}>
                <div className={`${styles.cardTitle} ${styles.shimmer}`} />
                <div className={`${styles.cardMeta} ${styles.shimmer}`} />
              </div>
            </div>
            
            <div className={styles.cardBody}>
              <div className={`${styles.cardLine} ${styles.shimmer}`} style={{ width: '95%' }} />
              <div className={`${styles.cardLine} ${styles.shimmer}`} style={{ width: '100%' }} />
              <div className={`${styles.cardLine} ${styles.shimmer}`} style={{ width: '75%' }} />
            </div>

            <div className={styles.cardFooter}>
              <div className={`${styles.cardButton} ${styles.shimmer}`} />
              <div className={`${styles.cardStat} ${styles.shimmer}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
