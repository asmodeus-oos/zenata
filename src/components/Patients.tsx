import React, { useState, useMemo, useEffect } from "react";
import { jsPDF } from "jspdf";
import { useStore } from "../store";
import { ZendentaLogo } from "./ZendentaLogo";
import { 
  Search, 
  Plus, 
  User, 
  Phone, 
  Map, 
  ShieldAlert, 
  Calendar,
  DollarSign, 
  CheckCircle, 
  Trash2, 
  PlusCircle, 
  FileText, 
  PenTool, 
  Wrench,
  X,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  History,
  AlertCircle,
  Check,
  Building,
  Sparkles,
  CreditCard,
  Edit
} from "lucide-react";
import { 
  Patient, 
  FillingRecord, 
  ExtractionRecord, 
  CrownProstheticRecord, 
  ProstheticType, 
  LabStatus,
  FillingType,
  ExtractionType,
  ComplexityLevel,
  EndodonticCase,
  PeriodonticRecord,
  OrthodonticRecord,
  PediatricNotes,
  PreventiveScore,
  SpecialtyRecords
} from "../types";

interface PatientsProps {
  selectedPatientId: string | null;
  onSelectPatient: (id: string | null) => void;
}

export default function Patients({ selectedPatientId, onSelectPatient }: PatientsProps) {
  const { 
    patients, 
    financialRecords,
    addPatient, 
    updatePatient, 
    deletePatient, 
    addFillingRecord, 
    addExtractionRecord, 
    addProstheticsRecord, 
    updateProstheticSession,
    updateProstheticLabStatus,
    addPayment,
    updateOrthoNotes
  } = useStore();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState("all");
  const [filterRiskLevel, setFilterRiskLevel] = useState<"all" | "Low" | "Moderate" | "High">("all");

  // Selection
  const activePatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  // Modals / Collapse States
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false);

  // Edit patient profile fields state
  const [editPatientName, setEditPatientName] = useState("");
  const [editPatientPhone, setEditPatientPhone] = useState("");
  const [editPatientWhatsapp, setEditPatientWhatsapp] = useState("");
  const [editPatientEmail, setEditPatientEmail] = useState("");
  const [editPatientDob, setEditPatientDob] = useState("");
  const [editPatientGender, setEditPatientGender] = useState("");
  const [editPatientAddress, setEditPatientAddress] = useState("");
  const [editPatientOccupation, setEditPatientOccupation] = useState("");
  const [editPatientAllergies, setEditPatientAllergies] = useState("");
  const [editPatientWeight, setEditPatientWeight] = useState("");
  const [editPatientHeight, setEditPatientHeight] = useState("");
  const [editPatientRiskLevel, setEditPatientRiskLevel] = useState<"Low" | "Moderate" | "High">("Low");

  // Edit treatment records states
  const [editingRecord, setEditingRecord] = useState<{ id: string, type: "filling" | "extraction" | "prosthetic" | "session" } | null>(null);
  
  const [recordTooth, setRecordTooth] = useState(1);
  const [recordCost, setRecordCost] = useState(0);
  const [recordNotes, setRecordNotes] = useState("");
  const [recordDate, setRecordDate] = useState("");
  
  // Filling specific
  const [recordMaterial, setRecordMaterial] = useState<"Composite" | "Amalgam" | "GIC">("Composite");
  const [recordSurfaces, setRecordSurfaces] = useState<string[]>([]);
  
  // Extraction specific
  const [recordExtType, setRecordExtType] = useState<"Simple" | "Surgical" | "Impaction">("Simple");
  const [recordComplexity, setRecordComplexity] = useState<"Low" | "Medium" | "High">("Low");
  const [recordPostOp, setRecordPostOp] = useState("");
  
  // Prosthetic specific
  const [recordProsType, setRecordProsType] = useState<ProstheticType>("Zirconia");
  const [recordLab, setRecordLab] = useState("");
  const [recordLabStatus, setRecordLabStatus] = useState<LabStatus>("Sent to Lab");
  const [recordPaid, setRecordPaid] = useState(0);
  
  // Session specific
  const [recordProcType, setRecordProcType] = useState("");
  const [recordDocName, setRecordDocName] = useState("");
  const [recordTime, setRecordTime] = useState("");

  const recordAdjustHour = (delta: number) => {
    const parts = recordTime.split(' ');
    const hm = parts[0].split(':');
    const current = parseInt(hm[0], 10) || 12;
    let next = current + delta;
    if (next > 12) next = 1;
    if (next < 1) next = 12;
    setRecordTime(`${String(next).padStart(2, '0')}:${hm[1] || "00"} ${parts[1] || "AM"}`);
  };

  const recordAdjustMinute = (delta: number) => {
    const parts = recordTime.split(' ');
    const hm = parts[0].split(':');
    const current = parseInt(hm[1], 10) || 0;
    let next = current + delta;
    if (next > 59) next = 0;
    if (next < 0) next = 59;
    setRecordTime(`${hm[0] || "10"}:${String(next).padStart(2, '0')} ${parts[1] || "AM"}`);
  };

  const openEditPatientModal = () => {
    if (!activePatient) return;
    setEditPatientName(activePatient.name || "");
    setEditPatientPhone(activePatient.phone || "");
    setEditPatientWhatsapp(activePatient.whatsapp || "");
    setEditPatientEmail(activePatient.email || "");
    setEditPatientDob(activePatient.dob || "");
    setEditPatientGender(activePatient.gender || "Female");
    setEditPatientAddress(activePatient.address || "");
    setEditPatientOccupation(activePatient.occupation || "");
    setEditPatientAllergies(activePatient.allergies || "None");
    setEditPatientWeight(activePatient.weight || "");
    setEditPatientHeight(activePatient.height || "");
    setEditPatientRiskLevel(activePatient.riskLevel || "Low");
    setIsEditPatientOpen(true);
  };

  const handleSavePatientEdits = () => {
    if (!activePatient) return;
    updatePatient(activePatient.id, {
      name: editPatientName,
      phone: editPatientPhone,
      whatsapp: editPatientWhatsapp,
      email: editPatientEmail,
      dob: editPatientDob,
      gender: editPatientGender,
      address: editPatientAddress,
      occupation: editPatientOccupation,
      allergies: editPatientAllergies,
      weight: editPatientWeight,
      height: editPatientHeight,
      riskLevel: editPatientRiskLevel
    });
    setIsEditPatientOpen(false);
  };

  const startEditingRecord = (item: any, type: "filling" | "extraction" | "prosthetic" | "session") => {
    setEditingRecord({ id: item.id, type });
    setRecordTooth(item.toothNumber || 1);
    setRecordCost(item.cost || item.totalCost || 0);
    setRecordNotes(item.notes || item.reason || "");
    setRecordDate(item.date || "");
    
    if (type === "filling") {
      setRecordMaterial(item.material || "Composite");
      setRecordSurfaces(item.surfaces || []);
    } else if (type === "extraction") {
      setRecordExtType(item.type || "Simple");
      setRecordComplexity(item.complexity || "Low");
      setRecordPostOp(item.postOpStatus || "");
    } else if (type === "prosthetic") {
      setRecordProsType(item.prostheticType || "Zirconia");
      setRecordLab(item.labName || "");
      setRecordLabStatus(item.labStatus || "Sent to Lab");
      setRecordPaid(item.paidAmount || 0);
    } else if (type === "session") {
      setRecordProcType(item.procedureType || "");
      setRecordDocName(item.doctorName || "");
      setRecordTime(item.time || "");
    }
  };

  const handleSaveRecordEdit = () => {
    if (!activePatient || !editingRecord) return;
    const { id, type } = editingRecord;
    
    if (type === "filling") {
      const updated = activePatient.fillingRecords.map(f => f.id === id ? {
        ...f,
        toothNumber: Number(recordTooth),
        material: recordMaterial,
        cost: Number(recordCost),
        notes: recordNotes,
        date: recordDate,
        surfaces: recordSurfaces as any
      } : f);
      updatePatient(activePatient.id, { fillingRecords: updated });
    } else if (type === "extraction") {
      const updated = activePatient.extractionRecords.map(e => e.id === id ? {
        ...e,
        toothNumber: Number(recordTooth),
        type: recordExtType,
        complexity: recordComplexity,
        reason: recordNotes,
        cost: Number(recordCost),
        date: recordDate,
        postOpStatus: recordPostOp
      } : e);
      updatePatient(activePatient.id, { extractionRecords: updated });
    } else if (type === "prosthetic") {
      const updated = activePatient.prostheticsRecords.map(p => p.id === id ? {
        ...p,
        toothNumber: Number(recordTooth),
        prostheticType: recordProsType,
        labName: recordLab,
        labStatus: recordLabStatus,
        totalCost: Number(recordCost),
        paidAmount: Number(recordPaid),
        remainingAmount: Number(recordCost) - Number(recordPaid),
        paymentStatus: (Number(recordPaid) >= Number(recordCost) ? "Fully Paid" : Number(recordPaid) > 0 ? "Partially Paid" : "Unpaid") as any,
        notes: recordNotes,
        date: recordDate
      } : p);
      updatePatient(activePatient.id, { prostheticsRecords: updated });
    } else if (type === "session") {
      const updated = (activePatient.sessions || []).map(s => s.id === id ? {
        ...s,
        procedureType: recordProcType,
        doctorName: recordDocName,
        date: recordDate,
        time: recordTime,
        notes: recordNotes
      } : s);
      updatePatient(activePatient.id, { sessions: updated });
    }
    
    setEditingRecord(null);
  };

  const handleDeleteRecord = (id: string, type: "filling" | "extraction" | "prosthetic" | "session") => {
    if (!activePatient) return;
    if (!confirm(`Are you sure you want to delete this clinical ${type} record permanently?`)) return;
    
    if (type === "filling") {
      updatePatient(activePatient.id, {
        fillingRecords: activePatient.fillingRecords.filter(f => f.id !== id)
      });
    } else if (type === "extraction") {
      updatePatient(activePatient.id, {
        extractionRecords: activePatient.extractionRecords.filter(e => e.id !== id)
      });
    } else if (type === "prosthetic") {
      updatePatient(activePatient.id, {
        prostheticsRecords: activePatient.prostheticsRecords.filter(p => p.id !== id)
      });
    } else if (type === "session") {
      updatePatient(activePatient.id, {
        sessions: (activePatient.sessions || []).filter(s => s.id !== id)
      });
    }
  };

  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [isPediatricMode, setIsPediatricMode] = useState(false);

  // Calculate if active patient is a child (under 16 years as of 2026)
  const isChildPatient = (dob?: string) => {
    if (!dob) return false;
    const birthYear = new Date(dob).getFullYear();
    const currentYear = 2026;
    return (currentYear - birthYear) < 16;
  };

  // Dynamically calculate clinical age as of current clinic date (May 2026)
  const calculateAge = (dobString?: string) => {
    if (!dobString) return 0;
    try {
      const birthDate = new Date(dobString);
      if (isNaN(birthDate.getTime())) return 0;
      const currentYear = 2026;
      const currentMonth = 4; // May (0-indexed)
      const currentDay = 27;

      let age = currentYear - birthDate.getFullYear();
      const monthDiff = currentMonth - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && currentDay < birthDate.getDate())) {
        age--;
      }
      return age >= 0 ? age : 0;
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    if (activePatient) {
      setIsPediatricMode(isChildPatient(activePatient.dob));
    }
  }, [activePatient?.id, activePatient?.dob]);

  const [activeTreatmentTab, setActiveTreatmentTab] = useState<"filling" | "extraction" | "crown">("filling");

  // Multi-Specialty Clinical Department tracker state
  const [activeSpecialtyTab, setActiveSpecialtyTab] = useState("endodontics");

  // Endodontic Case Working Length Canal Temp Input states
  const [newCanalName, setNewCanalName] = useState("MB1");
  const [newEstLength, setNewEstLength] = useState("21.5mm");
  const [newFinalLength, setNewFinalLength] = useState("21.0mm");
  const [newApexLocator, setNewApexLocator] = useState("0.0 (Apex)");
  const [newFileSize, setNewFileSize] = useState("#25");

  // Print Case Summary Simulated Preview toggles
  const [showEndoSummaryLabel, setShowEndoSummaryLabel] = useState(false);

  // Helper actions to maintain multi-specialty case folders
  const updateEndoCase = (updatedEndo: Partial<EndodonticCase>) => {
    if (!activePatient) return;
    const records = activePatient.specialtyRecords || {};
    const cases = records.endoCases || [];
    
    let updatedCases;
    if (cases.length === 0) {
      const firstCase: EndodonticCase = {
        toothNumber: 11,
        chiefComplaint: "Lingering throbbing distress and sensitivity.",
        spontaneousPain: "Mild",
        nightPain: false,
        coldSensitivity: "None",
        heatSensitivity: "None",
        painChewing: false,
        swelling: false,
        abscess: false,
        sinusTract: false,
        pulpDiagnosis: "Normal pulp",
        apicalDiagnosis: "Normal apical tissue",
        workingLengths: [],
        instrumentationSystem: "WaveOne Gold Primary",
        glidePath: "ProGlider",
        irrigationProtocol: { sodiumHypo: "2.5% NaOCl", edta: true, chlorhexidine: false, activation: "None" },
        intracanalMedication: { material: "Calcium Hydroxide", placedDate: "", removalDate: "" },
        obturationDetails: { technique: "Single Cone", sealerType: "Bioceramic Sealer", coneSize: "#25", date: "", operator: "" },
        followUpNotes: "",
        caseStatus: "Diagnosed",
        ...updatedEndo
      };
      updatedCases = [firstCase];
    } else {
      updatedCases = cases.map((c, idx) => idx === 0 ? { ...c, ...updatedEndo } : c);
    }

    updatePatient(activePatient.id, {
      specialtyRecords: {
        ...records,
        endoCases: updatedCases
      }
    });
  };

  const initEndoCase = () => {
    if (!activePatient) return;
    const records = activePatient.specialtyRecords || {};
    const defaultCase: EndodonticCase = {
      toothNumber: 14,
      chiefComplaint: "Pulp exposure on deep carious decay.",
      spontaneousPain: "Moderate",
      nightPain: false,
      coldSensitivity: "Severe",
      heatSensitivity: "None",
      painChewing: true,
      swelling: false,
      abscess: false,
      sinusTract: false,
      pulpDiagnosis: "Irreversible pulpitis",
      apicalDiagnosis: "Symptomatic apical periodontitis",
      workingLengths: [
        { canal: "MB1", estLength: "22mm", finalLength: "21.5mm", apexLocator: "0.0", fileSize: "#25" }
      ],
      instrumentationSystem: "TruShape 3D System",
      glidePath: "K-File #15",
      irrigationProtocol: { sodiumHypo: "5.25% NaOCl", edta: true, chlorhexidine: true, activation: "Sonic activation" },
      intracanalMedication: { material: "Calcium Hydroxide", placedDate: new Date().toISOString().split('T')[0], removalDate: "" },
      obturationDetails: { technique: "Warm Vertical", sealerType: "Bioceramic Sealer", coneSize: "#25/.04", date: "", operator: currentUser?.name || "Practitioner" },
      followUpNotes: "Awaiting final composite post core reconstruction.",
      caseStatus: "Medication Phase"
    };

    updatePatient(activePatient.id, {
      specialtyRecords: {
        ...records,
        endoCases: [defaultCase, ...(records.endoCases || [])]
      }
    });
  };

  const addWorkingLength = () => {
    if (!activePatient) return;
    const records = activePatient.specialtyRecords || {};
    const cases = records.endoCases || [];
    if (cases.length === 0) return;

    const activeCase = cases[0];
    const currentWls = activeCase.workingLengths || [];
    const newWl = {
      canal: newCanalName,
      estLength: newEstLength,
      finalLength: newFinalLength,
      apexLocator: newApexLocator,
      fileSize: newFileSize
    };

    const updatedLengths = [...currentWls, newWl];
    updateEndoCase({ workingLengths: updatedLengths });

    // reset canal inputs
    setNewCanalName("DB");
    setNewEstLength("20.0mm");
    setNewFinalLength("19.5mm");
    setNewApexLocator("0.0");
    setNewFileSize("#25");
  };

  const updatePeriodontalRecord = (updatedPerio: Partial<PeriodonticRecord>) => {
    if (!activePatient) return;
    const records = activePatient.specialtyRecords || {};
    const currentPerio = records.perioRecord || {
      scalingAndPlaningDate: "",
      pocketDepthMax: 3,
      bleedingIndices: "None",
      mobilityIndex: "Grade 0",
      boneLossPercentage: 0,
      implantSupportStatus: "Normal pocket depths"
    };
    
    updatePatient(activePatient.id, {
      specialtyRecords: {
        ...records,
        perioRecord: { ...currentPerio, ...updatedPerio }
      }
    });
  };

  const updateOrthodonticRecord = (updatedOrtho: Partial<OrthodonticRecord>) => {
    if (!activePatient) return;
    const records = activePatient.specialtyRecords || {};
    const currentOrtho = records.orthoRecord || {
      bracketSystem: "Standard Ceramic Custom",
      currentWire: "0.016 NiTi",
      biteCorrection: "Class I normal alignment",
      complianceScore: "Good",
      jawAlignmentNotes: ""
    };

    updatePatient(activePatient.id, {
      specialtyRecords: {
        ...records,
        orthoRecord: { ...currentOrtho, ...updatedOrtho }
      }
    });
  };

  const updatePediatricNotes = (updatedPed: Partial<PediatricNotes>) => {
    if (!activePatient) return;
    const records = activePatient.specialtyRecords || {};
    const currentPed = records.pediatricNotes || {
      habitThumbSucking: false,
      habitTongueThrust: false,
      growthStatus: "Normal primary eruption",
      behavioralScore: "Cooperative"
    };

    updatePatient(activePatient.id, {
      specialtyRecords: {
        ...records,
        pediatricNotes: { ...currentPed, ...updatedPed }
      }
    });
  };

  // For Adding Patient
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [newPatientWhatsapp, setNewPatientWhatsapp] = useState("");
  const [newPatientEmail, setNewPatientEmail] = useState("");
  const [newPatientDob, setNewPatientDob] = useState("");
  const [newPatientGender, setNewPatientGender] = useState("Female");
  const [newPatientOrtho, setNewPatientOrtho] = useState("");
  const [newPatientRiskRef, setNewPatientRiskRef] = useState<"Low" | "Moderate" | "High">("Low");
  const [newPatientAllergies, setNewPatientAllergies] = useState("None");
  const [newPatientWeight, setNewPatientWeight] = useState("70 kg");
  const [newPatientHeight, setNewPatientHeight] = useState("175 cm");

  // Treatment form states
  const [fillingMaterial, setFillingMaterial] = useState<FillingType>("Composite");
  const [fillingSurfaces, setFillingSurfaces] = useState<("O" | "M" | "D" | "B" | "L")[]>(["O"]);
  const [fillingCost, setFillingCost] = useState(180);
  const [fillingNotes, setFillingNotes] = useState("");

  const [extractionType, setExtractionType] = useState<ExtractionType>("Simple");
  const [extractionReason, setExtractionReason] = useState("");
  const [extractionComplexity, setExtractionComplexity] = useState<ComplexityLevel>("Low");
  const [extractionPostOp, setExtractionPostOp] = useState("Healing normally. Suture intact.");
  const [extractionCost, setExtractionCost] = useState(220);

  const [prostheticType, setProstheticType] = useState<ProstheticType>("Zirconia");
  const [crownLab, setCrownLab] = useState("Apex Advanced Labs");
  const [crownTotalCost, setCrownTotalCost] = useState(1400);
  const [crownPaidAmount, setCrownPaidAmount] = useState(900);
  const [crownNotes, setCrownNotes] = useState("");

  // Payment popup on patients page
  const [payingCrownId, setPayingCrownId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(100);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card" | "Bank Transfer">("Cash");

  // Inline notes editing states for prosthetics
  const [editingSessionNoteId, setEditingSessionNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState("");

  // Filtering Logic
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.phone.includes(searchTerm) ||
                          p.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGender = filterGender === "all" || p.gender === filterGender;
      const matchRiskLevel = filterRiskLevel === "all" || p.riskLevel === filterRiskLevel;
      return matchSearch && matchGender && matchRiskLevel;
    });
  }, [patients, searchTerm, filterGender, filterRiskLevel]);

  // Tooth status utilities
  const getToothStatus = (toothNum: number, patient: Patient | null) => {
    if (!patient) return null;
    
    const extraction = patient.extractionRecords.find(e => e.toothNumber === toothNum);
    if (extraction) return { type: "extraction", detail: extraction };

    const filling = patient.fillingRecords.find(f => f.toothNumber === toothNum);
    if (filling) return { type: "filling", detail: filling };

    const crown = patient.prostheticsRecords.find(c => c.toothNumber === toothNum);
    if (crown) return { type: "crown", detail: crown };

    return null;
  };

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName || !newPatientPhone) return;

    const newId = addPatient({
      name: newPatientName,
      phone: newPatientPhone,
      whatsapp: newPatientWhatsapp || undefined,
      email: newPatientEmail || undefined,
      dob: newPatientDob || "1990-01-01",
      gender: newPatientGender,
      orthoNotes: newPatientOrtho,
      riskLevel: newPatientRiskRef,
      allergies: newPatientAllergies,
      weight: newPatientWeight,
      height: newPatientHeight
    });

    onSelectPatient(newId);
    setIsAddPatientOpen(false);
    resetPatientForm();
  };

  const resetPatientForm = () => {
    setNewPatientName("");
    setNewPatientPhone("");
    setNewPatientWhatsapp("");
    setNewPatientEmail("");
    setNewPatientDob("");
    setNewPatientGender("Female");
    setNewPatientOrtho("");
    setNewPatientRiskRef("Low");
    setNewPatientAllergies("None");
    setNewPatientWeight("70 kg");
    setNewPatientHeight("175 cm");
  };

  const handleAddFilling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !selectedTooth) return;

    addFillingRecord(activePatient.id, {
      toothNumber: selectedTooth,
      material: fillingMaterial,
      surfaces: fillingSurfaces,
      cost: fillingCost,
      notes: fillingNotes || "Routine occlusal filling."
    });

    setSelectedTooth(null);
    setFillingNotes("");
  };

  const handleAddExtraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !selectedTooth) return;

    addExtractionRecord(activePatient.id, {
      toothNumber: selectedTooth,
      type: extractionType,
      reason: extractionReason || "Severe localized decay / bone attachment loss",
      complexity: extractionComplexity,
      postOpStatus: extractionPostOp,
      cost: extractionCost
    });

    setSelectedTooth(null);
    setExtractionReason("");
  };

  const handleAddCrown = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !selectedTooth) return;

    addProstheticsRecord(activePatient.id, {
      toothNumber: selectedTooth,
      prostheticType,
      labName: crownLab,
      labStatus: "Sent to Lab",
      totalCost: crownTotalCost,
      paidAmount: Math.min(crownPaidAmount, crownTotalCost),
      notes: crownNotes || "Preparation done. Color match shade A2."
    });

    setSelectedTooth(null);
    setCrownNotes("");
  };

  const handleSurfaceToggle = (surf: "O" | "M" | "D" | "B" | "L") => {
    if (fillingSurfaces.includes(surf)) {
      setFillingSurfaces(fillingSurfaces.filter(s => s !== surf));
    } else {
      setFillingSurfaces([...fillingSurfaces, surf]);
    }
  };

  const handleCrownPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !payingCrownId) return;

    addPayment(activePatient.id, payingCrownId, paymentAmount, paymentMethod);
    setPayingCrownId(null);
  };

  const generatePatientSummaryPDF = () => {
    if (!activePatient) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    let pageNum = 1;
    let yPos = 80;

    const drawHeaderFooter = (p: number) => {
      // Top blue bar
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 6, "F");

      // Header branding
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text("ZENDENTA DENTAL ERP", 15, 14);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Clinical Dossier Summary: ${activePatient.name} (ID: ${activePatient.id})`, 15, 18);

      doc.text(`Generated: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`, 195, 14, { align: "right" });
      doc.text(`Operator: ${currentUser?.email || "Unknown"}`, 195, 18, { align: "right" });

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(15, 22, 195, 22);

      // Bottom footer divider
      doc.setDrawColor(241, 245, 249);
      doc.line(15, 280, 195, 280);

      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text("Zendenta ERP • Confidential Clinical History & Risk Assessment Report", 15, 285);
      doc.text(`Page ${p}`, 190, 285, { align: "right" });
    };

    const checkPageBreak = (heightNeeded: number) => {
      if (yPos + heightNeeded > 270) {
        doc.addPage();
        pageNum += 1;
        drawHeaderFooter(pageNum);
        yPos = 30;
      }
    };

    const drawSectionHeader = (title: string) => {
      checkPageBreak(18);
      doc.setFillColor(241, 245, 249);
      doc.rect(15, yPos, 180, 7, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(title, 18, yPos + 5);
      yPos += 11;
    };

    // Initialize first page header
    drawHeaderFooter(pageNum);

    // Patient Registration & Vitals Block (Page 1)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, 26, 180, 48, 2, 2, "FD");

    // Title of block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(26, 54, 110);
    doc.text("PATIENT DISCLOSURE & DEMOGRAPHIC RISK PROFILE", 20, 32);

    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    // Column 1
    doc.setFont("helvetica", "bold"); doc.text("Full Patient Name:", 20, 38);
    doc.setFont("helvetica", "normal"); doc.text(activePatient.name, 48, 38);

    doc.setFont("helvetica", "bold"); doc.text("Patient ID Code:", 20, 43);
    doc.setFont("helvetica", "normal"); doc.text(activePatient.id, 48, 43);

    doc.setFont("helvetica", "bold"); doc.text("Birthdate & Age:", 20, 48);
    doc.setFont("helvetica", "normal"); doc.text(`${activePatient.dob} (${calculateAge(activePatient.dob)} yrs)`, 48, 48);

    doc.setFont("helvetica", "bold"); doc.text("Gender Class:", 20, 53);
    doc.setFont("helvetica", "normal"); doc.text(activePatient.gender, 48, 53);

    // Column 2
    doc.setFont("helvetica", "bold"); doc.text("Primary Contact:", 110, 38);
    doc.setFont("helvetica", "normal"); doc.text(activePatient.phone, 138, 38);

    doc.setFont("helvetica", "bold"); doc.text("WhatsApp Channel:", 110, 43);
    doc.setFont("helvetica", "normal"); doc.text(activePatient.whatsapp || "None Provided", 138, 43);

    doc.setFont("helvetica", "bold"); doc.text("Email Address:", 110, 48);
    doc.setFont("helvetica", "normal"); doc.text(activePatient.email || "None On Record", 138, 48);

    doc.setFont("helvetica", "bold"); doc.text("Billing Address:", 110, 53);
    doc.setFont("helvetica", "normal"); doc.text(activePatient.address || "Universal Record", 138, 53);

    // Allergies & Vitals
    doc.setFont("helvetica", "bold"); doc.text("Known Allergies:", 20, 60);
    doc.setFont("helvetica", "bold"); doc.setTextColor(225, 29, 72);
    doc.text(activePatient.allergies || "None Declared", 48, 60);
    doc.setTextColor(71, 85, 105);

    doc.setFont("helvetica", "bold"); doc.text("Weight & Height:", 110, 60);
    doc.setFont("helvetica", "normal"); doc.text(`${activePatient.weight || "N/A"}  /  ${activePatient.height || "N/A"}`, 138, 60);

    // System Risk level bar
    doc.setFont("helvetica", "bold"); doc.text("CLINICAL RISK PROFILE RATING:", 20, 68);
    const risk = activePatient.riskLevel || "Low";
    if (risk === "High") {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(252, 165, 165);
      doc.setTextColor(220, 38, 38);
    } else if (risk === "Moderate") {
      doc.setFillColor(254, 243, 199);
      doc.setDrawColor(251, 191, 36);
      doc.setTextColor(217, 119, 6);
    } else {
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.setTextColor(21, 128, 61);
    }
    doc.roundedRect(68, 64, 120, 6, 1, 1, "FD");
    doc.text(`${risk.toUpperCase()} CLINICAL DENTAL RISK (Continuous Professional Surveillance Advised)`, 72, 68);

    doc.setTextColor(30, 41, 59);

    // Restorative fillings
    drawSectionHeader("RESTORATIVE TREATMENTS (COMPOSITE / AMALGAM / GIC FILLINGS)");
    if (activePatient.fillingRecords && activePatient.fillingRecords.length > 0) {
      activePatient.fillingRecords.forEach((f) => {
        checkPageBreak(18);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(241, 245, 249);
        doc.roundedRect(15, yPos, 180, 14, 1, 1, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`Tooth Node ID: FDI ${f.toothNumber}`, 18, yPos + 4);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Compound Material: ${f.material}`, 70, yPos + 4);
        doc.text(`Surfaces Mapped: ${f.surfaces.join(", ")}`, 110, yPos + 4);
        doc.text(`Procedure Fee: $${f.cost}`, 155, yPos + 4);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Clinical Diagnosis & Treatment Note: ${f.notes || "Procedure completed successfully."}`, 18, yPos + 9);

        yPos += 16;
      });
    } else {
      checkPageBreak(10);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("No active compound filling records mapped inside or registered inside this active folder.", 18, yPos + 4);
      yPos += 10;
    }

    // Extractions
    drawSectionHeader("SURGICAL INTERVENTIONS & TOOTH EXTRACTIONS RECORD");
    if (activePatient.extractionRecords && activePatient.extractionRecords.length > 0) {
      activePatient.extractionRecords.forEach((e) => {
        checkPageBreak(18);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(241, 245, 249);
        doc.roundedRect(15, yPos, 180, 14, 1, 1, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`Tooth Node ID: FDI ${e.toothNumber} (${e.type} Extraction)`, 18, yPos + 4);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Complexity Rating: ${e.complexity}`, 70, yPos + 4);
        doc.text(`Fee: $${e.cost}`, 115, yPos + 4);
        doc.text(`Completed Date: ${e.date || "N/A"}`, 150, yPos + 4);

        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Reason: ${e.reason}  |  Post-Op Check: ${e.postOpStatus || "No surgical complications noted."}`, 18, yPos + 9);

        yPos += 16;
      });
    } else {
      checkPageBreak(10);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("No extraction operations or active bone remodeling procedures inside this patient's directory.", 18, yPos + 4);
      yPos += 10;
    }

    // Prosthetics
    drawSectionHeader("PROSTHODONTICS & IMPLANT RESTORATIVE DOSSIER");
    if (activePatient.prostheticsRecords && activePatient.prostheticsRecords.length > 0) {
      activePatient.prostheticsRecords.forEach((p) => {
        checkPageBreak(22);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(241, 245, 249);
        doc.roundedRect(15, yPos, 180, 18, 1, 1, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`Abutment FDI Tooth ${p.toothNumber} - ${p.prostheticType}`, 18, yPos + 4);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Laboratory: ${p.labName}`, 75, yPos + 4);
        doc.text(`Status: ${p.labStatus}`, 115, yPos + 4);
        doc.text(`Date Registered: ${p.date || "N/A"}`, 150, yPos + 4);

        doc.text(`Financial Ledger: Fee $${p.totalCost} total (Disbursed: $${p.paidAmount} / Balance Due: $${p.remainingAmount})`, 18, yPos + 9);
        
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Prosthodontic Lab Notes: ${p.notes || "Bite registered, Shade value custom mapped."}`, 18, yPos + 14);

        yPos += 20;
      });
    } else {
      checkPageBreak(10);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("No active Crown, Bridge, Removable Partial, or Implant Prostheses logged inside this account.", 18, yPos + 4);
      yPos += 10;
    }

    // Specialty Casework Section
    const spec = activePatient.specialtyRecords;
    if (spec) {
      let isSpecialtyHeaderDrawn = false;

      const drawSpecTitleIfNeeded = () => {
        if (!isSpecialtyHeaderDrawn) {
          drawSectionHeader("CLINICAL SPECIALTY DEPARTMENTS CASE HISTORIES");
          isSpecialtyHeaderDrawn = true;
        }
      };

      if (spec.endoCases && spec.endoCases.length > 0) {
        drawSpecTitleIfNeeded();
        spec.endoCases.forEach((ec) => {
          checkPageBreak(35);
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(241, 245, 249);
          doc.roundedRect(15, yPos, 180, 28, 1, 1, "FD");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          doc.text(`Endodontics Case File - Tooth ${ec.toothNumber} (Department Status: ${ec.caseStatus})`, 18, yPos + 4);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          doc.text(`Chief Complaint: ${ec.chiefComplaint}`, 18, yPos + 9);
          doc.text(`Diagnoses: Pulp [${ec.pulpDiagnosis}]  |  Apical [${ec.apicalDiagnosis}]`, 18, yPos + 14);
          doc.text(`Instrumentation: ${ec.instrumentationSystem}  |  Glide Path: ${ec.glidePath}`, 18, yPos + 19);

          const wlStrs = ec.workingLengths?.map(wl => `${wl.canal} ${wl.finalLength}`).join(", ") || "None registered";
          doc.text(`Completed Root Canals & Length Measurement: ${wlStrs}`, 18, yPos + 24);

          yPos += 30;
        });
      }

      if (spec.perioRecord) {
        drawSpecTitleIfNeeded();
        const pr = spec.perioRecord;
        checkPageBreak(25);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(241, 245, 249);
        doc.roundedRect(15, yPos, 180, 18, 1, 1, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text("Periodontal Attachment & Bone Status Log", 18, yPos + 4);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Deepest Probe Pocket: ${pr.pocketDepthMax}mm  |  Bleeding: ${pr.bleedingIndices}`, 18, yPos + 9);
        doc.text(`Mobility: ${pr.mobilityIndex}  |  Bone Loss Ratio: ${pr.boneLossPercentage}%  |  Support: ${pr.implantSupportStatus || "Intact"}`, 18, yPos + 14);

        yPos += 20;
      }

      if (spec.orthoRecord || activePatient.orthoNotes) {
        drawSpecTitleIfNeeded();
        checkPageBreak(25);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(241, 245, 249);
        doc.roundedRect(15, yPos, 180, 18, 1, 1, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text("Orthodontic Appraisal & Malocclusion Records", 18, yPos + 4);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        if (spec.orthoRecord) {
          const or = spec.orthoRecord;
          doc.text(`Bracket Type: ${or.bracketSystem}  |  Archwire: ${or.currentWire}`, 18, yPos + 9);
          doc.text(`Bite Correction status: ${or.biteCorrection}  |  Compliance: ${or.complianceScore}`, 18, yPos + 14);
        } else {
          doc.text(`General Ortho Notes: ${activePatient.orthoNotes}`, 18, yPos + 9);
        }

        yPos += 20;
      }

      if (spec.pediatricNotes) {
        drawSpecTitleIfNeeded();
        const pd = spec.pediatricNotes;
        checkPageBreak(25);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(241, 245, 249);
        doc.roundedRect(15, yPos, 180, 18, 1, 1, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text("Pediatric Dental Behavior & Habits Index", 18, yPos + 4);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Anxiety behavioral score: ${pd.behavioralScore}  |  Dental Eruption/Growth: ${pd.growthStatus}`, 18, yPos + 9);
        doc.text(`Digital/Pacifier Habits: Thumb Sucking ${pd.habitThumbSucking ? "Yes" : "No"}  |  Tongue Thrust ${pd.habitTongueThrust ? "Yes" : "No"}`, 18, yPos + 14);

        yPos += 20;
      }
    }

    const safeFileName = activePatient.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    doc.save(`patient_summary_${safeFileName}.pdf`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="patients-system-panel">
      {/* 1. LEFT COLUMN: Patient search list */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[32px] p-5 shadow-sm h-auto lg:h-[calc(100vh-100px)] lg:min-h-[820px] flex flex-col justify-between">
        <div className="flex-1 overflow-hidden flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-800">Clinic Directory</h3>
            <button
              onClick={() => setIsAddPatientOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm shadow-blue-100"
              id="patient-add-btn"
            >
              <Plus size={14} />
              <span>New File</span>
            </button>
          </div>

          {/* Search Inputs */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, phone or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-705 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 focus:bg-white transition-all"
              id="patient-dir-search"
            />
          </div>

          {/* Optimized space-saving side-by-side filters to maximize list height */}
          <div className="grid grid-cols-2 gap-3 pb-1">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block font-sans">Gender:</span>
              <div className="flex gap-1">
                {["all", "Female", "Male"].map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setFilterGender(gender)}
                    className={`flex-1 py-1.5 rounded-lg text-[9.5px] font-bold border transition-all cursor-pointer truncate ${
                      filterGender === gender 
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {gender === "all" ? "All" : gender}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block font-sans">Risk / Priority:</span>
              <div className="flex gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200/50">
                {[
                  { id: "all", label: "All", color: "border-transparent text-slate-500 hover:text-slate-800" },
                  { id: "Low", label: "L", color: "border-transparent text-emerald-600 hover:text-emerald-700", activeColor: "bg-emerald-600 text-white border-emerald-600" },
                  { id: "Moderate", label: "M", color: "border-transparent text-amber-600 hover:text-amber-700", activeColor: "bg-amber-500 text-white border-amber-500" },
                  { id: "High", label: "H", color: "border-transparent text-rose-600 hover:text-rose-700", activeColor: "bg-rose-600 text-white border-rose-600" }
                ].map((risk) => {
                  const isActive = filterRiskLevel === risk.id;
                  return (
                    <button
                      key={risk.id}
                      onClick={() => setFilterRiskLevel(risk.id as any)}
                      className={`flex-1 py-1 text-[8.5px] font-black border rounded-md transition-all cursor-pointer text-center ${
                        isActive 
                          ? (risk.activeColor || "bg-blue-600 text-white border-blue-600 shadow-sm") 
                          : `${risk.color} border-transparent`
                      }`}
                      title={risk.id === "all" ? "All Priorities" : `${risk.id} Priority`}
                    >
                      {risk.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Directory List Container taking maximum available space */}
          <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar min-h-[480px] lg:min-h-[580px]">
            {filteredPatients.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <AlertCircle className="mx-auto mb-2 text-slate-300" size={24} />
                <span className="text-xs font-semibold">No direct results found</span>
              </div>
            ) : (
              filteredPatients.map((pat) => {
                const isSelected = pat.id === selectedPatientId;
                return (
                  <button
                    key={pat.id}
                    onClick={() => onSelectPatient(pat.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected 
                        ? "bg-blue-605/10 bg-blue-50 border-blue-200/50 shadow-sm font-semibold" 
                        : "bg-slate-50 border-slate-200/80 hover:bg-slate-100/50 hover:border-slate-300"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-slate-800 text-xs leading-none truncate">{pat.name}</h4>
                        {calculateAge(pat.dob) < 18 && (
                          <span className="text-[8px] bg-sky-100 text-rose-700 bg-rose-50 border border-rose-200/50 px-1.5 py-0.5 rounded-full font-extrabold uppercase shrink-0">
                            Pediatric
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                        <Phone size={9} /> {pat.phone}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5 font-medium font-mono">
                        DOB: {pat.dob} ({calculateAge(pat.dob)} yrs) • {pat.gender}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0 self-stretch justify-between">
                      {pat.riskLevel ? (
                        <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase text-center block w-fit border ${
                          pat.riskLevel === "High" 
                            ? "bg-rose-50 text-rose-600 border-rose-100" 
                            : pat.riskLevel === "Moderate"
                            ? "bg-amber-50 text-amber-600 border-amber-100"
                            : "bg-emerald-50 text-emerald-600 border-emerald-100"
                        }`}>
                          {pat.riskLevel}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase text-center block w-fit border bg-emerald-50 text-emerald-600 border-emerald-100">
                          Low
                        </span>
                      )}
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm animate-pulse" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Small stats summary inside left bar */}
        <div className="mt-4 pt-3 border-t border-slate-150 text-[10px] text-slate-400 flex items-center justify-between font-semibold">
          <span>Active Patient Folders:</span>
          <span className="font-bold text-slate-700">{patients.length} records</span>
        </div>
      </div>

      {/* 2. RIGHT COLUMN: Core interactive health map panel */}
      <div className="lg:col-span-8 space-y-6">
        {activePatient ? (
          <>
            {/* Folder Header Metadata card */}
            <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-700 border border-blue-200/50 flex items-center justify-center font-black text-lg shadow-inner overflow-hidden">
                    {activePatient.avatarUrl ? (
                      <img src={activePatient.avatarUrl} alt={activePatient.name} className="w-full h-full object-cover" />
                    ) : (
                      activePatient.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none">{activePatient.name}</h2>
                    <p className="text-xs text-slate-400 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span><strong>ID:</strong> {activePatient.id}</span>
                      <span>•</span>
                      <span><strong>Age/DOB:</strong> {activePatient.dob} ({calculateAge(activePatient.dob)} Years{calculateAge(activePatient.dob) < 18 ? " 🧸 Pediatric" : ""})</span>
                      <span>•</span>
                      <span><strong>Gender:</strong> {activePatient.gender}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span><strong>Phone:</strong> {activePatient.phone}</span>
                      {activePatient.whatsapp && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 font-bold"><strong>WhatsApp:</strong> {activePatient.whatsapp}</span>
                        </>
                      )}
                      {activePatient.email && (
                        <>
                          <span>•</span>
                          <span><strong>Email:</strong> {activePatient.email}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={openEditPatientModal}
                    className="px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/50 rounded-xl transition-all cursor-pointer text-xs font-bold flex items-center gap-2 shadow-xs active:scale-95"
                    title="Edit Patient Demographics and File Profile"
                  >
                    <Edit size={16} />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={generatePatientSummaryPDF}
                    className="px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 rounded-xl transition-all cursor-pointer text-xs font-bold flex items-center gap-2 shadow-xs active:scale-95"
                    title="Generate Patient Summary Printable Export (Clinical + Risk)"
                    id="patient-summary-pdf-btn"
                  >
                    <FileText size={16} />
                    <span>Generate Patient Summary</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Permanently wipe patient clinical record from system?")) {
                        deletePatient(activePatient.id);
                        onSelectPatient(null);
                      }
                    }}
                    className="p-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 hover:text-rose-700 border border-rose-200/30 transition-colors cursor-pointer"
                    title="Delete Patient Record"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Sub-panel mapping health parameters */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-205/65 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">System Risk Level</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${
                      activePatient.riskLevel === "High" ? "bg-red-500 animate-pulse" : 
                      activePatient.riskLevel === "Moderate" ? "bg-amber-500" : "bg-emerald-500"
                    }`} />
                    <select
                      value={activePatient.riskLevel || "Low"}
                      onChange={(e) => updatePatient(activePatient.id, { riskLevel: e.target.value as any })}
                      className="text-xs font-black text-slate-800 focus:outline-none bg-transparent cursor-pointer"
                    >
                      <option value="Low">Low Risk</option>
                      <option value="Moderate">Moderate</option>
                      <option value="High">High Risk</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-205/65 rounded-2xl flex flex-col justify-between col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Drug Allergies</span>
                  <input
                    type="text"
                    value={activePatient.allergies || "None"}
                    onChange={(e) => updatePatient(activePatient.id, { allergies: e.target.value })}
                    className="text-xs font-black text-rose-700 border-none bg-transparent focus:outline-none mt-1 min-w-0"
                    title="Click to edit allergies"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-205/65 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Patient Weight</span>
                  <input
                    type="text"
                    value={activePatient.weight || "N/A"}
                    onChange={(e) => updatePatient(activePatient.id, { weight: e.target.value })}
                    className="text-xs font-bold text-slate-700 font-mono border-none bg-transparent focus:outline-none mt-1 min-w-0"
                    title="Click to edit weight"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-205/65 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Patient Height</span>
                  <input
                    type="text"
                    value={activePatient.height || "N/A"}
                    onChange={(e) => updatePatient(activePatient.id, { height: e.target.value })}
                    className="text-xs font-bold text-slate-700 font-mono border-none bg-transparent focus:outline-none mt-1 min-w-0"
                    title="Click to edit height"
                  />
                </div>
              </div>
            </div>

            {/* ALERT: OUTSTANDING PAYMENTS / WHAT THE PATIENT OWES */}
            {(() => {
              const isProstheticRecord = (name: string) => {
                const lower = name.toLowerCase();
                return (
                  lower.includes("zirconia") ||
                  lower.includes("e-max") ||
                  lower.includes("porcelain") ||
                  lower.includes("bridge") ||
                  lower.includes("denture") ||
                  lower.includes("crown") ||
                  lower.includes("prosthetic")
                );
              };
              const prostOwed = activePatient.prostheticsRecords?.reduce((sum, pr) => sum + (pr.remainingAmount || 0), 0) || 0;
              const nonProstOwed = financialRecords
                .filter(f => f.patientId === activePatient.id && f.remainingAmount > 0 && !isProstheticRecord(f.procedureName))
                .reduce((sum, f) => sum + (f.remainingAmount || 0), 0) || 0;
              const totalOwed = prostOwed + nonProstOwed;
              const outstandingProsthetics = activePatient.prostheticsRecords?.filter(p => p.remainingAmount > 0) || [];

              if (totalOwed <= 0) return null;

              return (
                <div className="bg-amber-50/80 border border-orange-200 rounded-[24px] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center shrink-0 border border-orange-250/50">
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 tracking-tight">Active Financial Balance Outstanding</h4>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        We flagged an active outstanding balance of <span className="text-orange-600 font-extrabold font-mono">${totalOwed.toLocaleString()}</span> for prosthetic and clinical treatments in this patient's digital ledger.
                      </p>
                      {outstandingProsthetics.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {outstandingProsthetics.map(pr => (
                            <span key={pr.id} className="text-[10px] bg-white border border-slate-150/60 font-semibold text-slate-650 px-2.5 py-0.5 rounded-lg">
                              Tooth {pr.toothNumber} ({pr.prostheticType}) — Bal Due: <strong className="text-orange-600">${pr.remainingAmount}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const element = document.getElementById("active-prosthetics-section");
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth" });
                        } else {
                          window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                        }
                      }}
                      className="w-full md:w-auto px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CreditCard size={12} />
                      <span>Settle Outstanding Balances</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* INTERACTIVE TOOTH MAP SECTION */}
            <div className="bg-white border border-slate-205 rounded-[32px] p-6 shadow-sm">
              <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Map size={16} className="text-blue-500" />
                    <span>FDI Clinical Tooth Chart</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Click any anatomically mapped node below to register local composites, tooth extractions, or prosthetic crowns.</p>
                </div>
                {isChildPatient(activePatient.dob) && (
                  <div className="flex items-center gap-1 bg-slate-105 p-1 rounded-xl border border-slate-200/50 shadow-sm shrink-0 self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => setIsPediatricMode(false)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        !isPediatricMode 
                          ? "bg-blue-600 text-white shadow-sm" 
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Permanent (FDI 11-48)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPediatricMode(true)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        isPediatricMode 
                          ? "bg-blue-600 text-white shadow-sm" 
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Pediatric (FDI 51-85)
                    </button>
                  </div>
                )}
              </div>
              {/* Graphical teeth grid */}
              <div className="space-y-6 border border-slate-100 bg-slate-50/50 p-6 rounded-[24px]">
                {/* Upper Jaw Row */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                    {isPediatricMode ? "Maxillary Arch (Primary Upper Teeth • FDI 55 - 65)" : "Maxillary Arch (Upper Teeth • FDI 18 - 28)"}
                  </span>
                  <div className="w-full overflow-x-auto custom-scrollbar pb-2">
                    <div className={`grid gap-2 ${isPediatricMode ? "grid-cols-10 min-w-[540px]" : "grid-cols-16 min-w-[820px]"}`}>
                      {(isPediatricMode 
                        ? [55, 54, 53, 52, 51, 61, 62, 63, 64, 65] 
                        : [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
                      ).map((toothNum) => {
                        const status = getToothStatus(toothNum, activePatient);
                        return (
                          <button
                            key={toothNum}
                            onClick={() => setSelectedTooth(toothNum)}
                            className={`
                              border aspect-square rounded-xl text-center p-1 select-none flex flex-col items-center justify-between transition-all cursor-pointer select-none active:scale-90
                              ${status?.type === "extraction" 
                                ? "bg-slate-800 text-white border-slate-900 shadow-inner" 
                                : status?.type === "filling"
                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                : status?.type === "crown"
                                ? "bg-amber-100 text-amber-900 border-amber-300 shadow-[0_2px_8px_rgba(245,158,11,0.15)]"
                                : "bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/20"
                              }
                            `}
                            id={`tooth-node-${toothNum}`}
                          >
                            <span className="text-[9px] font-black">{toothNum}</span>
                            <span className="text-[8px] font-bold block pt-1 leading-none">
                              {status?.type === "extraction" ? "EXT" : 
                               status?.type === "filling" ? "FILL" : 
                               status?.type === "crown" ? "CRN" : "OK"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Lower Jaw Row */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                    {isPediatricMode ? "Mandibular Arch (Primary Lower Teeth • FDI 85 - 75)" : "Mandibular Arch (Lower Teeth • FDI 48 - 38)"}
                  </span>
                  <div className="w-full overflow-x-auto custom-scrollbar pb-2">
                    <div className={`grid gap-2 ${isPediatricMode ? "grid-cols-10 min-w-[540px]" : "grid-cols-16 min-w-[820px]"}`}>
                      {(isPediatricMode 
                        ? [85, 84, 83, 82, 81, 71, 72, 73, 74, 75] 
                        : [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
                      ).map((toothNum) => {
                        const status = getToothStatus(toothNum, activePatient);
                        return (
                          <button
                            key={toothNum}
                            onClick={() => setSelectedTooth(toothNum)}
                            className={`
                              border aspect-square rounded-xl text-center p-1 select-none flex flex-col items-center justify-between transition-all cursor-pointer select-none active:scale-90
                              ${status?.type === "extraction" 
                                ? "bg-slate-800 text-white border-slate-900" 
                                : status?.type === "filling"
                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                : status?.type === "crown"
                                ? "bg-amber-100 text-amber-900 border-amber-300 shadow-[0_2px_8px_rgba(245,158,11,0.15)]"
                                : "bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/20"
                              }
                            `}
                            id={`tooth-node-${toothNum}`}
                          >
                            <span className="text-[9px] font-black">{toothNum}</span>
                            <span className="text-[8px] font-bold block pt-1 leading-none">
                              {status?.type === "extraction" ? "EXT" : 
                               status?.type === "filling" ? "FILL" : 
                               status?.type === "crown" ? "CRN" : "OK"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Code Legend indicator */}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-bold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-white border border-slate-200 block" />
                  <span>Healthy / Intact Structure</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-blue-100 border border-blue-300 block" />
                  <span>Filling (Composite / GIC)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-slate-800 block" />
                  <span>Extracted Tooth Space</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-300 block" />
                  <span>Implanted Crown / Bridge Prosthesis</span>
                </div>
              </div>
            </div>

             {/* COMPREHENSIVE MULTI-SPECIALTY CLINICAL DEPARTMENTS & CASES CODES */}
            <div className="frosted-glass-panel rounded-[32px] p-6 shadow-sm space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100/85">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Stethoscope size={16} className="text-blue-500 animate-pulse" />
                    <span>Clinical Specialties & Casework folders</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Explore, monitor, and record patient metrics across all clinical departments & specialties.</p>
                </div>
                <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-150/40">
                  {["endodontics", "ortho", "periodontics", "general", "pediatric", "imaging", "surgery", "digital"].map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => setActiveSpecialtyTab(spec)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                        activeSpecialtyTab === spec
                          ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                          : "text-slate-500 hover:text-slate-800 border border-transparent"
                      }`}
                    >
                      {spec === "endodontics" && "Endo (RCT)"}
                      {spec === "ortho" && "Ortho"}
                      {spec === "periodontics" && "Perio"}
                      {spec === "general" && "Preventive"}
                      {spec === "pediatric" && "Pediatric"}
                      {spec === "imaging" && "Diagnostics / CBCT"}
                      {spec === "surgery" && "Surgery Logs"}
                      {spec === "digital" && "Digital / CAD-CAM"}
                    </button>
                  ))}
                </div>
              </div>

              {/* SPECIALTY CONTENT: ENDODONTICS (ADVANCED RCT CASE FILES) */}
              {activeSpecialtyTab === "endodontics" && (() => {
                const cases = activePatient.specialtyRecords?.endoCases || [];
                const activeCase = cases[0];

                if (!activeCase) {
                  return (
                    <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-5">
                      <FileText className="mx-auto text-slate-350 mb-2" size={32} />
                      <h4 className="text-xs font-bold text-slate-700">No Endodontic Case Records logged</h4>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">Establish a complete root canal dossier to record apex locator tracking, canal lengths, and obturation indices.</p>
                      <button
                        type="button"
                        onClick={initEndoCase}
                        className="mt-3.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-[11px] font-bold hover:opacity-90 shadow-sm cursor-pointer transition-opacity"
                      >
                        + Initialize Endodontic Case File
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Status Stepper Progression */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9.5px] uppercase font-black text-slate-400 tracking-wider">Dynamic RCT Case Status Stepper</span>
                        <span className="text-[9.5px] font-bold text-slate-500 bg-white border border-slate-200 rounded-full px-2 py-0.5">
                          Active Phase: <span className="font-extrabold text-indigo-600">{activeCase.caseStatus}</span>
                        </span>
                      </div>
                      
                      <div className="relative border border-slate-100/60 bg-slate-50/50 rounded-2xl p-4 shadow-inner overflow-x-auto custom-scrollbar select-none">
                        <div className="min-w-[850px] relative flex items-center justify-between py-1">

                          {/* Connector line */}
                          <div className="absolute left-6 right-6 top-[15px] h-1 bg-slate-200 z-0" />
                          {[
                            "Diagnosed", "Access Opened", "Instrumentation In Progress", 
                            "Medication Phase", "Obturation Completed", "Restoration Pending", "Completed"
                          ].map((node, i, arr) => {
                            const isPastOrCurrent = arr.indexOf(activeCase.caseStatus) >= i;
                            const isCurrent = activeCase.caseStatus === node;

                            return (
                              <button
                                key={node}
                                type="button"
                                onClick={() => updateEndoCase({ caseStatus: node as any })}
                                className="flex flex-col items-center relative z-10 w-20 group cursor-pointer"
                              >
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center border text-[10px] font-black transition-all ${
                                  isCurrent
                                    ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100 scale-105"
                                    : isPastOrCurrent
                                      ? "bg-emerald-600 border-emerald-600 text-white"
                                      : "bg-white border-slate-300 text-slate-400 group-hover:border-slate-400"
                                }`}>
                                  {isPastOrCurrent && !isCurrent ? <Check size={11} className="stroke-[3]" /> : i + 1}
                                </div>
                                <span className={`text-[8.5px] font-extrabold uppercase tracking-wider mt-1.5 text-center leading-tight ${
                                  isCurrent ? "text-blue-600" : isPastOrCurrent ? "text-slate-650" : "text-slate-400"
                                }`}>
                                  {node.replace(" In Progress", "").replace(" Completed", "")}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Form Layout: Symptoms & Pulp Vitality Diagnostician */}
                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-150/40 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Symptoms Checklist */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Pulp Symptoms & Clinical Status Signs</h4>
                        
                        <div className="grid grid-cols-2 gap-3 pb-1">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 block uppercase">Spontaneous Pain</label>
                            <select
                              value={activeCase.spontaneousPain}
                              onChange={(e) => updateEndoCase({ spontaneousPain: e.target.value as any })}
                              className="w-full bg-white p-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-400"
                            >
                              <option value="None">None</option>
                              <option value="Mild">Mild / Intermittent</option>
                              <option value="Moderate">Moderate throbbing</option>
                              <option value="Severe">Severe pulsing</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 block uppercase">Tooth Number</label>
                            <select
                              value={activeCase.toothNumber}
                              onChange={(e) => updateEndoCase({ toothNumber: Number(e.target.value) })}
                              className="w-full bg-white p-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-400"
                            >
                              {[11,12,13,14,15,16,17,18,21,22,23,24,25,26,27,28,31,32,33,34,35,36,37,38,41,42,43,44,45,46,47,48].map((tooth) => (
                                <option key={tooth} value={tooth}>FDI #{tooth}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-650">
                            <input
                              type="checkbox"
                              checked={activeCase.nightPain}
                              onChange={(e) => updateEndoCase({ nightPain: e.target.checked })}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Nocturnal Sleep Pain</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-650">
                            <input
                              type="checkbox"
                              checked={activeCase.painChewing}
                              onChange={(e) => updateEndoCase({ painChewing: e.target.checked })}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Pain on Percussion</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-650">
                            <input
                              type="checkbox"
                              checked={activeCase.swelling}
                              onChange={(e) => updateEndoCase({ swelling: e.target.checked })}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Facial/Mucosal Swelling</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-650">
                            <input
                              type="checkbox"
                              checked={activeCase.sinusTract}
                              onChange={(e) => updateEndoCase({ sinusTract: e.target.checked })}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Sinus Tract / Fistula</span>
                          </label>
                        </div>
                      </div>

                      {/* Right: Diagnosis Category Selectors */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Aesthetic pulp & Periapical Clinical diagnoses</h4>
                        
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400 block uppercase">Pulp Diagnosis</label>
                          <select
                            value={activeCase.pulpDiagnosis}
                            onChange={(e) => updateEndoCase({ pulpDiagnosis: e.target.value as any })}
                            className="w-full bg-white p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                          >
                            <option value="Normal pulp">Normal pulp (Vital, normal limits)</option>
                            <option value="Reversible pulpitis">Reversible pulpitis (Transient discomfort)</option>
                            <option value="Irreversible pulpitis">Symptomatic Irreversible pulpitis (Lingering paint)</option>
                            <option value="Necrotic pulp">Necrotic pulp (Non-vital structure)</option>
                            <option value="Previously treated">Previously treated obturated canal</option>
                            <option value="Previously initiated therapy">Previously initiated temporary therapy</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400 block uppercase">Apical Diagnosis</label>
                          <select
                            value={activeCase.apicalDiagnosis}
                            onChange={(e) => updateEndoCase({ apicalDiagnosis: e.target.value as any })}
                            className="w-full bg-white p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                          >
                            <option value="Normal apical tissue">Normal apical tissue</option>
                            <option value="Symptomatic apical periodontitis">Symptomatic apical periodontitis (Pain chewing)</option>
                            <option value="Asymptomatic apical periodontitis">Asymptomatic apical periodontitis (Lucency on X-ray)</option>
                            <option value="Acute apical abscess">Acute apical abscess (Swelling, pain intensity)</option>
                            <option value="Chronic apical abscess">Chronic apical abscess (Draining sinus tract)</option>
                            <option value="Condensing osteitis">Condensing osteitis</option>
                          </select>
                        </div>
                      </div>

                      {/* Chief Complaint Box (Full spans) */}
                      <div className="col-span-1 md:col-span-2 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase">Chief complaint & Diagnostic symptoms report</label>
                        <input
                          type="text"
                          value={activeCase.chiefComplaint}
                          onChange={(e) => updateEndoCase({ chiefComplaint: e.target.value })}
                          placeholder="Client words describe pain indices..."
                          className="w-full bg-white p-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                        />
                      </div>
                    </div>

                    {/* Working Length Table & Entry Add form */}
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <span>Canal Working Length Registry Ledger</span>
                          <span className="text-[8.5px] bg-slate-100 border border-slate-200 rounded-md px-1.5 py-0.2 text-slate-500 font-extrabold font-mono">
                            {(activeCase.workingLengths || []).length} Canals
                          </span>
                        </h4>
                      </div>

                      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
                        <table className="w-full text-left text-xs bg-white">
                          <thead className="bg-slate-50/70 text-[9px] uppercase font-bold text-slate-400 border-b border-slate-150/50">
                            <tr>
                              <th className="p-3">Canal Anatomy</th>
                              <th className="p-3">Est. Length (WL1)</th>
                              <th className="p-3">Final Length (WL2)</th>
                              <th className="p-3">Apex Locator Value</th>
                              <th className="p-3">Max File size</th>
                              <th className="p-3 text-right">Delete</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-xs">
                            {(!activeCase.workingLengths || activeCase.workingLengths.length === 0) ? (
                              <tr>
                                <td colSpan={6} className="p-4 text-center text-slate-400 italic text-[11px]">
                                  No working length canal coordinates registered yet.
                                </td>
                              </tr>
                            ) : (
                              activeCase.workingLengths.map((wl, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/40">
                                  <td className="p-3 font-bold text-slate-700 font-sans">{wl.canal}</td>
                                  <td className="p-3 text-slate-600">{wl.estLength}</td>
                                  <td className="p-3 text-slate-800 font-bold">{wl.finalLength}</td>
                                  <td className="p-3 text-emerald-600 font-bold">{wl.apexLocator}</td>
                                  <td className="p-3 text-indigo-600 font-bold">{wl.fileSize}</td>
                                  <td className="p-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedLens = activeCase.workingLengths.filter((_, i) => i !== idx);
                                        updateEndoCase({ workingLengths: updatedLens });
                                      }}
                                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Add canal sub form */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-dotted border-slate-250 flex flex-wrap gap-2.5 items-end">
                        <div className="space-y-1 shrink-0 w-20">
                          <label className="text-[8px] font-black text-slate-400 uppercase block">Canal Name</label>
                          <input
                            type="text"
                            value={newCanalName}
                            onChange={(e) => setNewCanalName(e.target.value)}
                            className="w-full bg-white p-2 border border-slate-200 rounded-lg text-xs font-bold"
                            placeholder="MB1"
                          />
                        </div>
                        <div className="space-y-1 shrink-0 w-24">
                          <label className="text-[8px] font-black text-slate-400 uppercase block">Est. Length</label>
                          <input
                            type="text"
                            value={newEstLength}
                            onChange={(e) => setNewEstLength(e.target.value)}
                            className="w-full bg-white p-2 border border-slate-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1 shrink-0 w-24">
                          <label className="text-[8px] font-black text-slate-400 uppercase block">Final Length</label>
                          <input
                            type="text"
                            value={newFinalLength}
                            onChange={(e) => setNewFinalLength(e.target.value)}
                            className="w-full bg-white p-2 border border-slate-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1 shrink-0 w-24">
                          <label className="text-[8px] font-black text-slate-400 uppercase block">Apex Locator</label>
                          <input
                            type="text"
                            value={newApexLocator}
                            onChange={(e) => setNewApexLocator(e.target.value)}
                            className="w-full bg-white p-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-emerald-700"
                          />
                        </div>
                        <div className="space-y-1 shrink-0 w-20">
                          <label className="text-[8px] font-black text-slate-400 uppercase block">File Choice</label>
                          <select
                            value={newFileSize}
                            onChange={(e) => setNewFileSize(e.target.value)}
                            className="w-full bg-white p-2 border border-slate-200 rounded-lg text-xs font-bold text-indigo-700"
                          >
                            <option value="#15">#15</option>
                            <option value="#20">#20</option>
                            <option value="#25">#25</option>
                            <option value="#30">#30</option>
                            <option value="#35">#35</option>
                            <option value="#40">#40</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={addWorkingLength}
                          className="px-4 py-2 bg-slate-900 border border-transparent hover:bg-black text-white text-xs font-black rounded-lg cursor-pointer transform hover:scale-102 transition-all flex items-center gap-1 shadow-sm"
                        >
                          <Plus size={13} /> Add Canal
                        </button>
                      </div>
                    </div>

                    {/* Irrigation Protocol & Intracanal medication row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Irrigation */}
                      <div className="bg-slate-50/70 p-4 border border-slate-150/40 rounded-3xl space-y-3">
                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                          <span>Irrigation Protocol and Activation</span>
                          <span className="text-[8.5px] bg-red-50 text-red-600 border border-red-100 rounded px-1.5 font-bold">Infection Safety</span>
                        </h4>

                        <div className="space-y-2 text-xs">
                          <div className="flex flex-col sm:flex-row gap-2 justify-between sm:items-center w-full">
                            <span className="text-slate-500 font-semibold shrink-0">Primary Chemical:</span>
                            <select
                              value={activeCase.irrigationProtocol.sodiumHypo}
                              onChange={(e) => updateEndoCase({
                                irrigationProtocol: { ...activeCase.irrigationProtocol, sodiumHypo: e.target.value }
                              })}
                              className="bg-white p-1.5 rounded-lg border border-slate-200 font-bold text-[11px] w-full sm:w-auto max-w-full sm:max-w-[190px] truncate focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="5.25% NaOCl">5.25% Sodium Hypochlorite (Max dissolution)</option>
                              <option value="2.5% NaOCl">2.5% Sodium Hypochlorite</option>
                              <option value="Normal Saline">Normal Saline (Sterile water)</option>
                            </select>
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-650">
                              <input
                                type="checkbox"
                                checked={activeCase.irrigationProtocol.edta}
                                onChange={(e) => updateEndoCase({
                                  irrigationProtocol: { ...activeCase.irrigationProtocol, edta: e.target.checked }
                                })}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span>EDTA 17% (Smear layer)</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-650">
                              <input
                                type="checkbox"
                                checked={activeCase.irrigationProtocol.chlorhexidine}
                                onChange={(e) => updateEndoCase({
                                  irrigationProtocol: { ...activeCase.irrigationProtocol, chlorhexidine: e.target.checked }
                                })}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span>Chlorhexidine 2%</span>
                            </label>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 justify-between sm:items-center pt-2 border-t border-slate-200 w-full">
                            <span className="text-slate-500 font-semibold shrink-0">Activation Protocol:</span>
                            <select
                              value={activeCase.irrigationProtocol.activation}
                              onChange={(e) => updateEndoCase({
                                irrigationProtocol: { ...activeCase.irrigationProtocol, activation: e.target.value }
                              })}
                              className="bg-white p-1.5 rounded-lg border border-slate-200 text-xs font-semibold w-full sm:w-auto max-w-full sm:max-w-[190px] truncate focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="None">Syringe needle irrigation</option>
                              <option value="EndoActivator Sonic Activation">Sonic Active (EndoActivator)</option>
                              <option value="Ultrasonic activation">Ultrasonic activation (PUI)</option>
                              <option value="Passive">Manual dynamic activation</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Intracanal Medication */}
                      <div className="bg-slate-50/70 p-4 border border-slate-150/40 rounded-3xl space-y-3">
                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                          <span>Intracanal Dressing Placement</span>
                          <span className="text-[8.5px] bg-indigo-50 text-indigo-700 border border-indigo-100 rounded px-1.5 font-bold">Inter-appointment</span>
                        </h4>

                        <div className="space-y-2 text-xs">
                          <div className="flex flex-col sm:flex-row gap-2 justify-between sm:items-center w-full">
                            <span className="text-slate-500 font-semibold shrink-0">Material Dress:</span>
                            <select
                              value={activeCase.intracanalMedication.material}
                              onChange={(e) => updateEndoCase({
                                intracanalMedication: { ...activeCase.intracanalMedication, material: e.target.value }
                              })}
                              className="bg-white p-1.5 rounded-lg border border-slate-200 font-bold text-[11px] w-full sm:w-auto max-w-full sm:max-w-[190px] truncate focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="Calcium Hydroxide">Calcium Hydroxide (UltraCal)</option>
                              <option value="Triple Antibiotic Paste (TAP)">Triple Antibiotic Paste (TAP)</option>
                              <option value="Ledermix">Ledermix paste</option>
                              <option value="None">None (Obturate immediate)</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="space-y-0.5">
                              <span className="text-[8px] text-slate-400 font-bold uppercase block">Placed On</span>
                              <input
                                type="date"
                                value={activeCase.intracanalMedication.placedDate}
                                onChange={(e) => updateEndoCase({
                                  intracanalMedication: { ...activeCase.intracanalMedication, placedDate: e.target.value }
                                })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1 text-[11px] font-mono leading-none"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[8px] text-slate-400 font-bold uppercase block">Removal Scheduled</span>
                              <input
                                type="date"
                                value={activeCase.intracanalMedication.removalDate}
                                onChange={(e) => updateEndoCase({
                                  intracanalMedication: { ...activeCase.intracanalMedication, removalDate: e.target.value }
                                })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1 text-[11px] font-mono leading-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Obturation details */}
                    <div className="bg-slate-50/70 p-4 border border-slate-150/40 rounded-3xl space-y-3">
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span>Hermetic Canal Obturation Parameters</span>
                        <span className="text-[8.5px] bg-emerald-50 text-emerald-700 border border-emerald-100 rounded px-1.5 font-bold">Final sealing</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 text-xs">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase block">Obturation Technique</label>
                          <select
                            value={activeCase.obturationDetails.technique}
                            onChange={(e) => updateEndoCase({
                              obturationDetails: { ...activeCase.obturationDetails, technique: e.target.value }
                            })}
                            className="w-full bg-white border border-slate-200 p-2 rounded-xl text-center font-semibold"
                          >
                            <option value="Warm Vertical Compaction">Warm Vertical Compaction</option>
                            <option value="Single Cone">Single Cone hydraulic seal</option>
                            <option value="Lateral Compaction">Cold Lateral Compaction</option>
                            <option value="Carrier-based">Carrier-based obturation</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase block">Root Canal Sealer</label>
                          <select
                            value={activeCase.obturationDetails.sealerType}
                            onChange={(e) => updateEndoCase({
                              obturationDetails: { ...activeCase.obturationDetails, sealerType: e.target.value }
                            })}
                            className="w-full bg-white border border-slate-200 p-2 rounded-xl text-center font-semibold"
                          >
                            <option value="Bioceramic Sealer">Bioceramic hydraulic Sealer</option>
                            <option value="AH Plus Resin Sealer">AH Plus Epoxy Resin Sealer</option>
                            <option value="Zinc Oxide Eugenol">Zinc Oxide Eugenol sealer</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase block">Master Cone size</label>
                          <input
                            type="text"
                            value={activeCase.obturationDetails.coneSize}
                            onChange={(e) => updateEndoCase({
                              obturationDetails: { ...activeCase.obturationDetails, coneSize: e.target.value }
                            })}
                            className="w-full bg-white border border-slate-200 p-2 rounded-xl font-mono text-center"
                            placeholder="#30/.06"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase block">Obturation Date</label>
                          <input
                            type="date"
                            value={activeCase.obturationDetails.date}
                            onChange={(e) => updateEndoCase({
                              obturationDetails: { ...activeCase.obturationDetails, date: e.target.value }
                            })}
                            className="w-full bg-white border border-slate-200 p-1.5 rounded-xl font-mono text-center text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-xs">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase block font-semibold">Attending clinical operator</label>
                          <input
                            type="text"
                            value={activeCase.obturationDetails.operator}
                            onChange={(e) => updateEndoCase({
                              obturationDetails: { ...activeCase.obturationDetails, operator: e.target.value }
                            })}
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-medium"
                            placeholder="Dr. Practitioner"
                            />

                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase block">Follow-up recalled notes</label>
                          <input
                            type="text"
                            value={activeCase.followUpNotes}
                            onChange={(e) => updateEndoCase({ followUpNotes: e.target.value })}
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-mono placeholder:text-slate-400"
                            placeholder="Stable tooth structure, bone healing checked on recall..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick actions panel */}
                    <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          const updatedCases = cases.filter((_, idx) => idx !== 0);
                          updatePatient(activePatient.id, {
                            specialtyRecords: {
                              ...activePatient.specialtyRecords,
                              endoCases: updatedCases
                            }
                          });
                        }}
                        className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 hover:text-rose-800 flex items-center gap-1.5 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100 cursor-pointer"
                      >
                        <Trash2 size={12} /> Reset Case record
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowEndoSummaryLabel(!showEndoSummaryLabel)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-transform active:scale-95"
                      >
                        <FileText size={14} /> Print Endodontic Diagnostic Summary
                      </button>
                    </div>

                    {/* Simulated Printed medical report sheet */}
                    {showEndoSummaryLabel && (
                      <div className="bg-slate-900 text-slate-50 rounded-3xl p-6 border border-slate-800 space-y-4 font-mono select-none animate-fadeIn">
                        <div className="flex justify-between items-start border-b border-slate-850 pb-3">
                          <div className="flex items-center gap-2.5">
                            <ZendentaLogo size={42} />
                            <div>
                              <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">OFFICIAL RECALL REPORT</span>
                              <h5 className="text-sm font-black text-white font-sans">ENDODONTIC CLINICAL CASE FILE SUMMARY</h5>
                            </div>
                          </div>
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded-md border border-blue-500/30">PATIENT ID: {activePatient.id}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-[11px] leading-relaxed">
                          <div><span className="text-slate-450 uppercase font-semibold">Patient Name:</span> <span className="text-white font-bold">{activePatient.name}</span></div>
                          <div><span className="text-slate-450 uppercase font-semibold">FDI Tooth involved:</span> <span className="text-emerald-400 font-bold">Tooth #{activeCase.toothNumber}</span></div>
                          <div><span className="text-slate-450 uppercase font-semibold">Clinical Complaint:</span> <span className="text-amber-300 font-medium italic">"{activeCase.chiefComplaint}"</span></div>
                          <div><span className="text-slate-450 uppercase font-semibold">Pulse Diagnosis:</span> <span className="text-white font-bold font-sans">{activeCase.pulpDiagnosis}</span></div>
                          <div><span className="text-slate-450 uppercase font-semibold">Apical Status:</span> <span className="text-white font-bold font-sans">{activeCase.apicalDiagnosis}</span></div>
                          <div><span className="text-slate-450 uppercase font-semibold">Medication Placed:</span> <span className="text-white font-bold">{activeCase.intracanalMedication.material || "None"} ({activeCase.intracanalMedication.placedDate || "N/A"})</span></div>
                          <div><span className="text-slate-450 uppercase font-semibold">Irrigation System:</span> <span className="text-white">{activeCase.irrigationProtocol.sodiumHypo} with {activeCase.irrigationProtocol.activation}</span></div>
                          <div><span className="text-slate-450 uppercase font-semibold">Obturation Seal:</span> <span className="text-indigo-300 font-bold">{activeCase.obturationDetails.technique} / {activeCase.obturationDetails.sealerType} (Cone {activeCase.obturationDetails.coneSize})</span></div>
                        </div>
                        <div className="pt-2 border-t border-slate-850 text-[10px] text-slate-500 flex justify-between">
                          <span>Verified Physician: {activeCase.obturationDetails.operator || "Attending clinician Staff"}</span>
                          <span>Timestamp: {new Date().toISOString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* SPECIALTY CONTENT: ORTHODONTICS */}
              {activeSpecialtyTab === "ortho" && (() => {
                const ortho = activePatient.specialtyRecords?.orthoRecord || {
                  bracketSystem: "Standard Ceramic Aesthetic",
                  currentWire: "0.018 NiTi Round",
                  biteCorrection: "Class II Division 1",
                  complianceScore: "Excellent",
                  jawAlignmentNotes: "Good jaw compliance. Minimal vertical friction."
                };

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-xs">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase">Bonded Bracket System</label>
                        <select
                          value={ortho.bracketSystem}
                          onChange={(e) => updateOrthodonticRecord({ bracketSystem: e.target.value })}
                          className="w-full bg-white p-2 border border-slate-200 rounded-xl font-bold"
                        >
                          <option value="Clarity Advanced Ceramic Brackets">Clarity Advanced Ceramic Aesthetic Brackets</option>
                          <option value="Damon Self-Ligating Metal">Damon Self-Ligating frictionless brackets</option>
                          <option value="Standard Stainless Buccal">Standard Metal SS Brackets</option>
                          <option value="Invisalign Clear Aligners">Clear Aligners system tray set</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase">Active wire and tension configuration</label>
                        <select
                          value={ortho.currentWire}
                          onChange={(e) => updateOrthodonticRecord({ currentWire: e.target.value })}
                          className="w-full bg-white p-2 border border-slate-200 rounded-xl font-bold text-indigo-650 font-mono"
                        >
                          <option value="0.014 NiTi Round Archwire">0.014 NiTi Round (Levelling phase)</option>
                          <option value="0.018 NiTi Round Archwire">0.018 NiTi Round (Active tooth movement)</option>
                          <option value="0.019 x 0.025 SS Rectangular">0.019 x 0.025 Stainless Steel (Torque control)</option>
                          <option value="0.016 x 0.022 NiTi Rectangular">0.016 x 0.022 NiTi Rectangular</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1 text-xs">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase">Anatomy Bite alignment status</label>
                        <input
                          type="text"
                          value={ortho.biteCorrection}
                          onChange={(e) => updateOrthodonticRecord({ biteCorrection: e.target.value })}
                          className="w-full bg-white border border-slate-200 p-2 rounded-xl text-slate-705"
                          placeholder="E.g., Class I or Class II division 1"
                        />
                      </div>
                      <div className="space-y-1 text-xs">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase">BITE compliance Score</label>
                        <select
                          value={ortho.complianceScore}
                          onChange={(e) => updateOrthodonticRecord({ complianceScore: e.target.value as any })}
                          className="w-full bg-white border border-slate-200 p-2 rounded-xl text-slate-705"
                        >
                          <option value="Excellent">Excellent (Wear elastic tubes perfectly)</option>
                          <option value="Good">Good compliance</option>
                          <option value="Fair">Fair (Needs reminder)</option>
                          <option value="Poor">Poor compliance (Risk of relapse)</option>
                        </select>
                      </div>
                      <div className="space-y-1 text-xs">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase">Jaw alignment parameters</label>
                        <input
                          type="text"
                          value={ortho.jawAlignmentNotes}
                          onChange={(e) => updateOrthodonticRecord({ jawAlignmentNotes: e.target.value })}
                          className="w-full bg-white border border-slate-200 p-2 rounded-xl text-slate-705 text-xs font-medium"
                          placeholder="No jaw clicking, joints sound clear..."
                        />
                      </div>
                    </div>

                    {/* Integrated Long notes field */}
                    <div className="space-y-1 md:space-y-2 pt-2">
                      <label className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span>Attending adjustment case diary notes</span>
                        <span className="text-[8.5px] bg-indigo-50 text-indigo-700 rounded px-1.5 font-bold font-mono">Synced to general file</span>
                      </label>
                      <textarea
                        value={activePatient.orthoNotes}
                        onChange={(e) => updateOrthoNotes(activePatient.id, e.target.value)}
                        placeholder="Write cumulative orthodontic diaries, jaw bone conditions, expansion notes..."
                        rows={3}
                        className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/70 text-xs text-slate-700 focus:ring-2 focus:ring-blue-400 focus:outline-none font-mono resize-none focus:bg-white transition-all leading-relaxed"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* SPECIALTY CONTENT: PERIODONTICS (GUM HEALTH) */}
              {activeSpecialtyTab === "periodontics" && (() => {
                const perio = activePatient.specialtyRecords?.perioRecord || {
                  scalingAndPlaningDate: "",
                  pocketDepthMax: 3,
                  bleedingIndices: "None",
                  mobilityIndex: "Grade 0",
                  boneLossPercentage: 10,
                  implantSupportStatus: "Gingival tissues intact, normal bone levels."
                };

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-150/40">
                      {/* Pocket depth slider */}
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center text-xs">
                          <label className="text-[9px] font-bold text-slate-500 block uppercase">Maximum Pocket Depth Assessment</label>
                          <span className={`px-2.5 py-0.5 rounded-md font-bold text-xs ${
                            perio.pocketDepthMax > 5 ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {perio.pocketDepthMax} mm {perio.pocketDepthMax > 5 ? "(Pocket / Suture needed)" : "(Normal limits)"}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={perio.pocketDepthMax}
                          onChange={(e) => updatePeriodontalRecord({ pocketDepthMax: Number(e.target.value) })}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                        />
                        <span className="text-[9px] text-slate-400 leading-none">1-3mm: Healthy gingival tissue. 4-5mm: Mild-moderate periodontal risk. &gt;5mm: Severe attachment loss.</span>
                      </div>

                      {/* Bone Loss slider */}
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center text-xs">
                          <label className="text-[9px] font-bold text-slate-500 block uppercase">Radiographic Alveolar Bone Loss</label>
                          <span className={`px-2.5 py-0.5 rounded-md font-bold text-xs ${
                            perio.boneLossPercentage > 30 ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {perio.boneLossPercentage}% {perio.boneLossPercentage > 30 ? "(Grade B/C Periodontitis)" : "(Slight bone scaling)"}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={perio.boneLossPercentage}
                          onChange={(e) => updatePeriodontalRecord({ boneLossPercentage: Number(e.target.value) })}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                        />
                        <span className="text-[9px] text-slate-400 leading-none">Slight bone loss of alveolar height relative to age. Essential for root support.</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase">Bleeding checking Index</label>
                        <select
                          value={perio.bleedingIndices}
                          onChange={(e) => updatePeriodontalRecord({ bleedingIndices: e.target.value as any })}
                          className="w-full bg-white border border-slate-200 p-2 rounded-xl text-center font-semibold"
                        >
                          <option value="None">None (Pink tight gingival mucosa)</option>
                          <option value="Localized">Localized (Bleeding at pocket probe #18, #36)</option>
                          <option value="Generalized">Generalized (Active spontaneous bleeding)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase">Tooth Mobility Index</label>
                        <select
                          value={perio.mobilityIndex}
                          onChange={(e) => updatePeriodontalRecord({ mobilityIndex: e.target.value as any })}
                          className="w-full bg-white border border-slate-200 p-2 rounded-xl text-center font-semibold"
                        >
                          <option value="Grade 0">Grade 0 (Physiological mobility only)</option>
                          <option value="Grade I">Grade I (Horizontal movement &lt; 1mm)</option>
                          <option value="Grade II">Grade II (Horizontal movement &gt; 1mm)</option>
                          <option value="Grade III">Grade III (Vertical mobility - tooth danger)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase">Last scaling & Root Planing</label>
                        <input
                          type="date"
                          value={perio.scalingAndPlaningDate}
                          onChange={(e) => updatePeriodontalRecord({ scalingAndPlaningDate: e.target.value })}
                          className="w-full bg-white border border-slate-200 p-1.5 rounded-xl font-mono text-center text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="text-[9px] font-bold text-slate-400 block uppercase">Implant tissues support notes</label>
                      <input
                        type="text"
                        value={perio.implantSupportStatus}
                        onChange={(e) => updatePeriodontalRecord({ implantSupportStatus: e.target.value })}
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-medium"
                        placeholder="Bone levels around implants are solid, osseointegration stable..."
                      />
                    </div>
                  </div>
                );
              })()}

              {/* SPECIALTY CONTENT: GENERAL & PREVENTIVE */}
              {activeSpecialtyTab === "general" && (() => {
                const prev = activePatient.specialtyRecords?.preventiveScore || {
                  cleaningsCount: 1,
                  fluorideGiven: false,
                  sealantApplied: false,
                  cariesRisk: "Low"
                };

                const updatePrev = (updated: Partial<PreventiveScore>) => {
                  const records = activePatient.specialtyRecords || {};
                  updatePatient(activePatient.id, {
                    specialtyRecords: {
                      ...records,
                      preventiveScore: { ...prev, ...updated }
                    }
                  });
                };

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Preventive Score tracker */}
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-150/40 space-y-3.5 text-xs">
                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Preventive Metrics counters</h4>
                        
                        <div className="flex items-center justify-between pb-1 border-b border-slate-200/50">
                          <span className="text-slate-500 font-semibold">Cleanings Logged (Annual):</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updatePrev({ cleaningsCount: Math.max(0, prev.cleaningsCount - 1) })}
                              className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold font-mono text-slate-600 active:scale-95 text-xs"
                            >
                              -
                            </button>
                            <span className="font-extrabold text-xs font-mono">{prev.cleaningsCount}</span>
                            <button
                              type="button"
                              onClick={() => updatePrev({ cleaningsCount: prev.cleaningsCount + 1 })}
                              className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold font-mono text-slate-600 active:scale-95 text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-650">
                            <input
                              type="checkbox"
                              checked={prev.fluorideGiven}
                              onChange={(e) => updatePrev({ fluorideGiven: e.target.checked })}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Annual Fluoride Varnish Given</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-650">
                            <input
                              type="checkbox"
                              checked={prev.sealantApplied}
                              onChange={(e) => updatePrev({ sealantApplied: e.target.checked })}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Molar Sealant Applied</span>
                          </label>
                        </div>
                      </div>

                      {/* Caries risk */}
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-150/40 space-y-3.5 text-xs">
                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Caries risk Assessment Index</h4>
                        
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 block uppercase">Caries risk Level</label>
                          <div className="flex gap-2">
                            {["Low", "Medium", "High"].map((lev) => (
                              <button
                                key={lev}
                                type="button"
                                onClick={() => updatePrev({ cariesRisk: lev as any })}
                                className={`flex-1 py-1.5 rounded-xl font-bold uppercase text-[10px] border transition-colors cursor-pointer ${
                                  prev.cariesRisk === lev
                                    ? lev === "Low" ? "bg-emerald-600 text-white border-emerald-600"
                                      : lev === "High" ? "bg-red-600 text-white border-red-600" : "bg-blue-600 text-white border-blue-600"
                                    : "bg-white border-slate-200 text-slate-500"
                                }`}
                              >
                                {lev} Risk
                              </button>
                            ))}
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-400 block leading-tight">Patient habits, diet sugars, saliva flow, and presence of plaque elements determine risk coordinates.</span>
                      </div>
                    </div>

                    {/* Smile Design block */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Smile Design & Restorative Esthetics</span>
                        <p className="font-bold text-slate-750 mt-0.5">Shade target guide selection:</p>
                      </div>
                      <div className="flex gap-1">
                        {["OM1", "OM2", "OM3", "A1", "A2", "B1"].map((s) => (
                          <span key={s} className="px-2 py-1 text-[10px] rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-extrabold font-mono">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* SPECIALTY CONTENT: PEDIATRIC & SPECIAL CARE */}
              {activeSpecialtyTab === "pediatric" && (() => {
                const ped = activePatient.specialtyRecords?.pediatricNotes || {
                  habitThumbSucking: false,
                  habitTongueThrust: false,
                  growthStatus: "Normal pediatric mixed development.",
                  behavioralScore: "Cooperative"
                };

                return (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Habit index */}
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-150/40 space-y-3">
                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                          <span>Pediatric Development Habits</span>
                          <span className="text-[8.5px] bg-indigo-50 text-indigo-700 rounded px-1.5 font-bold">Orthodontic triggers</span>
                        </h4>

                        <div className="flex gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-650">
                            <input
                              type="checkbox"
                              checked={ped.habitThumbSucking}
                              onChange={(e) => updatePediatricNotes({ habitThumbSucking: e.target.checked })}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Active thumb sucking habit</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-650">
                            <input
                              type="checkbox"
                              checked={ped.habitTongueThrust}
                              onChange={(e) => updatePediatricNotes({ habitTongueThrust: e.target.checked })}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Active tongue thrusting habit</span>
                          </label>
                        </div>
                        <span className="text-[9px] text-slate-400 block leading-tight">These habits trigger anterior open bite, arch collapse, and facial dentition alignment issues.</span>
                      </div>

                      {/* Behavior Compliance score */}
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-150/40 space-y-3">
                        <label className="text-[10px] font-black text-slate-850 block uppercase tracking-wider">Clinical Behavioral Score (Frankl Scale)</label>
                        <select
                          value={ped.behavioralScore}
                          onChange={(e) => updatePediatricNotes({ behavioralScore: e.target.value as any })}
                          className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-bold text-slate-705 focus:outline-none"
                        >
                          <option value="Excellent">Excellent (+4, Outgoing and highly supportive)</option>
                          <option value="Cooperative">Cooperative (+3, Shy but complies completely)</option>
                          <option value="Fearful">Fearful (-2, Crying but treated safely)</option>
                          <option value="Uncooperative">Uncooperative (-1, Refused access, sedatives needed)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="text-[9px] font-bold text-slate-400 block uppercase">Pediatric jaw growth developmental status</label>
                      <input
                        type="text"
                        value={ped.growthStatus}
                        onChange={(e) => updatePediatricNotes({ growthStatus: e.target.value })}
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-medium"
                        placeholder="Orderly mixed primary dentition, growth indicators clear..."
                      />
                    </div>
                  </div>
                );
              })()}

              {/* SPECIALTY CONTENT: SURGERY */}
              {activeSpecialtyTab === "surgery" && (() => {
                const specRecs = activePatient.specialtyRecords || {};
                const notes = specRecs.surgeryNotes || "";

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Wisdom tooth surgery */}
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-150/40 space-y-3 text-xs">
                        <h4 className="text-[10px] font-black text-slate-850 uppercase tracking-wider">Oral & Maxillofacial extraction logs</h4>
                        <div className="flex gap-5">
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-655">
                            <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-500" />
                            <span>Bone Graft Placement (Synthetics)</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-655">
                            <input type="checkbox" className="rounded border-slate-300 text-blue-500" />
                            <span>PRF Membrane placement</span>
                          </label>
                        </div>
                        <div className="flex gap-2 items-center text-xs">
                          <span className="text-slate-500 font-semibold">Post-surgical sutures count:</span>
                          <span className="px-2 py-0.5 bg-slate-200 border border-slate-300 font-bold font-mono text-slate-700 rounded-md">4 sutured (Ethilon 4-0)</span>
                        </div>
                      </div>

                      {/* Implantology check */}
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-150/40 space-y-3 text-xs">
                        <h4 className="text-[10px] font-black text-slate-850 uppercase tracking-wider">Active Implants osseointegration index</h4>
                        <p className="text-slate-500">Implant fixture status on FDI #14, #15 registered stable torque levels at 35 Ncm.</p>
                        <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider text-emerald-600">● OSSEOINTEGRATED PATTERN OK</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <label className="text-[10px] font-black text-slate-850 block uppercase tracking-wider">Maxillofacial pathology biopsy notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => updatePatient(activePatient.id, {
                          specialtyRecords: { ...specRecs, surgeryNotes: e.target.value }
                        })}
                        placeholder="Write oral biopsy pathology diagnosis notes, wisdom tooth impaction steps, bony extraction parameters..."
                        rows={2}
                        className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs font-mono font-medium focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* SPECIALTY CONTENT: IMAGING / DIAMOND */}
              {activeSpecialtyTab === "imaging" && (() => {
                const specRecs = activePatient.specialtyRecords || {};
                const notes = specRecs.radiologyInterpret || "";

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Radiology */}
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-150/40 space-y-2 text-xs">
                        <h4 className="text-[10px] font-black text-slate-850 uppercase tracking-wider">Multi-plane CBCT analysis status</h4>
                        <p className="text-slate-500 font-medium">CBCT 3D volume scan shows clear root canal curvature without signs of perforation or root calcification on FDI #11.</p>
                      </div>

                      {/* Mucosal Medicine */}
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-150/40 space-y-2 text-xs">
                        <h4 className="text-[10px] font-black text-slate-850 uppercase tracking-wider">Oral mucosal / systemic manifest indicators</h4>
                        <p className="text-slate-500 font-medium">BMS (Burning Mouth Syndrome) metrics stable. Check for xerostomia indicators under prescription drugs.</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <label className="text-[10px] font-black text-slate-850 block uppercase tracking-wider">Attending radiologist panoramic interpretation notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => updatePatient(activePatient.id, {
                          specialtyRecords: { ...specRecs, radiologyInterpret: e.target.value }
                        })}
                        placeholder="E.g., Panoramic radiograph displays orderly mandibular nerve line, mental foramen distances OK..."
                        rows={2}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* SPECIALTY CONTENT: DIGITAL DENTISTRY & CAD/CAM */}
              {activeSpecialtyTab === "digital" && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CAD-CAM Scans */}
                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-150/40 space-y-2.5">
                      <h4 className="text-[10px] font-black text-slate-850 uppercase tracking-wider flex items-center justify-between">
                        <span>CAD-CAM Intraoral 3D Scan Status</span>
                        <span className="text-[8.5px] bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-100 rounded px-1 px-1.5">TRIOS READY</span>
                      </h4>
                      <p className="text-slate-550">Intraoral digital STL file mesh generation for crowns/aligners completed on May 25, 2026. STL file uploaded to milling provider lab.</p>
                    </div>

                    {/* Support Fields */}
                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-150/40 space-y-2.5">
                      <h4 className="text-[10px] font-black text-slate-850 uppercase tracking-wider">Attending Support Specialties Coordinates</h4>
                      <ul className="space-y-1 text-slate-500">
                        <li>• <span className="font-bold">Dental Anesthesiology:</span> Conscious Nitrous Oxide (Happy gas) checked active.</li>
                        <li>• <span className="font-bold">TMJ / TMD clicking status:</span> Normal condyle excursion.</li>
                        <li>• <span className="font-bold">Sleep Apnea clinical score:</span> Epworth Sleepiness Scale level 4.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CROWN restauration session-based tracker grid */}
            {activePatient.prostheticsRecords.length > 0 && (
              <div className="frosted-glass-panel rounded-[32px] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-200">
                      <Wrench size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span>Crown & Prosthetics Session logs</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-2.5 py-0.5 font-extrabold normal-case">
                          {activePatient.prostheticsRecords.length} {activePatient.prostheticsRecords.length === 1 ? "Case" : "Cases"}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Multi-step clinic trial checkpoints and active laboratory status.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {activePatient.prostheticsRecords.map(pr => {
                    const completedSessionsCount = pr.sessions.filter(s => s.completed).length;
                    const progressPercentage = (completedSessionsCount / pr.sessions.length) * 100;

                    return (
                      <div key={pr.id} className="bg-white/90 border border-slate-100 rounded-[28px] p-6 shadow-sm hover:shadow-md transition-all space-y-5 relative overflow-hidden backdrop-blur-md">
                        {/* Top status bar */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100/80">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex flex-col items-center justify-center font-mono">
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Tooth</span>
                              <span className="text-lg font-black text-slate-800 leading-tight">{pr.toothNumber}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-850">{pr.prostheticType} Restoration</span>
                                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-slate-500 bg-slate-50 border border-slate-200/50 rounded-full px-2 py-0.5">
                                  <Sparkles size={10} className="text-amber-500" />
                                  Custom Lab Mold
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                                <Building size={12} className="text-slate-400" />
                                <span>Lab Partner: <span className="font-semibold text-slate-650">{pr.labName}</span></span>
                                <span className="text-slate-300">•</span>
                                <span className="font-medium text-slate-500">Initiated {pr.date}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Lab Status</span>
                            <select
                              value={pr.labStatus}
                              onChange={(e) => updateProstheticLabStatus(activePatient.id, pr.id, e.target.value as LabStatus)}
                              className={`text-[11px] font-bold py-1.5 px-3 rounded-xl border focus:outline-none transition-all cursor-pointer shadow-sm ${
                                pr.labStatus === "Fitted" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                                pr.labStatus === "Adjusted" ? "bg-indigo-50 border-indigo-200 text-indigo-700" :
                                pr.labStatus === "Received from Lab" ? "bg-purple-50 border-purple-200 text-purple-700" :
                                pr.labStatus === "In Fabrication" ? "bg-amber-50 border-amber-200 text-amber-700" :
                                "bg-blue-50 border-blue-200 text-blue-700"
                              }`}
                            >
                              {["Sent to Lab", "In Fabrication", "Received from Lab", "Adjusted", "Fitted"].map(st => (
                                <option key={st} value={st} className="bg-white text-slate-850">{st}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Sessions Checklist Steps Title & Completion Meter */}
                        <div className="space-y-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between text-[11px] font-extrabold uppercase text-slate-550 border-b border-slate-100 pb-3 gap-2">
                            <span className="flex items-center gap-1.5">
                              <History size={13} className="text-blue-500" />
                              Clinical Trial Stepper Progress
                            </span>
                            <span className="text-slate-600 bg-slate-100 border border-slate-200/65 rounded-lg px-2.5 py-1 font-bold">
                              {completedSessionsCount} of {pr.sessions.length} Completed ({Math.round(progressPercentage)}%)
                            </span>
                          </div>

                          {/* Interactive Header Timeline (Visually Connects all 5 steps) */}
                          <div className="relative border border-slate-105 bg-slate-50/50 rounded-2xl py-4 px-4 sm:px-8 shadow-inner overflow-x-auto custom-scrollbar">
                            <div className="min-w-[620px] relative flex items-center justify-between py-2">
                              {/* Background Connector Bar Line */}
                              <div className="absolute left-6 right-6 top-[18px] h-1.5 bg-slate-200/70 rounded-full z-0" />
                              
                              {/* Glowing Active Dynamic Connector Bar */}
                              <div 
                                className="absolute left-6 top-[18px] h-1.5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-blue-500 rounded-full z-0 transition-all duration-500"
                                style={{ 
                                  width: `${
                                    completedSessionsCount === 0 
                                      ? 0 
                                      : completedSessionsCount === pr.sessions.length
                                        ? "calc(100% - 3rem)"
                                        : `calc(${((completedSessionsCount - 0.5) / (pr.sessions.length - 1)) * 100}% - 1.5rem)`
                                  }` 
                                }}
                              />

                              {pr.sessions.map((sess, idx) => {
                                const isCompleted = sess.completed;
                                const isFirstUncompleted = pr.sessions.findIndex(s => !s.completed) === idx;
                                const isActive = !isCompleted && isFirstUncompleted;

                                return (
                                  <div key={`node-${sess.id}`} className="flex flex-col items-center relative z-10 w-24">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateProstheticSession(
                                          activePatient.id, 
                                          pr.id, 
                                          sess.id, 
                                          !isCompleted, 
                                          sess.notes,
                                          sess.date
                                        );
                                      }}
                                      className={`w-9 h-9 rounded-full flex items-center justify-center border font-sans font-black text-xs transition-all duration-300 shadow-md ${
                                        isCompleted 
                                          ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 hover:scale-105"
                                          : isActive 
                                            ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100 animate-pulse hover:bg-blue-700 hover:scale-105"
                                            : "bg-white border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700"
                                      }`}
                                      title={`Mark ${sess.stage} as ${isCompleted ? 'incomplete' : 'complete'}`}
                                    >
                                      {isCompleted ? <Check size={14} className="stroke-[3]" /> : idx + 1}
                                    </button>
                                    <span className={`text-[9px] font-extrabold uppercase mt-2 text-center tracking-wider truncate max-w-full ${
                                      isCompleted ? "text-emerald-700 font-black" : isActive ? "text-blue-600 font-black" : "text-slate-400"
                                    }`}>
                                      {sess.stage}
                                    </span>
                                    {sess.date && (
                                      <span className="text-[8px] text-slate-400 font-semibold bg-slate-100/80 border border-slate-200 mt-0.5 px-1.5 py-0.2 rounded-full">
                                        {sess.date.replace(/^\d{4}-/, "")}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Sessions Checklist Steps card list in Full Width Layout */}
                          <div className="flex flex-col gap-3.5 w-full relative">
                            {pr.sessions.map((sess, idx) => {
                              const isCompleted = sess.completed;
                              const isFirstUncompleted = pr.sessions.findIndex(s => !s.completed) === idx;
                              const isActive = !isCompleted && isFirstUncompleted;
                              const isEditing = editingSessionNoteId === `${pr.id}-${sess.id}`;

                              return (
                                <div 
                                  key={sess.id} 
                                  className={`p-4 md:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                                    isCompleted 
                                      ? "bg-emerald-50/20 border-emerald-500/15 shadow-sm shadow-emerald-500/5 hover:border-emerald-500/25" 
                                      : isActive
                                        ? "bg-blue-50/40 border-blue-500/30 ring-2 ring-blue-500/5 shadow-sm hover:border-blue-400"
                                        : "bg-slate-50/40 border-slate-150/40 opacity-75 hover:opacity-100"
                                  }`}
                                >
                                  {/* Left section: Index, Checkbox and Stage Title */}
                                  <div className="flex items-center gap-4 min-w-0 md:w-1/4">
                                    <div className="relative flex items-center justify-center shrink-0">
                                      <input
                                        id={`check-${pr.id}-${sess.id}`}
                                        type="checkbox"
                                        checked={isCompleted}
                                        onChange={(e) => updateProstheticSession(
                                          activePatient.id, 
                                          pr.id, 
                                          sess.id, 
                                          e.target.checked, 
                                          sess.notes,
                                          sess.date
                                        )}
                                        className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer transition-colors"
                                      />
                                    </div>

                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md ${
                                          isCompleted ? "bg-emerald-100 text-emerald-800" : isActive ? "bg-blue-100 text-blue-800" : "bg-slate-150 text-slate-500"
                                        }`}>
                                          Step {idx + 1}
                                        </span>
                                      </div>
                                      <label htmlFor={`check-${pr.id}-${sess.id}`} className="block cursor-pointer select-none mt-1">
                                        <span className={`text-sm font-black block leading-snug truncate ${isCompleted ? "text-emerald-950" : isActive ? "text-blue-900" : "text-slate-800"}`}>
                                          {sess.stage}
                                        </span>
                                      </label>
                                    </div>
                                  </div>

                                  {/* Middle section: Dedicated Date Picker Selector */}
                                  <div className="space-y-1 w-full md:w-1/4 max-w-xs">
                                    <span className="text-[8.5px] uppercase font-bold text-slate-400 block tracking-wider flex items-center gap-1">
                                      <Calendar size={10} className="text-slate-400" />
                                      Session Date
                                    </span>
                                    <input
                                      type="date"
                                      value={sess.date || ""}
                                      onChange={(e) => updateProstheticSession(
                                        activePatient.id, 
                                        pr.id, 
                                        sess.id, 
                                        sess.completed, 
                                        sess.notes, 
                                        e.target.value
                                      )}
                                      className="text-[11px] w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-650 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent select-none cursor-pointer"
                                    />
                                  </div>

                                  {/* Right section: Actionable Clinical Notes Panel */}
                                  <div className="pt-3 md:pt-0 border-t md:border-t-0 border-slate-200/50 md:border-l md:pl-5 border-dashed flex-1 w-full min-w-0">
                                    <span className="text-[8.5px] uppercase font-bold text-slate-400 block tracking-wider mb-1">Clinic progress Note</span>
                                    {isEditing ? (
                                      <div className="flex flex-col gap-1.5 w-full">
                                        <textarea
                                          rows={2}
                                          value={tempNoteText}
                                          onChange={(e) => setTempNoteText(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                              e.preventDefault();
                                              updateProstheticSession(activePatient.id, pr.id, sess.id, sess.completed, tempNoteText, sess.date);
                                              setEditingSessionNoteId(null);
                                            }
                                          }}
                                          autoFocus
                                          placeholder="Type note..."
                                          className="text-[11px] w-full p-2.5 rounded-xl border border-blue-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent font-sans resize-none placeholder:text-slate-400 leading-snug"
                                        />
                                        <div className="flex justify-end gap-1">
                                          <button
                                            type="button"
                                            onClick={() => setEditingSessionNoteId(null)}
                                            className="text-[8.5px] font-bold text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-100 rounded-md"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              updateProstheticSession(activePatient.id, pr.id, sess.id, sess.completed, tempNoteText, sess.date);
                                              setEditingSessionNoteId(null);
                                            }}
                                            className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md flex items-center gap-1"
                                          >
                                            <Check size={10} /> Save
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div 
                                        onClick={() => {
                                          setEditingSessionNoteId(`${pr.id}-${sess.id}`);
                                          setTempNoteText(sess.notes || "");
                                        }}
                                        className="group cursor-pointer rounded-xl p-2 bg-white/45 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-100 transition-all flex items-start justify-between gap-1.5 min-h-[44px]"
                                      >
                                        <span className={`text-[11px] leading-relaxed font-semibold block italic break-words w-full ${sess.notes ? "text-slate-650" : "text-slate-400"}`}>
                                          {sess.notes || "+ Add details / results"}
                                        </span>
                                        <PenTool size={11} className="text-slate-400/0 group-hover:text-slate-400/100 shrink-0 mt-0.5 transition-opacity" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Financial status for prosthetic */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                            <div className="space-y-0.5">
                              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Total treatment Fee</span>
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 text-sm font-semibold">$</span>
                                <span className="text-base font-black text-slate-800">{pr.totalCost.toLocaleString("en-US")}</span>
                              </div>
                            </div>

                            <div className="w-[1px] h-8 bg-slate-200 hidden sm:block" />

                            <div className="space-y-0.5">
                              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider font-semibold">Amount Settled</span>
                              <div className="flex items-center gap-1">
                                <span className="text-emerald-500 text-sm font-semibold">$</span>
                                <span className="text-base font-black text-emerald-600">{pr.paidAmount.toLocaleString("en-US")}</span>
                              </div>
                            </div>

                            <div className="w-[1px] h-8 bg-slate-200 hidden sm:block" />

                            <div className="space-y-0.5">
                              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Outstanding Balance</span>
                              <div className="flex items-center gap-1">
                                <span className={`${pr.remainingAmount > 0 ? "text-orange-500" : "text-slate-400"} text-sm font-semibold`}>$</span>
                                <span className={`text-base font-black ${pr.remainingAmount > 0 ? "text-orange-600" : "text-slate-500"}`}>
                                  {pr.remainingAmount.toLocaleString("en-US")}
                                </span>
                              </div>
                            </div>

                            {/* Settle progress bar indicator */}
                            <div className="flex flex-col gap-1 w-28 sm:w-36 ml-0 md:ml-4">
                              <div className="flex items-center justify-between text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">
                                <span>Settle progress</span>
                                <span>{Math.round((pr.paidAmount / pr.totalCost) * 100)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 rounded-full" 
                                  style={{ width: `${Math.min(100, (pr.paidAmount / pr.totalCost) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 w-full md:w-auto">
                            {pr.remainingAmount > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setPayingCrownId(pr.id);
                                  setPaymentAmount(pr.remainingAmount);
                                }}
                                className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-blue-100 font-sans"
                              >
                                <CreditCard size={12} />
                                <span>Collect Payment</span>
                              </button>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 text-[10.5px] text-emerald-700 font-extrabold bg-emerald-100/50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                                <CheckCircle size={13} className="text-emerald-600" />
                                <span>Fully Settled</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* UNIFIED TREATMENT HISTORY TIMELINE */}
            <div className="frosted-glass-panel rounded-[32px] p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
                <History size={16} className="text-blue-500" />
                <span>Unified Patient History Timeline</span>
              </h3>

              {activePatient.fillingRecords.length === 0 && 
               activePatient.extractionRecords.length === 0 && 
               activePatient.prostheticsRecords.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">No historic procedural items found inside folder files.</p>
              ) : (
                <div className="space-y-4">
                  {/* Join and Sort chronological list */}
                  {[
                    ...activePatient.fillingRecords.map(f => ({ ...f, histType: "filling" as const })),
                    ...activePatient.extractionRecords.map(e => ({ ...e, histType: "extraction" as const })),
                    ...activePatient.prostheticsRecords.map(p => ({ ...p, histType: "prosthetic" as const }))
                  ]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((item, index) => (
                      <div key={index} className="flex gap-4 border-l-2 border-white pl-4 relative">
                        {/* Bullet circle */}
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white absolute -left-2 top-0.5 shadow-sm" />
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              {item.histType === "filling" && `Composite filling on Tooth ${item.toothNumber}`}
                              {item.histType === "extraction" && `Tooth ${item.toothNumber} Extraction`}
                              {item.histType === "prosthetic" && `Crown install on Tooth ${item.toothNumber}`}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">({item.date})</span>
                          </div>
                          
                          <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            {item.notes || (item as any).reason}
                          </p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[32px] p-12 text-center shadow-sm h-full flex flex-col items-center justify-center">
            <Stethoscope className="text-slate-300 mb-4" size={56} />
            <h3 className="text-lg font-extrabold text-slate-750">No Clinic File Is Open</h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed font-semibold">
              Select or search for an active patient folder in the left Directory to display oral maps, history timelines, and orthodontic logs.
            </p>
          </div>
        )}
      </div>

      {/* 3. ADD PATIENT MODAL DIALOG */}
      {isAddPatientOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddPatientOpen(false);
            }
          }}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-55 p-4 cursor-pointer"
        >
          <div className="bg-white rounded-[32px] border border-slate-100 p-6 w-full max-w-lg shadow-2xl relative cursor-default max-h-[92vh] flex flex-col">
            <button 
              onClick={() => setIsAddPatientOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-colors"
              title="Close modal"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-black text-slate-800 mb-4 shrink-0">Record New Patient</h3>

            <form onSubmit={handleCreatePatient} className="space-y-4 flex-1 overflow-y-auto pr-1 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="E.g., Elena Rostova"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Phone</label>
                  <input
                    type="text"
                    required
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-emerald-600">WhatsApp (Optional)</label>
                  <input
                    type="text"
                    value={newPatientWhatsapp}
                    onChange={(e) => setNewPatientWhatsapp(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/10 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="E.g., +1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Email (Optional)</label>
                  <input
                    type="email"
                    value={newPatientEmail}
                    onChange={(e) => setNewPatientEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Birth Date</label>
                  <input
                    type="date"
                    required
                    value={newPatientDob}
                    onChange={(e) => setNewPatientDob(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Dynamic calculated age block to quickly identify pediatric cases */}
              <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-extrabold text-slate-400 block tracking-wider">Dynamic Patient Age</span>
                  <p className="font-bold text-slate-700">
                    {newPatientDob ? `${calculateAge(newPatientDob)} Years Old` : "Please select a Birth Date"}
                  </p>
                </div>
                {newPatientDob && (
                  <div className="flex items-center gap-2">
                    {calculateAge(newPatientDob) < 18 ? (
                      <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200/50 px-2.5 py-1 rounded-xl font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        🧸 Pediatric Patient
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2.5 py-1 rounded-xl font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        Adult Patient
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">Biological Gender</label>
                <div className="flex gap-4">
                  {["Female", "Male", "Other"].map(g => (
                    <label key={g} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <input 
                        type="radio" 
                        name="gender" 
                        value={g}
                        checked={newPatientGender === g}
                        onChange={() => setNewPatientGender(g)}
                        className="text-blue-500 focus:ring-blue-500"
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">System Risk Level</label>
                  <select
                    value={newPatientRiskRef}
                    onChange={(e) => setNewPatientRiskRef(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
                  >
                    <option value="Low">Low Risk</option>
                    <option value="Moderate">Moderate Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Drug Allergies</label>
                  <input
                    type="text"
                    value={newPatientAllergies}
                    onChange={(e) => setNewPatientAllergies(e.target.value)}
                    placeholder="None, Penicillin, etc."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Weight (kg)</label>
                  <input
                    type="text"
                    value={newPatientWeight}
                    onChange={(e) => setNewPatientWeight(e.target.value)}
                    placeholder="E.g., 78 kg"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Height (cm)</label>
                  <input
                    type="text"
                    value={newPatientHeight}
                    onChange={(e) => setNewPatientHeight(e.target.value)}
                    placeholder="E.g., 182 cm"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Initial Orthodontic Condition</label>
                <textarea
                  value={newPatientOrtho}
                  onChange={(e) => setNewPatientOrtho(e.target.value)}
                  placeholder="Severe overbite of 4mm with minor rotation..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Create Folder File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. TOOTH CLINICAL TREATMENT POPOVER MODAL */}
      {selectedTooth !== null && activePatient && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedTooth(null);
            }
          }}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-55 p-4 cursor-pointer"
        >
          <div className="bg-white rounded-[32px] border border-slate-100 p-6 w-full max-w-lg shadow-2xl relative cursor-default">
            <button 
              onClick={() => setSelectedTooth(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-colors"
              title="Close modal"
            >
              <X size={20} />
            </button>

            <div className="mb-4">
              <span className="text-[10px] uppercase font-black text-blue-600 block">TOOTH CLINICAL LOGS</span>
              <h3 className="text-lg font-extrabold text-slate-800">Assign Treatment for Tooth #{selectedTooth}</h3>
              <p className="text-xs text-slate-400 mt-1">Patient: {activePatient.name}</p>
            </div>

            {/* Selector treatment Tab header */}
            <div className="flex border-b border-slate-100 mb-5">
              {(["filling", "extraction", "crown"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTreatmentTab(tab)}
                  className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                    activeTreatmentTab === tab 
                      ? "border-blue-600 text-blue-600" 
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab === "filling" && "Restorative Filling"}
                  {tab === "extraction" && "Clinical Extraction"}
                  {tab === "crown" && "Crown Prosthetic"}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: FILLINGS */}
            {activeTreatmentTab === "filling" && (
              <form onSubmit={handleAddFilling} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Restoration material</label>
                  <div className="flex gap-3">
                    {["Composite", "Amalgam", "GIC"].map((mat) => (
                      <button
                        key={mat}
                        type="button"
                        onClick={() => setFillingMaterial(mat as any)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          fillingMaterial === mat 
                            ? "bg-blue-600 text-white border-blue-600" 
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        {mat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Anatomy Surfaces Affected</label>
                  <div className="flex gap-2">
                    {["O", "M", "D", "B", "L"].map((surf) => {
                      const isSelected = fillingSurfaces.includes(surf as any);
                      return (
                        <button
                          key={surf}
                          type="button"
                          onClick={() => handleSurfaceToggle(surf as any)}
                          className={`w-9 h-9 rounded-lg text-xs font-extrabold border transition-colors ${
                            isSelected 
                              ? "bg-slate-800 text-white border-slate-800" 
                              : "bg-white border-slate-200 text-slate-500"
                          }`}
                        >
                          {surf}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[9px] text-slate-400 block pt-1">O: Occlusal, M: Mesial, D: Distal, B: Buccal, L: Lingual</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Service Fee ($)</label>
                  <input
                    type="number"
                    value={fillingCost}
                    onChange={(e) => setFillingCost(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Procedural Notes</label>
                  <textarea
                    value={fillingNotes}
                    onChange={(e) => setFillingNotes(e.target.value)}
                    placeholder="E.g., Local block given, restored deep pit occlusion without pulp exposure."
                    rows={2}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Apply Filling Log & Invoice
                </button>
              </form>
            )}

            {/* TAB CONTENT: EXTRACTION */}
            {activeTreatmentTab === "extraction" && (
              <form onSubmit={handleAddExtraction} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Extraction nature</label>
                    <select
                      value={extractionType}
                      onChange={(e) => setExtractionType(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700"
                    >
                      <option value="Simple">Simple</option>
                      <option value="Surgical">Surgical</option>
                      <option value="Impaction">Impaction</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Anatomy Complexity</label>
                    <select
                      value={extractionComplexity}
                      onChange={(e) => setExtractionComplexity(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700"
                    >
                      <option value="Low">Low (Root Fused)</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High (Impaction)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Reason for extraction</label>
                  <input
                    type="text"
                    value={extractionReason}
                    onChange={(e) => setExtractionReason(e.target.value)}
                    required
                    placeholder="E.g., Severe vertical fracture or deep periapical infection"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Initial Post-Op Plan</label>
                    <input
                      type="text"
                      value={extractionPostOp}
                      onChange={(e) => setExtractionPostOp(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Extraction Cost ($)</label>
                    <input
                      type="number"
                      value={extractionCost}
                      onChange={(e) => setExtractionCost(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Extirpate Tooth Structure & Invoice
                </button>
              </form>
            )}

            {/* TAB CONTENT: CROWNS */}
            {activeTreatmentTab === "crown" && (
              <form onSubmit={handleAddCrown} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Material Option</label>
                    <select
                      value={prostheticType}
                      onChange={(e) => setProstheticType(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700"
                    >
                      <option value="Zirconia">High Zirconia Aesthetic</option>
                      <option value="E-Max">E-Max Porcelain</option>
                      <option value="Porcelain Fused Metal">PFM Core</option>
                      <option value="Bridge">Dental Bridge</option>
                      <option value="Denture">Removable Denture</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Fabrication lab</label>
                    <input
                      type="text"
                      value={crownLab}
                      onChange={(e) => setCrownLab(e.target.value)}
                      required
                      placeholder="E.g., Apex Premium Lab"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Total Crown Cost ($)</label>
                    <input
                      type="number"
                      value={crownTotalCost}
                      onChange={(e) => setCrownTotalCost(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Upfront payment ($)</label>
                    <input
                      type="number"
                      value={crownPaidAmount}
                      onChange={(e) => setCrownPaidAmount(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Initial Prep Notes</label>
                  <textarea
                    value={crownNotes}
                    onChange={(e) => setCrownNotes(e.target.value)}
                    placeholder="Preparation completed. Match shade tooth A1.5..."
                    rows={2}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Create Crown Work order
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5. CROWN TRANSITIONAL PAYMENT MODAL */}
      {payingCrownId && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPayingCrownId(null);
            }
          }}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-55 p-4 cursor-pointer"
        >
          <div className="bg-white rounded-[32px] border border-slate-100 p-6 w-full max-w-sm shadow-2xl relative cursor-default">
            <button 
              onClick={() => setPayingCrownId(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-colors"
              title="Close modal"
            >
              <X size={20} />
            </button>

            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Post Prosthetic Payment</h3>

            <form onSubmit={handleCrownPayment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Collect Amount ($)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-700"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card Checkout</option>
                  <option value="Bank Transfer">Bank Wire Transfer</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Log Receipt Payment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PATIENT DEMOGRAPHICS MODAL */}
      {isEditPatientOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] border border-slate-100 p-6 w-full max-w-lg shadow-2xl relative cursor-default max-h-[92vh] flex flex-col">
            <button 
              onClick={() => setIsEditPatientOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-colors"
              title="Close modal"
            >
              <X size={20} />
            </button>

            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User size={18} className="text-amber-500" />
              <span>Edit Patient Profile Demographics</span>
            </h3>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Full Name</label>
                  <input
                    type="text"
                    value={editPatientName}
                    onChange={(e) => setEditPatientName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Date of Birth</label>
                  <input
                    type="date"
                    value={editPatientDob}
                    onChange={(e) => setEditPatientDob(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Gender</label>
                  <select
                    value={editPatientGender}
                    onChange={(e) => setEditPatientGender(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Risk Level</label>
                  <select
                    value={editPatientRiskLevel}
                    onChange={(e) => setEditPatientRiskLevel(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold"
                  >
                    <option value="Low">Low Risk</option>
                    <option value="Moderate">Moderate Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Phone</label>
                  <input
                    type="text"
                    value={editPatientPhone}
                    onChange={(e) => setEditPatientPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">WhatsApp</label>
                  <input
                    type="text"
                    value={editPatientWhatsapp}
                    onChange={(e) => setEditPatientWhatsapp(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Email Address</label>
                <input
                  type="email"
                  value={editPatientEmail}
                  onChange={(e) => setEditPatientEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Occupation</label>
                  <input
                    type="text"
                    value={editPatientOccupation}
                    onChange={(e) => setEditPatientOccupation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Allergies Warning</label>
                  <input
                    type="text"
                    value={editPatientAllergies}
                    onChange={(e) => setEditPatientAllergies(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-rose-200 text-xs text-rose-700 font-bold bg-rose-50/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Weight</label>
                  <input
                    type="text"
                    value={editPatientWeight}
                    onChange={(e) => setEditPatientWeight(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Height</label>
                  <input
                    type="text"
                    value={editPatientHeight}
                    onChange={(e) => setEditPatientHeight(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Home/Contact Address</label>
                <textarea
                  value={editPatientAddress}
                  onChange={(e) => setEditPatientAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 h-16 resize-none font-semibold"
                />
              </div>
            </div>

            <button
              onClick={handleSavePatientEdits}
              className="w-full mt-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow-md"
            >
              Save Profile Changes
            </button>
          </div>
        </div>
      )}

      {/* EDIT TREATMENT RECORD MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] border border-slate-100 p-6 w-full max-w-md shadow-2xl relative cursor-default">
            <button 
              onClick={() => setEditingRecord(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-colors"
              title="Close modal"
            >
              <X size={20} />
            </button>

            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <PenTool size={18} className="text-blue-500" />
              <span>Edit Historic Clinical Record ({editingRecord.type})</span>
            </h3>

            <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-1 custom-scrollbar">
              
              {/* Common Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Log Date</label>
                  <input
                    type="date"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono"
                  />
                </div>
                {editingRecord.type !== "session" && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Tooth Number (FDI)</label>
                    <input
                      type="number"
                      min="1"
                      max="32"
                      value={recordTooth}
                      onChange={(e) => setRecordTooth(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono font-bold"
                    />
                  </div>
                )}
                {editingRecord.type === "session" && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Scheduled Time</label>
                    <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1 items-center">
                      {/* Hour Stepper */}
                      <div className="flex-1 min-w-0 flex flex-col items-center">
                        <button 
                          type="button" 
                          onClick={() => recordAdjustHour(1)} 
                          className="w-full flex justify-center py-0.5 bg-slate-100 hover:bg-blue-600 text-slate-500 hover:text-white rounded-t-lg transition-all cursor-pointer group active:scale-95"
                        >
                          <ChevronUp size={12} className="group-hover:scale-110" />
                        </button>
                        <input
                          type="text"
                          value={recordTime.split(' ')[0].split(':')[0]}
                          onChange={(e) => {
                            const parts = recordTime.split(' ');
                            const digits = e.target.value.replace(/\D/g, '');
                            let val = parseInt(digits, 10);
                            if (val > 12) val = 12;
                            const h = isNaN(val) ? "" : String(val).padStart(2, '0');
                            setRecordTime(`${h}:${parts[0].split(':')[1] || "00"} ${parts[1] || "AM"}`);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowUp') { e.preventDefault(); recordAdjustHour(1); }
                            if (e.key === 'ArrowDown') { e.preventDefault(); recordAdjustHour(-1); }
                          }}
                          placeholder="HH"
                          className="w-full bg-white border-x border-slate-100 py-1 px-0.5 text-center text-xs font-black focus:outline-none text-slate-800 font-mono"
                        />
                        <button 
                          type="button" 
                          onClick={() => recordAdjustHour(-1)} 
                          className="w-full flex justify-center py-0.5 bg-slate-100 hover:bg-blue-600 text-slate-500 hover:text-white rounded-b-lg transition-all cursor-pointer group active:scale-95"
                        >
                          <ChevronDown size={12} className="group-hover:scale-110" />
                        </button>
                      </div>
                      
                      <span className="font-black text-slate-400 mb-0.5">:</span>
                      
                      {/* Minute Stepper */}
                      <div className="flex-1 min-w-0 flex flex-col items-center">
                        <button 
                          type="button" 
                          onClick={() => recordAdjustMinute(1)} 
                          className="w-full flex justify-center py-0.5 bg-slate-100 hover:bg-blue-600 text-slate-500 hover:text-white rounded-t-lg transition-all cursor-pointer group active:scale-95"
                        >
                          <ChevronUp size={12} className="group-hover:scale-110" />
                        </button>
                        <input
                          type="text"
                          value={recordTime.split(' ')[0].split(':')[1]}
                          onChange={(e) => {
                            const parts = recordTime.split(' ');
                            const digits = e.target.value.replace(/\D/g, '');
                            let val = parseInt(digits, 10);
                            if (val > 59) val = 59;
                            const m = isNaN(val) ? "" : String(val).padStart(2, '0');
                            setRecordTime(`${parts[0].split(':')[0] || "10"}:${m} ${parts[1] || "AM"}`);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowUp') { e.preventDefault(); recordAdjustMinute(1); }
                            if (e.key === 'ArrowDown') { e.preventDefault(); recordAdjustMinute(-1); }
                          }}
                          placeholder="MM"
                          className="w-full bg-white border-x border-slate-100 py-1 px-0.5 text-center text-xs font-black focus:outline-none text-slate-800 font-mono"
                        />
                        <button 
                          type="button" 
                          onClick={() => recordAdjustMinute(-1)} 
                          className="w-full flex justify-center py-0.5 bg-slate-100 hover:bg-blue-600 text-slate-500 hover:text-white rounded-b-lg transition-all cursor-pointer group active:scale-95"
                        >
                          <ChevronDown size={12} className="group-hover:scale-110" />
                        </button>
                      </div>
                      <div className="flex gap-1 shrink-0 ml-0.5">
                        {["AM", "PM"].map((mode) => {
                          const isActive = (recordTime.split(' ')[1] || "AM") === mode;
                          return (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => {
                                const hhmm = recordTime.split(' ')[0] || "10:00";
                                setRecordTime(`${hhmm} ${mode}`);
                              }}
                              className={`px-2 py-1.5 rounded-lg text-[9px] font-black transition-all cursor-pointer ${
                                isActive 
                                  ? "bg-blue-600 text-white shadow-sm" 
                                  : "text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              {mode}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Filling specifics */}
              {editingRecord.type === "filling" && (
                <>
                  <div className="space-y-1 font-sans">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Restoration Material</label>
                    <select
                      value={recordMaterial}
                      onChange={(e) => setRecordMaterial(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold"
                    >
                      <option value="Composite">Composite resin</option>
                      <option value="Amalgam">Silver Amalgam</option>
                      <option value="GIC">Glass Ionomer (GIC)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Involved Surfaces</label>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["O", "M", "D", "B", "L"].map((code) => {
                        const active = recordSurfaces.includes(code);
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => {
                              if (active) {
                                setRecordSurfaces(recordSurfaces.filter((s) => s !== code));
                              } else {
                                setRecordSurfaces([...recordSurfaces, code]);
                              }
                            }}
                            className={`px-3 py-1 text-xs font-black rounded-lg border cursor-pointer transition-all ${
                              active
                                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                : "bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {code}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Extraction specifics */}
              {editingRecord.type === "extraction" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Extraction Class</label>
                      <select
                        value={recordExtType}
                        onChange={(e) => setRecordExtType(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold"
                      >
                        <option value="Simple">Simple extraction</option>
                        <option value="Surgical">Surgical extraction</option>
                        <option value="Impaction">Full wisdom Impaction</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Clinical Complexity</label>
                      <select
                        value={recordComplexity}
                        onChange={(e) => setRecordComplexity(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">Severe/High</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Post-Op Status</label>
                    <input
                      type="text"
                      value={recordPostOp}
                      onChange={(e) => setRecordPostOp(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Crown Prosthetics specifics */}
              {editingRecord.type === "prosthetic" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 font-sans">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Prosthetic Crown type</label>
                      <select
                        value={recordProsType}
                        onChange={(e) => setRecordProsType(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold"
                      >
                        <option value="Zirconia">Full Zirconia</option>
                        <option value="E-Max">E-Max lithium disilicate</option>
                        <option value="Porcelain Fused Metal">Porcelain Fused Metal</option>
                        <option value="Bridge">Prosthetic Bridge</option>
                        <option value="Denture">Removable Denture</option>
                      </select>
                    </div>
                    <div className="space-y-1 font-sans">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Fabrication Lab status</label>
                      <select
                        value={recordLabStatus}
                        onChange={(e) => setRecordLabStatus(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold"
                    >
                        <option value="Sent to Lab font">Sent to external lab</option>
                        <option value="In Fabrication">In Fabrication</option>
                        <option value="Received from Lab">Received</option>
                        <option value="Adjusted">Clinically Adjusted</option>
                        <option value="Fitted">Cemented / Fitted</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 font-sans">Lab Provider Name</label>
                    <input
                      type="text"
                      value={recordLab}
                      onChange={(e) => setRecordLab(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 font-semibold">Paid Ledger Amount ($)</label>
                    <input
                      type="number"
                      value={recordPaid}
                      onChange={(e) => setRecordPaid(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono font-bold"
                    />
                  </div>
                </>
              )}

              {/* Sessions specifics */}
              {editingRecord.type === "session" && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Procedure Category Type</label>
                    <input
                      type="text"
                      value={recordProcType}
                      onChange={(e) => setRecordProcType(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-blue-700 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Clinician Name</label>
                    <input
                      type="text"
                      value={recordDocName}
                      onChange={(e) => setRecordDocName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold"
                    />
                  </div>
                </>
              )}

              {/* Cost & Note Fields for treatments */}
              {editingRecord.type !== "session" && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 font-sans">Procedure Fee / Total Cost ($)</label>
                  <input
                    type="number"
                    value={recordCost}
                    onChange={(e) => setRecordCost(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono font-bold"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 font-sans">Clinical Assessment / Notes</label>
                <textarea
                  value={recordNotes}
                  onChange={(e) => setRecordNotes(e.target.value)}
                  className="w-full p-2.5 text-xs text-slate-700 rounded-xl border border-slate-200 h-24 resize-none font-semibold"
                />
              </div>

            </div>

            <button
              onClick={handleSaveRecordEdit}
              className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow-md"
            >
              Save Record Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
