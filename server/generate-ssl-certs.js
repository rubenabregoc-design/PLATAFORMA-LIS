/**
 * AbregoTech LISCORE - Generador Criptografico SSL/TLS de Par de Claves (Cert + Private Key)
 */
import selfsigned from 'selfsigned';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const attrs = [
    { name: 'commonName', value: '192.168.0.8' },
    { name: 'countryName', value: 'PA' },
    { name: 'localityName', value: 'Panama' },
    { name: 'organizationName', value: 'AbregoTech Systems LISCORE' },
    { name: 'organizationalUnitName', value: 'Clinical IT' }
  ];

  const options = {
    days: 3650,
    keySize: 2048,
    algorithm: 'sha256',
    extensions: [
      { name: 'basicConstraints', cA: true },
      { name: 'keyUsage', keyCertSign: true, digitalSignature: true, keyEncipherment: true, cRLSign: true },
      { name: 'extKeyUsage', serverAuth: true, clientAuth: true },
      {
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: 'his.local' },
          { type: 2, value: 'lis.local' },
          { type: 2, value: 'localhost' },
          { type: 7, value: '127.0.0.1' },
          { type: 7, value: '192.168.0.8' }
        ]
      }
    ]
  };

  console.log('Generando certificado SSL (cert.pem) y clave privada RSA (key.pem) para 192.168.0.8 y localhost...');
  const generateFn = selfsigned.generate || selfsigned.default;
  const pki = await generateFn(attrs, options);

  fs.writeFileSync(path.resolve(__dirname, 'cert.pem'), pki.cert);
  fs.writeFileSync(path.resolve(__dirname, 'key.pem'), pki.private);

  console.log('OK: cert.pem y key.pem creados exitosamente en /server');
}

main().catch(console.error);
