/**
 * Debug script to test Supabase data fetch
 * Run this in browser console to diagnose data loading issues
 */

import { supabase } from "@/integrations/supabase/client";
import { fetchHospitalPerformanceRows } from "@/lib/hospitalPerformanceIntegration";

export async function debugHospitalPerformanceData() {
  console.log("=== DEBUG: Hospital Performance Data Fetch ===");
  
  // Step 1: Check if Supabase is initialized
  console.log("1. Supabase Client Status:");
  if (!supabase) {
    console.error("❌ Supabase client is not initialized");
    return;
  }
  console.log("✓ Supabase client exists");
  
  // Step 2: Check authentication
  console.log("\n2. Authentication Status:");
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      console.log("✓ User authenticated:", session.user.email);
      console.log("  User ID:", session.user.id);
    } else {
      console.warn("⚠ No authenticated session - RLS may restrict data");
    }
  } catch (err) {
    console.error("❌ Auth check failed:", err);
  }
  
  // Step 3: Direct table query
  console.log("\n3. Direct Table Query:");
  try {
    const { data, error, count } = await supabase
      .from("hospital_plan_and_performance")
      .select("*", { count: "exact" })
      .limit(5);
    
    if (error) {
      console.error("❌ Query failed:", error.message);
      console.error("   Code:", error.code);
      console.error("   Details:", error.details);
    } else {
      console.log(`✓ Query successful. Total records: ${count}`);
      if (data && data.length > 0) {
        console.log("  Sample records:");
        data.forEach((row: any, i: number) => {
          console.log(`    [${i}] ${row.indicator_name} | ${row.fiscal_year} | ${row.metric_type}`);
        });
      } else {
        console.warn("⚠ No records found in hospital_plan_and_performance table");
      }
    }
  } catch (err) {
    console.error("❌ Direct query error:", err);
  }
  
  // Step 4: Test fetchHospitalPerformanceRows function
  console.log("\n4. Function Test (fetchHospitalPerformanceRows):");
  try {
    const data = await fetchHospitalPerformanceRows();
    console.log(`✓ Function returned ${data.length} records`);
    if (data.length > 0) {
      console.log("  Sample data:", data.slice(0, 2));
    } else {
      console.warn("⚠ Function returned empty array");
    }
  } catch (err) {
    console.error("❌ Function error:", err);
  }
  
  // Step 5: Test with filters
  console.log("\n5. Filtered Query Test:");
  try {
    const data = await fetchHospitalPerformanceRows({
      metric_type: "Plan"
    });
    console.log(`✓ Filtered query (metric_type='Plan') returned ${data.length} records`);
  } catch (err) {
    console.error("❌ Filtered query error:", err);
  }
  
  console.log("\n=== END DEBUG ===");
}

// Export for window access
(window as any).debugHospitalPerformanceData = debugHospitalPerformanceData;
