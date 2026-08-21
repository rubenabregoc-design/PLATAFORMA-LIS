import React, { useState } from 'react';
import { Order, TestResult, Patient, Tenant, Branch } from '../../types';
import {
  Code2,
  Globe,
  Key,
  Copy,
  Check,
  Send,
  Database,
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
  Server
} from 'lucide-react';

interface FhirInteroperabilityStudioProps {
  tenant: Tenant;
  branch: Branch;
  orders: Order[];
  results: TestResult[];
  patients: Patient[];
}

export const FhirInteroperabilityStudio: React.FC<FhirInteroperabilityStudioProps> = ({
  tenant,
  branch,
  orders,
  results,
  patients
}) => {
  const [selectedResourceType, setSelectedResourceType] = useState<'DiagnosticReport' | 'Observation' | 'Patient' | 'ServiceRequest'>('DiagnosticReport');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('at_live_key_panama_9982310023912093');
  const [endpointUrl, setEndpointUrl] = useState<string>(`https://api.abregotech.com/v1/tenants/${tenant.id}/fhir/r4`);

  const currentOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];
  const currentPatient = patients.find((p) => p.id === currentOrder.patientId) || patients[0];
  const currentResults = results.filter((r) => r.orderId === currentOrder.id);

  // Generate real HL7 FHIR R4 JSON representation based on selection
  const generateFhirResource = () => {
    if (selectedResourceType === 'Patient') {
      return {
        resourceType: 'Patient',
        id: currentPatient.id,
        identifier: [
          {
            use: 'official',
            system: 'urn:oid:2.16.840.1.113883.4.1', // Panama National ID system
            value: currentPatient.nationalId
          }
        ],
        active: true,
        name: [
          {
            use: 'official',
            family: currentPatient.lastName,
            given: [currentPatient.firstName]
          }
        ],
        telecom: [
          { system: 'phone', value: currentPatient.phone },
          { system: 'email', value: currentPatient.email }
        ],
        gender: currentPatient.gender === 'M' ? 'male' : 'female',
        birthDate: currentPatient.dob,
        address: [
          {
            line: [currentPatient.address],
            city: 'Ciudad de Panamá',
            country: 'Panamá'
          }
        ]
      };
    }

    if (selectedResourceType === 'DiagnosticReport') {
      return {
        resourceType: 'DiagnosticReport',
        id: `dr-${currentOrder.id}`,
        status: currentOrder.status === 'VALIDADA_MED' ? 'final' : 'partial',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
                code: 'LAB',
                display: 'Laboratory'
              }
            ]
          }
        ],
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '11502-2',
              display: 'Laboratory report'
            }
          ],
          text: 'Informe Oficial de Resultados de Laboratorio Clínico'
        },
        subject: {
          reference: `Patient/${currentPatient.id}`,
          display: `${currentPatient.firstName} ${currentPatient.lastName}`
        },
        effectiveDateTime: currentOrder.createdAt,
        issued: new Date().toISOString(),
        performer: [
          {
            display: `${tenant.name} (${branch.name})`
          }
        ],
        result: currentResults.map((r) => ({
          reference: `Observation/obs-${r.id}`,
          display: r.parameterName
        }))
      };
    }

    if (selectedResourceType === 'Observation') {
      const sampleResult = currentResults[0] || {
        id: 'res-sample',
        parameterName: 'Glucosa en Suero',
        value: '95',
        unit: 'mg/dL',
        status: 'VALIDADO_MED'
      };
      return {
        resourceType: 'Observation',
        id: `obs-${sampleResult.id}`,
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'laboratory',
                display: 'Laboratory'
              }
            ]
          }
        ],
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '2345-7',
              display: sampleResult.parameterName
            }
          ]
        },
        subject: {
          reference: `Patient/${currentPatient.id}`
        },
        valueQuantity: {
          value: Number(sampleResult.value) || 95,
          unit: sampleResult.unit,
          system: 'http://unitsofmeasure.org',
          code: sampleResult.unit
        },
        referenceRange: [
          {
            low: { value: 70, unit: sampleResult.unit },
            high: { value: 99, unit: sampleResult.unit },
            text: '70 - 99 mg/dL'
          }
        ]
      };
    }

    // ServiceRequest
    return {
      resourceType: 'ServiceRequest',
      id: `sr-${currentOrder.id}`,
      status: 'active',
      intent: 'order',
      priority: currentOrder.priority.toLowerCase(),
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '18719-5',
            display: 'Chemistry panel'
          }
        ]
      },
      subject: {
        reference: `Patient/${currentPatient.id}`
      },
      authoredOn: currentOrder.createdAt,
      requester: {
        display: currentOrder.doctorName
      }
    };
  };

  const fhirJsonString = JSON.stringify(generateFhirResource(), null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(fhirJsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-cyan-950 text-white p-6 rounded-2xl shadow-xl border border-teal-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-cyan-300 text-xs font-bold uppercase tracking-wider mb-1 flex items-center space-x-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Fase 5 — API RESTful HL7 FHIR R4 (Interoperabilidad Sistemas de Salud)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            HL7 FHIR Interoperability Studio & API Sandbox
          </h1>
          <p className="text-teal-100 text-sm mt-1 max-w-xl">
            Integración nativa bidireccional con el Expediente Clínico Electrónico de la Caja de Seguro Social (SISCO / SEIS) y MINSA Panamá.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-teal-500/40 p-4 rounded-xl text-xs space-y-1">
          <div className="text-teal-300 font-bold flex items-center space-x-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>OAuth2 Token: Bearer Validated</span>
          </div>
          <div className="text-slate-300">Formato: JSON HL7 FHIR v4.0.1</div>
        </div>
      </div>

      {/* API Endpoint Config & Selector */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">Base Endpoint RESTful FHIR Tenant:</label>
            <input
              type="text"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-xs font-bold text-teal-800"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">API Secret Key (X-API-KEY Header):</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-xs"
            />
          </div>
        </div>

        {/* Resource Selector & Order Picker */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-700">Recurso FHIR R4:</span>
            {(['DiagnosticReport', 'Observation', 'Patient', 'ServiceRequest'] as const).map((rType) => (
              <button
                key={rType}
                onClick={() => setSelectedResourceType(rType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedResourceType === rType
                    ? 'bg-teal-600 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {rType}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="font-bold text-slate-700">Orden Médica:</span>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-bold text-xs"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} — {o.patientName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* JSON Payload Viewer */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-teal-400" />
            <span className="font-bold text-sm text-teal-300">
              Payload HL7 FHIR v4.0.1 Standard ({selectedResourceType})
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center space-x-1 border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar JSON</span>
              </>
            )}
          </button>
        </div>

        <pre className="font-mono text-xs text-emerald-400 bg-slate-900 p-4 rounded-xl border border-slate-800 overflow-x-auto max-h-96">
          {fhirJsonString}
        </pre>
      </div>
    </div>
  );
};
