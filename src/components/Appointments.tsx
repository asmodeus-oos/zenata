import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
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
      {isWizardOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsWizardOpen(false);
              setWizardStep(1);
            }
          }}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 cursor-pointer"
        >
          <div className="bg-white rounded-[32px] border border-slate-200 p-5 md:p-8 w-full max-w-4xl shadow-2xl relative my-4 md:my-8 cursor-default max-h-[92vh] overflow-y-auto custom-scrollbar flex flex-col">
            
            {/* Close */}
            <button 
              onClick={() => {
                setIsWizardOpen(false);
                setWizardStep(1);
              }}
              className="absolute top-4 right-4 md:top-6 md:right-6 text-slate-400 hover:text-slate-600 cursor-pointer p-2 bg-slate-100 rounded-full"
            >
              <X size={20} />
            </button>

            {/* Title & Static Header */}
            <div className="mb-4 space-y-0.5 shrink-0">
              <h3 className="text-xl md:text-2xl font-black text-slate-900">New Appointment</h3>
              <p className="text-xs md:text-sm font-extrabold text-blue-600">
                Step {wizardStep} of 5: {
                  wizardStep === 1 ? "Patient" : 
                  wizardStep === 2 ? "Medical" : 
                  wizardStep === 3 ? "Dental" : 
                  wizardStep === 4 ? "Billing" : "Overview"
                }
              </p>
            </div>

            {/* Stepper with click direct navigation */}
            <div className="flex overflow-x-auto gap-2 mb-4 bg-slate-50 p-2 rounded-[24px] border border-slate-200 shrink-0 select-none">
              {[
                { number: 1, label: "Patient", desc: "Patient & Time" },
                { number: 2, label: "Medical", desc: "Health Issues" },
                { number: 3, label: "Dental", desc: "Tooth & History" },
                { number: 4, label: "Billing", desc: "Total Fee Ledger" },
                { number: 5, label: "Overview", desc: "Final Review" }
              ].map((step) => {
                const isActive = wizardStep === step.number;
                return (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => setWizardStep(step.number)}
                    className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer min-w-[130px] sm:min-w-0 sm:flex-1 ${
                      isActive 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-150" 
                        : "text-slate-500 hover:bg-slate-200/60"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 justify-center">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${
                        isActive ? 'bg-white text-blue-600' : 'bg-slate-300 text-white'
                      }`}>
                        {step.number}
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider">{step.label}</span>
                    </div>
                    <span className="text-[10px] hidden sm:block mt-1 opacity-80 font-bold">{step.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Body Container to prevent screens over-height */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-6">

            {/* STEP 1: PATIENT DATA DETAILED */}
            {wizardStep === 1 && (
              <div className="space-y-6">
                
                {/* Search Toggle Existing */}
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                  <span className="text-xs font-bold text-blue-700">Patient Mode Selection:</span>
                  <button
                    type="button"
                    onClick={() => setPatientMode("existing")}
                    className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                      patientMode === "existing" 
                        ? "bg-blue-600 text-white" 
                        : "bg-white text-slate-700 border border-slate-200"
                    }`}
                  >
                    Search Existing Records
                  </button>
                  <button
                    type="button"
                    onClick={handleSwitchToNewPatientMode}
                    className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                      patientMode === "new" 
                        ? "bg-blue-600 text-white" 
                        : "bg-white text-slate-700 border border-slate-200"
                    }`}
                  >
                    Create New Profile
                  </button>
                </div>

                {patientMode === "existing" && (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <label className="text-xs uppercase font-extrabold text-slate-500">Pick Registered Patient</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Type name or phone to query db..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-blue-400 focus:bg-white bg-white"
                      />
                    </div>
                    
                    {patientSearch && (
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pt-2">
                        {patientSearchResults.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              handleSelectExistingPatient(p);
                              setPatientSearch("");
                            }}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                              selectedPatientId === p.id 
                                ? "bg-blue-50 border-blue-300" 
                                : "bg-white border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <div>
                              <span className="text-sm font-bold block">{p.name}</span>
                              <span className="text-xs text-slate-500 block">Phone: {p.phone} • Age: 35</span>
                            </div>
                            <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">Select</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedPatientId && (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-bold leading-none flex items-center gap-2">
                        <Check size={16} />
                        <span>Successfully matched to: {fullName} ({phone})</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Avatar upload / Paste URL */}
                  <div className="md:col-span-3 flex flex-col items-center justify-center p-5 bg-slate-50/80 border border-slate-200 rounded-[24px] space-y-4">
                    <div className="w-28 h-28 rounded-3xl bg-blue-105 bg-blue-600/10 text-blue-700 border-2 border-dashed border-blue-200 flex items-center justify-center font-black text-4xl shadow-inner relative overflow-hidden">
                      {patientImageUrl ? (
                        <img src={patientImageUrl} alt="Patient Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{fullName ? fullName.substring(0, 1) : "P"}</span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Paste image URL link..."
                      value={patientImageUrl}
                      onChange={(e) => setPatientImageUrl(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold text-center bg-white"
                    />
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
                    <button
                      type="button"
                      onClick={() => document.getElementById("patient-avatar-upload")?.click()}
                      className="px-4 py-2 border border-blue-205 bg-blue-50 text-blue-700 text-xs font-extrabold rounded-xl w-full hover:bg-blue-100 cursor-pointer text-center"
                    >
                      Upload from PC
                    </button>
                    <button
                      type="button"
                      onClick={() => setPatientImageUrl("https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80")}
                      className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-extrabold rounded-xl w-full hover:bg-slate-100 cursor-pointer"
                    >
                      Attach Female Mock
                    </button>
                  </div>

                  {/* Patient core fields */}
                  <div className="md:col-span-9 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs uppercase font-extrabold text-slate-500">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Patient name"
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs uppercase font-extrabold text-slate-500">Phone</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 555..."
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs uppercase font-extrabold text-slate-500">WhatsApp</label>
                      <input
                        type="text"
                        value={whatsApp}
                        onChange={(e) => setWhatsApp(e.target.value)}
                        placeholder="WhatsApp number"
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs uppercase font-extrabold text-slate-500">Age</label>
                      <input
                        type="text"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="32"
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs uppercase font-extrabold text-slate-500">Sex</label>
                      <PremiumSelect
                        value={sex}
                        onChange={(e) => setSex(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </PremiumSelect>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs uppercase font-extrabold text-slate-500">Patient State</label>
                      <PremiumSelect
                        value={patientState}
                        onChange={(e) => setPatientState(e.target.value as AppointmentStatus)}
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold text-emerald-800 bg-white cursor-pointer"
                      >
                        <option value="Scheduled">Reserved (Scheduled)</option>
                        <option value="Waiting">Waiting</option>
                        <option value="In chair">In Chair (Active Room)</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </PremiumSelect>
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="text-xs uppercase font-extrabold text-slate-500">Address</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Patient address"
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                      />
                    </div>

                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <label className="text-xs uppercase font-extrabold text-slate-500">Occupation</label>
                      <input
                        type="text"
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        placeholder="Occupation"
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                      />
                    </div>

                    <div className="space-y-1 col-span-1">
                      <label className="text-xs uppercase font-extrabold text-slate-500">Date</label>
                      <input
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                      />
                    </div>

                    <div className="space-y-1 col-span-1">
                      <label className="text-xs uppercase font-extrabold text-slate-500">Time Choice</label>
                      <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1 items-center">
                        {/* Hour Stepper */}
                        <div className="flex-1 min-w-0 flex flex-col items-center">
                          <button 
                            type="button" 
                            onClick={() => adjustHour(1)} 
                            className="w-full flex justify-center py-0.5 bg-slate-100 hover:bg-blue-600 text-slate-500 hover:text-white rounded-t-lg transition-all cursor-pointer group active:scale-95"
                          >
                            <ChevronUp size={14} className="group-hover:scale-110" />
                          </button>
                          <input
                            type="text"
                            value={bookingTime.split(' ')[0].split(':')[0]}
                            onChange={(e) => {
                              const parts = bookingTime.split(' ');
                              const digits = e.target.value.replace(/\D/g, '');
                              let val = parseInt(digits, 10);
                              if (val > 12) val = 12;
                              const h = isNaN(val) ? "" : String(val).padStart(2, '0');
                              setBookingTime(`${h}:${parts[0].split(':')[1] || "00"} ${parts[1] || "AM"}`);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowUp') { e.preventDefault(); adjustHour(1); }
                              if (e.key === 'ArrowDown') { e.preventDefault(); adjustHour(-1); }
                            }}
                            placeholder="HH"
                            className="w-full bg-white border-x border-slate-100 py-1 px-0.5 text-center text-sm font-black focus:outline-none text-slate-800 font-mono"
                          />
                          <button 
                            type="button" 
                            onClick={() => adjustHour(-1)} 
                            className="w-full flex justify-center py-0.5 bg-slate-100 hover:bg-blue-600 text-slate-500 hover:text-white rounded-b-lg transition-all cursor-pointer group active:scale-95"
                          >
                            <ChevronDown size={14} className="group-hover:scale-110" />
                          </button>
                        </div>
                        
                        <span className="font-black text-slate-400 mb-0.5">:</span>
                        
                        {/* Minute Stepper */}
                        <div className="flex-1 min-w-0 flex flex-col items-center">
                          <button 
                            type="button" 
                            onClick={() => adjustMinute(1)} 
                            className="w-full flex justify-center py-0.5 bg-slate-100 hover:bg-blue-600 text-slate-500 hover:text-white rounded-t-lg transition-all cursor-pointer group active:scale-95"
                          >
                            <ChevronUp size={14} className="group-hover:scale-110" />
                          </button>
                          <input
                            type="text"
                            value={bookingTime.split(' ')[0].split(':')[1]}
                            onChange={(e) => {
                              const parts = bookingTime.split(' ');
                              const digits = e.target.value.replace(/\D/g, '');
                              let val = parseInt(digits, 10);
                              if (val > 59) val = 59;
                              const m = isNaN(val) ? "" : String(val).padStart(2, '0');
                              setBookingTime(`${parts[0].split(':')[0] || "10"}:${m} ${parts[1] || "AM"}`);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowUp') { e.preventDefault(); adjustMinute(1); }
                              if (e.key === 'ArrowDown') { e.preventDefault(); adjustMinute(-1); }
                            }}
                            placeholder="MM"
                            className="w-full bg-white border-x border-slate-100 py-1 px-0.5 text-center text-sm font-black focus:outline-none text-slate-800 font-mono"
                          />
                          <button 
                            type="button" 
                            onClick={() => adjustMinute(-1)} 
                            className="w-full flex justify-center py-0.5 bg-slate-100 hover:bg-blue-600 text-slate-500 hover:text-white rounded-b-lg transition-all cursor-pointer group active:scale-95"
                          >
                            <ChevronDown size={14} className="group-hover:scale-110" />
                          </button>
                        </div>
                        <div className="flex gap-1 shrink-0 ml-0.5">
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
                                className={`px-2 py-2 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
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

                    <div className="space-y-1 col-span-2">
                      <label className="text-xs uppercase font-extrabold text-slate-500">Procedure Intended</label>
                      <PremiumSelect
                        value={procedureType}
                        onChange={(e) => setProcedureType(e.target.value as ProcedureType)}
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white text-slate-700 cursor-pointer"
                      >
                        <option value="Consultation">Consultation</option>
                        <option value="Filling">Restoration / Filling</option>
                        <option value="Extraction">Extraction / Oral Surgery</option>
                        <option value="Crown & Prosthetic">Crown & Prosthetic Treatment</option>
                        <option value="Orthodontic">Orthodontic Adjustment</option>
                        <option value="Hygiene/Clean">Hygiene Care & Teeth Cleaning</option>
                      </PremiumSelect>
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1 col-span-1">
                    <label className="text-xs uppercase font-extrabold text-slate-500 font-bold">Chief Complaint</label>
                    <textarea
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="Reason for visit"
                      rows={2}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                    />
                  </div>

                  <div className="space-y-1 col-span-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs uppercase font-extrabold text-rose-600 font-bold flex items-center gap-1.5" id="quick-notes-wizard-label">
                        <AlertCircle size={14} className="text-rose-500" />
                        <span>Quick Notes (Dietary / Emergency Alerts)</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-bold">Visually highlighted</span>
                    </div>
                    <textarea
                      id="wizard-quick-notes-input"
                      value={quickNotes}
                      onChange={(e) => setQuickNotes(e.target.value)}
                      placeholder="Enter urgent alerts, dietary limits (e.g. diabetic, NPO), or emergency contacts here..."
                      rows={2}
                      className="w-full p-3 rounded-xl border border-rose-200 text-sm font-semibold bg-rose-50/10 focus:bg-white focus:border-rose-450 focus:outline-none focus:ring-1 focus:ring-rose-250 text-slate-800"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { label: "Dietary Prep", text: "🥦 Special dietary prep required." },
                        { label: "Cardiac Alerts", text: "🩺 Cardiac precautions." },
                        { label: "Bleeding Risk", text: "🩸 High bleeding risk." },
                        { label: "Severe Anxiety", text: "🚨 Severe anxiety / panic alert." },
                      ].map((chip) => (
                        <button
                          key={chip.label}
                          type="button"
                          onClick={() => {
                            if (quickNotes.includes(chip.text)) return;
                            const newVal = quickNotes ? `${quickNotes} ${chip.text}` : chip.text;
                            setQuickNotes(newVal);
                          }}
                          className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-lg border border-rose-200/50 cursor-pointer transition-all active:scale-95"
                        >
                          + {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Practitioner picker visual card style */}
                <div className="space-y-3">
                  <label className="text-xs uppercase font-extrabold text-slate-500 block font-bold">
                    Assign Doctor / Room Assignment
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {doctorDetails.map(doc => {
                      const isPicked = selectedDoctor === doc.name;
                      return (
                        <button
                          key={doc.name}
                          type="button"
                          onClick={() => setSelectedDoctor(doc.name)}
                          className={`p-4 rounded-2xl border text-left flex gap-3 items-center justify-between transition-all cursor-pointer ${
                            isPicked 
                              ? "bg-blue-50 border-blue-400 ring-2 ring-blue-50 shadow-md" 
                              : "bg-white border-slate-200 hover:bg-slate-50 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img src={doc.image} alt={doc.name} className="w-12 h-12 rounded-xl object-cover border" />
                            <div>
                              <span className="text-sm font-black text-slate-900 block">{doc.name}</span>
                              <span className="text-[10px] text-slate-500 block font-bold">{doc.specialty}</span>
                              <span className="text-[11px] text-blue-600 font-extrabold block uppercase mt-0.5">{doc.room} available</span>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isPicked ? 'border-blue-600' : 'border-slate-300'}`}>
                            {isPicked && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-6 border-t flex justify-end">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Continue to Medical History</span>
                    <ChevronRight size={16} />
                  </button>
                </div>

              </div>
            )}

            {/* STEP 2: MEDICAL HISTORY DETAILS */}
            {wizardStep === 2 && (
              <div className="space-y-6">
                
                <h4 className="text-base font-black text-slate-900 uppercase tracking-wide border-b pb-2">Common Medical Issues</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                        className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          checked 
                            ? "bg-slate-300/40 border-slate-650 bg-blue-50/60 border-blue-400 font-extrabold text-blue-900" 
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-sm font-semibold">{issue}</span>
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                          checked ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                        }`}>
                          {checked && <Check size={14} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom medical issue */}
                <div className="space-y-3 pt-4 border-t">
                  <label className="text-xs uppercase font-extrabold text-slate-500 block font-bold">Other Clinical Issues / Notes</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Type custom clinical issue and click Add..."
                      value={newCustomMedical}
                      onChange={(e) => setNewCustomMedical(e.target.value)}
                      className="flex-1 p-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomMedical}
                      className="px-6 py-2 bg-slate-900 text-white hover:bg-slate-800 font-black text-xs rounded-xl"
                    >
                      Add
                    </button>
                  </div>

                  {customMedicalList.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {customMedicalList.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold font-mono">
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => setCustomMedicalList(customMedicalList.filter((_, i) => i !== idx))}
                            className="hover:text-rose-900"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer buttons */}
                <div className="pt-6 border-t flex justify-between gap-3">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm rounded-xl cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Dental History</span>
                    <ChevronRight size={16} />
                  </button>
                </div>

              </div>
            )}

            {/* STEP 3: DENTAL HISTORY */}
            {wizardStep === 3 && (
              <div className="space-y-6">
                
                <div className="space-y-3">
                  <label className="text-xs uppercase font-extrabold text-slate-500 block font-bold">
                    Primary Tooth focus coordinates (Optional)
                  </label>
                  <div className="flex items-center gap-4 bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                    <span className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-700 font-black text-lg flex items-center justify-center border border-blue-200">
                      FDI
                    </span>
                    <div className="flex-1 space-y-1 text-slate-700">
                      <span className="text-sm font-extrabold block">Assign specific tooth</span>
                      <p className="text-slate-500 text-xs">For dental visits focused on a single tooth segment (e.g. pain or molar checkup)</p>
                    </div>
                    <PremiumSelect
                      value={assignedTooth}
                      onChange={(e) => setAssignedTooth(e.target.value)}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                    >
                      <option value="None">None (Whole Mouth)</option>
                      {Array.from({ length: 32 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={`FDI ${num}`}>FDI Tooth #{num}</option>
                      ))}
                    </PremiumSelect>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-base font-black text-slate-900 uppercase tracking-wide">Historical Dental Records Log</h4>
                  
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Type one historic dental point and press Add Point..."
                      value={newDentalPoint}
                      onChange={(e) => setNewDentalPoint(e.target.value)}
                      className="flex-1 p-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
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
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl"
                    >
                      Add Point
                    </button>
                  </div>

                  <div className="bg-slate-50/80 border border-slate-200 rounded-[24px] p-6 min-h-36 flex flex-col justify-center">
                    {dentalHistoryPoints.length === 0 ? (
                      <p className="text-center text-xs text-slate-500 font-bold">
                        Each item you add will appear as a separate line in the dental history list.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {dentalHistoryPoints.map((pt, idx) => (
                          <li key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <div className="flex items-center gap-2 text-slate-700">
                              <Smile size={16} className="text-blue-500" />
                              <span className="text-sm font-semibold">{pt}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDentalHistoryPoints(dentalHistoryPoints.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-6 border-t flex justify-between gap-3">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm rounded-xl cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setWizardStep(4)}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Billing Ledger</span>
                    <ChevronRight size={16} />
                  </button>
                </div>

              </div>
            )}

            {/* STEP 4: BILLING */}
            {wizardStep === 4 && (
              <div className="space-y-6">
                
                <h4 className="text-base font-black text-slate-900 uppercase tracking-wide border-b pb-2">Financial Accounting Invoice</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase font-extrabold text-slate-500 block font-bold">Billing Type</label>
                    <PremiumSelect
                      value={billingType}
                      onChange={(e) => setBillingType(e.target.value as any)}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white cursor-pointer"
                    >
                      <option value="Cash">Cash Currency</option>
                      <option value="Card">Visa / Mastercard POS</option>
                      <option value="Bank Transfer">Direct Wire Bank Transfer</option>
                    </PremiumSelect>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase font-extrabold text-slate-500 block font-bold">Total Fee ($)</label>
                    <input
                      type="number"
                      value={totalFee}
                      onChange={(e) => setTotalFee(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase font-extrabold text-slate-500 block font-bold">Paid Upfront ($)</label>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase font-extrabold text-slate-500 block font-bold">Balance Remaining</label>
                    <div className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-base font-black text-rose-700 shadow-inner flex items-center justify-between">
                      <span>Remaining</span>
                      <span>${remainingCost}</span>
                    </div>
                  </div>

                </div>

                {/* Simulated receipt attached file widget */}
                <div className="p-4 bg-slate-50/85 border border-slate-200 rounded-[24px] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-extrabold text-slate-500 font-bold block">Optional Receipt Verification File</span>
                    <span className="text-[10px] text-slate-400 font-mono">PC Attachment active</span>
                  </div>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-2 bg-white">
                    <p className="text-xs text-slate-550 font-bold">Drag receipts here or click to browse files.</p>
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
                    <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
                      <button
                        type="button"
                        onClick={() => document.getElementById("appointment-receipt-upload")?.click()}
                        className={`px-4 py-2 font-black text-xs rounded-lg transition-all cursor-pointer ${
                          receiptFileName 
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300" 
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {receiptFileName ? `✓ ${receiptFileName}` : "Upload Receipt from PC"}
                      </button>
                      
                      {!receiptFileName && (
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptFileName("receipt.pdf");
                            setReceiptAttached(true);
                            setReceiptFileContent("dummy-pdf-content");
                          }}
                          className="px-4 py-2 font-black text-xs rounded-lg bg-slate-100 text-slate-650 hover:bg-slate-200 cursor-pointer"
                        >
                          Attach Dummy receipt.pdf
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
                          className="px-2 py-2 font-black text-xs rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-6 border-t flex justify-between gap-3">
                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm rounded-xl cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setWizardStep(5)}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continue to final Review</span>
                    <ChevronRight size={16} />
                  </button>
                </div>

              </div>
            )}

            {/* STEP 5: OVERVIEW & CONFIRMATION */}
            {wizardStep === 5 && (
              <div className="space-y-6">
                
                <div className="bg-blue-50 border border-blue-150 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black text-blue-900">Review Appointment</h4>
                    <p className="text-xs text-blue-700 font-bold">Please review all demographic information, clinical risks, and payments before confirming.</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-600 text-white text-[10px] uppercase font-bold tracking-widest rounded-full">{patientState}</span>
                </div>

                {/* Grid list overview cards */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Avatar left */}
                  <div className="md:col-span-3 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-[24px]">
                    <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-black shadow-inner overflow-hidden">
                      {patientImageUrl ? (
                        <img src={patientImageUrl} alt="Review Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{fullName ? fullName.substring(0, 1) : "P"}</span>
                      )}
                    </div>
                    <span className="font-extrabold text-sm text-slate-900 mt-3 block">{fullName || "Unnamed Patient"}</span>
                    <span className="text-xs text-slate-500 font-bold mt-1">Age: {age} • {sex}</span>
                  </div>

                  {/* Fields list */}
                  <div className="md:col-span-9 grid grid-cols-2 gap-4 bg-slate-50/50 p-5 rounded-[24px] border border-slate-200">
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Phone</span>
                      <span className="text-xs font-semibold text-slate-800 block mt-1">{phone || "Not provided"}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400 block">WhatsApp</span>
                      <span className="text-xs font-semibold text-slate-800 block mt-1">{whatsApp || "Not provided"}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Address</span>
                      <span className="text-xs font-semibold text-slate-800 block mt-1">{address || "Not provided"}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Occupation</span>
                      <span className="text-xs font-semibold text-slate-800 block mt-1">{occupation || "Not provided"}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Date choice</span>
                      <span className="text-xs font-semibold text-slate-800 block mt-1">{bookingDate}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Time choice</span>
                      <span className="text-xs font-semibold text-slate-800 block mt-1">{bookingTime}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Clinician</span>
                      <span className="text-xs font-extrabold text-blue-700 block mt-1">{selectedDoctor}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Treatment Location</span>
                      <span className="text-xs font-semibold text-slate-800 block mt-1">{currentDoctorObj.room}</span>
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-6 p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 block font-bold">Chief Complaint / Notes</span>
                    <p className="text-xs text-slate-700 mt-1 italic">"{chiefComplaint || "No diagnostic pre-notes recorded."}"</p>
                  </div>

                  <div className="col-span-1 md:col-span-6 p-3 bg-rose-50/20 rounded-xl border border-rose-200">
                    <span className="text-[10px] uppercase font-extrabold text-rose-600 block font-bold flex items-center gap-1">
                      <AlertCircle size={12} className="text-rose-500" />
                      <span>Quick Notes (Dietary / Emergency Alerts)</span>
                    </span>
                    <p className="text-xs text-rose-900 mt-1 font-semibold italic">
                      {quickNotes ? `"${quickNotes}"` : "No special dietary or emergency alerts registered for this booking."}
                    </p>
                  </div>

                </div>

                {/* Bottom details mapping checklists */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Medical check display */}
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl relative">
                    <button type="button" onClick={() => setWizardStep(2)} className="absolute top-4 right-4 text-xs font-extrabold text-blue-600 hover:underline">Edit</button>
                    <span className="text-xs font-black uppercase text-slate-500 block mb-2">Medical History Overview</span>
                    {medicalChecklist.length === 0 && customMedicalList.length === 0 ? (
                      <span className="text-xs text-slate-450 block font-semibold italic">No high medical risks declared.</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {medicalChecklist.map(m => (
                          <span key={m} className="p-1 px-2.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-lg border border-red-100">{m}</span>
                        ))}
                        {customMedicalList.map(c => (
                          <span key={c} className="p-1 px-2.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-lg border border-red-150">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dental check display */}
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl relative">
                    <button type="button" onClick={() => setWizardStep(3)} className="absolute top-4 right-4 text-xs font-extrabold text-blue-600 hover:underline">Edit</button>
                    <span className="text-xs font-black uppercase text-slate-500 block mb-2">Dental History & Tooth</span>
                    <span className="text-xs font-extrabold text-blue-700 block mb-1">Target Segment: {assignedTooth}</span>
                    {dentalHistoryPoints.length === 0 ? (
                      <span className="text-xs text-slate-450 block font-semibold italic">No dental history coordinates attached.</span>
                    ) : (
                      <p className="text-xs text-slate-550 leading-tight font-medium inline-block truncate w-full">Comments: {dentalHistoryPoints.join(", ")}</p>
                    )}
                  </div>

                  {/* Financial display */}
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl relative">
                    <button type="button" onClick={() => setWizardStep(4)} className="absolute top-4 right-4 text-xs font-extrabold text-blue-600 hover:underline">Edit</button>
                    <span className="text-xs font-black uppercase text-slate-500 block mb-2">Billing & Accounting</span>
                    <div className="space-y-1 text-xs font-bold text-slate-700">
                      <p>Ledger Mode: <span className="text-blue-700">{billingType}</span></p>
                      <p>Total Cost: <span className="text-slate-900">${totalFee}</span></p>
                      <p>Received Upfront: <span className="text-emerald-700">${paidAmount}</span></p>
                      <p>Bal Remaining: <span className="text-rose-700">${remainingCost}</span></p>
                    </div>
                  </div>

                </div>

                {/* Confirm footer */}
                <div className="pt-6 border-t flex justify-between gap-3">
                  <button
                    onClick={() => setWizardStep(4)}
                    className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm rounded-xl cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinalizeBooking}
                    className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all text-center"
                  >
                    Confirm Appointment Setup
                  </button>
                </div>

              </div>
            )}

            </div> {/* Closing scrollable body wrapper */}

          </div>
        </div>
      )}

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
                  <label className="text-[10px] font-black uppercase text-slate-500 block">Procedure / Cost Name</label>
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
                  <label className="text-[10px] font-black uppercase text-slate-500 block">Cost Amount ($)</label>
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
                  <label className="text-[10px] font-black uppercase text-slate-500 block">Amount Paid ($)</label>
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
                  <label className="text-[10px] font-black uppercase text-slate-500 block">Payment Method</label>
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
                <label className="text-[10px] font-black uppercase text-slate-500 block">Treatment / Clinical Checkout Notes</label>
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
