/**
 * Hook for managing IPC FLAT Assessment data persistence to Supabase
 * Complements localStorage auto-save with cloud backup
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AssessmentData, HospitalInfo } from "@/components/ipc/ipcData";

export interface IPCAssessmentRecord {
  id?: string;
  hospital_name: string;
  hospital_location: string;
  assessment_date: string;
  assessor_names: string;
  total_score?: number;
  score_percentage?: number;
  section_i_score?: number;
  section_ii_score?: number;
  responses: Record<string, {
    answer: 'yes' | 'no' | 'na' | '';
    comment: string;
  }>;
  hospital_profile: HospitalInfo;
  created_at?: string;
  created_by?: string;
  status: 'draft' | 'submitted' | 'reviewed';
}

export function useIPCAssessment() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  /**
   * Save IPC FLAT assessment to Supabase
   * Can be called as draft (auto-save) or as final submission
   */
  const saveIPCAssessment = useCallback(
    async (
      hospitalInfo: HospitalInfo,
      assessmentData: AssessmentData,
      totalScore: number,
      scorePercentage: number,
      status: 'draft' | 'submitted' = 'draft',
      sectionIScore?: number,
      sectionIIScore?: number
    ) => {
      try {
        setIsSubmitting(true);

        // Check if Supabase is configured
        const hasSupabase =
          import.meta.env.VITE_SUPABASE_URL &&
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        if (!hasSupabase) {
          console.warn("Supabase not configured. Assessment saved locally only.");
          return { success: false, error: "Supabase not available", isOffline: true };
        }

        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || null;

        // Prepare the assessment record
        const record: IPCAssessmentRecord = {
          hospital_name: hospitalInfo.hospitalName,
          hospital_location: hospitalInfo.location,
          assessment_date: hospitalInfo.assessmentDate,
          assessor_names: hospitalInfo.assessorNames,
          total_score: totalScore,
          score_percentage: scorePercentage,
          section_i_score: sectionIScore,
          section_ii_score: sectionIIScore,
          responses: assessmentData,
          hospital_profile: hospitalInfo,
          status,
          created_by: userId,
        };

        // Insert or update to Supabase
        const { data, error } = await supabase
          .from("ipc_assessments" as any)
          .insert([record])
          .select()
          .single();

        if (error) {
          // Table might not exist - try to create gracefully
          if (error.code === "PGRST116" || error.code === "42P01") {
            console.warn("IPC assessments table not found. Storing locally only.");
            return { 
              success: false, 
              error: "Database table not configured", 
              isOffline: true,
              id: null 
            };
          }
          throw error;
        }

        if (!data) {
          throw new Error("No data returned after insert");
        }

        const assessmentId = (data as any).id;
        setLastSavedId(assessmentId);

        // Show success message
        if (status === 'submitted') {
          toast.success(
            `IPC FLAT Assessment submitted successfully! ID: ${assessmentId.substring(0, 8)}...`
          );
        } else {
          toast.success("IPC assessment draft saved to cloud.");
        }

        return {
          success: true,
          id: assessmentId,
          isOffline: false,
        };
      } catch (err: any) {
        console.error("Failed to save IPC assessment:", err);

        // If error is due to missing table, don't fail - just store locally
        if (err.code === "42P01" || err.message?.includes("does not exist")) {
          return {
            success: false,
            error: "Cloud storage unavailable - using local storage",
            isOffline: true,
            id: null,
          };
        }

        toast.error(
          err.message ||
          "Failed to save assessment. Ensure you are logged in."
        );

        return {
          success: false,
          error: err.message || "Unknown error",
          isOffline: false,
          id: null,
        };
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  /**
   * Fetch previously saved IPC assessments for the current user
   */
  const fetchUserAssessments = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        return [];
      }

      const { data, error } = await supabase
        .from("ipc_assessments" as any)
        .select("*")
        .eq("created_by", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "42P01") {
          // Table doesn't exist yet
          return [];
        }
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error("Failed to fetch IPC assessments:", err);
      return [];
    }
  }, []);

  /**
   * Update an existing IPC assessment
   */
  const updateIPCAssessment = useCallback(
    async (
      assessmentId: string,
      updates: Partial<IPCAssessmentRecord>
    ) => {
      try {
        setIsSubmitting(true);

        const { data, error } = await supabase
          .from("ipc_assessments" as any)
          .update(updates)
          .eq("id", assessmentId)
          .select()
          .single();

        if (error) throw error;

        toast.success("Assessment updated successfully.");
        return { success: true, data };
      } catch (err: any) {
        console.error("Failed to update IPC assessment:", err);
        toast.error(err.message || "Failed to update assessment");
        return { success: false, error: err.message };
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return {
    isSubmitting,
    lastSavedId,
    saveIPCAssessment,
    fetchUserAssessments,
    updateIPCAssessment,
  };
}
