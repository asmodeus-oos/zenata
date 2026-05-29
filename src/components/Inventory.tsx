import React, { useState, useMemo } from "react";
import { useStore } from "../store";
import { 
  Package, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Check, 
  Calendar, 
  Clock, 
  Loader, 
  Search, 
  CheckCircle2,
  X,
  Settings,
  Sliders,
  RotateCcw,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  QrCode,
  Camera,
  UploadCloud,
  BellRing,
  AlertCircle
} from "lucide-react";
import { InventoryItem } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";

interface InventoryToast {
  id: string;
  itemId: string;
  itemName: string;
  qty: number;
  minQty: number;
  unit: string;
  type: "low-stock" | "out-of-stock";
}

export default function Inventory() {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, users, addExpense, currentUser, activityLogs, addActivityLog } = useStore();

  const getLastRestockDate = (itemName: string) => {
    if (!activityLogs) return null;
    const foundLog = activityLogs.find(log => {
      const isInventoryAction = 
        log.action === "Inventory Restocked" || 
        log.action === "Inventory Added" || 
        log.action === "Inventory Updated";
      return isInventoryAction && log.details.toLowerCase().includes(itemName.toLowerCase());
    });

    if (!foundLog) return null;

    try {
      const d = new Date(foundLog.timestamp);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
      }
    } catch (_) {
      // Ignored
    }
    return foundLog.timestamp.split("T")[0];
  };

  const [toasts, setToasts] = useState<InventoryToast[]>([]);

  const addToast = (itemId: string, itemName: string, qty: number, minQty: number, unit: string) => {
    const isOutOfStock = qty === 0;
    const type = isOutOfStock ? ("out-of-stock" as const) : ("low-stock" as const);
    const id = `${Date.now()}-${Math.random()}`;

    // Prevent duplicate active toasts for the exact same item, level, and qty to keep notifications clean and professional
    setToasts(prev => {
      if (prev.some(t => t.itemId === itemId && t.type === type && t.qty === qty)) {
        return prev;
      }
      return [...prev, { id, itemId, itemName, qty, minQty, unit, type }];
    });
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryValue, setNewCategoryValue] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState("Resins / Composites");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [settingsSearchQuery, setSettingsSearchQuery] = useState("");

  // Expiration Calendar State
  const [activeSubTab, setActiveSubTab] = useState<"ledger" | "calendar">("ledger");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(4); // 4 = May 2026 (the active clinic date is May 26, 2026)
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(26); // Default to today's date

  // QR Code packaging scanner and reorder management
  const [isQRScannerExpanded, setIsQRScannerExpanded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedItemName, setDecodedItemName] = useState<string | null>(null);
  const [scanSuccessPulse, setScanSuccessPulse] = useState(false);
  const [activeCameraId, setActiveCameraId] = useState("primary-front");

  const handleSimulatedQRScan = (itemId: string, batchNo: string, reorderQty: number) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    setScanSuccessPulse(true);
    setTimeout(() => setScanSuccessPulse(false), 1500);

    handleRestockClick(item);
    setInputActionValue(String(reorderQty));
  };

  const processQRImageFile = (file: File) => {
    setIsDecoding(true);
    setDecodedItemName(null);
    setTimeout(() => {
      setIsDecoding(false);
      // Try to find a low stock item to restock, else any item
      const lowStockItems = inventory.filter(i => i.quantity <= i.minQty);
      const targetItem = lowStockItems.length > 0 ? lowStockItems[0] : (inventory[0] || null);
      if (targetItem) {
        setDecodedItemName(targetItem.name);
        setScanSuccessPulse(true);
        setTimeout(() => setScanSuccessPulse(false), 1500);
        
        handleRestockClick(targetItem);
        // Default to a generous reorder package size of 25
        setInputActionValue("25");
      }
    }, 1200);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDropScanned = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processQRImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelectScanned = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processQRImageFile(e.target.files[0]);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayVal = new Date(todayStr).getTime();

  // Midnight-grounded days left until expiry calculation
  const getDaysToExpiry = (expiryDateStr: string) => {
    const parts = expiryDateStr.split("-");
    if (parts.length !== 3) return 9999;
    
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    
    const expTime = new Date(y, m, d).getTime();
    
    const todayParts = todayStr.split("-");
    const tY = parseInt(todayParts[0], 10);
    const tM = parseInt(todayParts[1], 10) - 1;
    const tD = parseInt(todayParts[2], 10);
    const todayMidnight = new Date(tY, tM, tD).getTime();

    const diffTime = expTime - todayMidnight;
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  // Pre-compiled list of items expiring in the next 60 days
  const expiringWithin60Days = useMemo(() => {
    return inventory
      .map(item => {
        const daysLeft = getDaysToExpiry(item.expiryDate);
        return { ...item, daysLeft };
      })
      .filter(item => item.daysLeft <= 60)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [inventory]);

  // Navigate calendar coordinates directly to a selected item's expiry date
  const navigateToItemExpiry = (expiryDateStr: string) => {
    const parts = expiryDateStr.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1; // 0-indexed
      const d = parseInt(parts[2], 10);
      setCalendarYear(y);
      setCalendarMonth(m);
      setSelectedCalendarDay(d);
    }
  };

  const MONTHS = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getExpiringItemsOnDate = (year: number, month: number, day: number) => {
    return inventory.filter(item => {
      const parts = item.expiryDate.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1; // 0-indexed
        const d = parseInt(parts[2], 10);
        return y === year && m === month && d === day;
      }
      return false;
    });
  };

  const handlePrevMonth = () => {
    setCalendarMonth(prev => {
      if (prev === 0) {
        setCalendarYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
    setSelectedCalendarDay(null);
  };

  const handleNextMonth = () => {
    setCalendarMonth(prev => {
      if (prev === 11) {
        setCalendarYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
    setSelectedCalendarDay(null);
  };

  const resetToTodayMonth = () => {
    setCalendarYear(2026);
    setCalendarMonth(4); // May
    setSelectedCalendarDay(26);
  };

  const expiredItems = useMemo(() => {
    return expiringWithin60Days.filter(item => item.daysLeft < 0);
  }, [expiringWithin60Days]);

  const imminentExpiredItems = useMemo(() => {
    return expiringWithin60Days.filter(item => item.daysLeft >= 0 && item.daysLeft <= 30);
  }, [expiringWithin60Days]);

  const upcomingAlertItems = useMemo(() => {
    return expiringWithin60Days.filter(item => item.daysLeft > 30 && item.daysLeft <= 60);
  }, [expiringWithin60Days]);

  const [categoryDefaults, setCategoryDefaults] = useState<{ [key: string]: number }>(() => {
    const saved = localStorage.getItem("inventory_category_defaults");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      "Anesthetics": 15,
      "Resins / Composites": 10,
      "Sutures / Surgical": 12,
      "Crowns / Prosthetics": 25,
      "Hygiene / Disinfectants": 20,
      "General Supplies": 5
    };
  });

  const updateCategoryDefault = (category: string, value: number) => {
    setCategoryDefaults(prev => {
      const updated = { ...prev, [category]: value };
      localStorage.setItem("inventory_category_defaults", JSON.stringify(updated));
      return updated;
    });
  };

  const removeCategoryDefault = (category: string) => {
    setCategoryDefaults(prev => {
      const updated = { ...prev };
      delete updated[category];
      localStorage.setItem("inventory_category_defaults", JSON.stringify(updated));
      return updated;
    });
  };

  const resetToFactoryDefaults = () => {
    const defaults = {
      "Anesthetics": 15,
      "Resins / Composites": 10,
      "Sutures / Surgical": 12,
      "Crowns / Prosthetics": 25,
      "Hygiene / Disinfectants": 20,
      "General Supplies": 5
    };
    setCategoryDefaults(defaults);
    localStorage.setItem("inventory_category_defaults", JSON.stringify(defaults));
  };

  const generateStockReportPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Helper statistics
    const totalItems = inventory.length;
    const itemsBelowThreshold = inventory.filter(i => i.quantity <= i.minQty);
    const criticalCount = itemsBelowThreshold.length;
    const outOfStockCount = inventory.filter(i => i.quantity === 0).length;
    const safetyIndex = totalItems > 0 ? Math.round(((totalItems - criticalCount) / totalItems) * 100) : 100;

    let pageNum = 1;

    // Helper to draw clean header and footer decoration
    const drawHeaderFooter = (p: number) => {
      // Header Accent Blue Row
      doc.setFillColor(37, 99, 235); // Blue-600
      doc.rect(0, 0, 210, 8, "F");

      // Title & Branding
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("CLINIC INVENTORY STOCK LEVEL REPORT", 15, 20);

      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}  •  Operator Credentials: mimix4ymu@gmail.com`, 15, 25);

      // Simple divider
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.4);
      doc.line(15, 29, 195, 29);

      // Footer
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.line(15, 282, 195, 282);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("Dental Clinic Asset Management Pro • Confidential Internal Supply Audit", 15, 287);
      doc.text(`Page ${p}`, 190, 287, { align: "right" });
    };

    drawHeaderFooter(pageNum);

    // Let's draw the summary statistics blocks
    // KPI Container
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.roundedRect(15, 34, 180, 20, 3, 3, "FD");

    // KPI Values
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);

    // Column 1: Total Supplies
    doc.text(totalItems.toString(), 25, 43);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL TRACKED SUPPLIES", 25, 48);

    // Column 2: Danger Zone / Alerts
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    if (criticalCount > 0) {
      doc.setTextColor(225, 29, 72); // rose-600
    } else {
      doc.setTextColor(22, 163, 74); // green-600
    }
    doc.text(criticalCount.toString(), 70, 43);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("BELOW SAFETY BASEREQ", 70, 48);

    // Column 3: Out of stock
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    if (outOfStockCount > 0) {
      doc.setTextColor(225, 29, 72);
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.text(outOfStockCount.toString(), 115, 43);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("OUT OF STOCK STATUS", 115, 48);

    // Column 4: Health Rating
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    if (safetyIndex >= 85) {
      doc.setTextColor(22, 163, 74); // green
    } else if (safetyIndex >= 60) {
      doc.setTextColor(217, 119, 6); // warning yellow
    } else {
      doc.setTextColor(225, 29, 72); // critical
    }
    doc.text(`${safetyIndex}%`, 160, 43);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("STOCK SECURITY INDEX", 160, 48);

    // Table Header Row helper
    const drawTableHeader = (startY: number) => {
      doc.setFillColor(15, 23, 42); // slate-900 / dark
      doc.rect(15, startY, 180, 8, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      
      doc.text("Supply Item & Batch Info", 18, startY + 5.5);
      doc.text("Expiration Date", 85, startY + 5.5);
      doc.text("Current Level", 120, startY + 5.5);
      doc.text("Safety Min", 150, startY + 5.5);
      doc.text("Status Alert", 175, startY + 5.5);
    };

    let y = 60;
    drawTableHeader(y);
    y += 8;

    // Loop over stock items to draw table rows
    inventory.forEach((item, index) => {
      const isCritical = item.quantity <= item.minQty;
      const rowHeight = 11;

      // Handle page breaking
      if (y + rowHeight > 274) {
        doc.addPage();
        pageNum++;
        drawHeaderFooter(pageNum);
        y = 34; // reset starting pointer below header line
        drawTableHeader(y);
        y += 8;
      }

      // Zebra striping backgrounds
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252); // slate-50
      } else {
        doc.setFillColor(255, 255, 255);
      }
      
      // If critical, highlight the row with a transparent red warning tint
      if (isCritical) {
        doc.setFillColor(254, 242, 242); // soft red tint
      }

      doc.rect(15, y, 180, rowHeight, "F");

      // Draw horizontal line separator
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.3);
      doc.line(15, y + rowHeight, 195, y + rowHeight);

      // Item Name & Batch Info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      
      // Truncate name if it exceeds layout span
      let displayName = item.name;
      if (displayName.length > 36) {
        displayName = displayName.substring(0, 33) + "...";
      }
      doc.text(displayName, 18, y + 4.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Batch: ${item.batchNo || "N/A"}`, 18, y + 8.5);

      // Expiry Date and calculations
      doc.setFontSize(7.5);
      const isItemExpired = isExpired(item.expiryDate);
      const isItemExpSoon = !isItemExpired && isExpiringSoon(item.expiryDate);

      if (isItemExpired) {
        doc.setTextColor(225, 29, 72);
        doc.setFont("helvetica", "bold");
        doc.text(`${item.expiryDate} (EXPIRED)`, 85, y + 6.5);
      } else if (isItemExpSoon) {
        doc.setTextColor(217, 119, 6);
        doc.setFont("helvetica", "bold");
        doc.text(`${item.expiryDate} (EXPIRING)`, 85, y + 6.5);
      } else {
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "normal");
        doc.text(item.expiryDate, 85, y + 6.5);
      }

      // Quantity Levels
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      if (item.quantity === 0) {
        doc.setTextColor(225, 29, 72);
      } else if (isCritical) {
        doc.setTextColor(217, 119, 6);
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(`${item.quantity} ${item.unit}`, 120, y + 6.5);

      // Safety limit minimum
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`${item.minQty} ${item.unit}`, 150, y + 6.5);

      // Critical Status Alerts Tagging
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      if (item.quantity === 0) {
        doc.setTextColor(225, 29, 72); // rose-600
        doc.text("🚨 DEPLETED STOCK", 175, y + 6.5);
      } else if (isCritical) {
        doc.setTextColor(220, 38, 38); // red-600
        doc.text("⚠️ ON BASIS MIN", 175, y + 6.5);
      } else {
        doc.setTextColor(22, 163, 74); // green-600
        doc.text("✓ SATISFACTORY", 175, y + 6.5);
      }

      y += rowHeight;
    });

    // Save and prompt download dialogue
    doc.save(`dental_supplies_stock_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // New item states
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState(1);
  const [newUnit, setNewUnit] = useState("Tubes");
  const [newMinQty, setNewMinQty] = useState(10);
  const [newExpiryDate, setNewExpiryDate] = useState(`${new Date().getFullYear()}-12-31`);
  const [newBatchNo, setNewBatchNo] = useState("");

  // Search filtered products
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) || 
      item.batchNo.toLowerCase().includes(search.toLowerCase())
    );
  }, [inventory, search]);

  // Expiry Checker
  const isExpiringSoon = (expiryDtStr: string) => {
    const expTime = new Date(expiryDtStr).getTime();
    const diffDays = (expTime - todayVal) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 30; // Within 30 days
  };

  const isExpired = (expiryDtStr: string) => {
    const expTime = new Date(expiryDtStr).getTime();
    return expTime < todayVal;
  };

  const [newPrice, setNewPrice] = useState<number>(15.00);

  // For custom React-based dialogs/modals inside the iframe (avoiding window.prompt/window.confirm)
  const [activeAction, setActiveAction] = useState<{
    type: "use" | "restock" | "delete";
    itemId: string;
    itemName: string;
    unit: string;
    currentQty: number;
  } | null>(null);

  const [inputActionValue, setInputActionValue] = useState<string>("1");
  const [actionError, setActionError] = useState<string | null>(null);

  const handleRestockClick = (item: InventoryItem) => {
    setActiveAction({
      type: "restock",
      itemId: item.id,
      itemName: item.name,
      unit: item.unit,
      currentQty: item.quantity
    });
    setInputActionValue("10");
    setActionError(null);
  };

  const handleConsumeClick = (item: InventoryItem) => {
    setActiveAction({
      type: "use",
      itemId: item.id,
      itemName: item.name,
      unit: item.unit,
      currentQty: item.quantity
    });
    setInputActionValue("1");
    setSelectedStaffId(currentUser?.id || users[0]?.id || "");
    setActionError(null);
  };

  const handleDeleteClick = (item: InventoryItem) => {
    setActiveAction({
      type: "delete",
      itemId: item.id,
      itemName: item.name,
      unit: item.unit,
      currentQty: item.quantity
    });
    setActionError(null);
  };

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    setNewName(item.name);
    setNewQuantity(item.quantity);
    setNewUnit(item.unit);
    setNewMinQty(item.minQty);
    setNewExpiryDate(item.expiryDate);
    setNewBatchNo(item.batchNo);
    setNewPrice(item.pricePerUnit || 0);
    setShowEditModal(true);
  };

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !newName || !newBatchNo) return;

    updateInventoryItem(editingItem.id, {
      name: newName,
      quantity: Number(newQuantity),
      unit: newUnit,
      minQty: Number(newMinQty),
      expiryDate: newExpiryDate,
      batchNo: newBatchNo,
      pricePerUnit: Number(newPrice)
    });

    addActivityLog("Inventory Updated", `Modified details for supply item: ${newName}`);
    setShowEditModal(false);
    setEditingItem(null);
    
    // Reset fields
    setNewName("");
    setNewQuantity(1);
    setNewPrice(15.00);
    setNewMinQty(10);
    setNewExpiryDate(`${new Date().getFullYear()}-12-31`);
    setNewBatchNo("");
  };

  const handleExecuteAction = () => {
    if (!activeAction) return;
    setActionError(null);
    const count = Number(inputActionValue);

    if (activeAction.type === "use") {
      if (activeAction.currentQty <= 0) {
        setActionError("This item is already out of stock!");
        return;
      }
      if (isNaN(count) || count <= 0) {
        setActionError("Please enter a valid positive number.");
        return;
      }
      if (activeAction.currentQty - count < 0) {
        setActionError("Cannot consume more than available stock!");
        return;
      }

      const targetStaff = users.find(u => u.id === selectedStaffId) || currentUser;
      const staffName = targetStaff ? targetStaff.name : "Unknown Staff";

      const newQty = activeAction.currentQty - count;
      updateInventoryItem(activeAction.itemId, { quantity: newQty });

      const item = inventory.find(i => i.id === activeAction.itemId);
      const pricePerUnit = item?.pricePerUnit || 15.00;
      const totalCost = count * pricePerUnit;

      // Automatically add its unit value to finance as a used expense
      addExpense({
        procedureName: `Materials Consumption: ${count} ${activeAction.unit} of ${activeAction.itemName} (by ${staffName})`,
        totalCost: totalCost,
        date: new Date().toISOString().split("T")[0],
        expenseType: "extra",
        expenseCategory: "Supplies Consumption",
        periodType: "Specific Day",
        notes: `Supply item consumed by ${staffName}. Spent qty: ${count} ${activeAction.unit} (Value: $${pricePerUnit.toFixed(2)}/unit). Dynamic tracking expense auto-logged.`
      });

      if (item && newQty <= item.minQty) {
        addToast(activeAction.itemId, item.name, newQty, item.minQty, item.unit);
      }
    } else if (activeAction.type === "restock") {
      if (isNaN(count) || count <= 0) {
        setActionError("Please enter a valid positive number.");
        return;
      }
      const newQty = activeAction.currentQty + count;
      updateInventoryItem(activeAction.itemId, { quantity: newQty });

      const item = inventory.find(i => i.id === activeAction.itemId);
      if (item) {
        addActivityLog("Inventory Restocked", `Restocked supply item: ${item.name} (+${count} ${item.unit} added)`);
      }
      if (item && newQty > item.minQty) {
        setToasts(prev => prev.filter(t => t.itemId !== activeAction.itemId));
      }
    } else if (activeAction.type === "delete") {
      deleteInventoryItem(activeAction.itemId);
    }

    setActiveAction(null);
    setActionError(null);
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newBatchNo) return;

    const qtyVal = Number(newQuantity);
    const minQtyVal = Number(newMinQty);

    addInventoryItem({
      name: newName,
      quantity: qtyVal,
      unit: newUnit,
      minQty: minQtyVal,
      expiryDate: newExpiryDate,
      batchNo: newBatchNo,
      suggestedFirst: false,
      pricePerUnit: Number(newPrice) || 0
    });

    if (qtyVal <= minQtyVal) {
      addToast(`new-${Date.now()}`, newName, qtyVal, minQtyVal, newUnit);
    }

    // Reset fields
    setNewName("");
    setNewQuantity(1);
    setNewPrice(15.00);
    setNewMinQty(categoryDefaults[selectedCategory] || 10);
    setNewExpiryDate(`${new Date().getFullYear()}-12-31`);
    setNewBatchNo("");
    setShowAddModal(false);
  };

  // Automatic batch optimization suggestion based on FIFO logic (use nearest expiry first)
  const sortedFIFOItems = useMemo(() => {
    return [...inventory]
      .filter(i => i.quantity > 0)
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  }, [inventory]);

  return (
    <div className="space-y-6 animate-fade-in" id="inventory-module-container">
      {/* Top Banner Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-600/10 border border-blue-200/50 px-3 py-1 rounded-full">Asset Management</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">CLINICAL SUPPLIES & STOCK</h2>
          <p className="text-slate-500 text-xs font-medium">Coordinate surgical sutures, lidocaine anesthetic vials, and composite resins with active batch alerts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={generateStockReportPDF}
            className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Download Printable PDF Stock Report"
            id="download-stock-report-pdf-btn"
          >
            <FileText size={15} className="text-rose-500" />
            <span>Stock PDF Report</span>
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Configure category minimum baselines"
            id="open-threshold-settings-btn"
          >
            <Sliders size={15} className="text-slate-500" />
            <span>Threshold Rules</span>
          </button>
          <button
            onClick={() => setIsQRScannerExpanded(!isQRScannerExpanded)}
            className={`px-4 py-3 border rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 ${
              isQRScannerExpanded 
                ? "bg-blue-50 text-blue-700 border-blue-200" 
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
            }`}
            title="Scan QR codes on product packaging to reorder"
            id="toggle-qr-scanner-btn"
          >
            <QrCode size={15} className={isQRScannerExpanded ? "text-blue-600 animate-pulse" : "text-blue-500"} />
            <span>{isQRScannerExpanded ? "Close QR Scanner" : "QR Pack Scanner"}</span>
          </button>
          <button
            onClick={() => {
              setNewMinQty(categoryDefaults[selectedCategory] || 10);
              setShowAddModal(true);
            }}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-150 active:scale-95"
            id="onboard-new-supply-btn"
          >
            <Plus size={16} />
            <span>Onboard New Supply</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex bg-slate-100/80 p-1 rounded-2xl w-fit gap-1 border border-slate-200/40">
        <button
          onClick={() => setActiveSubTab("ledger")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "ledger"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
          id="inventory-toggle-ledger"
        >
          <Package size={14} className={activeSubTab === "ledger" ? "text-blue-600" : "text-slate-400"} />
          <span>Active Stock Registry</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab("calendar");
            resetToTodayMonth();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
            activeSubTab === "calendar"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
          id="inventory-toggle-calendar"
        >
          <CalendarDays size={14} className={activeSubTab === "calendar" ? "text-rose-500" : "text-slate-400"} />
          <span>Expiration Calendar Hub</span>
          {expiringWithin60Days.length > 0 && (
            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0">
              {expiringWithin60Days.length}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === "ledger" ? (
        <div className="grid grid-cols-1 gap-6">

          {/* STOCK REORDER ALERTS FEED & SMART PACKAGING SCANNER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Reorder Alerts Feed */}
            <div className="col-span-1 lg:col-span-7 frosted-glass-panel rounded-[32px] p-6 shadow-sm space-y-4 border border-amber-200/40 bg-amber-50/10">
              <div className="flex items-center justify-between border-b border-amber-200/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                    <BellRing size={16} className="animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                      Stock Reorder Alerts
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Automatic safety limit alerts requesting replenishment.</p>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-1 bg-amber-500/10 text-amber-700 font-extrabold rounded-full uppercase">
                  {inventory.filter(i => i.quantity <= i.minQty).length} Shortages
                </span>
              </div>

              {inventory.filter(i => i.quantity <= i.minQty).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">All supplies are currently above safety baselines.</p>
                  <p className="text-[10px] text-slate-400 max-w-xs">No urgent reorder actions are needed today. Standard material counts are verified secure.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {inventory.filter(i => i.quantity <= i.minQty).map(item => {
                    const isOutOfStock = item.quantity === 0;
                    const percent = Math.min((item.quantity / Math.max(1, item.minQty * 1.5)) * 100, 100);
                    return (
                      <div key={item.id} className="p-3 bg-white border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-slate-200 transition-all">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] px-2 py-0.5 font-extrabold rounded-md uppercase tracking-wider ${isOutOfStock ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}>
                              {isOutOfStock ? "🚨 Critical Out-Of-Stock" : "⚠️ Reorder Alert"}
                            </span>
                            <span className="text-[9.5px] text-slate-400 font-bold font-mono uppercase">ID: {item.id}</span>
                          </div>
                          <h4 className="text-xs font-black text-slate-800">{item.name}</h4>
                          
                          {/* Level visual bar */}
                          <div className="w-full sm:max-w-xs space-y-1">
                            <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                              <span>Current: <strong className={isOutOfStock ? "text-rose-600" : "text-amber-600"}>{item.quantity} {item.unit}</strong></span>
                              <span>Baseline: {item.minQty} {item.unit}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${isOutOfStock ? "w-0" : "bg-gradient-to-r from-rose-500 to-amber-500"}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setIsQRScannerExpanded(true);
                              const targetElem = document.getElementById("qr-packaging-scanner-section");
                              if (targetElem) {
                                targetElem.scrollIntoView({ behavior: "smooth" });
                              }
                            }}
                            className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-slate-200 rounded-xl text-[10px] font-black cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
                            title="Scan QR of packaging container"
                          >
                            <QrCode size={13} />
                            <span>Scan Packaging</span>
                          </button>
                          <button
                            onClick={() => handleRestockClick(item)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black cursor-pointer transition-all flex items-center gap-1.5 shadow-sm shadow-blue-150 active:scale-95"
                          >
                            <span>Fast Restock</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: QR Scanning / Upload Mock Module */}
            <div id="qr-packaging-scanner-section" className="col-span-1 lg:col-span-5 frosted-glass-panel rounded-[32px] p-6 shadow-sm space-y-4 border border-blue-200/40 bg-blue-50/10">
              <div className="flex items-center justify-between border-b border-blue-200/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                    <QrCode size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                      QR Reorder Scanner
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Automatic packaging scanner identification.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQRScannerExpanded(!isQRScannerExpanded)}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  {isQRScannerExpanded ? "Collapse" : "Expand"}
                </button>
              </div>

              {!isQRScannerExpanded ? (
                <div className="space-y-3.5">
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Scan or drop product packaging QR label codes to automatically look up matching catalog codes and open the Restock dialog instantly.
                  </p>
                  <button
                    onClick={() => setIsQRScannerExpanded(true)}
                    className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-extrabold rounded-2xl cursor-pointer border border-blue-200/50 transition-all flex items-center justify-center gap-2"
                  >
                    <Camera size={14} />
                    <span>Open Camera Scan / File Drag</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 className=animate-fade-in">
                  
                  {/* Glowing camera stream simulator */}
                  <div className="relative w-full h-44 bg-slate-950 rounded-2xl overflow-hidden flex flex-col justify-between p-3.5 border border-slate-800 shadow-inner">
                    <div className="absolute top-2 left-2 text-[8px] font-mono text-emerald-400 uppercase tracking-widest bg-black/60 px-1.5 py-0.5 rounded flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>CAM: LIVE</span>
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                      <select 
                        value={activeCameraId}
                        onChange={(e) => setActiveCameraId(e.target.value)}
                        className="text-[8px] bg-black/90 border border-slate-700 text-slate-300 font-bold font-mono p-1 rounded focus:outline-none cursor-pointer"
                      >
                        <option value="primary-front">📹 Primary Sony Lens A</option>
                        <option value="highres-macro">🔎 Macro Close-Up Lens</option>
                      </select>
                    </div>

                    {/* Camera scan zone target frame */}
                    <div className="relative flex-1 flex items-center justify-center">
                      <div className={`relative w-24 h-24 border-2 border-emerald-400/55 rounded-2xl flex items-center justify-center transition-all ${scanSuccessPulse ? "scale-110 !border-emerald-400 bg-emerald-500/20" : ""}`}>
                        <QrCode size={32} className="text-emerald-400/25 shrink-0" />
                        
                        {/* Animated scanning laser line */}
                        <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-[sine_2s_infinite]" style={{
                          animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                        }} />
                      </div>
                    </div>

                    {/* Laser guidance notification */}
                    <div className="text-[8px] font-bold text-center text-slate-400 bg-slate-900/60 py-1 rounded inline-block w-full">
                      Place packaging box QR code in center
                    </div>
                  </div>

                  {/* Drag and Drop File Upload zone */}
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDropScanned}
                    className={`p-3.5 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                      isDragging 
                        ? "border-blue-500 bg-blue-50/20" 
                        : "border-slate-200 hover:border-blue-350 hover:bg-slate-50/40"
                    }`}
                  >
                    <input 
                      type="file" 
                      id="qr-file-selector" 
                      accept="image/*"
                      onChange={handleFileSelectScanned} 
                      className="hidden" 
                    />
                    <label htmlFor="qr-file-selector" className="cursor-pointer space-y-1 block">
                      <div className="flex justify-center">
                        <UploadCloud size={20} className="text-blue-500 shrink-0" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-700">Drag & drop packaging photo, or click to upload</p>
                        <p className="text-[8px] text-slate-400">PDF, PNG, JPG supported. Decodes product barcodes/QR codes.</p>
                      </div>
                    </label>
                  </div>

                  {/* Decoding state */}
                  {isDecoding && (
                    <div className="p-3 bg-blue-50 border border-blue-100/50 rounded-2xl flex items-center gap-2.5">
                      <Loader size={14} className="animate-spin text-blue-600 shrink-0" />
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider animate-pulse">
                        Parsing image matrix pixels...
                      </span>
                    </div>
                  )}

                  {/* PRESET QUICK-SCANNABLE PACKAGES */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">
                      Quick Simulate Product QR Scans
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: "Composite Resin", id: "inv-1", batch: "BCH-892A", qty: 25, color: "bg-purple-50 text-purple-700 border-purple-200/50 hover:bg-purple-100/40" },
                        { label: "Lidocaine Vial", id: "inv-2", batch: "BCH-044B", qty: 30, color: "bg-rose-50 text-rose-700 border-rose-200/50 hover:bg-rose-100/40" },
                        { label: "Suture Box (3-0)", id: "inv-3", batch: "BCH-118X", qty: 15, color: "bg-emerald-50 text-emerald-700 border-emerald-200/50 hover:bg-emerald-100/40" },
                        { label: "Provisional Crown", id: "inv-4", batch: "BCH-551Z", qty: 20, color: "bg-amber-50 text-amber-700 border-amber-200/50 hover:bg-amber-100/40" }
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSimulatedQRScan(preset.id, preset.batch, preset.qty)}
                          className={`text-[9px] font-black border p-2 rounded-xl transition-all active:scale-95 text-left relative overflow-hidden group cursor-pointer ${preset.color}`}
                        >
                          <div className="font-extrabold truncate">{preset.label}</div>
                          <div className="text-[7.5px] opacity-75 font-mono truncate">Code: {preset.batch}</div>
                          <div className="text-[8px] font-extrabold mt-1 text-slate-500">Scan Reorder of {preset.qty}</div>
                          <div className="absolute right-1 top-1 w-1.5 h-1.5 bg-rose-550 rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-ping" />
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
          
          {/* LEDGER DETAILS (FULL WIDTH) */}
          <div className="frosted-glass-panel rounded-[32px] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/40 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Package size={16} className="text-blue-500" />
                  <span>Active Stock Registry</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Real-time counts, units pricing, safe baseline limits, and expiry dates.</p>
              </div>

              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={13} />
                <input
                  type="text"
                  placeholder="Search stock catalog..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-white bg-white/50 text-[10px] font-bold text-slate-600 focus:outline-none rounded-lg focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Column Header Titles */}
            <div className="hidden md:grid md:grid-cols-12 md:gap-4 px-4 py-2 border-b border-slate-200/40 text-[10px] uppercase font-black text-slate-400 tracking-wider">
              <span className="col-span-3">Supply Item & Batch Info</span>
              <span className="col-span-2">Price per Unit</span>
              <span className="col-span-2">Total Price</span>
              <span className="col-span-2 text-right">Current Level</span>
              <span className="col-span-3 text-right">Actions</span>
            </div>

            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredInventory.map(item => {
                const isLow = item.quantity <= item.minQty;
                const expired = isExpired(item.expiryDate);
                const expiring = isExpiringSoon(item.expiryDate);
                const lastRestock = getLastRestockDate(item.name);

                // Calculate stock percent
                const percent = Math.min((item.quantity / (item.minQty * 2.5)) * 100, 100);

                const itemPrice = item.pricePerUnit ?? 15.00;
                const totalPriceVal = item.quantity * itemPrice;

                return (
                  <motion.div 
                    layout
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="p-4 pl-6 border border-white bg-white/40 hover:bg-white/60 hover:border-white rounded-2xl shadow-sm transition-all relative overflow-hidden"
                  >
                    {/* Solid Left-Edge Visual Alert Bar */}
                    {isLow && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 z-10" />
                    )}
                    {expired && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-650 animate-pulse z-10" />
                    )}
                    {!isLow && !expired && expiring && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-550 z-10" />
                    )}

                    {/* Visual highlight splash when quantity changes */}
                    <motion.div
                      key={`flash-${item.quantity}`}
                      initial={{ opacity: 0.4, backgroundColor: isLow ? "rgba(225, 29, 72, 0.2)" : "rgba(37, 99, 235, 0.2)" }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 1.0, ease: "easeOut" }}
                      className="absolute inset-0 pointer-events-none rounded-2xl"
                    />

                    {/* DESKTOP VIEW (Always visible on large screens) */}
                    <div className="hidden md:grid md:grid-cols-12 gap-3 items-center relative z-10 w-full">
                      {/* Left: Name and Expiry metadata */}
                      <div className="md:col-span-3 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-slate-800 text-xs">{item.name}</strong>
                          <span className="text-[9px] font-mono text-slate-400 bg-white/50 border border-white/80 px-2 py-0.5 rounded-md">Batch: {item.batchNo}</span>
                          {isLow && (
                            <span className="text-[8px] bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Low Stock</span>
                          )}
                          {expired ? (
                            <span className="text-[8px] bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Expired!</span>
                          ) : expiring ? (
                            <span className="text-[8px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Near Expiration</span>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 font-semibold">
                          <span>Expiry: <strong className={expired ? "text-red-600" : expiring ? "text-amber-600" : "text-slate-600"}>{item.expiryDate}</strong></span>
                          <span>•</span>
                          <span className="text-slate-400">Last Restock: <strong className="text-blue-600 font-bold">{lastRestock || "No history"}</strong></span>
                        </div>
                      </div>

                      {/* Middle Grid: Price Per Unit */}
                      <div className="col-span-2 text-xs text-slate-705 text-slate-700 font-bold font-mono">
                        <span className="text-slate-700 font-bold font-mono">${itemPrice.toFixed(2)}</span>
                      </div>

                      {/* Middle Grid: Total Units Available Value */}
                      <div className="col-span-2 text-xs text-slate-900 font-black font-mono">
                        <span className="text-slate-900 font-black font-mono">${totalPriceVal.toFixed(2)}</span>
                      </div>

                      {/* Middle Grid: Stock Quantity Levels */}
                      <div className="col-span-2 flex justify-end">
                        <div className="text-right flex items-baseline gap-1.5 md:block">
                          <AnimatePresence mode="popLayout">
                            <motion.span
                              key={item.quantity}
                              initial={{ scale: 1.5, y: -8, opacity: 0 }}
                              animate={{ scale: 1, y: 0, opacity: 1 }}
                              exit={{ scale: 0.8, y: 8, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 450, damping: 18 }}
                              className={`text-xs font-black block transition-all duration-300 ${
                                isLow ? "low-stock-pulse text-rose-600" : "normal-stock-static text-slate-800"
                              }`}
                            >
                              {item.quantity}
                            </motion.span>
                          </AnimatePresence>
                          <span className="text-[10px] text-slate-400 font-bold block">{item.unit}</span>
                          
                          {/* Low stock visual alert bar reinforcement */}
                          {isLow && (
                            <div className="mt-1 h-1 w-full bg-rose-100 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500 animate-pulse" style={{ width: "100%" }} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Custom Buttons (Use, Restock, Edit, Delete) */}
                      <div className="col-span-3 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleConsumeClick(item)}
                          className="p-1 px-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-bold border border-slate-200 transition-colors cursor-pointer shadow-sm"
                          title="Deduct used items"
                        >
                          Use
                        </button>
                        
                        <button
                          onClick={() => handleRestockClick(item)}
                          className="p-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-sm"
                          title="Restock/add items"
                        >
                          Restock
                        </button>

                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold border border-slate-300 transition-colors cursor-pointer shadow-sm"
                          title="Edit supply record"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="p-1.5 text-slate-350 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer ml-1"
                          title="Delete inventory supply record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Desktop Stock level bar indicator (always visible on desktop) */}
                    <div className="hidden md:block mt-3 relative z-10">
                      <div className="w-full bg-slate-200/50 rounded-full h-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLow ? "bg-rose-500" : expiring ? "bg-amber-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase mt-1">
                        <span>Min Safety Limit: {item.minQty} {item.unit}</span>
                        {lastRestock && (
                          <span className="text-blue-600 font-extrabold normal-case">Last Restocked: {lastRestock}</span>
                        )}
                        <span>Capacity Quotient</span>
                      </div>
                    </div>

                    {/* MOBILE COLLAPSIBLE CARD (Only visible on screens < md) */}
                    <div className="md:hidden flex flex-col gap-2.5 relative z-10 w-full">
                      {/* Mobile Card Header */}
                      <div 
                        onClick={() => toggleExpand(item.id)}
                        className="flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <strong className="text-slate-800 text-xs font-bold leading-tight block truncate max-w-[160px]">{item.name}</strong>
                            <span className="text-[8px] font-mono text-slate-400 bg-white/60 border border-slate-200 px-1 py-0.5 rounded">Batch: {item.batchNo}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <motion.span 
                              className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-lg border transition-all duration-300 ${
                                isLow 
                                  ? "low-stock-pulse text-rose-700 bg-rose-50 border-rose-200" 
                                  : "normal-stock-static text-blue-700 bg-blue-50 border-blue-100"
                              }`}
                            >
                              {item.quantity} {item.unit}
                            </motion.span>
                            {isLow && (
                              <span className="text-[8px] font-black uppercase text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md animate-pulse">Low</span>
                            )}
                            {expired && (
                              <span className="text-[8px] font-black uppercase text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">Expired</span>
                            )}
                            {expiring && !expired && (
                              <span className="text-[8px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md">Exp Soon</span>
                            )}
                          </div>
                        </div>

                        {/* Chevron Trigger */}
                        <div className="w-7 h-7 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-700 transition-colors shrink-0">
                          {expandedItems[item.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </div>

                      {/* Mobile Card Details (Animated Accordion) */}
                      <AnimatePresence initial={false}>
                        {expandedItems[item.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden mt-1 space-y-3 pt-3 border-t border-slate-100"
                          >
                            {/* Key Values */}
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div className="bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100 flex flex-col gap-0.5">
                                <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400">Price Per Unit</span>
                                <span className="text-slate-700 font-bold font-mono text-xs">${itemPrice.toFixed(2)}</span>
                              </div>
                              <div className="bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100 flex flex-col gap-0.5">
                                <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400">Total Asset Value</span>
                                <span className="text-slate-900 font-black font-mono text-xs">${totalPriceVal.toFixed(2)}</span>
                              </div>
                            </div>

                            {/* Expiration date */}
                            <div className="bg-slate-50/40 p-2 py-1.5 rounded-xl border border-slate-100/80 text-[10px] text-slate-505 text-slate-500 font-semibold flex justify-between items-center">
                              <span>Physical Expiry Date:</span>
                              <strong className={`${expired ? "text-red-600" : expiring ? "text-amber-600" : "text-slate-600"} font-mono`}>
                                {item.expiryDate}
                              </strong>
                            </div>

                            {/* Last Restocked Row on Mobile */}
                            <div className="bg-slate-50/40 p-2 py-1.5 rounded-xl border border-slate-100/80 text-[10px] text-slate-500 font-semibold flex justify-between items-center">
                              <span>Last Restocked:</span>
                              <strong className="text-blue-600 font-mono">
                                {lastRestock || "No history"}
                              </strong>
                            </div>

                            {/* Capacity Quotient Loop bar */}
                            <div className="space-y-1 bg-slate-50/30 p-2.5 rounded-2xl border border-slate-100/50">
                              <div className="w-full bg-slate-200/50 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isLow ? "bg-rose-500" : expiring ? "bg-amber-500" : "bg-blue-500"
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase pt-0.5">
                                <span>Safety Baseline: {item.minQty} {item.unit}</span>
                                <span>Cap Quotient</span>
                              </div>
                            </div>

                            {/* Primary Mobile Action Buttons (touch friendly heights) */}
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-100/80">
                              <button
                                onClick={() => handleConsumeClick(item)}
                                className="flex-1 py-2.5 bg-white hover:bg-slate-150 text-slate-700 rounded-xl text-xs font-black border border-slate-200 transition-colors shadow-sm cursor-pointer text-center"
                              >
                                Use Supply
                              </button>
                              
                              <button
                                onClick={() => handleRestockClick(item)}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer text-center"
                              >
                                Restock
                              </button>

                              <button
                                onClick={() => handleEditClick(item)}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black border border-slate-200 transition-colors shadow-sm cursor-pointer text-center"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleDeleteClick(item)}
                                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-100"
                                title="Delete Registry Item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}

              {filteredInventory.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <AlertTriangle size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">No stock documents found matching filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* EXPIRATION CALENDAR VIEW WORKSPACE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="expiration-calendar-workspace">
          
          {/* LEFT RAIL: URGENT EXPIRY HOTLIST (NEXT 60 DAYS) */}
          <div className="lg:col-span-4 frosted-glass-panel rounded-[32px] p-5 shadow-sm flex flex-col gap-4 max-h-[750px] overflow-y-auto custom-scrollbar">
            <div className="border-b border-white/40 pb-3">
              <span className="text-[9px] uppercase font-black tracking-widest text-rose-600 block">Critical Shelf-life Alerts</span>
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                <AlertTriangle size={15} className="text-rose-500 animate-pulse" />
                <span>60-Day Expiry Hotlist</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Items that have expired or will expire soon.</p>
            </div>

            {/* List Group 1: EXPIRED */}
            <div className="space-y-2">
              <h4 className="text-[9.5px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                <span>Critical: Expired ({expiredItems.length})</span>
              </h4>
              <div className="space-y-2">
                {expiredItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => navigateToItemExpiry(item.expiryDate)}
                    className="w-full text-left p-3 rounded-2xl bg-rose-50 border border-rose-100 hover:bg-rose-100/50 hover:border-rose-200 transition-all flex flex-col gap-1 relative cursor-pointer"
                    title="Click to spot on calendar"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <strong className="text-slate-800 text-[11px] font-bold leading-tight">{item.name}</strong>
                      <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-black text-[8.5px] shrink-0 font-mono">
                        EXP
                      </span>
                    </div>
                    <div className="flex justify-between text-[9px] text-rose-600 font-bold font-mono">
                      <span>Batch: {item.batchNo}</span>
                      <span>{Math.abs(item.daysLeft)}d overdue</span>
                    </div>
                  </button>
                ))}
                {expiredItems.length === 0 && (
                  <p className="text-[10px] text-slate-400 font-medium italic pl-1">No expired products detected in stock.</p>
                )}
              </div>
            </div>

            {/* List Group 2: IMMINENT EXPIRE WEEK (1-30 Days) */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <h4 className="text-[9.5px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Urgent: Expiring 1-30 Days ({imminentExpiredItems.length})</span>
              </h4>
              <div className="space-y-2">
                {imminentExpiredItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => navigateToItemExpiry(item.expiryDate)}
                    className="w-full text-left p-3 rounded-2xl bg-amber-50/50 border border-amber-100 hover:bg-amber-100/30 hover:border-amber-200 transition-all flex flex-col gap-1 relative cursor-pointer"
                    title="Click to spot on calendar"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <strong className="text-slate-800 text-[11px] font-bold leading-tight">{item.name}</strong>
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-850 font-extrabold text-[8.5px] shrink-0 font-mono">
                        {item.daysLeft}d left
                      </span>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 font-medium font-mono">
                      <span>Batch: {item.batchNo}</span>
                      <span className="font-bold text-amber-700">Due: {item.expiryDate}</span>
                    </div>
                  </button>
                ))}
                {imminentExpiredItems.length === 0 && (
                  <p className="text-[10px] text-slate-400 font-medium italic pl-1">No imminent expiries within 30 days.</p>
                )}
              </div>
            </div>

            {/* List Group 3: MONITOR BASICS (31-60 Days) */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <h4 className="text-[9.5px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Monitoring: 31-60 Days ({upcomingAlertItems.length})</span>
              </h4>
              <div className="space-y-2">
                {upcomingAlertItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => navigateToItemExpiry(item.expiryDate)}
                    className="w-full text-left p-3 rounded-2xl bg-blue-50/10 border border-slate-150 hover:bg-white hover:border-blue-200 transition-all flex flex-col gap-1 relative cursor-pointer"
                    title="Click to spot on calendar"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <strong className="text-slate-800 text-[11px] font-bold leading-tight">{item.name}</strong>
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[8.5px] shrink-0 font-mono">
                        {item.daysLeft}d left
                      </span>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 font-medium font-mono">
                      <span>Batch: {item.batchNo}</span>
                      <span className="text-slate-600 font-bold">Due: {item.expiryDate}</span>
                    </div>
                  </button>
                ))}
                {upcomingAlertItems.length === 0 && (
                  <p className="text-[10px] text-slate-400 font-medium italic pl-1">No inventory expiring in the 31-60 day range.</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: MAIN CALENDAR CONTROL GRID */}
          <div className="lg:col-span-8 space-y-5">
            <div className="frosted-glass-panel rounded-[32px] p-5 shadow-sm space-y-4">
              
              {/* Calendar Month Navigation Header */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-150 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-50 rounded-2xl text-rose-500">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      {MONTHS[calendarMonth]} {calendarYear}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Interactive Shelf-life Map</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetToTodayMonth}
                    className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold rounded-xl text-[10px] transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                    title="Snap to active clinic current month"
                  >
                    <RotateCcw size={10} />
                    <span>Today</span>
                  </button>

                  <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg cursor-pointer max-w-fit"
                      title="Previous Month"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <div className="h-4 w-[1px] bg-slate-200 mx-1" />
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg cursor-pointer max-w-fit"
                      title="Next Month"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid 7-columns Calendar Layout */}
              <div>
                {/* Weekdays Headers */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                  {DAYS_OF_WEEK.map(dayName => (
                    <div key={dayName} className="text-center text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      {dayName}
                    </div>
                  ))}
                </div>

                {/* Day Blocks */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {/* Empty offsets */}
                  {Array.from({ length: getFirstDayOfMonth(calendarYear, calendarMonth) }).map((_, i) => (
                    <div key={`offset-${i}`} className="bg-slate-50/40 rounded-2xl border border-transparent min-h-[64px] pb-1" />
                  ))}

                  {/* Day Active Squares */}
                  {Array.from({ length: getDaysInMonth(calendarYear, calendarMonth) }).map((_, i) => {
                    const dayNum = i + 1;
                    const expiringItems = getExpiringItemsOnDate(calendarYear, calendarMonth, dayNum);
                    
                    // Highlight codes
                    const isTodayCell = calendarYear === 2026 && calendarMonth === 4 && dayNum === 26;
                    const isSelected = selectedCalendarDay === dayNum;

                    let cellBg = "bg-white/40 hover:bg-slate-100 border-slate-200/60";
                    if (isTodayCell) {
                      cellBg = "bg-blue-50/40 hover:bg-blue-50/70 border-blue-200/80 relative ring-1.5 ring-blue-500/20";
                    }
                    if (isSelected) {
                      cellBg = "bg-slate-900 border-slate-900 text-white hover:bg-slate-850 shadow-md";
                    }

                    return (
                      <button
                        key={`day-${dayNum}`}
                        type="button"
                        onClick={() => setSelectedCalendarDay(dayNum)}
                        className={`p-1.5 sm:p-2 border rounded-2xl min-h-[68px] sm:min-h-[80px] text-left transition-all cursor-pointer flex flex-col justify-between ${cellBg}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[10px] font-black ${isSelected ? "text-white" : "text-slate-800"}`}>
                            {dayNum}
                          </span>
                          {isTodayCell && (
                            <span className="text-[7.5px] uppercase font-bold tracking-tight bg-blue-600 text-white px-1.5 py-0.5 rounded-full shrink-0">
                              Today
                            </span>
                          )}
                        </div>

                        {/* Overdue / Expiring Badges in cells */}
                        <div className="space-y-0.5 w-full mt-1 shrink-0">
                          {expiringItems.slice(0, 2).map(item => {
                            const dl = getDaysToExpiry(item.expiryDate);
                            const expired = dl < 0;
                            let badgeStyle = "bg-amber-100 text-amber-800";
                            if (expired) {
                              badgeStyle = "bg-rose-100 text-rose-800";
                            } else if (dl > 30) {
                              badgeStyle = "bg-blue-100 text-blue-850";
                            }
                            return (
                              <div
                                key={item.id}
                                className={`text-[7px] p-0.5 rounded font-bold truncate leading-none w-full ${
                                  isSelected ? "bg-white/20 text-white font-black" : badgeStyle
                                }`}
                              >
                                {item.name}
                              </div>
                            );
                          })}
                          {expiringItems.length > 2 && (
                            <div className={`text-[7px] text-center font-bold font-mono ${isSelected ? "text-white/85" : "text-slate-400"}`}>
                              +{expiringItems.length - 2} more...
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Panel: Inspect date details */}
            <div className="frosted-glass-panel rounded-[32px] p-5 shadow-sm space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-900/5 text-slate-800 rounded-xl">
                    <Clock size={14} />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                    Calendar Inspection: {selectedCalendarDay ? `${MONTHS[calendarMonth]} ${selectedCalendarDay}, ${calendarYear}` : "Select a day"}
                  </h4>
                </div>
                <span className="text-[9.5px] font-bold text-slate-400 font-mono text-right">
                  {selectedCalendarDay ? getExpiringItemsOnDate(calendarYear, calendarMonth, selectedCalendarDay).length : 0} items expiring
                </span>
              </div>

              {selectedCalendarDay ? (
                <div className="space-y-3">
                  {getExpiringItemsOnDate(calendarYear, calendarMonth, selectedCalendarDay).map(item => {
                    const isLow = item.quantity <= item.minQty;
                    const dl = getDaysToExpiry(item.expiryDate);
                    const expired = dl < 0;
                    const percent = Math.min((item.quantity / (item.minQty * 2.5)) * 100, 100);

                    return (
                      <div 
                        key={item.id} 
                        className="p-4 border border-white bg-white/40 hover:bg-white/60 hover:border-white rounded-2xl shadow-sm transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <strong className="text-slate-800 text-xs">{item.name}</strong>
                              <span className="text-[9px] font-mono text-slate-400 bg-white/50 border border-white/80 px-2 py-0.5 rounded-md">
                                Batch: {item.batchNo}
                              </span>
                              {isLow && (
                                <span className="text-[8px] bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                  Low Stock
                                </span>
                              )}
                              {expired ? (
                                <span className="text-[8px] bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                  Expired!
                                </span>
                              ) : dl <= 30 ? (
                                <span className="text-[8px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                  Near Expiration
                                </span>
                              ) : null}
                            </div>

                            <div className="flex items-center gap-4 text-[10px] text-slate-500 font-semibold">
                              <span>Days Remaining: <strong className={expired ? "text-rose-600" : dl <= 30 ? "text-amber-600" : "text-slate-600"}>
                                {expired ? `Overdue by ${Math.abs(dl)} days` : dl === 0 ? "Expires today!" : `${dl} days left`}
                              </strong></span>
                              <span>Baseline Limit: <strong>{item.minQty} {item.unit}</strong></span>
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <div className="text-right mr-3 relative min-w-[36px]">
                              <span className="text-xs font-black block text-slate-800">
                                {item.quantity}
                              </span>
                              <span className="text-[9px] text-slate-400 block font-bold">{item.unit}</span>
                            </div>
                            
                            <button
                              onClick={() => handleConsumeClick(item)}
                              className="p-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-bold border border-slate-200 transition-colors cursor-pointer"
                            >
                              Use
                            </button>
                            
                            <button
                              onClick={() => handleRestockClick(item)}
                              className="p-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-sm"
                            >
                              Restock
                            </button>

                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold border border-slate-300 transition-colors cursor-pointer shadow-sm"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDeleteClick(item)}
                              className="p-2 text-slate-350 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-1 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="w-full bg-slate-200/50 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isLow ? "bg-rose-500" : dl <= 30 ? "bg-amber-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {getExpiringItemsOnDate(calendarYear, calendarMonth, selectedCalendarDay).length === 0 && (
                    <div className="text-center py-6 bg-green-50/40 rounded-2xl border border-green-100/50 flex flex-col items-center justify-center p-4">
                      <CheckCircle2 className="text-green-500 mb-1.5" size={24} />
                      <p className="text-xs font-bold text-green-800">Compliant & Stable</p>
                      <p className="text-[10px] text-green-600 font-medium">No dental supply products are set to expire on this date.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <CalendarDays size={24} className="mx-auto text-slate-300 mb-1.5" />
                  Select a day square on the monthly cycle calendar to inspect item details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NEW SUPPLY ONBOARDING MODAL */}
      {showAddModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
            }
          }}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-55 p-4 cursor-pointer"
        >
          <div className="bg-white rounded-[32px] border border-slate-100 p-6 w-full max-w-md shadow-2xl relative cursor-default max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-850 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-colors"
              title="Close modal"
            >
              <X size={20} />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 block">Inventory Ledger Setup</span>
              <h3 className="text-base font-black text-slate-800">Onboard New Supply Batch</h3>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Supply Category (Auto Baseline Rule)</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    const cat = e.target.value;
                    setSelectedCategory(cat);
                    if (cat in categoryDefaults) {
                      setNewMinQty(categoryDefaults[cat]);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white font-semibold cursor-pointer"
                >
                  {Object.keys(categoryDefaults).map((catName) => (
                    <option key={catName} value={catName}>
                      {catName} (Baseline Default: {categoryDefaults[catName]})
                    </option>
                  ))}
                </select>
                <span className="text-[9px] text-slate-400 block font-semibold">
                  Choosing a category auto-prefills the safety limit based on global threshold definitions.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Item Descriptive Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="E.g., Micro-brush applicators (fine)"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Batch Code Reference (FIFO)</label>
                  <input
                    type="text"
                    required
                    value={newBatchNo}
                    onChange={(e) => setNewBatchNo(e.target.value)}
                    placeholder="E.g., BCH-908"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono tracking-wider font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Inventory Unit</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold"
                  >
                    <option value="Tubes">Tubes</option>
                    <option value="Vials">Vials</option>
                    <option value="Packs">Packs</option>
                    <option value="Units">Units</option>
                    <option value="Seringes">Syringes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Onboarding Quantity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Baseline Alert Qty (Low Limit)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newMinQty}
                    onChange={(e) => setNewMinQty(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Price per Unit ($)</label>
                  <input
                    type="number"
                    required
                    min={0.01}
                    step={0.01}
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Expiration Date Code</label>
                  <input
                    type="date"
                    required
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Log Supply Item In Registry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT REGISTRY ITEM MODAL */}
      {showEditModal && editingItem && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
              setEditingItem(null);
            }
          }}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-55 p-4 cursor-pointer"
        >
          <div className="bg-white rounded-[32px] border border-slate-100 p-6 w-full max-w-md shadow-2xl relative cursor-default max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => {
                setShowEditModal(false);
                setEditingItem(null);
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-850 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-colors"
              title="Close modal"
            >
              <X size={20} />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block">Inventory Ledger Adjustment</span>
              <h3 className="text-base font-black text-slate-800">Edit Supply Registry Item</h3>
              <p className="text-[10px] text-slate-400 font-medium">Updating metadata for: {editingItem.name}</p>
            </div>

            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Item Descriptive Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="E.g., Micro-brush applicators (fine)"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Batch Code Reference (FIFO)</label>
                  <input
                    type="text"
                    required
                    value={newBatchNo}
                    onChange={(e) => setNewBatchNo(e.target.value)}
                    placeholder="E.g., BCH-908"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono tracking-wider font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Inventory Unit</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold"
                  >
                    <option value="Tubes">Tubes</option>
                    <option value="Vials">Vials</option>
                    <option value="Packs">Packs</option>
                    <option value="Units">Units</option>
                    <option value="Seringes">Syringes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Current Quantity</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Baseline Alert Qty (Low Limit)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newMinQty}
                    onChange={(e) => setNewMinQty(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Price per Unit ($)</label>
                  <input
                    type="number"
                    required
                    min={0.01}
                    step={0.01}
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Expiration Date Code</label>
                  <input
                    type="date"
                    required
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GLOBAL DEFAULT CATEGORY THRESHOLD SETTINGS MODAL */}
      {showSettingsModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSettingsModal(false);
            }
          }}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-55 p-4 cursor-pointer"
          id="global-threshold-settings-modal"
        >
          <div className="bg-white rounded-[32px] border border-slate-100 p-6 w-full max-w-lg shadow-2xl relative cursor-default max-h-[90vh] overflow-y-auto custom-scrollbar animate-fade-in">
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-850 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-colors"
              title="Close settings"
            >
              <X size={20} />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 block">Inventory Rules Engine</span>
              <h3 className="text-base font-black text-slate-800">Supply Safety Threshold Rules</h3>
              <p className="text-[10px] text-slate-500 font-medium">Configure precise minimum safety levels on specific supply items. When stock slides below this limit, alerts will highlight on active boards.</p>
            </div>

            {/* Threshold Rules list for specific products */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-[10.5px] uppercase font-bold text-slate-700 tracking-wider">Active Supply Safety Levels</h4>
                <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-150 text-blue-700 rounded-full">{inventory.length} Stocked Batches</span>
              </div>

              {/* Live search box for specific items in rule settings */}
              <div>
                <input
                  type="text"
                  placeholder="Filter stock by name or batch code..."
                  value={settingsSearchQuery}
                  onChange={(e) => setSettingsSearchQuery(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-750 placeholder-slate-400 focus:outline-none"
                />
              </div>

              {/* Scrollable list of items */}
              <div className="divide-y divide-slate-150/60 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {inventory
                  .filter(item => 
                    item.name.toLowerCase().includes(settingsSearchQuery.toLowerCase()) ||
                    item.batchNo.toLowerCase().includes(settingsSearchQuery.toLowerCase())
                  )
                  .map((item) => (
                    <div key={item.id} className="flex items-center justify-between pt-2.5 first:pt-0 gap-3">
                      <div className="min-w-0 flex-1">
                        <strong className="font-bold text-slate-800 text-xs block truncate">{item.name}</strong>
                        <span className="text-[9.5px] text-slate-400 block font-semibold leading-normal">
                          Batch: <span className="font-mono">{item.batchNo}</span> • Current: {item.quantity} {item.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-sm shrink-0">
                        <span className="text-[9.5px] text-slate-400 font-bold uppercase">Min Limit:</span>
                        <input
                          type="number"
                          value={item.minQty}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            updateInventoryItem(item.id, { minQty: val });
                          }}
                          className="w-10 text-center text-xs font-black text-slate-800 focus:outline-none bg-transparent"
                          min={0}
                        />
                      </div>
                    </div>
                  ))}

                {inventory.filter(item => 
                  item.name.toLowerCase().includes(settingsSearchQuery.toLowerCase()) ||
                  item.batchNo.toLowerCase().includes(settingsSearchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400 font-medium">
                    No matching stock items found in clinical indexes.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  setSettingsSearchQuery("");
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer shadow-sm text-center"
              >
                Close Configurations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM REACT-BASED MODAL FOR USE / RESTOCK / DELETE ACTIONS */}
      {activeAction && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveAction(null);
            }
          }}
          className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[110] p-4 cursor-pointer"
          id="custom-action-adjustment-overlay"
        >
          <div className="bg-white rounded-[32px] border border-slate-100 p-6 w-full max-w-sm shadow-2xl relative cursor-default animate-fade-in space-y-4">
            <button 
              onClick={() => setActiveAction(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-colors"
              title="Cancel transaction"
            >
              <X size={18} />
            </button>

            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 block">
                {activeAction.type === "use" && "Deduct / Consume Supply"}
                {activeAction.type === "restock" && "Restock / Add Quantity"}
                {activeAction.type === "delete" && "Remove Supply Document"}
              </span>
              <h3 className="text-base font-black text-slate-800 tracking-tight">
                {activeAction.itemName}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                {activeAction.type === "use" && "Record material usage on current clinical procedure rooms."}
                {activeAction.type === "restock" && "Record newly processed supply batch arrival or restock."}
                {activeAction.type === "delete" && "Permanently wipe this material from active clinic supply indexes."}
              </p>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-bold rounded-xl flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0 text-rose-550" />
                <span>{actionError}</span>
              </div>
            )}

            {activeAction.type === "delete" ? (
              <div className="space-y-4 pt-2">
                <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-2xl text-[10px] leading-relaxed text-slate-500 font-semibold">
                  <strong className="text-rose-600">Warning:</strong> Removing this record permanently clears its current balance of <strong>{activeAction.currentQty} {activeAction.unit}</strong> and breaks references in expiration calendars. This transaction is irreversible.
                </div>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setActiveAction(null)}
                    type="button"
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteAction}
                    type="button"
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md shadow-rose-200"
                  >
                    Delete Record
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Current Stock Level:</span>
                  <span className="font-extrabold text-slate-800">{activeAction.currentQty} {activeAction.unit}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">
                    {activeAction.type === "use" ? "Number of units used" : "Number of units to add"}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      required
                      min={1}
                      max={activeAction.type === "use" ? activeAction.currentQty : undefined}
                      value={inputActionValue}
                      onChange={(e) => setInputActionValue(e.target.value)}
                      className="flex-1 p-2 rounded-xl border border-slate-200 text-sm font-black text-slate-800 bg-white focus:outline-none"
                    />
                    <span className="text-slate-400 text-xs font-bold font-mono">{activeAction.unit}</span>
                  </div>
                </div>

                {activeAction.type === "use" && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block">
                      Clinical Operator (Staff Tracking)
                    </label>
                    <select
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 font-semibold cursor-pointer focus:outline-none"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role}{u.role2 && (u.role2 as string) !== "none" ? ` & ${u.role2}` : ""})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setActiveAction(null)}
                    type="button"
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteAction}
                    type="button"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md shadow-blue-200"
                  >
                    {activeAction.type === "use" ? "Confirm Consume" : "Confirm Restock"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visual Level Threshold Alerts (Toasts Container) */}
      <div className="fixed bottom-6 right-6 z-[120] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
              className="pointer-events-auto w-full border border-rose-250 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-4 flex flex-col gap-3 relative overflow-hidden"
              style={{
                boxShadow: "0 10px 25px -4px rgba(225, 29, 72, 0.12), 0 4px 6px -2px rgba(225, 29, 72, 0.04)"
              }}
            >
              {/* Left aesthetic bar flag */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500" />

              <div className="flex gap-3 items-start pl-1.5">
                <div className="p-2 bg-rose-50 text-rose-500 rounded-xl shrink-0 mt-0.5 animate-pulse">
                  <AlertTriangle size={18} />
                </div>
                
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-rose-600 block">
                    {toast.type === "out-of-stock" ? "🚨 Out of Stock Critical" : "⚠️ Stock Alert Threshold"}
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-xs leading-snug">
                    {toast.itemName}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    {toast.type === "out-of-stock" 
                      ? "Zero units remaining in the clinic inventory list."
                      : `Stock has reached ${toast.qty} ${toast.unit} (Safety baseline: ${toast.minQty} ${toast.unit}).`
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Dismiss alert"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Action buttons inside toast */}
              <div className="flex items-center justify-end gap-2 mt-0.5 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="px-2.5 py-1.5 text-[9.5px] hover:bg-slate-100 text-slate-500 rounded-lg font-bold transition-all cursor-pointer"
                >
                  Dismiss Alert
                </button>
                {toast.itemId && !toast.itemId.startsWith("new") && (
                  <button
                    type="button"
                    onClick={() => {
                      const item = inventory.find(i => i.id === toast.itemId);
                      if (item) {
                        handleRestockClick(item);
                        removeToast(toast.id);
                      }
                    }}
                    className="px-2.5 py-1.5 text-[9.5px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1 active:scale-95 border border-blue-700/10"
                  >
                    <Plus size={10} />
                    <span>Quick Restock</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
