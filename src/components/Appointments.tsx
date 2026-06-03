import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../store";
import { 
  Plus, 
  Clock, 
  Calendar as CalIcon, 
  User, 
  UserCheck, 
  X, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  Search, 
  Briefcase,
  Layers,
  Check,
  CheckCircle,
  AlertCircle,
  Activity,
  Smile,
  DollarSign,
  FileText,
  MousePointer,
  Sparkles,
  ShieldCheck,
  MapPin,
  Heart
} from "lucide-react";
import { PremiumSelect } from "./ui/PremiumSelect";
import { Appointment, ProcedureType, AppointmentStatus, Patient } from "../types";

export interface AppointmentsProps {
  onSwitchTab?: (tab: string) => void;
  onSelectPatient?: (pId: string | null) => void;
}

export default function Appointments({ onSwitchTab, onSelectPatient }: AppointmentsProps) {
  const { 
    appointments, 
    patients, 
    users,
    doctorShifts, 
    addAppointment, 
    updateAppointment, 
    deleteAppointment,
    addPatient,
    addClinicalIncomeRecord,
    currentUser
  } = useStore();

  // Booking Wizard states
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Admit intake modal state variables
  const [isAdmittingAppId, setIsAdmittingAppId] = useState<string | null>(null);
  const [admitCostName, setAdmitCostName] = useState("");
  const [admitCostVal, setAdmitCostVal] = useState<number>(0);
  const [admitPaidVal, setAdmitPaidVal] = useState<number>(0);
  const [admitNotes, setAdmitNotes] = useState("");
  const [admitPaymentMethod, setAdmitPaymentMethod] = useState<"Cash" | "Card" | "Bank Transfer">("Cash");

  const appBeingAdmitted = useMemo(() => {
    if (!isAdmittingAppId) return null;
    return appointments.find(a => a.id === isAdmittingAppId) || null;
  }, [isAdmittingAppId, appointments]);

  // Filter conditions for scheduler
  const [filterDate, setFilterDate] = useState("all");
  const [filterDoctor, setFilterDoctor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Step 1 states (Patient Details & Appointment Time)
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsApp, setWhatsApp] = useState("");
  const [age, setAge] = useState("32");
  const [sex, setSex] = useState("Male");
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  const [patientState, setPatientState] = useState<AppointmentStatus>("Scheduled");
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  
  const [bookingTime, setBookingTime] = useState(() => {
    const d = new Date();
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hStr = String(hours).padStart(2, '0');
    const mStr = String(minutes).padStart(2, '0');
    return `${hStr}:${mStr} ${ampm}`;
  });
  const [procedureType, setProcedureType] = useState<ProcedureType>("Consultation");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [quickNotes, setQuickNotes] = useState("");
  const [patientImageUrl, setPatientImageUrl] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(() => {
    const defaultDoc = users.find(u => u.role === "doctor" || u.role === "admin" || u.role === "clinician");
    return defaultDoc ? defaultDoc.name : "Practitioner";
  });

  // Helper to adjust time segments
  const adjustHour = (delta: number) => {
    const parts = bookingTime.split(' ');
    const hm = parts[0].split(':');
    const current = parseInt(hm[0], 10) || 12;
    let next = current + delta;
    if (next > 12) next = 1;
    if (next < 1) next = 12;
    setBookingTime(`${String(next).padStart(2, '0')}:${hm[1] || "00"} ${parts[1] || "AM"}`);
  };

  const adjustMinute = (delta: number) => {
    const parts = bookingTime.split(' ');
    const hm = parts[0].split(':');
    const current = parseInt(hm[1], 10) || 0;
    let next = current + delta;
    if (next > 59) next = 0;
    if (next < 0) next = 59;
    setBookingTime(`${hm[0] || "10"}:${String(next).padStart(2, '0')} ${parts[1] || "AM"}`);
  };

  // Step 2 states (Medical History)
  const [medicalChecklist, setMedicalChecklist] = useState<string[]>([]);
  const [newCustomMedical, setNewCustomMedical] = useState("");
  const [customMedicalList, setCustomMedicalList] = useState<string[]>([]);

  // Step 3 states (Dental History)
  const [assignedTooth, setAssignedTooth] = useState("FDI 14");
  const [newDentalPoint, setNewDentalPoint] = useState("");
  const [dentalHistoryPoints, setDentalHistoryPoints] = useState<string[]>([]);

  // Step 4 states (Billing)
  const [billingType, setBillingType] = useState<"Cash" | "Card" | "Bank Transfer">("Cash");
  const [totalFee, setTotalFee] = useState<number>(100);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [receiptAttached, setReceiptAttached] = useState(false);
  const [receiptFileName, setReceiptFileName] = useState("");
  const [receiptFileContent, setReceiptFileContent] = useState("");

  // Available common medical issues checklist
  const commonMedicalIssues = [
    "Diabetes",
    "High Blood Pressure",
    "Heart Disease",
    "Asthma",
    "Hepatitis",
    "Bleeding Disorder",
    "Allergy - Penicillin",
    "Pregnancy",
    "Smoking",
    "Kidney Disease",
    "Thyroid Disease",
    "Epilepsy"
  ];

  // Calculate remaining balance dynamically
  const remainingCost = useMemo(() => {
    return Math.max(0, totalFee - paidAmount);
  }, [totalFee, paidAmount]);

  // Derive active doctor details dynamically from users list
  const doctorDetails = useMemo(() => {
    return users
      .filter(u => 
        u.role === "doctor" || u.role === "clinician" ||
        u.role2 === "doctor" || u.role2 === "clinician"
      )
      .map((u, idx) => ({
        name: u.name,
        specialty: u.specialty || (u.role === "clinician" ? "Dental Clinician" : "Medical Practitioner"),
        room: u.assignedRoom || `Room ${idx + 1}`,
        image: u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=2563EB&color=fff&bold=true`
      }));
  }, [users]);

  // Patients matched search for existing list
  const patientSearchResults = useMemo(() => {
    return patients.filter(p => 
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
      p.phone.includes(patientSearch)
    );
  }, [patients, patientSearch]);

  // Sync existing patient data when picked
  const handleSelectExistingPatient = (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setFullName(patient.name);
    setPhone(patient.phone);
    setWhatsApp(patient.phone); // default
    setAddress(patient.address || "");
    setOccupation(patient.occupation || "Service Professional");
    setAge("35"); // defaulted or calculated from dob
    setSex(patient.gender);

    // Sync state for medical checklist
    const initialMedList = [];
    if (patient.riskLevel === "High") initialMedList.push("High Blood Pressure");
    if (patient.allergies && patient.allergies.toLowerCase().includes("penicillin")) {
      initialMedList.push("Allergy - Penicillin");
    }
    setMedicalChecklist(initialMedList);
  };

  // Switch to new patient mode cleanly
  const handleSwitchToNewPatientMode = () => {
    setPatientMode("new");
    setSelectedPatientId("");
    setFullName("");
    setPhone("");
    setWhatsApp("");
    setAge("32");
    setSex("Male");
    setAddress("");
    setOccupation("");
    setChiefComplaint("");
  };

  // Add custom medical issues
  const handleAddCustomMedical = () => {
    if (!newCustomMedical.trim()) return;
    setCustomMedicalList([...customMedicalList, newCustomMedical.trim()]);
    setNewCustomMedical("");
  };

  // Add custom dental history list point
  const handleAddDentalPoint = () => {
    if (!newDentalPoint.trim()) return;
    setDentalHistoryPoints([...dentalHistoryPoints, newDentalPoint.trim()]);
    setNewDentalPoint("");
  };

  // Full Overview Finalize Handler
  const handleFinalizeBooking = () => {
    let finalPatientId = selectedPatientId;
    let finalPatientName = fullName;
    let finalPatientPhone = phone;

    // 1. If new patient, create in database folder first
    if (patientMode === "new" || !selectedPatientId) {
      const onboardedId = addPatient({
        name: fullName || "Unnamed Patient",
        phone: phone || "Not provided",
        dob: `19${94 - parseInt(age || "30")}-05-26`, // simulated dob matching age
        gender: sex,
        orthoNotes: `Chief Complaint: ${chiefComplaint || "Routine dental survey requested."}`,
        riskLevel: medicalChecklist.includes("High Blood Pressure") ? "High" : medicalChecklist.length > 2 ? "Moderate" : "Low",
        allergies: medicalChecklist.includes("Allergy - Penicillin") ? "Penicillin" : "None",
        avatarUrl: patientImageUrl || undefined,
        whatsapp: whatsApp || undefined
      });
      finalPatientId = onboardedId;
    }

    // Log the reservation payment to financialRecords as income
    if (totalFee > 0 || paidAmount > 0) {
      addClinicalIncomeRecord(finalPatientId, {
        procedureName: `Reservation: ${procedureType}`,
        totalCost: totalFee,
        paidAmount: paidAmount,
        paymentMethod: billingType,
        notes: `Booking reservation fee for appointment on ${bookingDate} ${bookingTime}`,
        receiptFileName: receiptFileName || undefined,
        receiptFileContent: receiptFileContent || undefined
      });
    }

    // 2. Add key Appointment Record
    addAppointment({
      patientId: finalPatientId,
      patientName: finalPatientName,
      patientPhone: finalPatientPhone,
      doctorName: selectedDoctor,
      date: bookingDate,
      time: bookingTime,
      procedureType: procedureType,
      status: patientState,
      notes: chiefComplaint || `Review focus ${assignedTooth}. Billing status: ${billingType} fee $${totalFee}.`,
      quickNotes: quickNotes
    });

    // Reset wizard forms & exit
    setIsWizardOpen(false);
    setWizardStep(1);
    setSelectedPatientId("");
    setFullName("");
    setPhone("");
    setWhatsApp("");
    setChiefComplaint("");
    setQuickNotes("");
    setProcedureType("Consultation");
    setMedicalChecklist([]);
    setCustomMedicalList([]);
    setDentalHistoryPoints([]);
    setTotalFee(100);
    setPaidAmount(0);
    setPatientSearch("");
    setPatientImageUrl("");
    setReceiptAttached(false);
    setReceiptFileName("");
    setReceiptFileContent("");
  };

  const currentDoctorObj = useMemo(() => {
    return doctorDetails.find(d => d.name === selectedDoctor) || doctorDetails[0] || { room: "Examination Room" };
  }, [selectedDoctor, doctorDetails]);

  // Filter list of schedules
  const sortedAppointments = useMemo(() => {
    return appointments
      .filter(a => {
        const matchDoc = filterDoctor === "all" || a.doctorName === filterDoctor;
        const matchStatus = filterStatus === "all" || a.status === filterStatus;
        const matchDt = filterDate === "all" || a.date === filterDate;
        return matchDoc && matchStatus && matchDt;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time));
  }, [appointments, filterDoctor, filterStatus, filterDate]);

  return (
    <div className="space-y-8 animate-fade-in text-slate-800" id="appointments-hub-wrapper">
      
      {/* Top action block with enlarged headers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 p-6 rounded-[32px] border border-white shadow-sm">
        <div>
          <span className="text-sm font-extrabold uppercase tracking-widest text-blue-700 bg-blue-600/10 border border-blue-200/50 px-4 py-1.5 rounded-full">
            Clinical Multi-Step Operations
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-3">Scheduling & Booking Registry</h2>
          <p className="text-slate-600 text-sm font-semibold max-w-xl mt-1.5">
            Onboard patients with the 5-Step interactive digital wizard. Log medical histories, teeth coordinates, and immediate finance ledger cards.
          </p>
        </div>
        <button
          onClick={() => {
            setIsWizardOpen(true);
            setWizardStep(1);
          }}
          className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-blue-100 active:scale-95"
          id="btn-schedule-wizard-trigger"
        >
          <Plus size={18} />
          <span>Launch Intake Wizard</span>
        </button>
      </div>

      {/* Main Grid elements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Availability Section */}
        <div className="lg:col-span-4 bg-white rounded-[32px] p-6 shadow-md border border-slate-200 space-y-6">
          <div className="border-b border-slate-200/60 pb-4">
            <h3 className="font-black text-slate-900 text-base tracking-tight flex items-center gap-2.5">
              <UserCheck size={20} className="text-emerald-500" />
              <span>Practitioner Operational Shifts</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Active treatment rooms & specialist status.</p>
          </div>

          <div className="space-y-4">
            {doctorShifts.map((shift, idx) => {
              const matchedDetails = doctorDetails.find(d => d.name === shift.name);
              return (
                <div key={idx} className="p-5 bg-white border border-slate-100 rounded-2xl text-sm space-y-3 hover:shadow-md transition-all shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">{shift.name}</span>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider ${
                      shift.isAvailable ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-red-100 text-red-800"
                    }`}>
                      {shift.isAvailable ? "Active Room" : "Off Duty"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 bg-blue-600/10 rounded-xl text-xs font-bold w-fit">
                    <MapPin size={12} />
                    <span>{matchedDetails?.room || "Room 1"} • {shift.specialty}</span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 font-medium">
                    <p><strong>Work Days:</strong> {shift.days.join(", ")}</p>
                    <p><strong>Practice Hours:</strong> {shift.hours}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Existing booking slots with enlarged contents */}
        <div className="lg:col-span-8 bg-white rounded-[32px] p-6 shadow-md border border-slate-200 flex flex-col min-h-[500px] lg:min-h-[780px]">
          <div className="space-y-6 flex flex-col flex-1 h-full min-h-0">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2.5">
                  <Clock size={20} className="text-blue-500" />
                  <span>Clinical Directives Schedule</span>
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Chronologically sorted clinical checkpoints.</p>
              </div>

              {/* Filtering */}
              <div className="flex flex-wrap gap-2.5">
                <PremiumSelect
                  value={filterDoctor}
                  onChange={(e) => setFilterDoctor(e.target.value)}
                  className="p-2 border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none rounded-xl shadow-sm"
                >
                  <option value="all">All Doctors</option>
                  {doctorDetails.map(d => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </PremiumSelect>

                <PremiumSelect
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="p-2 border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none rounded-xl shadow-sm"
                >
                  <option value="all">All Status</option>
                  <option value="Scheduled">Scheduled (Reserved)</option>
                  <option value="Waiting">Waiting List</option>
                  <option value="In chair">In Practice Chair</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </PremiumSelect>
              </div>
            </div>

            {/* List */}
            <div className="space-y-4 flex-1 overflow-y-auto pr-1 min-h-[380px] lg:min-h-[560px]">
              {sortedAppointments.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <AlertCircle className="mx-auto text-slate-300 mb-3" size={40} />
                  <p className="font-black text-slate-500 text-sm">No scheduled clinic treatments records found.</p>
                </div>
              ) : (
                sortedAppointments.map(app => {
                  const isInChair = app.status === "In chair";
                  return (
                    <motion.div 
                      key={app.id} 
                      className={`p-5 border bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 rounded-2xl ${
                        isInChair 
                          ? "border-blue-400 bg-blue-50/5" 
                          : "border-slate-100 hover:border-blue-200 hover:shadow-md"
                      }`}
                      animate={isInChair ? {
                        scale: [1, 1.012, 1],
                        borderColor: [
                          "rgba(96, 165, 250, 0.5)", // Blue-400
                          "rgba(37, 99, 235, 0.8)",  // Blue-600
                          "rgba(96, 165, 250, 0.5)"
                        ],
                        boxShadow: [
                          "0 4px 6px -1px rgba(37, 99, 235, 0.05), 0 2px 4px -1px rgba(37, 99, 235, 0.03)",
                          "0 12px 20px -3px rgba(37, 99, 235, 0.15), 0 4px 10px -2px rgba(37, 99, 235, 0.1)",
                          "0 4px 6px -1px rgba(37, 99, 235, 0.05), 0 2px 4px -1px rgba(37, 99, 235, 0.03)"
                        ]
                      } : {}}
                      transition={isInChair ? {
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      } : undefined}
                    >
                      <div className="flex items-start gap-4">
                        
                        <div className={`text-center font-extrabold p-3 px-4 rounded-xl min-w-[96px] ${
                          isInChair 
                            ? "bg-blue-600 border border-blue-550 text-white" 
                            : "bg-blue-50 border border-blue-100 text-blue-700"
                        }`}>
                          <span className={`text-[9px] uppercase tracking-wider font-extrabold block ${isInChair ? "text-blue-100" : "text-blue-500"}`}>TIME</span>
                          <span className={`text-base font-black block ${isInChair ? "text-white" : "text-slate-900"}`}>{app.time}</span>
                          <span className={`text-[10px] block leading-tight mt-1 ${isInChair ? "text-blue-150" : "text-slate-600"}`}>{app.date}</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectPatient) {
                                  onSelectPatient(app.patientId);
                                  if (onSwitchTab) {
                                    onSwitchTab("patients");
                                  }
                                }
                              }}
                              className="font-extrabold text-slate-900 text-base leading-none hover:text-blue-600 hover:underline cursor-pointer text-left transition-all"
                              title="Open patient medical records"
                            >
                              {app.patientName}
                            </button>
                            <span className="text-[10px] bg-slate-100 text-slate-705 px-2.5 py-0.5 rounded-full font-bold">
                              {app.procedureType}
                            </span>
                            <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                              app.status === "In chair" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                              app.status === "Completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                              app.status === "Cancelled" ? "bg-rose-50 text-rose-700 border border-rose-100" : 
                              "bg-blue-50 text-blue-700 border border-blue-100"
                            }`}>
                              {app.status === "In chair" && (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-450 opacity-100"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                              )}
                              {app.status === "In chair" ? "In Patient Chair" : app.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-bold">Phone: {app.patientPhone} • Room Practitioner: {app.doctorName}</p>
                          <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-dotted border-slate-200 mt-1.5 leading-relaxed font-semibold">
                            "{app.notes || 'No doctor pre-notes stored.'}"
                          </p>
                          {app.quickNotes && (
                            <div className="flex items-center gap-2 bg-rose-50/80 border border-rose-200/60 text-rose-800 text-xs font-extrabold px-3 py-2 rounded-xl mt-2 animate-pulse max-w-xl">
                              <AlertCircle size={14} className="text-rose-600 shrink-0" />
                              <span>URGENT ALERT: {app.quickNotes}</span>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Operational controls */}
                      <div className="flex items-center gap-2 self-end md:self-center bg-slate-50 p-2 rounded-xl border border-slate-100 shadow-inner">
                        {app.status === "Scheduled" || app.status === "Waiting" ? (
                          <>
                            <button
                              onClick={() => {
                                updateAppointment(app.id, { status: "In chair" });
                              }}
                              className="p-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                              title="Admit patient to the dental chair for active treatment instantly"
                            >
                              <Activity size={12} className="text-blue-100 animate-pulse" />
                              <span>Admit to Chair</span>
                            </button>
                            <button
                              onClick={() => {
                                setIsAdmittingAppId(app.id);
                                setAdmitCostName(`${app.procedureType} Treatment`);
                                setAdmitCostVal(0);
                                setAdmitPaidVal(0);
                                setAdmitNotes("");
                                setAdmitPaymentMethod("Cash");
                              }}
                              className="p-2 px-3 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[11px] font-bold rounded-xl transition-all cursor-pointer border border-slate-200"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => updateAppointment(app.id, { status: "Cancelled" })}
                              className="p-2 px-2 text-slate-400 hover:text-rose-600 text-[11px] font-medium rounded-xl transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        ) : app.status === "In chair" ? (
                          <>
                            <button
                              onClick={() => {
                                setIsAdmittingAppId(app.id);
                                setAdmitCostName(`${app.procedureType} Treatment`);
                                setAdmitCostVal(0);
                                setAdmitPaidVal(0);
                                setAdmitNotes("");
                                setAdmitPaymentMethod("Cash");
                              }}
                              className="p-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1"
                              title="Complete procedure, manage final payments, and release treatment chair space"
                            >
                              <Check size={13} />
                              <span>Finish & Checkout</span>
                            </button>
                            <button
                              onClick={() => updateAppointment(app.id, { status: "Cancelled" })}
                              className="p-2 px-3 bg-white hover:bg-rose-50 text-slate-550 hover:text-rose-600 text-[11px] font-medium rounded-xl transition-all cursor-pointer border border-slate-150"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-500 text-[11px] font-bold">
                            <span>{app.status}</span>
                          </div>
                        )}
                        
                        <button
                          onClick={() => {
                            if (confirm("Permanently wipe this appointment document?")) {
                              deleteAppointment(app.id);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Delete record card"
                        >
                          <X size={15} />
                        </button>
                      </div>

                    </motion.div>
                  );
                })
              )}
            </div>

          </div>
        </div>

      </div>

      {/* 5-STEP CLINICAL INTAKE MODAL */}
      <AnimatePresence>
        {isWizardOpen && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsWizardOpen(false);
                setWizardStep(1);
              }
            }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 cursor-pointer"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white/95 backdrop-blur-2xl border border-white/60 p-6 md:p-10 w-full max-w-5xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.15)] rounded-[32px] relative my-4 md:my-8 cursor-default max-h-[92vh] overflow-hidden flex flex-col"
            >
              
              {/* Close Button */}
              <button 
                onClick={() => {
                  setIsWizardOpen(false);
                  setWizardStep(1);
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer p-2.5 rounded-full z-20 active:scale-90"
              >
                <X size={20} />
              </button>

              {/* Header */}
              <div className="mb-8 flex items-end justify-between shrink-0">
                <div className="space-y-1">
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">New Appointment</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded-md shadow-sm shadow-blue-200">
                      Phase {wizardStep}
                    </span>
                    <span className="text-sm font-bold text-slate-500">
                      {
                        wizardStep === 1 ? "Patient & Core Details" : 
                        wizardStep === 2 ? "Medical Assessment" : 
                        wizardStep === 3 ? "Dental Records" : 
                        wizardStep === 4 ? "Financial Ledger" : "Final Review"
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Sleek Segmented Stepper */}
              <div className="grid grid-cols-5 gap-4 mb-10 select-none relative z-10 shrink-0">
                {[
                  { number: 1, label: "Patient" },
                  { number: 2, label: "Medical" },
                  { number: 3, label: "Dental" },
                  { number: 4, label: "Billing" },
                  { number: 5, label: "Overview" }
                ].map((step) => {
                  const isActive = wizardStep === step.number;
                  const isPassed = wizardStep > step.number;
                  return (
                    <button
                      key={step.number}
                      type="button"
                      onClick={() => setWizardStep(step.number)}
                      className="flex flex-col gap-3 group cursor-pointer"
                    >
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden relative border border-slate-200/50">
                        {isActive && (
                          <motion.div 
                            layoutId="active-step-bar"
                            className="absolute inset-0 bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                            initial={false}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                          />
                        )}
                        {isPassed && (
                          <div className="absolute inset-0 bg-blue-600/40" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 px-0.5">
                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                          {step.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Scrollable Body Container */}
              <div className="flex-1 overflow-y-auto min-h-0 pr-2 -mr-2 space-y-8 custom-scrollbar">

            {/* STEP 1: PATIENT DATA DETAILED */}
            {wizardStep === 1 && (
              <motion.div 
                key="step1" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 pb-4"
              >
                
                {/* Sleek Segmented Control for Patient Mode */}
                <div className="flex flex-col items-center justify-center space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500/80">Select Patient Mode</span>
                  <div className="bg-slate-100/80 backdrop-blur-sm p-1.5 rounded-2xl flex relative w-full max-w-md border border-slate-200/40">
                    <button
                      type="button"
                      onClick={() => setPatientMode("existing")}
                      className={`relative z-10 flex-1 py-2.5 text-xs font-black transition-colors duration-200 ${
                        patientMode === "existing" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Search Existing
                      {patientMode === "existing" && (
                        <motion.div
                          layoutId="patientModeActive"
                          className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-200/50"
                          style={{ zIndex: -1 }}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleSwitchToNewPatientMode}
                      className={`relative z-10 flex-1 py-2.5 text-xs font-black transition-colors duration-200 ${
                        patientMode === "new" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      New Profile
                      {patientMode === "new" && (
                        <motion.div
                          layoutId="patientModeActive"
                          className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-200/50"
                          style={{ zIndex: -1 }}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {patientMode === "existing" && (
                  <div className="space-y-4 p-6 bg-slate-50/50 backdrop-blur-sm rounded-[24px] border border-slate-200/60 shadow-inner">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pick Registered Patient</label>
                      {selectedPatientId && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/50">MATCH FOUND</span>
                      )}
                    </div>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input
                        type="text"
                        placeholder="Search by name, phone, or ID number..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200/60 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-400/50 bg-white/70 backdrop-blur-sm transition-all placeholder:text-slate-400"
                      />
                    </div>
                    
                    <AnimatePresence>
                      {patientSearch && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="max-h-60 overflow-y-auto space-y-2 pt-2 custom-scrollbar"
                        >
                          {patientSearchResults.length > 0 ? (
                            patientSearchResults.map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  handleSelectExistingPatient(p);
                                  setPatientSearch("");
                                }}
                                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                                  selectedPatientId === p.id 
                                    ? "bg-blue-50 border-blue-200 shadow-sm" 
                                    : "bg-white/80 border-slate-100 hover:border-blue-200 hover:bg-white hover:shadow-md"
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                    {p.name.charAt(0)}
                                  </div>
                                  <div>
                                    <span className="text-sm font-black text-slate-800 block">{p.name}</span>
                                    <span className="text-xs text-slate-500 font-bold block mt-0.5">Phone: {p.phone} • Age: 35</span>
                                  </div>
                                </div>
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                  selectedPatientId === p.id 
                                    ? "bg-blue-600 text-white" 
                                    : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600"
                                }`}>
                                  {selectedPatientId === p.id ? <Check size={14} /> : null}
                                  <span>{selectedPatientId === p.id ? "Selected" : "Select"}</span>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-8 text-center bg-white/50 rounded-2xl border border-dashed border-slate-200">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching records found</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {selectedPatientId && !patientSearch && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                          <Check size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-emerald-900 leading-none">Profile Linked Successfully</p>
                          <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-tight">{fullName} • {phone}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  
                  {/* Avatar upload / Paste URL - Premium Redesign */}
                  <div className="md:col-span-3 flex flex-col items-center p-6 bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 rounded-[32px] space-y-5 shadow-inner">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-[40px] bg-white border-2 border-dashed border-slate-200 flex items-center justify-center shadow-sm overflow-hidden group-hover:border-blue-400 group-hover:shadow-md transition-all">
                        {patientImageUrl ? (
                          <img src={patientImageUrl} alt="Patient Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <User size={32} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">No Photo</span>
                          </div>
                        )}
                      </div>
                      <button 
                        type="button"
                        onClick={() => document.getElementById("patient-avatar-upload")?.click()}
                        className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center hover:bg-blue-700 transition-all active:scale-90 border-4 border-white"
                      >
                        <Plus size={20} />
                      </button>
                    </div>

                    <div className="w-full space-y-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Image Reference URL</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={patientImageUrl}
                          onChange={(e) => setPatientImageUrl(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200/60 text-xs text-slate-700 font-bold bg-white/70 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                        />
                      </div>
                      
                      <input
                        type="file"
                        accept="image/*"
                        id="patient-avatar-upload"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setPatientImageUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          onClick={() => setPatientImageUrl("https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80")}
                          className="px-4 py-2 bg-white border border-slate-200/60 text-slate-600 text-[10px] font-black uppercase tracking-tight rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
                          Use Sample Mockup
                        </button>
                        {patientImageUrl && (
                          <button
                            type="button"
                            onClick={() => setPatientImageUrl("")}
                            className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black uppercase tracking-tight rounded-xl hover:bg-rose-100 transition-all active:scale-95"
                          >
                            Clear Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Patient core fields - Glass-morphic Inputs */}
                  <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full p-4 rounded-2xl border border-slate-200/60 text-sm font-bold bg-slate-50/50 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400/50 transition-all placeholder:text-slate-300"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full p-4 rounded-2xl border border-slate-200/60 text-sm font-bold bg-slate-50/50 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400/50 transition-all placeholder:text-slate-300"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</label>
                      <input
                        type="text"
                        value={whatsApp}
                        onChange={(e) => setWhatsApp(e.target.value)}
                        placeholder="WhatsApp contact"
                        className="w-full p-4 rounded-2xl border border-slate-200/60 text-sm font-bold bg-slate-50/50 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400/50 transition-all placeholder:text-slate-300"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Age</label>
                        <input
                          type="text"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          placeholder="32"
                          className="w-full p-4 rounded-2xl border border-slate-200/60 text-sm font-bold bg-slate-50/50 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400/50 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sex</label>
                        <div className="relative">
                          <PremiumSelect
                            value={sex}
                            onChange={(e) => setSex(e.target.value)}
                            className="w-full p-4 rounded-2xl border border-slate-200/60 text-sm font-bold bg-slate-50/50 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400/50 transition-all cursor-pointer appearance-none"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </PremiumSelect>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Appointment Status</label>
                      <div className="relative">
                        <PremiumSelect
                          value={patientState}
                          onChange={(e) => setPatientState(e.target.value as AppointmentStatus)}
                          className="w-full p-4 rounded-2xl border border-slate-200/60 text-sm font-black text-blue-700 bg-blue-50/30 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400/50 transition-all cursor-pointer appearance-none"
                        >
                          <option value="Scheduled">Reserved (Scheduled)</option>
                          <option value="Waiting">Waiting</option>
                          <option value="In chair">In Chair (Active Room)</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </PremiumSelect>
                        <Activity className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" size={16} />
                      </div>
                    </div>

                    <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Occupation</label>
                      <input
                        type="text"
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        placeholder="Service Professional"
                        className="w-full p-4 rounded-2xl border border-slate-200/60 text-sm font-bold bg-slate-50/50 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400/50 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2 lg:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Residence Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Street name, City, Zip"
                          className="w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-200/60 text-sm font-bold bg-slate-50/50 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400/50 transition-all placeholder:text-slate-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking Date</label>
                      <div className="relative">
                        <CalIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="date"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-200/60 text-sm font-bold bg-slate-50/50 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400/50 transition-all cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Selection</label>
                      <div className="flex bg-slate-100/50 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-1.5 gap-1.5 items-center shadow-inner">
                        {/* Hour Stepper */}
                        <div className="flex-1 min-w-0 flex flex-col items-center">
                          <button 
                            type="button" 
                            onClick={() => adjustHour(1)} 
                            className="w-full flex justify-center py-1 bg-white hover:bg-blue-600 text-slate-400 hover:text-white rounded-t-xl transition-all cursor-pointer group active:scale-95 shadow-sm border border-slate-200/50"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <input
                            type="text"
                            value={bookingTime.split(' ')[0].split(':')[0]}
                            readOnly
                            className="w-full bg-transparent py-2 text-center text-sm font-black focus:outline-none text-slate-900"
                          />
                          <button 
                            type="button" 
                            onClick={() => adjustHour(-1)} 
                            className="w-full flex justify-center py-1 bg-white hover:bg-blue-600 text-slate-400 hover:text-white rounded-b-xl transition-all cursor-pointer group active:scale-95 shadow-sm border border-slate-200/50"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                        
                        <span className="font-black text-slate-300">:</span>
                        
                        {/* Minute Stepper */}
                        <div className="flex-1 min-w-0 flex flex-col items-center">
                          <button 
                            type="button" 
                            onClick={() => adjustMinute(5)} 
                            className="w-full flex justify-center py-1 bg-white hover:bg-blue-600 text-slate-400 hover:text-white rounded-t-xl transition-all cursor-pointer group active:scale-95 shadow-sm border border-slate-200/50"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <input
                            type="text"
                            value={bookingTime.split(' ')[0].split(':')[1]}
                            readOnly
                            className="w-full bg-transparent py-2 text-center text-sm font-black focus:outline-none text-slate-900"
                          />
                          <button 
                            type="button" 
                            onClick={() => adjustMinute(-5)} 
                            className="w-full flex justify-center py-1 bg-white hover:bg-blue-600 text-slate-400 hover:text-white rounded-b-xl transition-all cursor-pointer group active:scale-95 shadow-sm border border-slate-200/50"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0 px-1">
                          {["AM", "PM"].map((mode) => {
                            const isActive = (bookingTime.split(' ')[1] || "AM") === mode;
                            return (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => {
                                  const hhmm = bookingTime.split(' ')[0] || "10:00";
                                  setBookingTime(`${hhmm} ${mode}`);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                  isActive 
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                                    : "bg-white text-slate-400 border border-slate-200/50 hover:text-slate-600 shadow-sm"
                                }`}
                              >
                                {mode}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 md:col-span-2 lg:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Procedure Intended</label>
                      <div className="relative">
                        <PremiumSelect
                          value={procedureType}
                          onChange={(e) => setProcedureType(e.target.value as ProcedureType)}
                          className="w-full p-4 rounded-2xl border border-slate-200/60 text-sm font-bold bg-slate-50/50 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400/50 transition-all cursor-pointer appearance-none"
                        >
                          <option value="Consultation">General Consultation & Survey</option>
                          <option value="Filling">Restoration / Composite Filling</option>
                          <option value="Extraction">Extraction / Oral Surgery</option>
                          <option value="Crown & Prosthetic">Crown & Prosthetic Treatment</option>
                          <option value="Orthodontic">Orthodontic Adjustment / Braces</option>
                          <option value="Hygiene/Clean">Professional Hygiene & Polishing</option>
                        </PremiumSelect>
                        <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      </div>
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chief Complaint</label>
                    <textarea
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="Describe primary reason for clinical visit..."
                      rows={3}
                      className="w-full p-4 rounded-[24px] border border-slate-200/60 text-sm font-bold bg-slate-50/50 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400/50 transition-all placeholder:text-slate-300 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-rose-500" />
                        <span>Quick Clinical Notes</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Emergency High-Vis</span>
                    </div>
                    <textarea
                      id="wizard-quick-notes-input"
                      value={quickNotes}
                      onChange={(e) => setQuickNotes(e.target.value)}
                      placeholder="Enter urgent alerts, dietary limits (e.g. diabetic), or emergency contacts..."
                      rows={3}
                      className="w-full p-4 rounded-[24px] border border-rose-200/60 text-sm font-bold bg-rose-50/20 backdrop-blur-sm focus:bg-white focus:border-rose-400/50 focus:outline-none focus:ring-4 focus:ring-rose-500/10 text-slate-800 transition-all placeholder:text-rose-200 resize-none"
                    />
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        { label: "Dietary", text: "🥦 Dietary prep req." },
                        { label: "Cardiac", text: "🩺 Cardiac precautions." },
                        { label: "Bleeding", text: "🩸 Bleeding risk." },
                        { label: "Anxiety", text: "🚨 Severe anxiety." },
                      ].map((chip) => (
                        <button
                          key={chip.label}
                          type="button"
                          onClick={() => {
                            if (quickNotes.includes(chip.text)) return;
                            const newVal = quickNotes ? `${quickNotes} ${chip.text}` : chip.text;
                            setQuickNotes(newVal);
                          }}
                          className="text-[10px] bg-white border border-rose-100 text-rose-600 font-black uppercase tracking-tight px-3 py-1.5 rounded-xl hover:bg-rose-50 cursor-pointer transition-all active:scale-95 shadow-sm"
                        >
                          + {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Practitioner picker visual card style - Premium Redesign */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-bold">
                      Doctor / Room Assignment
                    </label>
                    <span className="text-[10px] text-blue-500 font-black uppercase tracking-tight bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/50">High Trust Verification</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {doctorDetails.map(doc => {
                      const isPicked = selectedDoctor === doc.name;
                      return (
                        <button
                          key={doc.name}
                          type="button"
                          onClick={() => setSelectedDoctor(doc.name)}
                          className={`group relative p-5 rounded-[28px] border transition-all cursor-pointer overflow-hidden ${
                            isPicked 
                              ? "bg-white border-blue-500 shadow-xl shadow-blue-500/10 ring-4 ring-blue-500/5" 
                              : "bg-slate-50/50 border-slate-200/60 hover:bg-white hover:border-blue-300 hover:shadow-lg"
                          }`}
                        >
                          <div className="flex items-center gap-4 relative z-10">
                            <div className={`relative ${isPicked ? 'scale-110' : ''} transition-transform duration-300`}>
                              <img src={doc.image} alt={doc.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md" />
                              {isPicked && (
                                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                  <Check size={12} strokeWidth={4} />
                                </div>
                              )}
                            </div>
                            <div>
                              <span className={`text-sm font-black block transition-colors ${isPicked ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                                {doc.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight block mt-0.5">{doc.specialty}</span>
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${isPicked ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-wider ${isPicked ? 'text-blue-600' : 'text-slate-500'}`}>{doc.room}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Premium Hover Effect Background */}
                          {!isPicked && (
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Buttons - Premium Redesign */}
                <div className="pt-10 flex justify-end">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="group relative px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-[24px] flex items-center gap-3 cursor-pointer shadow-xl shadow-blue-200 transition-all active:scale-95 hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    <span className="relative z-10">Continue to Medical History</span>
                    <ChevronRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </motion.div>
            )}

            {/* STEP 2: MEDICAL ASSESSMENT */}
            {wizardStep === 2 && (
              <motion.div 
                key="step2" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 pb-4"
              >
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Common Medical Issues
                  </label>
                  <span className="text-[10px] text-blue-500 font-black uppercase tracking-tight bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/50">
                    Select all that apply
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {commonMedicalIssues.map(issue => {
                    const checked = medicalChecklist.includes(issue);
                    return (
                      <button
                        key={issue}
                        type="button"
                        onClick={() => {
                          if (checked) {
                            setMedicalChecklist(medicalChecklist.filter(i => i !== issue));
                          } else {
                            setMedicalChecklist([...medicalChecklist, issue]);
                          }
                        }}
                        className={`relative group p-4 rounded-[24px] border transition-all cursor-pointer overflow-hidden ${
                          checked 
                            ? "bg-white border-blue-500 shadow-xl shadow-blue-500/10 ring-4 ring-blue-500/5" 
                            : "bg-slate-50/50 border-slate-200/60 hover:bg-white hover:border-blue-300 hover:shadow-lg"
                        }`}
                      >
                        <div className="flex items-center gap-3 relative z-10">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${
                            checked ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" : "border-slate-300 bg-white"
                          }`}>
                            <AnimatePresence mode="wait">
                              {checked && (
                                <motion.div
                                  key="check"
                                  initial={{ scale: 0, rotate: -45 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 45 }}
                                >
                                  <Check size={14} strokeWidth={4} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <span className={`text-xs font-black transition-colors ${checked ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
                            {issue}
                          </span>
                        </div>
                        {/* Premium Hover Effect Background */}
                        {!checked && (
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom medical issue */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">
                    Custom Clinical Issues
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Enter specific clinical condition..."
                      value={newCustomMedical}
                      onChange={(e) => setNewCustomMedical(e.target.value)}
                      className="flex-1 p-4 rounded-2xl border border-slate-200/60 text-sm font-bold bg-slate-50/50 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400/50 transition-all placeholder:text-slate-300"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomMedical}
                      className="px-8 py-4 bg-slate-900 text-white hover:bg-black font-black text-xs rounded-2xl transition-all active:scale-95 shadow-lg"
                    >
                      Add Issue
                    </button>
                  </div>

                  {customMedicalList.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {customMedicalList.map((item, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-black shadow-sm group hover:border-rose-200 hover:bg-rose-50 transition-all"
                        >
                          <Activity size={14} className="text-blue-500 group-hover:text-rose-500" />
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => setCustomMedicalList(customMedicalList.filter((_, i) => i !== idx))}
                            className="ml-1 text-slate-300 hover:text-rose-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer buttons */}
                <div className="pt-10 flex justify-between gap-4">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-black text-sm rounded-[24px] transition-all active:scale-95"
                  >
                    Back to Patient Details
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    className="group relative px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-[24px] flex items-center gap-3 cursor-pointer shadow-xl shadow-blue-200 transition-all active:scale-95 hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    <span className="relative z-10">Continue to Dental History</span>
                    <ChevronRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </motion.div>
            )}

            {/* STEP 3: DENTAL HISTORY */}
            {wizardStep === 3 && (
              <motion.div 
                key="step3" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 pb-4"
              >
                
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">
                    Primary Tooth Focus
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 bg-blue-50/30 backdrop-blur-sm border border-blue-100/50 rounded-[32px] items-center">
                    <div className="md:col-span-2 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-[24px] bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                        <span className="text-lg font-black tracking-tighter">FDI</span>
                      </div>
                    </div>
                    
                    <div className="md:col-span-6 space-y-1">
                      <h5 className="text-base font-black text-slate-900 leading-tight">Assign Target Tooth</h5>
                      <p className="text-slate-500 text-xs font-bold leading-relaxed">Select the specific FDI coordinate for pinpoint clinical focus.</p>
                    </div>

                    <div className="md:col-span-4 relative">
                      <PremiumSelect
                        value={assignedTooth}
                        onChange={(e) => setAssignedTooth(e.target.value)}
                        className="w-full p-4 pl-5 pr-12 rounded-2xl border border-blue-200 text-sm font-black text-blue-700 bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                      >
                        <option value="None">None (Whole Mouth)</option>
                        {Array.from({ length: 32 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={`FDI ${num}`}>FDI Tooth #{num}</option>
                        ))}
                      </PremiumSelect>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Historical Dental Records Log
                    </label>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/50">
                      Pinpoint Timeline
                    </span>
                  </div>
                  
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Enter previous treatment or dental milestone..."
                      value={newDentalPoint}
                      onChange={(e) => setNewDentalPoint(e.target.value)}
                      className="flex-1 p-4 rounded-2xl border border-slate-200/60 text-sm font-bold bg-slate-50/50 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400/50 transition-all placeholder:text-slate-300"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddDentalPoint();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddDentalPoint}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-100"
                    >
                      Add Point
                    </button>
                  </div>

                  <div className="relative min-h-[200px] bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 rounded-[32px] p-8 overflow-hidden shadow-inner">
                    {dentalHistoryPoints.length === 0 ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                          <Smile size={24} />
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed max-w-[200px]">
                          Historical log currently empty
                        </p>
                      </div>
                    ) : (
                      <div className="relative space-y-4">
                        {/* Timeline Line */}
                        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200" />
                        
                        {dentalHistoryPoints.map((pt, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="relative pl-8 group"
                          >
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-blue-500 shadow-sm z-10 transition-transform group-hover:scale-125" />
                            <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[20px] shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                              <div className="flex items-center gap-3">
                                <FileText size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                <span className="text-sm font-black text-slate-700">{pt}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setDentalHistoryPoints(dentalHistoryPoints.filter((_, i) => i !== idx))}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="pt-10 flex justify-between gap-4">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-black text-sm rounded-[24px] transition-all active:scale-95"
                  >
                    Back to Medical Assessment
                  </button>
                  <button
                    onClick={() => setWizardStep(4)}
                    className="group relative px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-[24px] flex items-center gap-3 cursor-pointer shadow-xl shadow-blue-200 transition-all active:scale-95 hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    <span className="relative z-10">Continue to Billing Ledger</span>
                    <ChevronRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </motion.div>
            )}

            {/* STEP 4: BILLING */}
            {wizardStep === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 pb-4"
              >
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Financial Accounting Ledger
                  </label>
                  <span className="text-[10px] text-blue-500 font-black uppercase tracking-tight bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/50">
                    Live Balance Tracking
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Billing Type</label>
                    <div className="relative">
                      <PremiumSelect
                        value={billingType}
                        onChange={(e) => setBillingType(e.target.value as any)}
                        className="w-full p-4 rounded-2xl border border-slate-200/60 text-sm font-bold bg-slate-50/50 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400/50 transition-all appearance-none cursor-pointer"
                      >
                        <option value="Cash">Cash Currency</option>
                        <option value="Card">Visa / Mastercard POS</option>
                        <option value="Bank Transfer">Direct Wire Bank Transfer</option>
                      </PremiumSelect>
                      <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Total Treatment Fee ($)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">$</span>
                      <input
                        type="number"
                        value={totalFee}
                        onChange={(e) => setTotalFee(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full p-4 pl-8 rounded-2xl border border-slate-200/60 text-sm font-black bg-slate-50/50 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Paid Upfront ($)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">$</span>
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full p-4 pl-8 rounded-2xl border border-slate-200/60 text-sm font-black bg-slate-50/50 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400/50 transition-all text-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Balance Remaining</label>
                    <div className="w-full p-4 rounded-2xl bg-rose-50/30 border border-rose-100 text-base font-black text-rose-700 shadow-inner flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-rose-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">DUE</span>
                      </div>
                      <span className="font-mono">${remainingCost}</span>
                    </div>
                  </div>

                </div>

                {/* Simulated receipt attached file widget */}
                <div className="p-6 bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 rounded-[32px] space-y-4 shadow-inner">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Receipt Verification</span>
                    <span className="text-[10px] text-blue-500 font-bold uppercase tracking-tight bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/50">Digital Attachment</span>
                  </div>
                  <div className="border-2 border-dashed border-slate-200 rounded-[24px] p-8 text-center space-y-4 bg-white/50 hover:bg-white hover:border-blue-400 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                      <Plus size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-black">Drag clinical receipts here</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">Support: JPG, PNG, PDF (Max 5MB)</p>
                    </div>
                    <input
                      type="file"
                      id="appointment-receipt-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setReceiptFileName(file.name);
                          setReceiptAttached(true);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setReceiptFileContent(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="flex flex-col sm:flex-row gap-2 justify-center items-center pt-2">
                      <button
                        type="button"
                        onClick={() => document.getElementById("appointment-receipt-upload")?.click()}
                        className={`px-6 py-3 font-black text-[11px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 ${
                          receiptFileName 
                            ? "bg-emerald-500 text-white shadow-emerald-200" 
                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
                        }`}
                      >
                        {receiptFileName ? `✓ ${receiptFileName}` : "Select File"}
                      </button>
                      
                      {!receiptFileName && (
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptFileName("receipt.pdf");
                            setReceiptAttached(true);
                            setReceiptFileContent("dummy-pdf-content");
                          }}
                          className="px-6 py-3 font-black text-[11px] uppercase tracking-wider rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
                        >
                          Attach Sample
                        </button>
                      )}

                      {receiptFileName && (
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptFileName("");
                            setReceiptAttached(false);
                            setReceiptFileContent("");
                            if (document.getElementById("appointment-receipt-upload")) {
                              (document.getElementById("appointment-receipt-upload") as HTMLInputElement).value = "";
                            }
                          }}
                          className="p-3 font-black text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="pt-10 flex justify-between gap-4">
                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-black text-sm rounded-[24px] transition-all active:scale-95"
                  >
                    Back to Dental History
                  </button>
                  <button
                    onClick={() => setWizardStep(5)}
                    className="group relative px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-[24px] flex items-center gap-3 cursor-pointer shadow-xl shadow-blue-200 transition-all active:scale-95 hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    <span className="relative z-10">Continue to Final Overview</span>
                    <ChevronRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </motion.div>
            )}

            {/* STEP 5: OVERVIEW & CONFIRMATION */}
            {wizardStep === 5 && (
              <motion.div 
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 pb-4"
              >
                
                <div className="bg-blue-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-200 group">
                  <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-110 transition-transform duration-700" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="space-y-2">
                      <h4 className="text-2xl font-black tracking-tight">Final verification</h4>
                      <p className="text-blue-100 text-sm font-bold max-w-md">Please perform a final audit of all demographic info, clinical risks, and ledger entries before confirming the record.</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30 shadow-lg">
                      <span className="text-xs font-black uppercase tracking-widest">{patientState}</span>
                    </div>
                  </div>
                </div>

                {/* Grid list overview cards */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  
                  {/* Avatar left */}
                  <div className="md:col-span-3 flex flex-col items-center justify-center p-8 bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 rounded-[40px] shadow-inner space-y-4">
                    <div className="w-32 h-32 rounded-[48px] bg-blue-600 text-white flex items-center justify-center text-4xl font-black shadow-2xl shadow-blue-500/20 overflow-hidden border-4 border-white">
                      {patientImageUrl ? (
                        <img src={patientImageUrl} alt="Review Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{fullName ? fullName.substring(0, 1) : "P"}</span>
                      )}
                    </div>
                    <div className="text-center">
                      <span className="font-black text-lg text-slate-900 leading-tight block">{fullName || "Unnamed Patient"}</span>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 block">Age: {age} • {sex}</span>
                    </div>
                  </div>

                  {/* Fields list */}
                  <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/50 p-6 rounded-[32px] border border-slate-200/60 shadow-sm">
                    {[
                      { label: "Phone", value: phone || "Not provided", icon: <Activity size={12} /> },
                      { label: "WhatsApp", value: whatsApp || "Not provided", icon: <Activity size={12} /> },
                      { label: "Residence", value: address || "Not provided", icon: <MapPin size={12} /> },
                      { label: "Occupation", value: occupation || "Not provided", icon: <Briefcase size={12} /> },
                      { label: "Target Date", value: bookingDate, icon: <CalIcon size={12} /> },
                      { label: "Clinical Time", value: bookingTime, icon: <Clock size={12} /> },
                      { label: "Practitioner", value: selectedDoctor, icon: <User size={12} />, highlight: true },
                      { label: "Treatment Area", value: currentDoctorObj.room, icon: <MapPin size={12} /> },
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-4 group hover:bg-white hover:border-blue-200 transition-all">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.highlight ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400'} border border-slate-100 shadow-sm`}>
                          {item.icon}
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest block">{item.label}</span>
                          <span className={`text-xs font-black block mt-0.5 ${item.highlight ? 'text-blue-700' : 'text-slate-800'}`}>{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="md:col-span-6 p-6 bg-slate-50/50 border border-slate-200/60 rounded-[28px] shadow-inner space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Chief Complaint</span>
                    <p className="text-xs text-slate-700 font-bold italic leading-relaxed">"{chiefComplaint || "No diagnostic pre-notes recorded."}"</p>
                  </div>

                  <div className="md:col-span-6 p-6 bg-rose-50/30 border border-rose-100 rounded-[28px] shadow-inner space-y-2">
                    <div className="flex items-center gap-1.5 pl-1">
                      <AlertCircle size={12} className="text-rose-500" />
                      <span className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Urgent Alerts</span>
                    </div>
                    <p className="text-xs text-rose-900 font-black italic leading-relaxed">
                      {quickNotes ? `"${quickNotes}"` : "No special dietary or emergency alerts registered."}
                    </p>
                  </div>

                </div>

                {/* Bottom details mapping checklists */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Medical check display */}
                  <div className="p-6 bg-white border border-slate-200 rounded-[28px] relative group hover:shadow-lg transition-all">
                    <button type="button" onClick={() => setWizardStep(2)} className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <FileText size={14} />
                    </button>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-4">Clinical Risks</span>
                    {medicalChecklist.length === 0 && customMedicalList.length === 0 ? (
                      <span className="text-xs text-slate-400 font-bold italic">No high medical risks declared.</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {medicalChecklist.map(m => (
                          <span key={m} className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-lg border border-rose-100 uppercase tracking-tighter">{m}</span>
                        ))}
                        {customMedicalList.map(c => (
                          <span key={c} className="px-3 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-black rounded-lg border border-slate-200 uppercase tracking-tighter">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dental check display */}
                  <div className="p-6 bg-white border border-slate-200 rounded-[28px] relative group hover:shadow-lg transition-all">
                    <button type="button" onClick={() => setWizardStep(3)} className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <FileText size={14} />
                    </button>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-4">Dental History</span>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-md font-black">FDI</span>
                        <span className="text-sm font-black text-blue-700">{assignedTooth}</span>
                      </div>
                      {dentalHistoryPoints.length === 0 ? (
                        <span className="text-xs text-slate-400 font-bold italic block">No previous history points attached.</span>
                      ) : (
                        <p className="text-[11px] text-slate-500 font-bold leading-tight line-clamp-2">Points: {dentalHistoryPoints.join(", ")}</p>
                      )}
                    </div>
                  </div>

                  {/* Financial display */}
                  <div className="p-6 bg-white border border-slate-200 rounded-[28px] relative group hover:shadow-lg transition-all">
                    <button type="button" onClick={() => setWizardStep(4)} className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <FileText size={14} />
                    </button>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-4">Financial Ledger</span>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-black">
                        <span className="text-slate-400 uppercase tracking-tighter">Mode</span>
                        <span className="text-blue-700">{billingType}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-black">
                        <span className="text-slate-400 uppercase tracking-tighter">Total</span>
                        <span className="text-slate-900 font-mono">${totalFee}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-black">
                        <span className="text-slate-400 uppercase tracking-tighter">Paid</span>
                        <span className="text-emerald-600 font-mono">${paidAmount}</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-rose-600 uppercase">DUE</span>
                        <span className="text-sm font-black text-rose-600 font-mono">${remainingCost}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Confirm footer */}
                <div className="pt-10 flex justify-between gap-4">
                  <button
                    onClick={() => setWizardStep(4)}
                    className="px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-black text-sm rounded-[24px] transition-all active:scale-95"
                  >
                    Back to Ledger
                  </button>
                  <button
                    onClick={handleFinalizeBooking}
                    className="group relative px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-base rounded-[24px] flex items-center gap-3 cursor-pointer shadow-xl shadow-blue-300 transition-all active:scale-95 hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    <ShieldCheck size={20} className="relative z-10" />
                    <span className="relative z-10">Confirm & Finalize Appointment</span>
                  </button>
                </div>

              </motion.div>
            )}

            </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* APPOINTMENT COMPLETION & FINANCIAL WIZARD MODAL */}
      {isAdmittingAppId && appBeingAdmitted && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAdmittingAppId(null);
            }
          }}
          className="fixed inset-0 bg-slate-900/45 flex items-center justify-center z-50 p-4 cursor-pointer"
        >
          <div className="bg-white rounded-[24px] border border-slate-200 p-6 w-full max-w-lg shadow-2xl relative cursor-default flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <CheckCircle size={24} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Appointment Completion & Ledger Checkout</h3>
                  <p className="text-[10px] text-slate-500 font-bold">Process final payments and treatment checkout notes</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsAdmittingAppId(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Patient card summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-extrabold uppercase text-slate-400">Patient Treatment Completed</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-full">
                  {appBeingAdmitted.procedureType}
                </span>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-sm shrink-0">
                  {appBeingAdmitted.patientName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-850">{appBeingAdmitted.patientName}</h4>
                  <p className="text-[10px] text-slate-500 font-bold">Practitioner: {appBeingAdmitted.doctorName} • Time slot: {appBeingAdmitted.time}</p>
                </div>
              </div>
            </div>

            {/* Financial inputs */}
            <div className="space-y-4">
              <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100/60">
                <p className="text-[10px] text-blue-800 font-semibold leading-normal">
                  You can specify any final treatment costs, payments received, and clinician treatment checkout notes before completing this appointment.
                </p>
              </div>

              {/* Price Row: Cost Name & Amount */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">Procedure / Cost Name</label>
                  <input 
                    type="text"
                    value={admitCostName}
                    onChange={(e) => setAdmitCostName(e.target.value)}
                    placeholder="e.g. Surgical prep fee"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white p-2.5 rounded-xl text-xs font-bold text-slate-800 transition-all outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">Cost Amount ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">$</span>
                    <input 
                      type="number"
                      min="0"
                      value={admitCostVal || ""}
                      onChange={(e) => setAdmitCostVal(Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white p-2.5 pl-7 rounded-xl text-xs font-bold text-slate-800 font-mono transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Row: Paid amount & payment method */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">Amount Paid ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">$</span>
                    <input 
                      type="number"
                      min="0"
                      value={admitPaidVal || ""}
                      onChange={(e) => setAdmitPaidVal(Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white p-2.5 pl-7 rounded-xl text-xs font-bold text-slate-800 font-mono transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">Payment Method</label>
                  <PremiumSelect
                    value={admitPaymentMethod}
                    onChange={(e) => setAdmitPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white p-2.5 rounded-xl text-xs font-bold text-slate-800 transition-all outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </PremiumSelect>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 block">Treatment / Clinical Checkout Notes</label>
                <textarea 
                  value={admitNotes}
                  onChange={(e) => setAdmitNotes(e.target.value)}
                  placeholder="e.g. Extra tooth pain reported, anesthesia prep done"
                  className="w-full h-14 max-h-20 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white p-2.5 rounded-xl text-xs font-bold text-slate-800 transition-all outline-none resize-none"
                />
              </div>

              {/* Real-time calculated status display box */}
              {(() => {
                const due = Math.max(0, admitCostVal - admitPaidVal);
                const isPaidFull = admitCostVal > 0 && due === 0;
                return (
                  <div className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${
                    admitCostVal === 0 
                      ? "bg-slate-50/50 border-dashed border-slate-200" 
                      : isPaidFull 
                      ? "bg-emerald-50/50 border-emerald-200 text-emerald-900" 
                      : "bg-amber-50/50 border-amber-200 text-amber-900"
                  }`}>
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider block">Intake Calculations</span>
                      <div className="flex items-center gap-1.5">
                        {admitCostVal === 0 ? (
                          <span className="text-[11px] font-black text-slate-600">No Check-in Cost Added</span>
                        ) : isPaidFull ? (
                          <span className="text-[11px] font-black text-emerald-800 flex items-center gap-1">
                            ✓ fully paid up front
                          </span>
                        ) : (
                          <span className="text-[11px] font-black text-amber-800">
                             partial payment or invoice dues
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider block">Remaining Due</span>
                      <p className={`text-sm font-bold font-mono leading-none mt-1 ${
                        due > 0 ? "text-red-600" : "text-emerald-700"
                      }`}>
                        ${due.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsAdmittingAppId(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl cursor-pointer transition-colors"
                title="Discard completion flow"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  updateAppointment(appBeingAdmitted.id, { 
                    status: "Completed",
                    notes: admitNotes || "Treatment completed directly (bypassed billing and specific log details).",
                    attendingClinicalOperator: currentUser?.name // Record who actually performed the treatment
                  });
                  setIsAdmittingAppId(null);
                }}
                className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl cursor-pointer transition-colors hover:text-slate-800"
                title="Bypasses financial recording completely and completes"
              >
                Bypass & Complete
              </button>

              <button
                type="button"
                onClick={() => {
                  if (admitCostVal > 0 || admitPaidVal > 0) {
                    // Find the doctor object by name to get the correct doctorId
                    const doctorObj = users.find(u => u.name === appBeingAdmitted.doctorName);
                    
                    addClinicalIncomeRecord(appBeingAdmitted.patientId, {
                      procedureName: admitCostName || `${appBeingAdmitted.procedureType} Treatment`,
                      totalCost: admitCostVal,
                      paidAmount: admitPaidVal,
                      paymentMethod: admitPaymentMethod,
                      notes: admitNotes,
                      doctorId: doctorObj?.id // Attribute income to the specific doctor for performance stats
                    });
                  }
                  
                  // Construct helpful notes including ledger stats
                  const notesText = admitNotes 
                    ? `${admitNotes} (Billing: $${admitPaidVal} paid of $${admitCostVal} via ${admitPaymentMethod})`
                    : `Procedure completed. Billing: $${admitPaidVal} paid of $${admitCostVal} via ${admitPaymentMethod}.`;

                  updateAppointment(appBeingAdmitted.id, { 
                    status: "Completed",
                    notes: notesText,
                    attendingClinicalOperator: currentUser?.name // Record who actually performed the treatment
                  });
                  setIsAdmittingAppId(null);
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl cursor-pointer transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-1.5"
                title="Log final treatment calculation and mark appointment as completed"
              >
                <Check size={14} />
                <span>Confirm & Complete</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
