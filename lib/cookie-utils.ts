/**
 * Utilidades para el manejo seguro de cookies en la aplicación
 */

// Determina si estamos en un entorno de producción
const isProduction = process.env.NODE_ENV === 'production';

// Opciones de seguridad para las cookies
const secureCookieOptions = {
  // HttpOnly evita acceso desde JavaScript del lado del cliente
  httpOnly: true,
  // Secure asegura que las cookies solo se envíen por HTTPS
  secure: isProduction,
  // SameSite ayuda a prevenir ataques CSRF
  sameSite: 'lax' as 'lax' | 'strict' | 'none',
  // Path establece la ruta para la cual la cookie es válida
  path: '/',
  // Tiempo de expiración estándar (24 horas)
  maxAge: 86400
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
export const removeSecureCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; ${isProduction ? 'Secure; ' : ''}SameSite=lax; HttpOnly`;
};

/**
 * Elimina todas las cookies relacionadas con la autenticación
 */
export const clearAuthCookies = () => {
  const authCookies = [
    'auth-token',
    'user-type',
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token'
  ];
  
  authCookies.forEach(cookieName => removeSecureCookie(cookieName));
};

/**
 * Limpia todos los datos de autenticación (cookies y localStorage)
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
      'supabase.auth.accessToken'
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