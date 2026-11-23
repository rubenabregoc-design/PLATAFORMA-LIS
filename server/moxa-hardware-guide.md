# 🔌 GUÍA DE INTEGRACIÓN DE HARDWARE: MOXA NPORT / LANTRONIX (SERIAL-TO-ETHERNET)
### AbregoTech LIS — Arquitectura Hospitalaria 24/7 sin Dependencia de Navegador

Esta guía describe cómo conectar analizadores clínicos con interfaz serial **RS-232** (Sysmex XN-1000, Stago STA Compact Max, Bio-Rad D-100, etc.) al Middleware del LIS utilizando convertidores de hardware **Serial-a-Ethernet** (como Moxa NPort 5110/5150 o Lantronix EDS/UDS).

---

## 1. Topología de Conexión Física

```
┌─────────────────────────┐          Cable DB9 / RS-232          ┌─────────────────────────┐
│   Analizador Clínico    │ ──────────────────────────────────── │    Moxa NPort 5110 /    │
│  (Sysmex, Stago, etc.)  │    (Pinout Estándar: RX, TX, GND)    │     Lantronix EDS       │
└─────────────────────────┘                                      └───────────┬─────────────┘
                                                                             │ Cable RJ45 (Ethernet)
                                                                             ▼
┌─────────────────────────┐                                      ┌─────────────────────────┐
│ Servidor LIS / PC Lab   │ <─────────────────────────────────── │   Switch / Red LAN del  │
│  Middleware Bridge :8765│        Socket TCP Directo            │       Laboratorio       │
└─────────────────────────┘      (:5101, :5105, :5109, etc.)     └─────────────────────────┘
```

---

## 2. Configuración del Convertidor Moxa NPort (Vía Web / NPort Administrator)

1. **Operating Settings (Modo de Operación):**
   * Seleccionar: **`TCP Server Mode`** (o **`TCP Client Mode`** apuntando a la IP del LIS).
   * Si se usa `TCP Client Mode`:
     * **Destination IP:** Dirección IP del Computador/Servidor del LIS (ej. `192.168.10.20`).
     * **Destination Port:** Puerto asignado al analizador en `server/analyzers-config.json`:
       * **Sysmex XN-1000:** Puerto `5109`
       * **Stago STA Compact Max:** Puerto `5105`
       * **Bio-Rad D-100:** Puerto `5106`

2. **Serial Parameters (Parámetros del Puerto Serial):**
   * **Baud Rate:** Según el analizador:
     * *Sysmex XN-1000:* `9600`
     * *Stago STA Compact Max:* `19200`
     * *Bio-Rad D-100:* `9600`
   * **Data Bits:** `8`
   * **Stop Bits:** `1`
   * **Parity:** `None`
   * **Flow Control:** `None` (o `Hardware RTS/CTS` si el cable es cruzado completo).

3. **Data Packing (Empaquetado de Datos ASTM):**
   * **Delimiter 1:** `0x0A` (LF - Line Feed)
   * **Delimiter 2:** `0x04` (EOT - End of Transmission)
   * **Force Transmit Time:** `10 ms` (Garantiza entrega inmediata de tramas sin retrasos).

---

## 3. Matriz de Puertos TCP de Escucha en el Middleware LIS

El servidor del LIS (`server/middleware-bridge.js`) tiene abiertos y en escucha permanente los siguientes puertos:

| Analizador | Categoría | Protocolo | Puerto TCP LIS | Puerto Serial Windows (Opción A) |
| :--- | :--- | :--- | :--- | :--- |
| **Ortho Vitros 4600** | Química Clínica | ASTM E1381 | `:5101` | Red Directa |
| **Roche Cobas 6000** | Química / Inmuno | HL7 v2.5 | `:5102` | Red Directa |
| **Abbott Alinity ci** | Inmunología | HL7 v2.5 | `:5103` | Red Directa |
| **Mindray BC-5390** | Hematología | ASTM E1381 | `:5104` | Red Directa |
| **Stago STA Compact** | Coagulación | ASTM E1381 | `:5105` | `COM3` (19200 baud) |
| **Bio-Rad D-100** | HbA1c Especiales | ASTM E1381 | `:5106` | `COM4` (9600 baud) |
| **Sysmex XN-1000** | Hematología | ASTM E1381 | `:5109` | `COM1` (9600 baud) |

---

## 4. Ventajas de la Arquitectura Híbrida (Opción A + Opción B)

* **Concurrencia Total:** Puedes tener analizadores conectados por cable directo USB-Serial al PC (Opción A: `serialport` de Node.js) y al mismo tiempo otros analizadores en otras salas conectados por Moxa/Ethernet (Opción B: Sockets TCP).
* **Zero Browser Dependency:** Ninguna de las dos opciones depende de tener Google Chrome abierto. Ambas entregan directamente a PostgreSQL y notifican en tiempo real por WebSocket.
