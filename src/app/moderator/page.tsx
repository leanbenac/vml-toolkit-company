"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './moderator.module.css';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  author: string;
  team: string;
  created_at: string;
  file_url: string;
  image_url: string;
}

export default function ModeratorPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');

  const [pendingTools, setPendingTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingTools();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    try {
      const res = await fetch('/api/mod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        setError('Contraseña incorrecta');
      }
    } catch (err) {
      setError('Error al conectar');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchPendingTools = async () => {
    setIsLoading(true);
    try {
      // is_approved puede ser false o nulo si lo acaban de crear
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .is('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingTools(data || []);
    } catch (err) {
      console.error("Error fetching pending tools:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tools')
        .update({ is_approved: true })
        .eq('id', id);

      if (error) throw error;
      
      // Quitar de la lista
      setPendingTools(prev => prev.filter(t => t.id !== id));
      alert("¡Herramienta aprobada y publicada!");
    } catch (err) {
      console.error("Error approving tool:", err);
      alert("Error al aprobar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta herramienta? Esta acción no se puede deshacer.")) return;

    try {
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Quitar de la lista
      setPendingTools(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Error deleting tool:", err);
      alert("Error al eliminar");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/" className={styles.backLink}>← Volver a Inicio</Link>
          <h1 className="text-gradient">Acceso a Moderación</h1>
          <p className={styles.subtitle}>Solo personal autorizado</p>
        </div>

        <form onSubmit={handleLogin} className={`${styles.loginForm} card-glass`}>
          <div className={styles.field}>
            <label htmlFor="password">Contraseña de Moderador</label>
            <input 
              id="password"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa la contraseña"
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.submitBtn} disabled={isLoggingIn}>
            {isLoggingIn ? 'Verificando...' : 'Entrar'}
          </button>
          {process.env.NODE_ENV === "development" && (
            <p style={{ marginTop: "12px", color: "rgba(255, 255, 255, 0.5)", fontSize: "0.8rem", textAlign: "center" }}>
              (Desarrollo local: podés usar <strong>mod</strong>)
            </p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>← Volver a Inicio</Link>
        <h1 className="text-gradient">Panel de Moderación</h1>
        <p className={styles.subtitle}>Aprueba o rechaza las herramientas enviadas por el equipo</p>
      </div>

      <div className={styles.dashboard}>
        {isLoading ? (
          <p style={{textAlign: 'center'}}>Cargando herramientas pendientes...</p>
        ) : pendingTools.length > 0 ? (
          pendingTools.map(tool => (
            <div key={tool.id} className={styles.toolCard}>
              <div className={styles.toolInfo}>
                <h3 className={styles.toolTitle}>{tool.name}</h3>
                <p className={styles.toolMeta}>
                  Subido por <strong>{tool.author}</strong> ({tool.team}) • Categoría: {tool.category}
                </p>
                <p className={styles.toolDesc}>{tool.description}</p>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem' }}>
                  {tool.file_url && tool.file_url !== "#" && (
                    <a href={tool.file_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
                      📥 Bajar Archivo
                    </a>
                  )}
                  {tool.image_url && (
                    <a href={tool.image_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
                      🖼️ Ver Imagen
                    </a>
                  )}
                </div>
              </div>
              <div className={styles.toolActions}>
                <button 
                  className={styles.approveBtn}
                  onClick={() => handleApprove(tool.id)}
                >
                  ✓ Aprobar
                </button>
                <button 
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(tool.id)}
                >
                  ✕ Eliminar
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <h2>¡Todo al día!</h2>
            <p>No hay herramientas pendientes de aprobación en este momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
