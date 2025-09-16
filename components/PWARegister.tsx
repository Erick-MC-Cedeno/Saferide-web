'use client'

import React from 'react'

export function PWARegister() {
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      const host = window.location.hostname;
      const isLocalhost = host === 'localhost' || host === '127.0.0.1';
      const isSecure = window.location.protocol === 'https:' || isLocalhost;

      if (!isSecure) {
        console.info('PWARegister: skipping SW registration — insecure protocol:', window.location.protocol);
        return;
      }
      const register = async () => {
        try {
          console.info('PWARegister: attempting to fetch /sw.js before registration...');
          // Preflight fetch to debug issues with serving sw.js through proxies like ngrok
          const resp = await fetch('/sw.js', { cache: 'no-store' });
          console.info('PWARegister: /sw.js fetch status', resp.status, resp.type, resp.headers.get('content-type'));
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
                  // New update available
                  // You can show a toast or prompt the user
                  console.log('New content is available; please refresh.');
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
