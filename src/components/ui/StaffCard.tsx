import React from "react";
import { motion } from "motion/react";
import { 
  Phone, 
  Mail, 
  Clock, 
  Settings, 
  Trash2, 
  Shield, 
  Lock,
  Stethoscope,
  Briefcase,
  User as LucideUser,
  AlertTriangle
} from "lucide-react";
import { User, UserRole } from "../../types";
import { PremiumSelect } from "./PremiumSelect";
import "./StaffCard.css";

interface StaffCardProps {
  user: User;
  isSelf: boolean;
  isAdmin: boolean;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onUpdateRoom: (userId: string, room: string) => void;
}

const roleIcons: Record<string, any> = {
  admin: Shield,
  doctor: Stethoscope,
  clinician: Stethoscope,
  receptionist: Briefcase,
  frontdesk: Briefcase,
  accountant: LucideUser
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  doctor: "Doctor",
  clinician: "Dentist",
  receptionist: "Reception",
  frontdesk: "Front Desk",
  accountant: "Accounting"
};

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const StaffCard: React.FC<StaffCardProps> = ({ 
  user, 
  isSelf, 
  isAdmin, 
  onEdit, 
  onDelete, 
  onUpdateRoom 
}) => {
  const isOwner = user.id === "usr-1";
  const avatarBg = "2563EB";
  const finalAvatar = user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=${avatarBg}&color=fff&bold=true`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      className={`staff-card ${isSelf ? 'self-card' : ''}`}
    >
      {/* Header Section */}
      <div className="staff-card-header">
        <div className="staff-card-avatar-container">
          <img src={finalAvatar} alt={user.name} className="staff-card-avatar" />
          <div className={`staff-card-status-dot ${user.isActive ? 'status-online' : 'status-offline'}`} />
        </div>
        
        <div className="staff-card-badges">
          {isSelf && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="staff-card-badge badge-you"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              You
            </motion.div>
          )}
          {isOwner && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="staff-card-badge badge-owner"
            >
              <Shield size={11} />
              Owner
            </motion.div>
          )}
          
          {user.assignedRoom && (
            <motion.div 
              className="staff-card-room-selector"
              whileHover={{ scale: 1.02 }}
            >
              <PremiumSelect
                value={user.assignedRoom}
                onChange={(e) => isAdmin && onUpdateRoom(user.id, e.target.value)}
                disabled={!isAdmin}
                className="!h-8 !px-3 !rounded-full !bg-white/80 !border-slate-200/60 !text-[11px] !font-bold shadow-xs hover:!bg-white"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={`Room ${num}`}>Room {num}</option>
                ))}
              </PremiumSelect>
            </motion.div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="staff-card-info">
        <h3 className="staff-card-name">{user.name}</h3>
        <p className="staff-card-specialty">
          {user.specialty || (user.role === "clinician" ? "Dentist Practitioner" : user.role === "admin" ? "Practice Owner & Specialist" : "Clinic Front Desk Officer")}
        </p>
      </div>

      {/* Contact Section */}
      <div className="staff-card-contacts">
        <motion.a 
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href={user.phone ? `tel:${user.phone}` : '#'} 
          onClick={e => !user.phone && e.preventDefault()} 
          className="staff-card-contact-item"
        >
          <div className="staff-card-contact-icon">
            <Phone size={14} />
          </div>
          <div className="staff-card-contact-text">
            <span className="staff-card-contact-label">Phone</span>
            <span className="staff-card-contact-value">{user.phone || "Missing"}</span>
          </div>
        </motion.a>
        <motion.a 
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href={user.email ? `mailto:${user.email}` : '#'} 
          onClick={e => !user.email && e.preventDefault()} 
          className="staff-card-contact-item"
        >
          <div className="staff-card-contact-icon">
            <Mail size={14} />
          </div>
          <div className="staff-card-contact-text">
            <span className="staff-card-contact-label">Email</span>
            <span className="staff-card-contact-value">{user.email || "Missing"}</span>
          </div>
        </motion.a>
      </div>

      {/* Availability Section */}
      <motion.div 
        className="staff-card-availability"
        whileHover={{ backgroundColor: 'rgba(37, 99, 235, 0.03)' }}
      >
        <div className="staff-card-availability-header">
          <div className="staff-card-availability-title">
            <Clock size={14} />
            Availability
          </div>
          <span className="staff-card-availability-time">
            {user.hours || "On-Call"}
          </span>
        </div>

        <div className="staff-card-days">
          {weekDays.map(day => {
            const isActive = user.days?.includes(day);
            return (
              <div 
                key={day} 
                className={`staff-card-day ${isActive ? 'active' : ''}`}
              >
                {day.substring(0, 3).toUpperCase()}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Footer Section */}
      <div className="staff-card-footer">
        <div className="staff-card-roles">
          {[user.role, user.role2].map((role, rIdx) => {
            if (!role || (role as string) === "none") return null;
            const Icon = roleIcons[role] || LucideUser;

            return (
              <motion.div 
                key={rIdx} 
                className="staff-card-role"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(37, 99, 235, 0.05)' }}
              >
                <Icon size={12} />
                {roleLabels[role] || role}
              </motion.div>
            );
          })}

          {!user.isActive && (
            <div className="staff-card-role badge-danger" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <AlertTriangle size={11} />
              Revoked
            </div>
          )}
        </div>

        <div className="staff-card-actions">
          {isAdmin ? (
            <>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onEdit(user)}
                className="staff-card-action-btn btn-primary"
                title="Edit Personnel Profile"
              >
                <Settings size={18} />
              </motion.button>
              {!isOwner && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (confirm(`Delete personnel record for ${user.name}?`)) {
                      onDelete(user.id);
                    }
                  }}
                  className="staff-card-action-btn btn-danger"
                  title="Remove Personnel"
                >
                  <Trash2 size={18} />
                </motion.button>
              )}
            </>
          ) : (
            <div className="staff-card-action-btn" style={{ background: 'rgba(0,0,0,0.05)', color: '#94a3b8' }}>
              <Lock size={16} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
