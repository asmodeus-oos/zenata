export type UserRole = "admin" | "doctor" | "receptionist" | "accountant" | "clinician" | "frontdesk";

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  role2?: UserRole;
  isActive: boolean;
  password?: string; // legacy prototype field; must be removed in production auth migration
  email?: string;
  phone?: string;
  avatarUrl?: string;
  specialty?: string;
  assignedRoom?: string;
  days?: string[];
  hours?: string;
}

export type FillingType = "Composite" | "Amalgam" | "GIC";
export type ExtractionType = "Simple" | "Surgical" | "Impaction";
export type ComplexityLevel = "Low" | "Medium" | "High";
export type ProstheticType = "Zirconia" | "E-Max" | "Porcelain Fused Metal" | "Bridge" | "Denture";
export type LabStatus = "Sent to Lab" | "In Fabrication" | "Received from Lab" | "Adjusted" | "Fitted";
export type PaymentStatus = "Fully Paid" | "Partially Paid" | "Unpaid";
export type ProcedureType = "Consultation" | "Filling" | "Extraction" | "Crown & Prosthetic" | "Orthodontic" | "Hygiene/Clean";
export type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled" | "Waiting" | "In Chair" | "In chair" | "Late" | "Done";

export interface Surface {
  code: "O" | "M" | "D" | "B" | "L";
  name: string;
}

export interface FillingRecord {
  id: string;
  toothNumber: number; // 1-32
  material: FillingType;
  surfaces: ("O" | "M" | "D" | "B" | "L")[]; // Occlusal, Mesial, Distal, Buccal, Lingual
  cost: number;
  date: string;
  notes: string;
}

export interface ExtractionRecord {
  id: string;
  toothNumber: number;
  type: ExtractionType;
  reason: string;
  complexity: ComplexityLevel;
  postOpStatus: string;
  date: string;
  cost: number;
}

export interface ProstheticSession {
  id: string;
  stage: "Preparation" | "Impression" | "Metal Trial" | "Ceramic Trial" | "Cementation";
  date: string;
  completed: boolean;
  notes: string;
}

export interface CrownProstheticRecord {
  id: string;
  toothNumber: number;
  prostheticType: ProstheticType;
  labName: string;
  labStatus: LabStatus;
  totalCost: number;
  paidAmount: number;
  remainingAmount: number; // calculated
  paymentStatus: PaymentStatus;
  notes: string;
  sessions: ProstheticSession[];
  date: string;
}

export interface EndodonticCase {
  toothNumber: number;
  chiefComplaint: string;
  spontaneousPain: "None" | "Mild" | "Moderate" | "Severe";
  nightPain: boolean;
  coldSensitivity: "None" | "Mild" | "Moderate" | "Severe";
  heatSensitivity: "None" | "Mild" | "Moderate" | "Severe";
  painChewing: boolean;
  swelling: boolean;
  abscess: boolean;
  sinusTract: boolean;
  pulpDiagnosis: "Normal pulp" | "Reversible pulpitis" | "Irreversible pulpitis" | "Necrotic pulp" | "Previously treated" | "Previously initiated therapy";
  apicalDiagnosis: "Normal apical tissue" | "Symptomatic apical periodontitis" | "Asymptomatic apical periodontitis" | "Acute apical abscess" | "Chronic apical abscess" | "Condensing osteitis";
  workingLengths: { canal: string; estLength: string; finalLength: string; apexLocator: string; fileSize: string; }[];
  instrumentationSystem: string;
  glidePath: string;
  irrigationProtocol: { sodiumHypo: string; edta: boolean; chlorhexidine: boolean; activation: string; };
  intracanalMedication: { material: string; placedDate: string; removalDate: string; };
  obturationDetails: { technique: string; sealerType: string; coneSize: string; date: string; operator: string; };
  followUpNotes: string;
  caseStatus: "Diagnosed" | "Access Opened" | "Instrumentation In Progress" | "Medication Phase" | "Obturation Completed" | "Restoration Pending" | "Completed" | "Follow-up Required";
}

