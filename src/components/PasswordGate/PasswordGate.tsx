"use client";

import React, { useState, useEffect } from "react";
import styles from "./PasswordGate.module.css";

const GATE_KEY = "vml-tools-auth";

export const PasswordGate = ({ children }: { children: React.ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificar si ya se autenticó en esta sesión
  useEffect(() => {
    const saved = sessionStorage.getItem(GATE_KEY);
    if (saved === "true") {
      setAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      sessionStorage.setItem(GATE_KEY, "true");
      setAuthenticated(true);
    } else {
      setError(true);
      setPassword("");
    }
  };

  if (loading) {
    return (
      <div className={styles.gate}>
        <div className={styles.loader} />
      </div>
    );
  }

  if (authenticated) {
    return <>{children}</>;
  }

  return (
    <div className={styles.gate}>
      <div className={styles.glow} />
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.logoSection}>
          <h1 className={styles.logo}>
            <span className="accent-gradient">VML</span>
            <span className="text-gradient">Tools</span>
          </h1>
          <p className={styles.tagline}>Hub interno de herramientas</p>
        </div>

        <div className={styles.inputGroup}>
          <input
            type="password"
            placeholder="Contraseña de acceso"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            autoFocus
          />
          {error && (
            <p className={styles.errorMsg}>Contraseña incorrecta</p>
          )}
        </div>

        <button type="submit" className={styles.submitBtn}>
          Acceder
        </button>

        <p className={styles.hint}>
          Pedile la contraseña a tu team leader 🔑
          {process.env.NODE_ENV === "development" && (
            <span style={{ display: "block", marginTop: "8px", color: "rgba(255, 255, 255, 0.6)", fontSize: "0.8rem" }}>
              (Desarrollo local: podés usar <strong>vml2026</strong>)
            </span>
          )}
        </p>
      </form>
    </div>
  );
};
