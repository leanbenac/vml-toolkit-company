"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './admin.module.css';

const CATEGORIES = [
  { value: "Extensiones", label: "Extensiones Chrome" },
  { value: "AppWebs", label: "AppWebs" },
  { value: "Scripts", label: "Scripts" },
  { value: "Bots", label: "Bots" },
  { value: "Docs", label: "Docs" },
];

export default function AdminPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'AppWebs',
    author: '',
    team: '',
    editPin: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [toolFile, setToolFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, type: 'image' | 'tool') => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (type === 'image') setImageFile(files[0]);
      else setToolFile(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setErrorMsg('');
    
    try {
      let finalImageUrl = null;
      let finalFileUrl = "#";

      // Subir imagen si existe
      if (imageFile) {
        const imageExt = imageFile.name.split('.').pop();
        const imageName = `${Date.now()}-img.${imageExt}`;
        const { error: imgError } = await supabase.storage
          .from('tools')
          .upload(`images/${imageName}`, imageFile);
          
        if (imgError) throw imgError;
        
        const { data: imgUrlData } = supabase.storage
          .from('tools')
          .getPublicUrl(`images/${imageName}`);
        
        finalImageUrl = imgUrlData.publicUrl;
      }

      // Subir archivo si existe
      if (toolFile) {
        const fileExt = toolFile.name.split('.').pop();
        const fileName = `${Date.now()}-file.${fileExt}`;
        const { error: fileError } = await supabase.storage
          .from('tools')
          .upload(`files/${fileName}`, toolFile);
          
        if (fileError) throw fileError;
        
        const { data: fileUrlData } = supabase.storage
          .from('tools')
          .getPublicUrl(`files/${fileName}`);
        
        finalFileUrl = fileUrlData.publicUrl;
      }

      // Inserción real en Supabase
      const { error } = await supabase.from('tools').insert([
        {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          author: formData.author,
          team: formData.team,
          file_url: finalFileUrl,
          image_url: finalImageUrl, 
          // DESCOMENTAR PARA ACTIVAR LA MODERACIÓN (Si se omite, en Supabase el default es false)
          // is_approved: false, 
          is_approved: true, // Auto-aprobar para adopción rápida (Quitar esto cuando se active el moderador)
          edit_pin: formData.editPin || null,
        }
      ]);

      if (error) throw error;

      // En lugar de un alert feo, mostramos el estado de éxito premium
      setIsSuccess(true);
      // No redirigimos automáticamente, dejamos que el usuario vea el éxito y presione el botón
    } catch (err) {
      console.error("Error al subir herramienta:", err);
      setErrorMsg("Ocurrió un error de conexión al subir los archivos. Por favor, intenta de nuevo más tarde.");
    } finally {
      setIsUploading(false);
    }
  };

  const selectedCategoryLabel = CATEGORIES.find(c => c.value === formData.category)?.label;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>← Volver a Galería</Link>
        <h1 className="text-gradient">Aportar Nueva Tool</h1>
        <p className={styles.subtitle}>Sube tus scripts o herramientas para que todo el equipo de VML pueda aprovecharlos.</p>
      </div>

      {isSuccess ? (
        <div className={`${styles.successState} card-glass`}>
          <div className={styles.successIcon}>✨</div>
          <h2 className="text-gradient">¡Aporte Recibido!</h2>
          <p>
            Gracias <strong>{formData.author}</strong>. Tu herramienta se subió correctamente y ya 
            está disponible en la galería para todo el equipo.
          </p>
          {/* MODO MODERADOR (Descomentar en el futuro):
          <p>
            Gracias <strong>{formData.author}</strong>. Tu herramienta se envió correctamente y está 
            pendiente de revisión por un moderador.
          </p>
          */}
          <button 
            className={styles.submitBtn} 
            onClick={() => router.push('/')}
            style={{ marginTop: '2rem' }}
          >
            Volver a la Galería
          </button>
        </div>
      ) : (
        <form className={`${styles.form} ${styles.formNoHover} card-glass`} onSubmit={handleSubmit}>
          
          {errorMsg && (
            <div style={{ backgroundColor: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)', color: '#ff6b6b', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

        <div className={styles.field}>
          <label htmlFor="author">Creador de la herramienta</label>
          <input 
            id="author"
            type="text" 
            placeholder="Ej: Leandro Benac"
            value={formData.author || ''}
            onChange={(e) => setFormData({...formData, author: e.target.value})}
            required
            className="glass"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="team">Equipo / Marca</label>
          <input 
            id="team"
            type="text" 
            placeholder="Ej: Ford, Colgate, Internal"
            value={formData.team || ''}
            onChange={(e) => setFormData({...formData, team: e.target.value})}
            required
            className="glass"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="name">Nombre de la Herramienta</label>
          <input 
            id="name"
            type="text" 
            placeholder="Ej: Optimizador de Imágenes"
            value={formData.name || ''}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            className="glass"
          />
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label htmlFor="description">Descripción Breve</label>
            <span className={`${styles.charCounter} ${(formData.description || '').length >= 180 ? styles.charCounterWarning : ''}`}>
              {(formData.description || '').length} / 200
            </span>
          </div>
          <textarea 
            id="description"
            placeholder="Explica qué hace y cómo ayuda al equipo..."
            value={formData.description || ''}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
            maxLength={200}
            className="glass"
          />
        </div>

        <div className={styles.field}>
          <label>Categoría</label>
          <div className={styles.customSelectContainer} ref={dropdownRef}>
            <div 
              className={`${styles.customSelectTrigger} glass ${isOpen ? styles.triggerActive : ''}`}
              onClick={() => setIsOpen(!isOpen)}
            >
              <span>{selectedCategoryLabel}</span>
              <span className={`${styles.customArrow} ${isOpen ? styles.arrowRotate : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </span>
            </div>
            
            {isOpen && (
              <div className={`${styles.customOptions} glass`}>
                {CATEGORIES.map((cat) => (
                  <div 
                    key={cat.value}
                    className={`${styles.customOption} ${formData.category === cat.value ? styles.optionSelected : ''}`}
                    onClick={() => {
                      setFormData({...formData, category: cat.value});
                      setIsOpen(false);
                    }}
                  >
                    {cat.label}
                    {formData.category === cat.value && <span className={styles.checkIcon}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="editPin">PIN de Edición (Opcional - clave para poder modificar la herramienta después)</label>
          <input 
            id="editPin"
            type="password" 
            placeholder="Ej: 1234"
            maxLength={10}
            value={formData.editPin || ''}
            onChange={(e) => setFormData({...formData, editPin: e.target.value})}
            className="glass"
          />
        </div>

        <div className={styles.uploadGrid}>
          <div className={styles.uploadGroup}>
            <div 
              className={styles.uploadBox}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'image')}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              {imageFile && typeof window !== 'undefined' ? (
                <img 
                  src={URL.createObjectURL(imageFile)} 
                  alt="Preview" 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
                />
              ) : (
                <>
                  <span style={{ position: 'relative', zIndex: 1 }}>🖼️ Imagen o Icono</span>
                  <p style={{ position: 'relative', zIndex: 1, marginBottom: 0 }}>Arrastra o selecciona previsualización</p>
                </>
              )}
              <input 
                type="file" 
                accept="image/*" 
                className={styles.fileInput} 
                onChange={(e) => e.target.files && setImageFile(e.target.files[0])}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, zIndex: 2, cursor: 'pointer' }}
              />
            </div>
            <p className={styles.uploadHelper}>
              Recomendado: Proporción 16:9 (800x450px) o icono cuadrado.
            </p>
          </div>
          
          <div className={styles.uploadGroup}>
            <div 
              className={styles.uploadBox}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'tool')}
              style={{ position: 'relative' }}
            >
              {toolFile ? (
                <>
                  <span style={{ fontSize: '2.5rem' }}>✅</span>
                  <p style={{ color: 'white', fontWeight: 'bold' }}>{toolFile.name}</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '-0.5rem' }}>Clic para cambiar</p>
                </>
              ) : (
                <>
                  <span>📁 Archivo de la Tool</span>
                  <p>Arrastra o selecciona el archivo</p>
                </>
              )}
              <input 
                type="file" 
                className={styles.fileInput} 
                onChange={(e) => e.target.files && setToolFile(e.target.files[0])}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, zIndex: 2, cursor: 'pointer' }}
              />
            </div>
            <p className={styles.uploadHelper}>
              Formatos admitidos: Script (JS, PY), PDF, ZIP o instaladores.
            </p>
          </div>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={isUploading}>
          {isUploading ? 'Subiendo archivos...' : 'Publicar Herramienta'}
        </button>
      </form>
      )}
    </div>
  );
}
