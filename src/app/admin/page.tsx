"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './admin.module.css';

const CATEGORIES = [
  { value: "Extensiones", label: "Extensiones" },
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
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [toolFile, setToolFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
        }
      ]);

      if (error) throw error;

      alert(`¡Genial ${formData.author}! La herramienta se guardó correctamente.`);
      window.location.href = '/'; // Forzar recarga completa para traer los datos frescos
    } catch (err) {
      console.error("Error inserting tool:", err);
      alert("Hubo un error al guardar la herramienta. Revisa la consola o asegúrate de haber creado el bucket 'tools' en Supabase.");
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

      <form className={`${styles.form} ${styles.formNoHover} card-glass`} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="author">Creador de la herramienta</label>
          <input 
            id="author"
            type="text" 
            placeholder="Ej: Leandro Benac"
            value={formData.author}
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
            value={formData.team}
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
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            className="glass"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="description">Descripción Breve</label>
          <textarea 
            id="description"
            placeholder="Explica qué hace y cómo ayuda al equipo..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
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

        <div className={styles.uploadGrid}>
          <div 
            className={styles.uploadBox}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'image')}
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            {imageFile && (
              <img 
                src={URL.createObjectURL(imageFile)} 
                alt="Preview" 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3, zIndex: 0 }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>🖼️ Imagen o Icono</span>
            <input 
              type="file" 
              accept="image/*" 
              className={styles.fileInput} 
              onChange={(e) => e.target.files && setImageFile(e.target.files[0])}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, zIndex: 2, cursor: 'pointer' }}
            />
            <p style={{ position: 'relative', zIndex: 1 }}>
              {imageFile ? imageFile.name : "Arrastra o selecciona previsualización"}
            </p>
          </div>
          <div 
            className={styles.uploadBox}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'tool')}
          >
            <span>📁 Archivo de la Tool</span>
            <input 
              type="file" 
              className={styles.fileInput} 
              onChange={(e) => e.target.files && setToolFile(e.target.files[0])}
            />
            <p>{toolFile ? toolFile.name : "Arrastra o selecciona el archivo (Script, PDF, ZIP)"}</p>
          </div>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={isUploading}>
          {isUploading ? 'Subiendo archivos...' : 'Publicar Herramienta'}
        </button>
      </form>
    </div>
  );
}
