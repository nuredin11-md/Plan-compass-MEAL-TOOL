/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ChecklistItem } from "@/data/assessmentChecklist";

export interface FacilityProfile {
  name: string;
  code: string;
  region: string;
  zone: string;
  woreda: string;
  assessment_date: string;
  quarter: string;
}

export interface AssessmentResponse {
  item_id: string;
  score_achieved: number; // e.g. 0 to 5
  remarks: string;
}

export function useAssessmentData() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  const submitAssessment = useCallback(async (
    profile: FacilityProfile,
    responses: AssessmentResponse[],
    totalScore: number
  ) => {
    setIsSubmitting(true);
    try {
      // 1. Check if Supabase is properly configured or fallback to offline mode
      const hasSupabase = 
        import.meta.env.VITE_SUPABASE_URL && 
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!hasSupabase) {
        // Offline / Simulation Log
        console.warn("Supabase credentials missing. Storing assessment data in localStorage.");
        const localAssessments = JSON.parse(localStorage.getItem("offline_assessments") || "[]");
        const assessmentId = `offline_asst_${Date.now()}`;
        const newRecord = {
          id: assessmentId,
          profile,
          responses,
          totalScore,
          created_at: new Date().toISOString()
        };
        localAssessments.push(newRecord);
        localStorage.setItem("offline_assessments", JSON.stringify(localAssessments));
        
        // Simulating artificial lag for premium UI experience
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        setLastSavedId(assessmentId);
        toast.success("Assessment saved successfully to local storage (Offline Mode)!");
        setIsSubmitting(false);
        return { success: true, id: assessmentId, isOffline: true };
      }

      // 2. Insert or fetch facility (by code)
      let facilityId = "";
      
      // Let's query to see if facility already exists
      const { data: existingFacility, error: findFacilityError } = await supabase
        .from("facilities" as any)
        .select("id")
        .eq("code", profile.code)
        .maybeSingle();

      if (findFacilityError) {
        throw new Error(`Error looking up facility: ${findFacilityError.message}`);
      }

      if (existingFacility) {
        facilityId = (existingFacility as any).id;
      } else {
        // Create new facility
        const { data: newFacility, error: insertFacilityError } = await supabase
          .from("facilities" as any)
          .insert({
            name: profile.name,
            code: profile.code,
            region: profile.region,
            zone: profile.zone,
            woreda: profile.woreda
          })
          .select("id")
          .single();

        if (insertFacilityError) {
          throw new Error(`Failed to create facility: ${insertFacilityError.message}`);
        }
        facilityId = (newFacility as any).id;
      }

      // 3. User session lookup if authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || null;

      // 4. Create the Assessment record
      const { data: assessmentRecord, error: assessmentError } = await supabase
        .from("assessments" as any)
        .insert({
          facility_id: facilityId,
          assessment_date: profile.assessment_date,
          quarter: profile.quarter,
          created_by: userId,
          total_score: totalScore
        })
        .select("id")
        .single();

      if (assessmentError) {
        throw new Error(`Failed to create assessment container: ${assessmentError.message}`);
      }

      const assessmentId = (assessmentRecord as any).id;

      // 5. Create associated Response records (Single Batch Call to mimic transaction)
      const mappedResponses = responses.map(r => ({
        assessment_id: assessmentId,
        item_id: r.item_id,
        score_achieved: r.score_achieved,
        remarks: r.remarks
      }));

      const { error: responsesError } = await supabase
        .from("responses" as any)
        .insert(mappedResponses);

      if (responsesError) {
        throw new Error(`Failed to commit assessment checklist items: ${responsesError.message}`);
      }

      setLastSavedId(assessmentId);
      toast.success("Assessment committed successfully to Supabase database!");
      setIsSubmitting(false);
      return { success: true, id: assessmentId, isOffline: false };

    } catch (err: any) {
      console.error("Submit assessment error:", err);
      toast.error(err.message || "An error occurred during submission.");
      setIsSubmitting(false);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    submitAssessment,
    isSubmitting,
    lastSavedId
  };
}
