'use client'

import React from 'react'

export function PWARegister() {
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      const host = window.location.hostname;
      const isLocalhost = host === 'localhost' || host === '127.0.0.1';
      const isSecure = window.location.protocol === 'https:' || isLocalhost;

      if (!isSecure) {
        // running on insecure origin; skip service worker registration
        return;
      }
      const register = async () => {
        try {
          // Preflight fetch to ensure /sw.js is reachable
          const resp = await fetch('/sw.js', { cache: 'no-store' });
          if (!resp.ok) {
            console.error('PWARegister: /sw.js not accessible (status ' + resp.status + '). Service worker will not be registered.');
            return;
          }

          const reg = await navigator.serviceWorker.register('/sw.js');

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update available — implement UI prompt if desired
                }
              });
            }
          });

          // Optional: listen for controllerchange to reload when the new SW takes control
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
          });

        } catch (err) {
          console.error('Service worker registration failed:', err);
        }
      };

      register();
    }
  }, []);

  return null;
}
