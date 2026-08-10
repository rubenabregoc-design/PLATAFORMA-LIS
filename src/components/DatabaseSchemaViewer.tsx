import React, { useState } from 'react';
import { Database, ShieldCheck, FileCode2, Layers, Key, CheckCircle2, AlertTriangle, Cpu, Users, BarChart3, Lock } from 'lucide-react';

export const DatabaseSchemaViewer: React.FC = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<'discriminator' | 'schema_per_tenant' | 'db_per_tenant'>('discriminator');
  const [activeTableTab, setActiveTableTab] = useState<string>('patients');

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Database className="w-4 h-4" />
            <span>Punto 1 — Arquitectura de Base de Datos PostgreSQL Multi-Tenant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Modelo de Datos Comercial LIS-Core + Middleware
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-3xl leading-relaxed">
            Diseño relacional optimizado para PostgreSQL con aislamiento estricto por laboratorio, cumplimiento de la <strong className="text-teal-300">Ley 81 de Protección de Datos en Panamá</strong> y soporte de alto throughput para millones de eventos ASTM/HL7.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-xl text-xs">
          <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-slate-200">Ley 81 Panamá Ready</div>
            <div className="text-slate-400 text-[11px]">Audit Logs e Inmutabilidad de Resultados</div>
          </div>
        </div>
      </div>

      {/* Tenant Strategy Evaluation Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-teal-600" />
            <span>Evaluación de Estrategia Multi-Tenant para PostgreSQL</span>
          </h2>
          <p className="text-slate-600 text-xs mt-1">
            Seleccione una arquitectura para comparar pros/contras en el contexto del mercado de laboratorios en Panamá:
          </p>
        </div>

        {/* Strategy Selector Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setSelectedStrategy('discriminator')}
            className={`p-4 rounded-xl text-left border text-sm transition relative ${
              selectedStrategy === 'discriminator'
                ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-500/20'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900">Estrategia A: Shared DB + Discriminator Column (`tenant_id`) + RLS</span>
              {selectedStrategy === 'discriminator' && <span className="text-xs bg-teal-600 text-white font-bold px-2 py-0.5 rounded-full">RECOMENDADO MVP</span>}
            </div>
            <p className="text-xs text-slate-600 leading-normal">
              Todas las tablas incluyen <code className="bg-slate-200 text-slate-800 px-1 rounded">tenant_id</code>. PostgreSQL Row-Level Security (RLS) fuerza el aislamiento a nivel de motor SQL.
            </p>
          </button>

          <button
            onClick={() => setSelectedStrategy('schema_per_tenant')}
            className={`p-4 rounded-xl text-left border text-sm transition ${
              selectedStrategy === 'schema_per_tenant'
                ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-500/20'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="font-bold text-slate-900 mb-2">Estrategia B: Schema por Tenant (`tenant_lab_a`, `tenant_lab_b`)</div>
            <p className="text-xs text-slate-600 leading-normal">
              Un único PostgreSQL, pero cada laboratorio cliente posee su propio esquema de tablas dentro de la base de datos.
            </p>
          </button>

          <button
            onClick={() => setSelectedStrategy('db_per_tenant')}
            className={`p-4 rounded-xl text-left border text-sm transition ${
              selectedStrategy === 'db_per_tenant'
                ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-500/20'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="font-bold text-slate-900 mb-2">Estrategia C: Base de Datos Independiente por Tenant</div>
            <p className="text-xs text-slate-600 leading-normal">
              Cada cliente tiene un PostgreSQL dedicado en un contenedor o instancia propia. Aislamiento físico total.
            </p>
          </button>
        </div>

        {/* Detailed Comparison Table */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-xs space-y-4">
          {selectedStrategy === 'discriminator' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Pros de Estrategia A (`tenant_id` + Row Level Security):</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-2">
                <li><strong>Costo-Eficiencia Startup:</strong> Permite operar decenas de laboratorios en un solo cluster pequeño de PostgreSQL (ej. Cloud SQL Developer Instance).</li>
                <li><strong>Mantenimiento de Migraciones:</strong> Un solo comando de migración (<code className="bg-slate-200 px-1">drizzle-kit push</code>) actualiza la estructura para todos los clientes en milisegundos.</li>
                <li><strong>Consultas Globales AbregoTech:</strong> El SuperAdmin puede ejecutar reportes agregados y métricas SaaS sin uniones complejas multi-esquema.</li>
                <li><strong>Seguridad RLS Automatizada:</strong> RLS intercepta cada consulta <code className="bg-slate-200 px-1">SELECT/UPDATE/DELETE</code> asegurando que un bug en el código jamás filtre pacientes entre laboratorios.</li>
              </ul>

              <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm pt-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Contras y Mitigación:</span>
              </div>
              <p className="text-slate-600 pl-2 leading-relaxed">
                <em>Riesgo:</em> "Noisy Neighbor" si un laboratorio grande satura el IOPS. <br />
                <em>Solución:</em> Usar índices compuestos <code className="bg-slate-200 px-1">(tenant_id, national_id)</code> y particionamiento declarativo en tablas masivas como <code className="bg-slate-200 px-1">middleware_message_logs</code>.
              </p>
            </div>
          )}

          {selectedStrategy === 'schema_per_tenant' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Pros de Estrategia B (Schema por Tenant):</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-2">
                <li>Aislamiento lógico más visible a nivel de cliente SQL.</li>
                <li>Fácil respaldar o restaurar el esquema completo de un único cliente que solicite baja o auditoría.</li>
              </ul>
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm pt-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Contras:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-2">
                <li>Complejidad alta de migraciones: al tener 100 clientes, se deben ejecutar 100 migraciones DDL consecutivas por cada deploy.</li>
                <li>Agotamiento de pool de conexiones PostgreSQL y catálogo del sistema inflado.</li>
              </ul>
            </div>
          )}

          {selectedStrategy === 'db_per_tenant' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Pros de Estrategia C (DB por Tenant):</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-2">
                <li>Máxima seguridad física demandada por hospitales de alta complejidad o cadenas de salud multinacionales.</li>
              </ul>
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm pt-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Contras:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-2">
                <li>Costos de infraestructura excesivos para la fase MVP/Fase 1.</li>
                <li>Casi imposible de mantener económicamente para laboratorios pequeños con suscripciones económicas.</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Entity Explorer & DDL Code Visualizer */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold flex items-center space-x-2 text-teal-400">
              <FileCode2 className="w-5 h-5" />
              <span>Modelo Entidad-Relación y Esquema DDL en PostgreSQL</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Seleccione un módulo para explorar sus columnas, llaves foráneas, índices de rendimiento y banderas de cumplimiento Ley 81:
            </p>
          </div>

          <span className="text-xs bg-teal-500/20 text-teal-300 border border-teal-500/40 px-3 py-1 rounded-full font-mono">
            PostgreSQL 16 + Drizzle ORM / SQL Native
          </span>
        </div>

        {/* Entity Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 text-xs">
          {[
            { id: 'tenants', name: '1. Tenants & Sedes', icon: Building2Icon },
            { id: 'users', name: '2. Usuarios & RBAC', icon: Users },
            { id: 'patients', name: '3. Pacientes (Ley 81)', icon: ShieldCheck },
            { id: 'orders', name: '4. Órdenes & Muestras', icon: BarChart3 },
            { id: 'results', name: '5. Resultados & Firma', icon: Lock },
            { id: 'middleware', name: '6. Middleware ASTM/HL7', icon: Cpu }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTableTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
                activeTableTab === tab.id
                  ? 'bg-teal-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Table Schema Viewer Content */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto space-y-4">
          {activeTableTab === 'patients' && (
            <div className="space-y-4">
              <div className="text-teal-400 font-bold border-b border-slate-800 pb-2">
                -- Tabla: patients (Deduplicación por Cédula/Pasaporte y Ley 81 Panamá)
              </div>
              <pre className="text-slate-300 text-[11px] leading-relaxed">
{`CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Identificación Panameña
    id_type VARCHAR(20) NOT NULL CHECK (id_type IN ('CEDULA', 'PASAPORTE', 'CARNET')),
    national_id VARCHAR(50) NOT NULL, -- Format: '8-123-4567' or 'PA-992014'
    
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender CHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
    date_of_birth DATE NOT NULL,
    
    phone VARCHAR(30),
    email VARCHAR(150),
    address TEXT,
    
    -- Cumplimiento Ley 81 de Protección de Datos Personales Panamá
    data_consent_ley81 BOOLEAN NOT NULL DEFAULT FALSE,
    consent_recorded_at TIMESTAMPTZ,
    consent_ip VARCHAR(45),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unicidad del paciente DENTRO del mismo laboratorio
    CONSTRAINT unique_patient_per_tenant UNIQUE (tenant_id, national_id)
);

-- Índice de búsqueda rápida por Cédula
CREATE INDEX idx_patients_lookup ON patients(tenant_id, national_id);
CREATE INDEX idx_patients_name ON patients(tenant_id, last_name, first_name);`}
              </pre>
            </div>
          )}

          {activeTableTab === 'tenants' && (
            <div className="space-y-4">
              <div className="text-teal-400 font-bold border-b border-slate-800 pb-2">
                -- Tablas: tenants y branches (Multi-Sede)
              </div>
              <pre className="text-slate-300 text-[11px] leading-relaxed">
{`CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    ruc VARCHAR(50) NOT NULL,
    dv VARCHAR(5) NOT NULL,
    subscription_plan VARCHAR(30) DEFAULT 'Pro',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_branch_code UNIQUE(tenant_id, code)
);`}
              </pre>
            </div>
          )}

          {activeTableTab === 'orders' && (
            <div className="space-y-4">
              <div className="text-teal-400 font-bold border-b border-slate-800 pb-2">
                -- Tablas: medical_orders, specimens (Tubos/Código de barras), order_items
              </div>
              <pre className="text-slate-300 text-[11px] leading-relaxed">
{`CREATE TABLE medical_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    order_number VARCHAR(30) NOT NULL, -- e.g. ORD-2026-00101
    
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID REFERENCES doctors(id),
    
    priority VARCHAR(10) DEFAULT 'RUTINA' CHECK (priority IN ('RUTINA', 'STAT', 'URGENTE')),
    status VARCHAR(20) DEFAULT 'REGISTRADA',
    
    total_amount NUMERIC(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'PENDIENTE',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE specimens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    order_id UUID NOT NULL REFERENCES medical_orders(id) ON DELETE CASCADE,
    barcode VARCHAR(50) NOT NULL, -- e.g. 'BC-882001'
    tube_type VARCHAR(30) NOT NULL, -- 'EDTA_MORADO', 'SUERO_ROJO'
    status VARCHAR(20) DEFAULT 'PENDIENTE',
    collected_at TIMESTAMPTZ,
    collected_by UUID REFERENCES users(id)
);`}
              </pre>
            </div>
          )}

          {activeTableTab === 'results' && (
            <div className="space-y-4">
              <div className="text-teal-400 font-bold border-b border-slate-800 pb-2">
                -- Tablas: test_results, result_audit_trail (Firma Electrónica e Inmutabilidad)
              </div>
              <pre className="text-slate-300 text-[11px] leading-relaxed">
{`CREATE TABLE test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    order_id UUID NOT NULL REFERENCES medical_orders(id),
    test_id UUID NOT NULL REFERENCES test_catalog(id),
    parameter_id UUID NOT NULL,
    
    value VARCHAR(100) NOT NULL,
    numeric_value NUMERIC(12,4),
    flag VARCHAR(20) DEFAULT 'NORMAL', -- 'NORMAL', 'ALTO', 'BAJO', 'CRITICO_ALTO'
    
    source VARCHAR(30) NOT NULL CHECK (source IN ('MANUAL', 'MIDDLEWARE_ASTM', 'MIDDLEWARE_HL7')),
    analyzer_id UUID REFERENCES analyzers(id),
    
    -- Doble Flujo de Validación RBAC
    technical_validated_by UUID REFERENCES users(id),
    technical_validated_at TIMESTAMPTZ,
    
    medical_validated_by UUID REFERENCES users(id),
    medical_validated_at TIMESTAMPTZ,
    
    signature_hash TEXT, -- Hash SHA256 de la firma biométrica/digital del Jefe de Lab
    status VARCHAR(20) DEFAULT 'PENDIENTE'
);

-- Trazabilidad de Cambios (Ley 81 Audit Trail)
CREATE TABLE result_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID NOT NULL REFERENCES test_results(id),
    previous_value VARCHAR(100),
    new_value VARCHAR(100) NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    reason_for_change TEXT NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);`}
              </pre>
            </div>
          )}

          {activeTableTab === 'middleware' && (
            <div className="space-y-4">
              <div className="text-teal-400 font-bold border-b border-slate-800 pb-2">
                -- Tablas Middleware: analyzers, analyzer_mappings, middleware_raw_messages
              </div>
              <pre className="text-slate-300 text-[11px] leading-relaxed">
{`CREATE TABLE analyzers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    name VARCHAR(100) NOT NULL, -- e.g. 'Sysmex XN-1000'
    protocol VARCHAR(30) NOT NULL, -- 'ASTM_E1381', 'HL7_V2'
    connection_type VARCHAR(20) NOT NULL, -- 'TCP_IP', 'RS232_SERIAL'
    ip_address VARCHAR(45),
    port INT,
    driver_id VARCHAR(50) NOT NULL, -- ID del Dialecto/Adapter
    status VARCHAR(20) DEFAULT 'OFFLINE'
);

CREATE TABLE middleware_raw_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    analyzer_id UUID NOT NULL REFERENCES analyzers(id),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    raw_payload TEXT NOT NULL, -- Frame sin procesar ASTM/HL7
    parsed_json JSONB,
    status VARCHAR(20) DEFAULT 'PENDIENTE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice JSONB para búsquedas ultra-rápidas por código de tubo
CREATE INDEX idx_raw_messages_json ON middleware_raw_messages USING gin (parsed_json);`}
              </pre>
            </div>
          )}

          {activeTableTab === 'users' && (
            <div className="space-y-4">
              <div className="text-teal-400 font-bold border-b border-slate-800 pb-2">
                -- Tabla: users (Roles & Permisos RBAC)
              </div>
              <pre className="text-slate-300 text-[11px] leading-relaxed">
{`CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    branch_id UUID REFERENCES branches(id),
    email VARCHAR(150) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN (
        'owner', 'lab_chief', 'tech_med', 'lab_tech', 
        'receptionist', 'ext_doctor', 'patient', 'abregotech_admin'
    )),
    license_number VARCHAR(50), -- Idoneidad del profesional
    signature_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function Building2Icon(props: any) {
  return <Building2 className="w-4 h-4" {...props} />;
}
function Building2(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
      <path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>
    </svg>
  );
}
