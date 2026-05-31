import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building2, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Users, 
  Bed, 
  Network, 
  ShieldCheck,
  ClipboardCheck
} from "lucide-react";
import type { HospitalInfo } from "./ipcData";

interface Props {
  info: HospitalInfo;
  onChange: (info: HospitalInfo) => void;
}

function ProfileField({ 
  icon: Icon, 
  label, 
  value, 
  field, 
  onChange,
  type = "text",
  placeholder = ""
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  field: string; 
  onChange: (field: string, value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5 text-left">
      <Label htmlFor={`input-${field}`} className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-slate-500" /> 
        {label}
      </Label>
      <Input 
        id={`input-${field}`}
        value={value} 
        type={type}
        onChange={e => onChange(field, e.target.value)} 
        placeholder={placeholder || label} 
        className="h-9 text-xs border-slate-200/80 bg-slate-50/30 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-lg transition-all" 
      />
    </div>
  );
}

export default function HospitalInfoForm({ info, onChange }: Props) {
  const handleChange = (field: string, value: string) => {
    onChange({ ...info, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-left max-w-2xl">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-500" /> Hospital Demographics & Administrative Profiles
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Step 1: Input facilities demographics, executive coordinates, beds occupancy, and assessors ledger.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Hospital Details Card */}
        <Card className="md:col-span-2 border-slate-200/50 shadow-sm overflow-hidden bg-white/60 backdrop-blur-sm">
          <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-2.5 flex items-center gap-2">
            <Network className="h-4 w-4 text-theme-blue text-blue-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Primary Attributes</span>
          </div>
          <CardContent className="pt-4 pb-5 space-y-4">
            <ProfileField 
              icon={Building2} 
              label="Hospital Name" 
              value={info.hospitalName} 
              field="hospitalName" 
              onChange={handleChange}
              placeholder="e.g. Tikur Anbessa Specialized Hospital (TASH)"
            />
            <ProfileField 
              icon={MapPin} 
              label="Location (Region, Zone, Woreda, City)" 
              value={info.location} 
              field="location" 
              onChange={handleChange}
              placeholder="e.g. Addis Ababa, Lideta Subcity, Ward 03"
            />
          </CardContent>
        </Card>

        {/* Audit Metadata Card */}
        <Card className="border-slate-200/50 shadow-sm overflow-hidden bg-white/60 backdrop-blur-sm">
          <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-2.5 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Audit Parameters</span>
          </div>
          <CardContent className="pt-4 pb-5 space-y-4">
            <ProfileField 
              icon={Calendar} 
              label="Assessment Date" 
              value={info.assessmentDate} 
              field="assessmentDate" 
              onChange={handleChange}
              type="date"
            />
            <ProfileField 
              icon={Calendar} 
              label="Previous Assessment" 
              value={info.previousAssessmentDate} 
              field="previousAssessmentDate" 
              onChange={handleChange}
              type="date"
            />
          </CardContent>
        </Card>
      </div>

      {/* Leadership Directory Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left pl-1">
          Institutional Contacts & Leadership Directory
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { 
              title: "Chief Executive Officer / Director", 
              fields: [
                { field: "ceoName", label: "CEO Name", icon: User, placeholder: "Dr. Name of CEO/Director" },
                { field: "ceoPhone", label: "CEO Phone Contact", icon: Phone, placeholder: "+251 9..." },
                { field: "ceoEmail", label: "CEO Email Address", icon: Mail, type: "email", placeholder: "ceo@hospital.org" }
              ] 
            },
            { 
              title: "Medical Director", 
              fields: [
                { field: "medicalDirector", label: "Medical Director Name", icon: User, placeholder: "Dr. Medical Director Name" },
                { field: "mdPhone", label: "Director Phone Contact", icon: Phone, placeholder: "+251 9..." },
                { field: "mdEmail", label: "Director Email Address", icon: Mail, type: "email", placeholder: "md@hospital.org" }
              ] 
            },
            { 
              title: "IPC Committee Team Leader", 
              fields: [
                { field: "ipcLeader", label: "IPC Team Leader Name", icon: ShieldCheck, placeholder: "IPC Officer Name" },
                { field: "ipcPhone", label: "IPC Officer Phone", icon: Phone, placeholder: "+251 9..." }
              ] 
            }
          ].map(group => (
            <Card key={group.title} className="border-slate-200/50 shadow-sm overflow-hidden bg-white/60 backdrop-blur-sm hover:border-slate-350 transition-colors">
              <div className="bg-slate-50/50 border-b border-slate-100 px-4 py-2 text-left">
                <p className="font-bold text-xs text-slate-700">{group.title}</p>
              </div>
              <CardContent className="pt-3 pb-4 space-y-3">
                {group.fields.map(f => (
                  <ProfileField 
                    key={f.field} 
                    icon={f.icon} 
                    label={f.label} 
                    value={info[f.field as keyof HospitalInfo] || ""} 
                    field={f.field} 
                    onChange={handleChange}
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Operational Capacities Card */}
      <Card className="border-slate-200/50 shadow-sm overflow-hidden bg-white/60 backdrop-blur-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-2.5 flex items-center gap-2">
          <Users className="h-4 w-4 text-teal-500" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Operational Capacities & Staff Registry</span>
        </div>
        <CardContent className="pt-4 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ProfileField 
            icon={Users} 
            label="Total Clinical Staff" 
            value={info.totalHealthProfessionals} 
            field="totalHealthProfessionals" 
            onChange={handleChange}
            placeholder="e.g. 248"
          />
          <ProfileField 
            icon={Users} 
            label="Total Support/Cleaning Staff" 
            value={info.totalSupportStaff} 
            field="totalSupportStaff" 
            onChange={handleChange}
            placeholder="e.g. 85"
          />
          <ProfileField 
            icon={Bed} 
            label="Total Active Beds" 
            value={info.totalBeds} 
            field="totalBeds" 
            onChange={handleChange}
            placeholder="e.g. 320"
          />
          <div className="sm:col-span-1 lg:col-span-1">
            <ProfileField 
              icon={User} 
              label="Names of Assessor(s)" 
              value={info.assessorNames} 
              field="assessorNames" 
              onChange={handleChange}
              placeholder="e.g. Sister Almaz, Dr. Johannes, WHO rep"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
