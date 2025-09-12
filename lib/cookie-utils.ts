/**
 * Utilidades para el manejo seguro de cookies en la aplicación
 */

// Determina si estamos en un entorno de producción
const isProduction = process.env.NODE_ENV === 'production';

// Opciones de seguridad para las cookies
const secureCookieOptions = {
  // HttpOnly evita acceso desde JavaScript del lado del cliente
  // Establecido a false para permitir que el middleware acceda a las cookies
  httpOnly: false,
  // Secure asegura que las cookies solo se envíen por HTTPS
  secure: isProduction,
  // SameSite ayuda a prevenir ataques CSRF
  sameSite: 'lax' as 'lax' | 'strict' | 'none',
  // Path establece la ruta para la cual la cookie es válida
  path: '/',
  // Tiempo de expiración estándar (7 días para mayor persistencia)
  maxAge: 7 * 24 * 60 * 60
};

/**
 * Establece una cookie con configuraciones seguras
 * @param name Nombre de la cookie
 * @param value Valor de la cookie
 * @param options Opciones adicionales para sobrescribir las predeterminadas
 */
export const setSecureCookie = (name: string, value: string, options: Partial<typeof secureCookieOptions> = {}) => {
  if (typeof document === 'undefined') return;
  
  const cookieOptions = { ...secureCookieOptions, ...options };
  
  let cookieString = `${name}=${encodeURIComponent(value)}`;
  
  if (cookieOptions.httpOnly) cookieString += '; HttpOnly';
  if (cookieOptions.secure) cookieString += '; Secure';
  if (cookieOptions.sameSite) cookieString += `; SameSite=${cookieOptions.sameSite}`;
  if (cookieOptions.path) cookieString += `; Path=${cookieOptions.path}`;
  if (cookieOptions.maxAge) cookieString += `; Max-Age=${cookieOptions.maxAge}`;
  
  document.cookie = cookieString;
};

/**
 * Elimina una cookie de forma segura
 * @param name Nombre de la cookie a eliminar
 */
export const removeSecureCookie = (name: string, options?: { path?: string; domain?: string }) => {
  if (typeof document === 'undefined') return;
  const path = options?.path ?? '/'
  const domain = options?.domain
  const base = `${name}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:01 GMT; ${isProduction ? 'Secure; ' : ''}SameSite=Lax`
  // Sin domain
  document.cookie = base
  // Con domain explícito si se provee
  if (domain) {
    document.cookie = `${base}; Domain=${domain}`
  }
};

/**
 * Elimina todas las cookies relacionadas con la autenticación
 * excepto la cookie auth-in-progress que se mantiene para permitir el acceso a la página de login
 */
export const clearAuthCookies = () => {
  const authCookies = [
    'auth-token',
    'user-type',
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token'
  ];
  
  // Paths comunes donde podrían haberse creado cookies en versiones anteriores
  const paths = ['/', '/auth', '/driver', '/driver/dashboard', '/passenger', '/passenger/dashboard']
  const hostnames: (string | undefined)[] = [
    undefined,
    (typeof window !== 'undefined' ? window.location.hostname : undefined),
    'localhost',
    '127.0.0.1'
  ]
  
  authCookies.forEach(cookieName => {
    // Borrar en el path raíz primero (con y sin domain)
    hostnames.forEach(domain => removeSecureCookie(cookieName, { path: '/', domain }))
    // Borrar en paths adicionales por compatibilidad
    paths.forEach(p => hostnames.forEach(domain => removeSecureCookie(cookieName, { path: p, domain })))
  })
  
  // Eliminar explícitamente la cookie de progreso con su Path específico y otros paths por compatibilidad
  const progressPaths = ['/auth', '/', '/driver', '/passenger']
  progressPaths.forEach(p => hostnames.forEach(domain => removeSecureCookie('auth-in-progress', { path: p, domain })))
};

/**
 * Establece una cookie temporal para indicar que hay un proceso de autenticación en curso
 * Esto ayuda al middleware a evitar redirecciones en bucle durante el proceso de login
 * y permite el acceso a la página de login después de cerrar sesión
 */
export const setAuthInProgressCookie = () => {
  if (typeof document === 'undefined') return;
  
  // Establecer una cookie de duración suficiente (60 segundos) para el proceso de autenticación
  // Esto da tiempo suficiente para completar el proceso de login o para acceder a la página de login después de cerrar sesión
  // y para manejar correctamente las redirecciones en los dashboards de conductor y pasajero
  document.cookie = "auth-in-progress=true; Path=/auth; Max-Age=60; SameSite=Lax";
};

/**
 * Limpia todos los datos de autenticación (cookies y localStorage)
 * Mantiene la cookie auth-in-progress para permitir el acceso a la página de login
 */
export const clearAuthData = () => {
  // Limpiar cookies
  clearAuthCookies();
  
  // Limpiar localStorage
  if (typeof window !== 'undefined') {
    // Eliminar elementos específicos
    const authItems = [
      'supabase.auth.token',
      'supabase.auth.refreshToken',
      'supabase.auth.accessToken',
      'supabase-auth-token'
    ];
    
    authItems.forEach(item => localStorage.removeItem(item));
    
    // Buscar y eliminar cualquier otro item relacionado con auth
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });
  }
};