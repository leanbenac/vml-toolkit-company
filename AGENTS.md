# Reglas del Proyecto (AI Agent Rules)

Este archivo define el contexto y las reglas principales para cualquier Agente de IA (Claude, GitHub Copilot, Cursor, etc.) que asista en este proyecto.

## Contexto del Proyecto
* **Nombre:** VML Tools Hub
* **Propósito:** Plataforma interna para compartir scripts, web apps, docs y herramientas entre el equipo de VML.
* **Stack:** Next.js (App Router), React, TypeScript, Supabase (Database + Storage), Vanilla CSS (CSS Modules).

## Reglas de Arquitectura y Código
1. **Next.js App Router**: Todo el enrutamiento utiliza la carpeta `src/app`. No utilices el directorio `pages`.
2. **Componentes del Cliente vs Servidor**: Utiliza `"use client"` solo en componentes que requieran interactividad (hooks como `useState`, `useEffect`) o eventos del DOM (`onClick`). 
3. **Estilos**: El proyecto **NO** usa TailwindCSS. Todo el styling se hace con Vanilla CSS usando CSS Modules (`nombre.module.css`) y variables globales definidas en `src/app/globals.css`.
4. **Diseño (UI/UX)**: El diseño debe mantenerse Premium y "Glassmorphic". Tonos oscuros, bordes sutiles semi-transparentes (`rgba(255,255,255,0.1)`), fondos con blur (`backdrop-filter`) y gradientes acentuados. Las animaciones deben ser sutiles pero presentes.
5. **Base de Datos**: Las consultas a Supabase se hacen directamente desde el cliente para vistas interactivas, o desde Server Actions / Route Handlers si es crítico. 
6. **Estructura de Datos**: La tabla principal es `tools` y cuenta con un sistema de moderación (`is_approved` boolean) donde las herramientas nuevas entran en estado `false` hasta ser aprobadas en `/moderator`.

## Supabase
* Para importar el cliente: `import { supabase } from '@/lib/supabase';`
* Asegúrate de manejar correctamente los estados de carga (`isLoading`) y errores (`try/catch`) al hacer fetch a Supabase.
