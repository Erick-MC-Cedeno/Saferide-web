# Saferide-web

Este proyecto es una aplicación web para un servicio de transporte, construida con Next.js y una variedad de tecnologías modernas para ofrecer una experiencia de usuario fluida y robusta.

## Características

- **Autenticación de Usuarios:** Gestión de inicio de sesión y registro.
- **Paneles de Control:** Interfaces separadas para conductores y pasajeros.
- **Integración con Mapas:** Utiliza Google Maps para la visualización y seguimiento de rutas.
- **Comunicación en Tiempo Real:** Funcionalidades de chat y notificaciones de estado de viaje.
- **Componentes Reutilizables:** Desarrollado con una biblioteca de componentes UI para consistencia y eficiencia.

## Tecnologías Utilizadas

Aquí están las principales tecnologías y librerías utilizadas en este proyecto:

- **Next.js**
  [![Next.js](https://img.shields.io/badge/Next.js-Black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)

- **React**
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)

- **TypeScript**
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

- **Tailwind CSS**
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

- **Supabase**
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.io/)

- **Firebase**
  [![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

- **Radix UI**
  [![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=for-the-badge&logo=radix-ui&logoColor=white)](https://www.radix-ui.com/)

- **Google Maps JavaScript API Loader**
  [![Google Maps](https://img.shields.io/badge/Google_Maps-4285F4?style=for-the-badge&logo=google-maps&logoColor=white)](https://developers.google.com/maps/documentation/javascript/)

- **Zod**
  [![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)

- **React Hook Form**
  [![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white)](https://react-hook-form.com/)

- **Lucide React**
  [![Lucide React](https://img.shields.io/badge/Lucide_React-222222?style=for-the-badge&logo=lucide&logoColor=white)](https://lucide.dev/)

- **Sonner**
  [![Sonner](https://img.shields.io/badge/Sonner-FF5733?style=for-the-badge&logo=react&logoColor=white)](https://sonner.emilkowalski.no/)

- **Recharts**
  [![Recharts](https://img.shields.io/badge/Recharts-8884d8?style=for-the-badge&logo=recharts&logoColor=white)](https://recharts.org/en-US/)

## Instalación y Uso

Para configurar y ejecutar el proyecto localmente, sigue estos pasos:

1.  **Clona el repositorio:**
    ```bash
    git clone [URL_DEL_REPOSITORIO]
    cd Saferide-web
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    # o si usas pnpm
    pnpm install
    ```

3.  **Configura las variables de entorno:**
    Crea un archivo `.env.local` en la raíz del proyecto y añade tus variables de entorno (por ejemplo, claves de API de Supabase, Firebase, Google Maps).

4.  **Ejecuta la aplicación:**
    ```bash
    npm run dev
    # o si usas pnpm
    pnpm dev
    ```

    La aplicación estará disponible en `http://localhost:3000`.

## Estructura del Proyecto

. (raíz del proyecto)
├── app/                  # Rutas y páginas de Next.js
│   ├── api/              # Endpoints de API
│   ├── auth/             # Páginas de autenticación
│   ├── driver/           # Panel de control del conductor
│   ├── passenger/        # Panel de control del pasajero
│   └── layout.tsx        # Layout principal de la aplicación
├── components/           # Componentes UI reutilizables
│   └── ui/               # Componentes de Shadcn/ui (Radix UI + Tailwind CSS)
├── hooks/                # Hooks personalizados de React
├── lib/                  # Utilidades, configuraciones de Firebase/Supabase, contexto de autenticación
├── public/               # Archivos estáticos
├── styles/               # Estilos globales
└── ...otros archivos de configuración (package.json, next.config.mjs, tailwind.config.ts, etc.)


## Contribución

¡Las contribuciones son bienvenidas! Por favor, abre un 'issue' o envía un 'pull request' con tus mejoras.

## Licencia

Este proyecto está bajo la licencia [MIT](https://opensource.org/licenses/MIT). (O la licencia que corresponda)


## Screenshots

![root1](./utils/screenshots/root.png)  

# Settings  
![Settings](frontend/src/assets/screenshots/Settings.png)  

# Transactions  
![Transa](frontend/src/assets/screenshots/trans.png)  

# Transactions History  
![Transa](frontend/src/assets/screenshots/history.png)  

# Dashboard wallets  
![Wallet](frontend/src/assets/screenshots/wallet.png)  