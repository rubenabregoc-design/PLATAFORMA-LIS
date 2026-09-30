import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, 'dist');

const PORTAL_SERVICES = [
  { port: 3000, name: 'Plataforma Central LIS / HIS', portal: 'main' },
  { port: 3001, name: 'Portal de Pacientes', portal: 'patient' },
  { port: 3002, name: 'Portal Médicos Referentes & Consulta', portal: 'doctor' },
  { port: 3003, name: 'Consola SuperAdmin SaaS', portal: 'superadmin' }
];

console.log('\n=============================================================');
console.log('  🏥 PLATAFORMA-LIS — SERVIDOR MULTI-PORTAL DE PRODUCCIÓN');
console.log('=============================================================\n');

PORTAL_SERVICES.forEach(({ port, name, portal }) => {
  const app = express();

  // Servir archivos estáticos minificados desde /dist
  app.use(express.static(distPath));

  // Fallback SPA: devolver siempre index.html para cualquier ruta interna
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`  ✓ ${name}`);
    console.log(`    ➜ URL Local:   http://localhost:${port}`);
    console.log(`    ➜ Red Hospital: http://0.0.0.0:${port}\n`);
  });
});
