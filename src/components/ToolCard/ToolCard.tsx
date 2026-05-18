import React from 'react';
import styles from './ToolCard.module.css';

interface ToolCardProps {
  id: string;
  name: string;
  description: string;
  category?: string;
  imageUrl?: string;
  fileUrl: string;
  likes: number;
  liked: boolean;
  onLike: (id: string) => void;
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
  likes,
  liked,
  onLike,
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
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.button}
          >
            Descargar
          </a>

          <button
            className={`${styles.likeBtn} ${liked ? styles.liked : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onLike(id);
            }}
            aria-label="Dar like"
          >
            <span className={styles.likeIcon}>{liked ? '❤️' : '🤍'}</span>
            <span className={styles.likeCount}>{likes}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
