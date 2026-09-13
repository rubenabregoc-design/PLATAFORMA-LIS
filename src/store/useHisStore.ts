import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  HospitalBed,
  TriageRecord,
  HospitalAdmission,
  SoapNote,
  MedicationOrder,
  KardexAdministrationRecord,
  BedStatus
} from '../types';
import {
  MOCK_HOSPITAL_BEDS,
  MOCK_TRIAGE_RECORDS,
  MOCK_HOSPITAL_ADMISSIONS,
  MOCK_SOAP_NOTES,
  MOCK_MEDICATION_ORDERS,
  MOCK_KARDEX_RECORDS
} from '../data/mockHospitalData';
import {
  REAL_HOSPITAL_BEDS,
  REAL_TRIAGE_RECORDS,
  REAL_ADMISSIONS
} from '../data/realClinicalData';

interface HisState {
  // --- Data Collections ---
  beds: HospitalBed[];
  triageRecords: TriageRecord[];
  admissions: HospitalAdmission[];
  soapNotes: SoapNote[];
  medicationOrders: MedicationOrder[];
  kardexRecords: KardexAdministrationRecord[];

  // --- Active Selections ---
  selectedAdmissionId: string | null;
  selectedBedId: string | null;

  // --- Actions ---
  setHisDemoMode: (isDemo: boolean) => void;
  setSelectedAdmissionId: (id: string | null) => void;
  setSelectedBedId: (id: string | null) => void;

  // Triage Actions
  addTriageRecord: (record: TriageRecord) => void;
  updateTriageStatus: (id: string, status: TriageRecord['status'], assignedBedId?: string) => void;

  // Bed & Admission Lifecycle Actions
  admitPatientToBed: (
    triageId: string | null,
    patientId: string,
    patientName: string,
    patientNationalId: string,
    bedId: string,
    doctorName: string,
    doctorLicense: string,
    primaryDiagnosisIcd10: string,
    allergies: string[]
  ) => HospitalAdmission;

  transferPatientBed: (admissionId: string, fromBedId: string, toBedId: string) => void;
  dischargePatient: (admissionId: string, bedId: string) => void;
  setBedStatus: (bedId: string, status: BedStatus) => void;

  // EHR / SOAP Actions
  addSoapNote: (note: SoapNote) => void;

  // eMAR / Kardex Actions
  addMedicationOrder: (order: MedicationOrder) => void;
  recordMedicationAdministration: (
    recordId: string,
    administeredBy: string,
    status: KardexAdministrationRecord['status'],
    notes?: string
  ) => void;
  scheduleMedicationDoses: (medicationOrderId: string, scheduledTimes: string[]) => void;
}

