import React, { useEffect } from "react";
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, Calendar, Clock, Globe } from "lucide-react";
import { formatEthiopianDisplay, getEFYQuarter, getEFYString } from "@/lib/ethiopianDate";

interface FormValues {
  facilityName: string;
  facilityCode: string;
  region: string;
  zone: string;
  woreda: string;
  assessmentDate: string;
  quarter: string;
}

interface FacilityProfileFormProps {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  watch: UseFormWatch<FormValues>;
}

export default function FacilityProfileForm({ register, errors, setValue, watch }: FacilityProfileFormProps) {
  const selectedDate = watch("assessmentDate");

  // Keep Quarter auto-updated based on selected Date
  useEffect(() => {
    if (selectedDate) {
      const qResult = getEFYQuarter(selectedDate);
      setValue("quarter", qResult.quarter);
    }
  }, [selectedDate, setValue]);

  const etDateStr = selectedDate ? formatEthiopianDisplay(selectedDate) : "—";
  const etQuarterObj = selectedDate ? getEFYQuarter(selectedDate) : null;

  return (
    <Card className="border border-slate-200 shadow-xl overflow-hidden bg-white rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-blue-700 via-indigo-800 to-indigo-950 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
            <Building2 className="h-6 w-6 text-indigo-200" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">1. Facility Profile & Context</CardTitle>
            <p className="text-xs text-indigo-100 mt-1">Setup general location, reporting dates and Ethiopian Fiscal Quarter structures.</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Facility Name */}
          <div className="space-y-1.5">
            <Label htmlFor="facilityName" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400" /> Hospital Name
            </Label>
            <Input
              id="facilityName"
              placeholder="e.g. Chefa Robit Primary Hospital"
              {...register("facilityName")}
              className={`h-10 text-slate-800 ${errors.facilityName ? 'border-red-500 ring-1 ring-red-200' : 'border-slate-200'}`}
            />
            {errors.facilityName && (
              <p className="text-[11px] text-red-500 font-medium mt-1">{errors.facilityName.message}</p>
            )}
          </div>

          {/* Facility Code */}
          <div className="space-y-1.5">
            <Label htmlFor="facilityCode" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-slate-400" /> Facility ID / HRN Code
            </Label>
            <Input
              id="facilityCode"
              placeholder="e.g. HOSP-9831"
              {...register("facilityCode")}
              className={`h-10 text-slate-800 ${errors.facilityCode ? 'border-red-500 ring-1 ring-red-200' : 'border-slate-200'}`}
            />
            {errors.facilityCode && (
              <p className="text-[11px] text-red-500 font-medium mt-1">{errors.facilityCode.message}</p>
            )}
          </div>
        </div>

        {/* Location Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          <div className="space-y-1.5">
            <Label htmlFor="region" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" /> Region
            </Label>
            <Input
              id="region"
              placeholder="e.g. Amhara"
              {...register("region")}
              className={`h-10 text-slate-800 bg-white ${errors.region ? 'border-red-500' : 'border-slate-200'}`}
            />
            {errors.region && (
              <p className="text-[11px] text-red-500 font-medium mt-1">{errors.region.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="zone" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" /> Administrative Zone
            </Label>
            <Input
              id="zone"
              placeholder="e.g. Oromia Special Zone"
              {...register("zone")}
              className={`h-10 text-slate-800 bg-white ${errors.zone ? 'border-red-500' : 'border-slate-200'}`}
            />
            {errors.zone && (
              <p className="text-[11px] text-red-500 font-medium mt-1">{errors.zone.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="woreda" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" /> Woreda
            </Label>
            <Input
              id="woreda"
              placeholder="e.g. Chefa Robit"
              {...register("woreda")}
              className={`h-10 text-slate-800 bg-white ${errors.woreda ? 'border-red-500' : 'border-slate-200'}`}
            />
            {errors.woreda && (
              <p className="text-[11px] text-red-500 font-medium mt-1">{errors.woreda.message}</p>
            )}
          </div>
        </div>

        {/* Date & Calendar Conversion Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          {/* Calendar Input */}
          <div className="space-y-1.5">
            <Label htmlFor="assessmentDate" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" /> G.C. Date of Assessment
            </Label>
            <Input
              id="assessmentDate"
              type="date"
              {...register("assessmentDate")}
              className={`h-10 text-slate-800 ${errors.assessmentDate ? 'border-red-500' : 'border-slate-200'}`}
            />
            {errors.assessmentDate && (
              <p className="text-[11px] text-red-500 font-medium mt-1">{errors.assessmentDate.message}</p>
            )}
          </div>

          {/* Ethiopian Calendar Translation Panel */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 p-4 rounded-xl border border-indigo-100 flex flex-col justify-center">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Ethiopian Fiscal Year Mapping</p>
                
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-semibold text-slate-800">
                    <span className="text-slate-500 font-normal">Ethiopian Date: </span>
                    {etDateStr}
                  </p>
                  <p className="text-xs font-medium text-slate-700">
                    <span className="text-slate-500 font-normal">Reporting Window: </span>
                    {etQuarterObj ? etQuarterObj.label : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden field bound to react-hook-form */}
        <input type="hidden" {...register("quarter")} />
      </CardContent>
    </Card>
  );
}
