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
  docs_url?: string; // Nuevo campo para documentación (PDF/Link)
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
  const [prevInitialTools, setPrevInitialTools] = useState<Tool[]>(initialTools);
  const [visibleCount, setVisibleCount] = useState(6);

  // Sync tools when initialTools changes (for Server-Side updates)
  if (initialTools !== prevInitialTools) {
    setPrevInitialTools(initialTools);
    setTools(initialTools);
  }

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
    docsUrl: "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newToolFile, setNewToolFile] = useState<File | null>(null);
  const [newDocsFile, setNewDocsFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<string | null>(null);


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
      docsUrl: tool.docs_url || "",
    });
    setNewImageFile(null);
    setNewToolFile(null);
    setNewDocsFile(null);
    setEditPin("");
    setIsPinVerified(false);
    setPinError("");
    setSaveError("");
    setIsEditModalOpen(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, type: "image" | "tool" | "docs") => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (type === "image") setNewImageFile(files[0]);
      else if (type === "tool") setNewToolFile(files[0]);
      else if (type === "docs") setNewDocsFile(files[0]);
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
      let finalDocsUrl = editForm.docsUrl || null;

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

      // Subir docs si se seleccionó uno nuevo
      if (newDocsFile) {
        const docsName = `${Date.now()}-docs_${newDocsFile.name}`;
        const { error: docsError } = await supabase.storage
          .from('tools')
          .upload(`docs/${docsName}`, newDocsFile);
          
        if (docsError) throw docsError;
        
        const { data: docsUrlData } = supabase.storage
          .from('tools')
          .getPublicUrl(`docs/${docsName}`);
        
        finalDocsUrl = docsUrlData.publicUrl;
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
          docs_url: finalDocsUrl,
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
                  docs_url: finalDocsUrl || undefined,
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
      console.error("Error al editar la herramienta:", err);
      setSaveError(err instanceof Error ? err.message : "Error de conexión al guardar");
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
        <h1 className="accent-gradient">VML Tools</h1>
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
                docsUrl={tool.docs_url}
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
            Developed by <span className={styles.creatorName}>Automation Squad</span> | VML
          </p>
          <p className={styles.copyright}>© {new Date().getFullYear()} VML Hub Interno. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Modal de Edición Glassmorphic */}
      {isEditModalOpen && editingTool && (
        <div className={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Editar Tool</h2>
              <button 
                type="button"
                className={styles.modalCloseBtn} 
                onClick={() => setIsEditModalOpen(false)}
                aria-label="Cerrar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
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
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Imagen / Icono</label>
                    <div 
                      className={`${styles.uploadBox} ${dragActive === 'image' ? styles.dragActive : ''}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'image')}
                      style={{ position: 'relative', overflow: 'hidden' }}
                    >
                      {newImageFile ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={URL.createObjectURL(newImageFile)} 
                          alt="Preview" 
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
                        />
                      ) : editForm.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={editForm.imageUrl} 
                          alt="Preview" 
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 1 }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#a855f7' }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                          <span style={{ fontWeight: 600 }}>Imagen</span>
                          <p style={{ marginBottom: 0, fontSize: '0.85rem' }}>Arrastra o selecciona</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className={styles.fileInput} 
                        onChange={(e) => e.target.files && setNewImageFile(e.target.files[0])}
                        onDragEnter={() => setDragActive('image')}
                        onDragLeave={() => setDragActive(null)}
                        onDrop={() => setDragActive(null)}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, zIndex: 2, cursor: 'pointer' }}
                      />
                    </div>
                    <p className={styles.uploadHelper}>Proporción 16:9 o icono cuadrado.</p>
                  </div>
                  
                  <div className={styles.uploadGroup}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Archivo Tool</label>
                    <div 
                      className={`${styles.uploadBox} ${dragActive === 'tool' ? styles.dragActive : ''}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'tool')}
                      style={{ position: 'relative' }}
                    >
                      {newToolFile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}>
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                          <p style={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', padding: '0 4px', margin: 0 }}>{newToolFile.name}</p>
                          <p style={{ fontSize: '0.65rem', margin: 0 }}>Clic para cambiar</p>
                        </div>
                      ) : editForm.fileUrl ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6' }}>
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                          </svg>
                          <p style={{ color: '#cbd5e1', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', padding: '0 4px', margin: 0 }}>
                            {editForm.fileUrl.split('/').pop()?.split('?')[0] || 'Archivo actual'}
                          </p>
                          <p style={{ fontSize: '0.65rem', margin: 0 }}>Clic para reemplazar</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6' }}>
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                          </svg>
                          <span style={{ fontWeight: 600 }}>Archivo</span>
                          <p style={{ margin: 0, fontSize: '0.85rem' }}>Arrastra o selecciona</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        className={styles.fileInput} 
                        onChange={(e) => e.target.files && setNewToolFile(e.target.files[0])}
                        onDragEnter={() => setDragActive('tool')}
                        onDragLeave={() => setDragActive(null)}
                        onDrop={() => setDragActive(null)}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, zIndex: 2, cursor: 'pointer' }}
                      />
                    </div>
                    <p className={styles.uploadHelper}>Scripts (JS, PY), PDF, ZIP o instaladores.</p>
                  </div>
                  
                  <div className={styles.uploadGroup}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Docs (Opcional)</label>
                    <div 
                      className={`${styles.uploadBox} ${dragActive === 'docs' ? styles.dragActive : ''}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'docs')}
                      style={{ position: 'relative' }}
                    >
                      {newDocsFile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f59e0b' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                          <p style={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', padding: '0 4px', margin: 0 }}>{newDocsFile.name}</p>
                          <p style={{ fontSize: '0.65rem', margin: 0 }}>Clic para cambiar</p>
                        </div>
                      ) : editForm.docsUrl ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f59e0b' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                          <p style={{ color: '#cbd5e1', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', padding: '0 4px', margin: 0 }}>
                            Docs actual
                          </p>
                          <p style={{ fontSize: '0.65rem', margin: 0 }}>Clic para reemplazar</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f59e0b' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                          <span style={{ fontWeight: 600 }}>Docs</span>
                          <p style={{ margin: 0, fontSize: '0.85rem' }}>Opcional</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept=".pdf,.md,.txt"
                        className={styles.fileInput} 
                        onChange={(e) => e.target.files && setNewDocsFile(e.target.files[0])}
                        onDragEnter={() => setDragActive('docs')}
                        onDragLeave={() => setDragActive(null)}
                        onDrop={() => setDragActive(null)}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, zIndex: 2, cursor: 'pointer' }}
                      />
                    </div>
                    <p className={styles.uploadHelper}>PDF o Markdown.</p>
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
