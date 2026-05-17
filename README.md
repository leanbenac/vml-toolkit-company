# VML Tools Hub 🚀

VML Tools Hub es un repositorio interno y plataforma dinámica diseñada para que el equipo de VML comparta, descubre y gestione herramientas, scripts, extensiones y recursos útiles para su día a día.

## 🌟 Características Principales

* **Galería Interactiva**: Visualiza todas las herramientas disponibles, con filtros por categoría y búsqueda en tiempo real.
* **Sistema de Likes**: Guarda tus herramientas favoritas para saber cuáles son las más populares en el equipo.
* **Subida de Aportes**: Cualquier miembro puede subir una herramienta (imagen y archivo) desde el panel `/admin`.
* **Moderación Segura**: Las herramientas subidas quedan pendientes de revisión. Un moderador puede aprobarlas o rechazarlas desde el panel oculto `/moderator`.
* **Almacenamiento Cloud**: Integración completa con Supabase Database y Storage.
* **Diseño Premium**: Interfaz moderna, "glassmorphism" y animaciones fluidas utilizando Next.js App Router y CSS Modules.

## 🛠️ Tecnologías Utilizadas

* **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
* **Estilos**: Vanilla CSS con CSS Modules (`.module.css`) + variables CSS globales.
* **Backend as a Service**: [Supabase](https://supabase.com/) (PostgreSQL + Storage).
* **Despliegue**: Optimizado para [Vercel](https://vercel.com).

## 🚀 Inicio Rápido (Desarrollo Local)

1. **Clonar e instalar dependencias:**
   ```bash
   git clone <tu-repo>
   cd vml-toolkit-company
   npm install
   ```

2. **Configurar Variables de Entorno:**
   Crea un archivo `.env.local` en la raíz del proyecto basándote en la configuración de Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
   GATE_PASSWORD=contraseña_general_para_subir (opcional)
   MOD_PASSWORD=contraseña_de_moderador (opcional)
   ```

3. **Correr el servidor:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.



## 🔒 Rutas Especiales

* `/admin`: Formulario para subir nuevas herramientas al hub.
* `/moderator`: Panel protegido para aprobar o eliminar las herramientas enviadas.
