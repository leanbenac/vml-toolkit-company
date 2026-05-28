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
  downloads: number;
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
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newToolFile, setNewToolFile] = useState<File | null>(null);

  // Sync tools when initialTools changes (for Server-Side updates)
  useEffect(() => {
    setTools(initialTools);
  }, [initialTools]);

  const handleDownload = async (id: string, fileUrl: string) => {
    // 1. Abrir el archivo en otra pestaña para descargar
    window.open(fileUrl, '_blank');

    // 2. Actualizar localmente el contador
    const currentTool = tools.find((t) => t.id === id);
    if (!currentTool) return;
    
    const newDownloadsCount = (currentTool.downloads || 0) + 1;
    setTools((prev) =>
      prev.map((t) => (t.id === id ? { ...t, downloads: newDownloadsCount } : t))
    );

    // 3. Actualizar en Supabase
    try {
      await supabase.from("tools").update({ downloads: newDownloadsCount }).eq("id", id);
    } catch (e) {
      console.error("Error updating downloads in Supabase", e);
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
    setNewImageFile(null);
    setNewToolFile(null);
    setEditPin("");
    setIsPinVerified(false);
    setPinError("");
    setSaveError("");
    setIsEditModalOpen(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, type: "image" | "tool") => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (type === "image") setNewImageFile(files[0]);
      else setNewToolFile(files[0]);
    }
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
      let finalImageUrl = editForm.imageUrl || null;
      let finalFileUrl = editForm.fileUrl;

      // Subir imagen si se seleccionó una nueva
      if (newImageFile) {
        const imageExt = newImageFile.name.split('.').pop();
        const imageName = `${Date.now()}-img.${imageExt}`;
        const { error: imgError } = await supabase.storage
          .from('tools')
          .upload(`images/${imageName}`, newImageFile);
          
        if (imgError) throw imgError;
        
        const { data: imgUrlData } = supabase.storage
          .from('tools')
          .getPublicUrl(`images/${imageName}`);
        
        finalImageUrl = imgUrlData.publicUrl;
      }

      // Subir archivo si se seleccionó uno nuevo
      if (newToolFile) {
        // Usamos una subcarpeta con el timestamp para evitar colisiones
        // y mantenemos el nombre original intacto para descargas limpias.
        const fileName = `${Date.now()}/${newToolFile.name}`;
        const { error: fileError } = await supabase.storage
          .from('tools')
          .upload(`files/${fileName}`, newToolFile);
          
        if (fileError) throw fileError;
        
        const { data: fileUrlData } = supabase.storage
          .from('tools')
          .getPublicUrl(`files/${fileName}`);
        
        finalFileUrl = fileUrlData.publicUrl;
      }

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
          file_url: finalFileUrl,
          image_url: finalImageUrl,
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
                  fileUrl: finalFileUrl,
                  imageUrl: finalImageUrl || undefined,
                }
              : t
          )
        );
        setIsEditModalOpen(false);
        setEditingTool(null);
      } else {
        setSaveError(data.error || "Error al guardar cambios");
      }
    } catch (err: any) {
      console.error("Error al editar la herramienta:", err);
      setSaveError(err.message || "Error de conexión al guardar");
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
      .sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
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
                downloads={tool.downloads}
                onDownload={handleDownload}
                onEdit={handleEditClick}
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
          <p className={styles.creator}>
            Developed by <span className={styles.creatorName}>Leandro Benac</span> | Frontend Developer VML
          </p>
          <p>© {new Date().getFullYear()} VML Hub Interno. Todos los derechos reservados.</p>
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

                <div className={styles.uploadGrid}>
                  <div className={styles.uploadGroup}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>Imagen o Icono (Opcional)</label>
                    <div 
                      className={styles.uploadBox}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'image')}
                      style={{ position: 'relative', overflow: 'hidden' }}
                    >
                      {newImageFile ? (
                        <img 
                          src={URL.createObjectURL(newImageFile)} 
                          alt="Preview" 
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
                        />
                      ) : editForm.imageUrl ? (
                        <img 
                          src={editForm.imageUrl} 
                          alt="Preview" 
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
                        />
                      ) : (
                        <>
                          <span style={{ position: 'relative', zIndex: 1 }}>🖼️ Imagen</span>
                          <p style={{ position: 'relative', zIndex: 1, marginBottom: 0 }}>Arrastra o selecciona</p>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className={styles.fileInput} 
                        onChange={(e) => e.target.files && setNewImageFile(e.target.files[0])}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, zIndex: 2, cursor: 'pointer' }}
                      />
                    </div>
                    <p className={styles.uploadHelper}>Proporción 16:9 o icono cuadrado.</p>
                  </div>
                  
                  <div className={styles.uploadGroup}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>Archivo de la Tool</label>
                    <div 
                      className={styles.uploadBox}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'tool')}
                      style={{ position: 'relative' }}
                    >
                      {newToolFile ? (
                        <>
                          <span style={{ fontSize: '1.8rem' }}>✅</span>
                          <p style={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', padding: '0 4px' }}>{newToolFile.name}</p>
                          <p style={{ fontSize: '0.65rem', marginTop: '-0.25rem' }}>Clic para cambiar</p>
                        </>
                      ) : editForm.fileUrl ? (
                        <>
                          <span style={{ fontSize: '1.5rem' }}>📁</span>
                          <p style={{ color: '#cbd5e1', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', padding: '0 4px' }}>
                            {editForm.fileUrl.split('/').pop()?.split('?')[0] || 'Archivo actual'}
                          </p>
                          <p style={{ fontSize: '0.65rem', marginTop: '-0.25rem' }}>Clic para reemplazar</p>
                        </>
                      ) : (
                        <>
                          <span>📁 Archivo</span>
                          <p>Arrastra o selecciona</p>
                        </>
                      )}
                      <input 
                        type="file" 
                        className={styles.fileInput} 
                        onChange={(e) => e.target.files && setNewToolFile(e.target.files[0])}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, zIndex: 2, cursor: 'pointer' }}
                      />
                    </div>
                    <p className={styles.uploadHelper}>Scripts (JS, PY), PDF, ZIP o instaladores.</p>
                  </div>
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
