import React from 'react';
import styles from './ToolCard.module.css';

interface ToolCardProps {
  id: string;
  name: string;
  description: string;
  category?: string;
  imageUrl?: string;
  fileUrl: string;
  downloads: number;
  onDownload: (id: string, fileUrl: string) => void;
  onEdit: (id: string) => void;
  isTrending?: boolean;
  author?: string;
  team?: string; // Nuevo campo para la marca o equipo
}

const categoryLabels: Record<string, string> = {
  Extensiones: 'Extensiones Chrome',
  AppWebs: 'AppWebs',
  Scripts: 'Scripts',
  Bots: 'Bots',
  Docs: 'Docs',
};

const categoryColors: Record<string, string> = {
  Extensiones: '#06b6d4',
  AppWebs: '#10b981',
  Scripts: '#8b5cf6',
  Bots: '#f43f5e',
  Docs: '#f59e0b',
};

const categoryRGBs: Record<string, string> = {
  Extensiones: '6, 182, 212',
  AppWebs: '16, 185, 129',
  Scripts: '139, 92, 246',
  Bots: '244, 63, 94',
  Docs: '245, 158, 11',
};

export const ToolCard: React.FC<ToolCardProps> = ({
  id,
  name,
  description,
  category = 'AppWebs',
  imageUrl,
  fileUrl,
  downloads,
  onDownload,
  onEdit,
  isTrending,
  author,
  team,
}) => {
  const neonColor = categoryColors[category] || '#ffffff';

  return (
    <div className={`${styles.card} card-glass ${isTrending ? styles.trendingCard : ''}`}>
      {isTrending && (
        <div className={styles.trendingBadge}>
          <span>🔥 MÁS POPULAR</span>
        </div>
      )}
      
      <div className={styles.imageContainer}>
        {imageUrl ? (
          <>
            <div 
              className={styles.blurredBackdrop} 
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
            <img src={imageUrl} alt={name} className={styles.image} />
          </>
        ) : (
          <div className={styles.placeholder}>
            <div 
              className={styles.neonWrapper}
              style={{ '--neon-color': neonColor } as React.CSSProperties}
            >
              <span className={styles.placeholderLetter}>{name[0]}</span>
            </div>
          </div>
        )}
        <span 
          className={styles.categoryBadge}
          style={{
            '--neon-color': neonColor,
            '--neon-color-rgb': categoryRGBs[category] || '255, 255, 255'
          } as React.CSSProperties}
        >
          {categoryLabels[category] ?? category}
        </span>
      </div>

      <div className={styles.content}>
        <div className={styles.headerRow}>
          <h3 className={styles.title} title={name}>{name}</h3>
        </div>
        
        <p className={styles.description} title={description}>{description}</p>
        
        <div className={styles.metaInfo}>
          {author && (
            <div className={styles.authorInfo}>
              <span className={styles.authorLabel}>By</span> {author}
            </div>
          )}
          {team && (
            <div className={styles.teamBadge}>
              {team}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button
            onClick={(e) => {
              e.preventDefault();
              onDownload(id, fileUrl);
            }}
            className={styles.button}
          >
            Descargar
          </button>

          <div className={styles.downloadsBadge} title={`${downloads || 0} descargas`}>
            <span className={styles.downloadIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </span>
            <span className={styles.downloadCount}>{downloads || 0}</span>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              onEdit(id);
            }}
            className={styles.editBtn}
            title="Editar herramienta"
            aria-label="Editar herramienta"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
