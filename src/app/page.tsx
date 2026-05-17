"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ToolGrid } from "@/components/ToolGrid/ToolGrid";
import { ToolCard } from "@/components/ToolCard/ToolCard";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
  fileUrl: string;
  likes: number;
  author: string;
  team: string; // Nuevo campo para la marca o equipo
}

const CATEGORIES = [
  { value: "all", label: "Todas" },
  { value: "Extensiones", label: "Extensiones" },
  { value: "AppWebs", label: "AppWebs" },
  { value: "Scripts", label: "Scripts" },
  { value: "Bots", label: "Bots" },
  { value: "Docs", label: "Docs" },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [tools, setTools] = useState<Tool[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const [visibleCount, setVisibleCount] = useState(6);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar herramientas desde Supabase
  useEffect(() => {
    async function fetchTools() {
      try {
        const { data, error } = await supabase
          .from("tools")
          .select("*")
          .eq("is_approved", true)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data) {
          const formattedTools = data.map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            category: t.category,
            imageUrl: t.image_url,
            fileUrl: t.file_url,
            likes: t.likes,
            author: t.author,
            team: t.team,
          }));
          setTools(formattedTools);
        }
      } catch (err) {
        console.error("Error fetching tools:", err);
      } finally {
        setIsLoading(false);
      }

      const savedLikedIds = localStorage.getItem("vml-liked-ids");
      if (savedLikedIds) {
        setLikedIds(new Set(JSON.parse(savedLikedIds)));
      }
    }

    fetchTools();
  }, []);

  const handleLike = async (id: string) => {
    const alreadyLiked = likedIds.has(id);
    let newLikesCount = 0;

    setTools((prev) => {
      const updated = prev.map((t) => {
        if (t.id === id) {
          newLikesCount = alreadyLiked ? t.likes - 1 : t.likes + 1;
          return { ...t, likes: newLikesCount };
        }
        return t;
      });
      return updated;
    });

    setLikedIds((prev) => {
      const next = new Set(prev);
      if (alreadyLiked) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem("vml-liked-ids", JSON.stringify([...next]));
      return next;
    });

    // Save likes update to Supabase
    if (newLikesCount !== 0 || alreadyLiked) {
      // If we just unliked and count dropped to 0, it's valid
      try {
        await supabase.from("tools").update({ likes: newLikesCount }).eq("id", id);
      } catch (e) {
        console.error("Error updating likes in Supabase", e);
      }
    }
  };

  // Filtrar + ordenar por likes (más populares primero)
  const filteredTools = useMemo(() => {
    return tools
      .filter((t) => {
        const searchTerm = search.toLowerCase();
        const matchesSearch =
          t.name.toLowerCase().includes(searchTerm) ||
          t.description.toLowerCase().includes(searchTerm) ||
          (t.author && t.author.toLowerCase().includes(searchTerm)) ||
          (t.team && t.team.toLowerCase().includes(searchTerm));
        
        const matchesCategory =
          activeCategory === "all" || t.category === activeCategory;
        
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => b.likes - a.likes);
  }, [tools, search, activeCategory]);

  const visibleTools = filteredTools.slice(0, visibleCount);
  const hasMore = filteredTools.length > visibleCount;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className="text-gradient">VML Tools</h1>
        <p className={styles.subtitle}>
          Simplifica tu trabajo con estas herramientas y aporta tus tools al
          team.
        </p>
      </header>

      {/* Search & Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre, descripción o creador..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(6); // Reset count on search
            }}
          />
          {search && (
            <button
              className={styles.clearBtn}
              onClick={() => setSearch("")}
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        <div className={styles.categoryTabs}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`${styles.tab} ${
                activeCategory === cat.value ? styles.tabActive : ""
              }`}
              onClick={() => {
                setActiveCategory(cat.value);
                setVisibleCount(6);
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className={styles.resultsCount}>
        Mostrando {visibleTools.length} de {filteredTools.length}{" "}
        {filteredTools.length === 1 ? "herramienta" : "herramientas"}
      </p>

      <ToolGrid>
        {isLoading ? (
          // Skeleton Loader
          Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i}`} className={styles.skeletonCard} />
          ))
        ) : visibleTools.length > 0 ? (
          visibleTools.map((tool, index) => (
            <div 
              key={tool.id} 
              className={styles.fadeItem}
              style={{ '--index': index } as React.CSSProperties}
            >
              <ToolCard
                id={tool.id}
                name={tool.name}
                description={tool.description}
                category={tool.category}
                imageUrl={tool.imageUrl}
                fileUrl={tool.fileUrl}
                likes={tool.likes}
                liked={likedIds.has(tool.id)}
                onLike={handleLike}
                isTrending={tool.id === filteredTools[0]?.id && tool.likes > 0}
                author={tool.author}
                team={tool.team}
              />
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <h3>No se encontraron herramientas</h3>
            <p>Intenta con otros términos o cambia la categoría.</p>
          </div>
        )}
      </ToolGrid>

      {hasMore && (
        <div className={styles.loadMoreContainer}>
          <button 
            className={`${styles.loadMoreBtn} glass`}
            onClick={() => setVisibleCount(prev => prev + 6)}
          >
            Ver más herramientas
          </button>
        </div>
      )}

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <span className="accent-gradient">VML</span> Tools
          </div>
          <p>© {new Date().getFullYear()} VML Hub Interno. Todos los derechos reservados.</p>
          <p className={styles.creator}>
            Developed by <span className={styles.creatorName}>Leandro Benac</span> | Frontend Developer VML
          </p>
        </div>
      </footer>
    </div>
  );
}
