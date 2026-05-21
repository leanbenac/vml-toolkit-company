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

  // Estados para modal de edición
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPin, setEditPin] = useState("");
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinError, setPinError] = useState("");
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [isNewPinNeeded, setIsNewPinNeeded] = useState(false);
  
  // Estado de formulario
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "AppWebs",
    author: "",
    team: "",
    fileUrl: "",
    imageUrl: "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [saveError, setSaveError] = useState("");

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

  const handleEditClick = (id: string) => {
    const tool = tools.find(t => t.id === id);
    if (!tool) return;
    setEditingTool(tool);
    setEditForm({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      author: tool.author,
      team: tool.team,
      fileUrl: tool.fileUrl,
      imageUrl: tool.imageUrl || "",
    });
    setEditPin("");
    setIsPinVerified(false);
    setPinError("");
    setSaveError("");
    setIsEditModalOpen(true);
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTool) return;
    setIsVerifyingPin(true);
    setPinError("");
    try {
      const res = await fetch("/api/tools/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingTool.id, pin: editPin }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsPinVerified(true);
        setIsNewPinNeeded(!!data.isNewPinNeeded);
      } else {
        setPinError(data.error || "Error al verificar el PIN");
      }
    } catch (err) {
      setPinError("Error de conexión con el servidor");
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTool) return;
    setIsSavingEdit(true);
    setSaveError("");
    try {
      const res = await fetch("/api/tools/edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTool.id,
          pin: editPin,
          name: editForm.name,
          description: editForm.description,
          category: editForm.category,
          author: editForm.author,
          team: editForm.team,
          file_url: editForm.fileUrl,
          image_url: editForm.imageUrl || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Actualizar localmente
        setTools((prev) =>
          prev.map((t) =>
            t.id === editingTool.id
              ? {
                  ...t,
                  name: editForm.name,
                  description: editForm.description,
                  category: editForm.category,
                  author: editForm.author,
                  team: editForm.team,
                  fileUrl: editForm.fileUrl,
                  imageUrl: editForm.imageUrl || undefined,
                }
              : t
          )
        );
        setIsEditModalOpen(false);
        setEditingTool(null);
      } else {
        setSaveError(data.error || "Error al guardar cambios");
      }
    } catch (err) {
      setSaveError("Error de conexión al guardar");
    } finally {
      setIsSavingEdit(false);
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
                onEdit={handleEditClick}
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

      {/* Modal de Edición Glassmorphic */}
      {isEditModalOpen && editingTool && (
        <div className={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Editar Tool</h2>
              <p className={styles.modalSubtitle}>{editingTool.name}</p>
            </div>

            {!isPinVerified ? (
              <form onSubmit={handleVerifyPin} className={styles.modalForm}>
                <div className={styles.modalField}>
                  <label htmlFor="modalPin">Introduce el PIN de edición para esta herramienta</label>
                  <input
                    id="modalPin"
                    type="password"
                    required
                    placeholder="PIN de edición"
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value)}
                    className={styles.modalInput}
                    autoFocus
                  />
                </div>
                {pinError && <p className={styles.modalError}>{pinError}</p>}
                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setIsEditModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.saveBtn} disabled={isVerifyingPin}>
                    {isVerifyingPin ? "Verificando..." : "Validar"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveEdit} className={styles.modalForm}>
                {isNewPinNeeded && (
                  <p style={{ color: '#c4b5fd', fontSize: '0.8rem', marginBottom: '0.5rem', backgroundColor: 'rgba(139, 92, 246, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    💡 Esta herramienta antigua no tiene un PIN. El PIN ingresado arriba se registrará como su nuevo PIN.
                  </p>
                )}

                <div className={styles.modalField}>
                  <label htmlFor="editName">Nombre de la Herramienta</label>
                  <input
                    id="editName"
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className={styles.modalInput}
                  />
                </div>

                <div className={styles.modalField}>
                  <label htmlFor="editDescription">Descripción</label>
                  <textarea
                    id="editDescription"
                    required
                    maxLength={200}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className={styles.modalTextarea}
                  />
                </div>

                <div className={styles.modalField}>
                  <label htmlFor="editCategory">Categoría</label>
                  <select
                    id="editCategory"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className={styles.modalSelect}
                  >
                    <option value="Extensiones">Extensiones Chrome</option>
                    <option value="AppWebs">AppWebs</option>
                    <option value="Scripts">Scripts</option>
                    <option value="Bots">Bots</option>
                    <option value="Docs">Docs</option>
                  </select>
                </div>

                <div className={styles.modalField}>
                  <label htmlFor="editAuthor">Autor</label>
                  <input
                    id="editAuthor"
                    type="text"
                    required
                    value={editForm.author}
                    onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                    className={styles.modalInput}
                  />
                </div>

                <div className={styles.modalField}>
                  <label htmlFor="editTeam">Equipo / Marca</label>
                  <input
                    id="editTeam"
                    type="text"
                    required
                    value={editForm.team}
                    onChange={(e) => setEditForm({ ...editForm, team: e.target.value })}
                    className={styles.modalInput}
                  />
                </div>

                <div className={styles.modalField}>
                  <label htmlFor="editFileUrl">URL del Archivo</label>
                  <input
                    id="editFileUrl"
                    type="text"
                    required
                    value={editForm.fileUrl}
                    onChange={(e) => setEditForm({ ...editForm, fileUrl: e.target.value })}
                    className={styles.modalInput}
                  />
                </div>

                <div className={styles.modalField}>
                  <label htmlFor="editImageUrl">URL de la Imagen (Opcional)</label>
                  <input
                    id="editImageUrl"
                    type="text"
                    value={editForm.imageUrl}
                    onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                    className={styles.modalInput}
                  />
                </div>

                {saveError && <p className={styles.modalError}>{saveError}</p>}

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setIsEditModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.saveBtn} disabled={isSavingEdit}>
                    {isSavingEdit ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
