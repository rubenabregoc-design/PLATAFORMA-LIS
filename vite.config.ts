import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import http from 'http';
import {defineConfig, Plugin} from 'vite';

const PORTAL_SERVICES = [
  { port: 3001, name: 'Portal Pacientes', portal: 'patient' },
  { port: 3002, name: 'Portal Médicos Referentes', portal: 'doctor' },
  { port: 3003, name: 'Consola SuperAdmin SaaS', portal: 'superadmin' }
];

let activePortalServers: http.Server[] = [];

function multiPortPortalPlugin(): Plugin {
  return {
    name: 'multi-port-portal-listeners',
    configureServer(server) {
      activePortalServers.forEach(s => {
        try { s.close(); } catch (e) {}
      });
      activePortalServers = [];

      const mainPort = 3000;

      PORTAL_SERVICES.forEach(({ port, name, portal }) => {
        const portalServer = http.createServer((req, res) => {
          const proxyReq = http.request(
            {
              host: '127.0.0.1',
              port: mainPort,
              path: req.url,
              method: req.method,
              headers: {
                ...req.headers,
                host: `127.0.0.1:${mainPort}`,
                'x-forwarded-host': req.headers.host || '',
                'x-forwarded-port': String(port),
                'x-forwarded-portal': portal
              }
            },
            (proxyRes) => {
              const resHeaders = { ...proxyRes.headers };
              if (resHeaders.location && typeof resHeaders.location === 'string') {
                resHeaders.location = resHeaders.location.replace(
                  /https?:\/\/(localhost|127\.0\.0\.1):3000/g,
                  `http://${req.headers.host || `127.0.0.1:${port}`}`
                );
              }
              res.writeHead(proxyRes.statusCode || 200, resHeaders);
              proxyRes.pipe(res);
            }
          );

          proxyReq.on('error', () => {
            if (!res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(`
                <div style="font-family: system-ui, sans-serif; background: #020617; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;">
                  <div style="max-width: 500px; background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 30px; text-align: center;">
                    <h2 style="color: #22d3ee; margin-top: 0;">${name} (Puerto ${port})</h2>
                    <p style="color: #94a3b8; font-size: 14px;">Conectando con el servidor LIS...</p>
                    <script>setTimeout(() => window.location.reload(), 1500);</script>
                  </div>
                </div>
              `);
            }
          });

          req.pipe(proxyReq);
        });

        portalServer.on('upgrade', (req, clientSocket) => {
          const proxyReq = http.request({
            host: '127.0.0.1',
            port: mainPort,
            path: req.url,
            method: req.method,
            headers: {
              ...req.headers,
              host: `127.0.0.1:${mainPort}`
            }
          });

          proxyReq.on('upgrade', (proxyRes, proxySocket) => {
            clientSocket.write(
              `HTTP/1.1 101 Switching Protocols\r\n` +
              Object.entries(proxyRes.headers)
                .map(([k, v]) => `${k}: ${v}`)
                .join('\r\n') +
              '\r\n\r\n'
            );
            proxySocket.pipe(clientSocket).pipe(proxySocket);
          });

          proxyReq.on('error', () => {
            clientSocket.destroy();
          });

          proxyReq.end();
        });

        portalServer.on('error', (err: any) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`[MultiPort] Puerto ${port} ya en uso (${name}).`);
          } else {
            console.error(`[MultiPort] Error en puerto ${port}:`, err);
          }
        });

        portalServer.listen(port, '0.0.0.0', () => {
          console.log(`[MultiPort] ✓ ${name} escuchando en http://0.0.0.0:${port}`);
        });

        activePortalServers.push(portalServer);
      });

      server.httpServer?.on('close', () => {
        activePortalServers.forEach(s => {
          try { s.close(); } catch (e) {}
        });
        activePortalServers = [];
      });
    }
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), multiPortPortalPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas') || id.includes('node_modules/jszip')) {
              return 'vendor-pdf';
            }
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
              return 'vendor-charts';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('node_modules/motion')) {
              return 'vendor-motion';
            }
            if (id.includes('node_modules/@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('src/components/Phase6Suite/TechnologistSuite/')) {
              return 'suite-technologist-p6';
            }
          }
        }
      }
    },
    server: {
      host: true, // Listen on all network interfaces (0.0.0.0) so LAN IP (e.g. 192.168.0.8:3000) works
      port: 3000,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