export const useHisStore = create<HisState>()(
  persist(
    (set, get) => ({
      beds: REAL_HOSPITAL_BEDS,
      triageRecords: REAL_TRIAGE_RECORDS,
      admissions: REAL_ADMISSIONS,
      soapNotes: MOCK_SOAP_NOTES,
      medicationOrders: MOCK_MEDICATION_ORDERS,
      kardexRecords: MOCK_KARDEX_RECORDS,

      selectedAdmissionId: REAL_ADMISSIONS[0]?.id || null,
      selectedBedId: 'bed-urg-01',

      setHisDemoMode: (isDemo: boolean) => {
        if (isDemo) {
          set({
            beds: MOCK_HOSPITAL_BEDS,
            triageRecords: MOCK_TRIAGE_RECORDS,
            admissions: MOCK_HOSPITAL_ADMISSIONS,
            selectedAdmissionId: MOCK_HOSPITAL_ADMISSIONS[0]?.id || null,
          });
        } else {
          set({
            beds: REAL_HOSPITAL_BEDS,
            triageRecords: REAL_TRIAGE_RECORDS,
            admissions: REAL_ADMISSIONS,
            selectedAdmissionId: REAL_ADMISSIONS[0]?.id || null,
          });
        }
      },

      setSelectedAdmissionId: (id) => set({ selectedAdmissionId: id }),
      setSelectedBedId: (id) => set({ selectedBedId: id }),

      addTriageRecord: (record) => {
        set((state) => ({
          triageRecords: [record, ...state.triageRecords]
        }));
      },

      updateTriageStatus: (id, status, assignedBedId) => {
        set((state) => ({
          triageRecords: state.triageRecords.map((t) =>
            t.id === id ? { ...t, status, assignedBedId: assignedBedId || t.assignedBedId } : t
          )
        }));
      },

      admitPatientToBed: (
        triageId,
        patientId,
        patientName,
        patientNationalId,
        bedId,
        doctorName,
        doctorLicense,
        primaryDiagnosisIcd10,
        allergies
      ) => {
        const targetBed = get().beds.find((b) => b.id === bedId);
        const newAdmissionId = `adm-${Date.now()}`;

        const newAdmission: HospitalAdmission = {
          id: newAdmissionId,
          tenantId: targetBed?.tenantId || 'lab-san-jose',
          branchId: targetBed?.branchId || 'branch-via-espana',
          patientId,
          patientName,
          patientNationalId,
          bedId,
          ward: targetBed?.ward || 'URGENCIAS',
          admittingDoctorName: doctorName,
          admittingDoctorLicense: doctorLicense,
          admissionDate: new Date().toISOString(),
          primaryDiagnosisIcd10,
          allergies,
          status: 'ACTIVA'
        };

        set((state) => ({
          admissions: [newAdmission, ...state.admissions],
          beds: state.beds.map((b) =>
            b.id === bedId
              ? {
                  ...b,
                  status: 'OCUPADA',
                  patientId,
                  admissionId: newAdmissionId,
                  currentPatientName: patientName,
                  currentPatientCedula: patientNationalId
                }
              : b
          ),
          triageRecords: triageId
            ? state.triageRecords.map((t) =>
                t.id === triageId ? { ...t, status: 'INGRESADO', assignedBedId: bedId } : t
              )
            : state.triageRecords,
          selectedAdmissionId: newAdmissionId,
          selectedBedId: bedId
        }));

        return newAdmission;
      },

      transferPatientBed: (admissionId, fromBedId, toBedId) => {
        const admission = get().admissions.find((a) => a.id === admissionId);
        const destinationBed = get().beds.find((b) => b.id === toBedId);

        if (!admission || !destinationBed) return;

        set((state) => ({
          admissions: state.admissions.map((a) =>
            a.id === admissionId ? { ...a, bedId: toBedId, ward: destinationBed.ward } : a
          ),
          beds: state.beds.map((b) => {
            if (b.id === fromBedId) {
              return {
                ...b,
                status: 'DESINFECCION',
                patientId: undefined,
                admissionId: undefined,
                currentPatientName: undefined,
                currentPatientCedula: undefined,
                lastSanitizedAt: new Date().toISOString()
              };
            }
            if (b.id === toBedId) {
              return {
                ...b,
                status: 'OCUPADA',
                patientId: admission.patientId,
                admissionId,
                currentPatientName: admission.patientName,
                currentPatientCedula: admission.patientNationalId
              };
            }
            return b;
          }),
          selectedBedId: toBedId
        }));
      },

      dischargePatient: (admissionId, bedId) => {
        set((state) => ({
          admissions: state.admissions.map((a) =>
            a.id === admissionId ? { ...a, status: 'ALTA', dischargeDate: new Date().toISOString() } : a
          ),
          beds: state.beds.map((b) =>
            b.id === bedId
              ? {
                  ...b,
                  status: 'DESINFECCION',
                  patientId: undefined,
                  admissionId: undefined,
                  currentPatientName: undefined,
                  currentPatientCedula: undefined,
                  lastSanitizedAt: new Date().toISOString()
                }
              : b
          )
        }));
      },

      setBedStatus: (bedId, status) => {
        set((state) => ({
          beds: state.beds.map((b) =>
            b.id === bedId
              ? {
                  ...b,
                  status,
                  ...(status === 'DISPONIBLE' ? { lastSanitizedAt: new Date().toISOString() } : {})
                }
              : b
          )
        }));
      },

      addSoapNote: (note) => {
        set((state) => ({
          soapNotes: [note, ...state.soapNotes]
        }));
      },

      addMedicationOrder: (order) => {
        set((state) => ({
          medicationOrders: [order, ...state.medicationOrders]
        }));

        // Generate initial kardex schedule
        const now = new Date();
        const initialTimes = [
          new Date(now.getTime() + 2 * 3600 * 1000).toISOString(),
          new Date(now.getTime() + 8 * 3600 * 1000).toISOString()
        ];
        get().scheduleMedicationDoses(order.id, initialTimes);
      },

      recordMedicationAdministration: (recordId, administeredBy, status, notes) => {
        set((state) => ({
          kardexRecords: state.kardexRecords.map((k) =>
            k.id === recordId
              ? {
                  ...k,
                  status,
                  administeredBy,
                  administeredTime: new Date().toISOString(),
                  notes: notes || k.notes
                }
              : k
          )
        }));
      },

      scheduleMedicationDoses: (medicationOrderId, scheduledTimes) => {
        const order = get().medicationOrders.find((m) => m.id === medicationOrderId);
        if (!order) return;

        const newRecords: KardexAdministrationRecord[] = scheduledTimes.map((t, idx) => ({
          id: `krd-${Date.now()}-${idx}`,
          medicationOrderId,
          admissionId: order.admissionId,
          patientId: order.patientId,
          scheduledTime: t,
          status: 'PROGRAMADA'
        }));

        set((state) => ({
          kardexRecords: [...state.kardexRecords, ...newRecords]
        }));
      }
    }),
    {
      name: 'abregotech_his_store_v2',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
