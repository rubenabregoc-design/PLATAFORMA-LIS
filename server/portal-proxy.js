/**
 * AbregoTech LISCORE — Multi-Port Portal Router & Reverse Proxy
 * 
 * Escucha en los puertos dedicados solicitados:
 * - Puerto 3001: Portal Público de Pacientes (http://localhost:3001)
 * - Puerto 3002: Portal de Médicos Referentes (http://localhost:3002)
 * - Puerto 3003: Consola Súper-Admin SaaS (http://localhost:3003)
 * 
 * Enruta transparentemente o redirige a la aplicación principal en http://localhost:3000
 */

import http from 'http';

const PORTS = [
  {
    port: 3001,
    name: 'Portal Público de Pacientes',
    portalParam: 'patient',
    targetPath: '/?portal=patient'
  },
  {
    port: 3002,
    name: 'Portal de Médicos Referentes',
    portalParam: 'doctor',
    targetPath: '/?portal=doctor'
  },
  {
    port: 3003,
    name: 'Consola Súper-Admin SaaS',
    portalParam: 'superadmin',
    targetPath: '/?portal=superadmin'
  }
];

const MAIN_APP_HOST = '127.0.0.1';
const MAIN_APP_PORT = 3000;

console.log('============================================================');
console.log('  AbregoTech LISCORE — Enrutador de Portales Multi-Puerto');
console.log('============================================================');

PORTS.forEach(({ port, name, portalParam }) => {
  const server = http.createServer((req, res) => {
    const proxyReq = http.request(
      {
        host: MAIN_APP_HOST,
        port: MAIN_APP_PORT,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          host: `${MAIN_APP_HOST}:${MAIN_APP_PORT}`,
          'x-forwarded-host': req.headers.host || '',
          'x-forwarded-port': String(port),
          'x-forwarded-portal': portalParam
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

    proxyReq.on('error', (err) => {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <div style="font-family: system-ui, sans-serif; background: #020617; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <div style="max-width: 500px; background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 30px; text-align: center;">
              <h2 style="color: #22d3ee; margin-top: 0;">${name} (Puerto ${port})</h2>
              <p style="color: #94a3b8; font-size: 14px;">Conectando con el servidor LIS principal...</p>
              <script>setTimeout(() => window.location.reload(), 1500);</script>
            </div>
          </div>
        `);
      }
    });

    req.pipe(proxyReq);
  });

  server.on('upgrade', (req, clientSocket) => {
    const proxyReq = http.request({
      host: MAIN_APP_HOST,
      port: MAIN_APP_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${MAIN_APP_HOST}:${MAIN_APP_PORT}`
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

  server.listen(port, '0.0.0.0', () => {
    console.log(`  [OK] ${name} activo en: http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`  [AVISO] Puerto ${port} ya en uso. Portal accesible vía http://localhost:${MAIN_APP_PORT}${targetPath}`);
    } else {
      console.error(`  [ERROR] Error en puerto ${port}:`, err.message);
    }
  });
});