export interface PeriodonticRecord {
  scalingAndPlaningDate: string;
  pocketDepthMax: number;
  bleedingIndices: "None" | "Localized" | "Generalized";
  mobilityIndex: "Grade 0" | "Grade I" | "Grade II" | "Grade III";
  boneLossPercentage: number;
  implantSupportStatus: string;
}

export interface OrthodonticRecord {
  bracketSystem: string;
  currentWire: string;
  biteCorrection: string;
  complianceScore: "Excellent" | "Good" | "Fair" | "Poor";
  jawAlignmentNotes: string;
}

export interface PreventiveScore {
  cleaningsCount: number;
  fluorideGiven: boolean;
  sealantApplied: boolean;
  cariesRisk: "Low" | "Medium" | "High";
}

export interface PediatricNotes {
  habitThumbSucking: boolean;
  habitTongueThrust: boolean;
  growthStatus: string;
  behavioralScore: "Excellent" | "Cooperative" | "Fearful" | "Uncooperative";
}

export interface SpecialtyRecords {
  endoCases?: EndodonticCase[];
  perioRecord?: PeriodonticRecord;
  orthoRecord?: OrthodonticRecord;
  preventiveScore?: PreventiveScore;
  surgeryNotes?: string;
  pediatricNotes?: PediatricNotes;
  oralMedicineNotes?: string;
  pathologyDiagnostic?: string;
  radiologyInterpret?: string;
}

export interface PatientSession {
  id: string;
  date: string;
  time: string;
  procedureType: string;
  doctorName: string;
  notes: string;
  quickNotes?: string;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  dob: string;
  gender: string;
  orthoNotes: string; // orthodontic cases notes
  createdAt: string;
  fillingRecords: FillingRecord[];
  extractionRecords: ExtractionRecord[];
  prostheticsRecords: CrownProstheticRecord[];
  riskLevel?: "Low" | "Moderate" | "High";
  allergies?: string;
  weight?: string;
  height?: string;
  address?: string;
  occupation?: string;
  specialtyRecords?: SpecialtyRecords;
  sessions?: PatientSession[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  procedureType: ProcedureType;
  status: AppointmentStatus;
  notes: string;
  quickNotes?: string;
}

export interface FinancialRecord {
  id: string;
  patientId: string;
  patientName: string;
  procedureName: string; // e.g., "Composite Filling Tooth 18", "Temporary Crown"
  totalCost: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  date: string;
  paymentMethod: "Cash" | "Card" | "Bank Transfer";
  receiptNo: string;
  notes?: string;
  type?: "income" | "expense";
  expenseCategory?: string;
  expenseType?: "payroll" | "utility" | "extra";
  periodType?: "Monthly" | "Daily" | "Specific Day";
  doctorId?: string;
}

export type LedgerEntryType = "payment" | "refund" | "charge" | "adjustment";

export interface LedgerEntry {
  id: string;
  type: LedgerEntryType;
  amount: number;
  patientId: string;
  relatedTreatmentId: string;
  createdAt: string;
  createdBy: string;
  immutable: true;
  currency: "USD";
  notes?: string;
}

export type StockMovementType = "add" | "consume" | "adjust";

export interface StockMovement {
  id: string;
  itemId: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  timestamp: string;
  createdBy: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  resourceType: "patient" | "appointment" | "ledger" | "inventory" | "staff" | "file";
  resourceId: string;
  createdAt: string;
  immutable: true;
  metadata?: Record<string, unknown>;
}

export interface VersionedRecord<T> {
  version: number;
  updatedAt: string;
  updatedBy: string;
  payload: T;
}

export interface DoctorShift {
  name: string;
  specialty: string;
  assignedRoom?: string;
  days: string[]; // e.g., Monday, Tuesday...
  hours: string; // "09:00 AM - 05:00 PM"
  isAvailable: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minQty: number;
  expiryDate: string; // YYYY-MM-DD
  batchNo: string;
  suggestedFirst: boolean; // FIFO indicator
  pricePerUnit?: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface ClinicSettings {
  name: string;
  logo: string;
  address: string;
  phone: string;
  social: string;
}
