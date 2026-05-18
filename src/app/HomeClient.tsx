"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ToolGrid } from "@/components/ToolGrid/ToolGrid";
import { ToolCard } from "@/components/ToolCard/ToolCard";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
  fileUrl: string;
  likes: number;
  author: string;
  team: string;
}

const CATEGORIES = [
  { value: "all", label: "Todas" },
  { value: "Extensiones", label: "Extensiones Chrome" },
  { value: "AppWebs", label: "AppWebs" },
  { value: "Scripts", label: "Scripts" },
  { value: "Bots", label: "Bots" },
  { value: "Docs", label: "Docs" },
];

interface HomeClientProps {
  initialTools: Tool[];
}

export default function HomeClient({ initialTools }: HomeClientProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(6);

  // Sync tools when initialTools changes (for Server-Side updates)
  useEffect(() => {
    setTools(initialTools);
  }, [initialTools]);

  // Cargar likes locales desde localStorage
  useEffect(() => {
    const savedLikedIds = localStorage.getItem("vml-liked-ids");
    if (savedLikedIds) {
      setLikedIds(new Set(JSON.parse(savedLikedIds)));
    }
  }, []);

  const handleLike = async (id: string) => {
    const alreadyLiked = likedIds.has(id);
    
    // Buscar la herramienta en el estado actual para obtener el valor de likes real
    const currentTool = tools.find((t) => t.id === id);
    if (!currentTool) return;

    // Calcular el nuevo número de likes (clamped a 0 como mínimo para evitar números negativos)
    const newLikesCount = alreadyLiked 
      ? Math.max(0, currentTool.likes - 1) 
      : currentTool.likes + 1;

    // Actualizar el estado local de herramientas inmediatamente
    setTools((prev) =>
      prev.map((t) => (t.id === id ? { ...t, likes: newLikesCount } : t))
    );

    // Guardar el estado de likes en localstorage
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

    // Actualizar en Supabase de forma segura con el valor calculado
    try {
      await supabase.from("tools").update({ likes: newLikesCount }).eq("id", id);
    } catch (e) {
      console.error("Error updating likes in Supabase", e);
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
        {visibleTools.length > 0 ? (
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
