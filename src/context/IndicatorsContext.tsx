import React, { createContext, useContext, useState, useEffect } from 'react';
import { Indicator, setIndicatorsFromDB } from '@/data/hospitalIndicators';
import { fetchIndicatorsFromDB } from '../../hospitalDataSync';
import { supabase } from '@/integrations/supabase/client';

interface IndicatorsContextType {
  indicators: Indicator[];
  addIndicator: (indicator: Indicator) => boolean;
  updateIndicator: (code: string, patch: Partial<Indicator>) => void;
  removeIndicator: (code: string) => void;
  isCustom: (code: string) => boolean;
}

const IndicatorsContext = createContext<IndicatorsContextType | undefined>(undefined);

export const useIndicators = () => {
  const context = useContext(IndicatorsContext);
  if (!context) throw new Error('useIndicators must be used within an IndicatorsProvider');
  return context;
};

export const IndicatorsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadIndicators = async () => {
      // Ensure Supabase auth session is ready before querying (RLS requires auth)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No session yet; wait briefly for auth to initialize, then retry once
        await new Promise((r) => setTimeout(r, 800));
      }

      try {
        const inds = await fetchIndicatorsFromDB();
        if (cancelled) return;
        setIndicatorsFromDB(inds);
        setIndicators(inds);
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load indicators from Supabase:', error);
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    loadIndicators();

    // Re-load when auth state changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      if (!cancelled && ready) {
        loadIndicators();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const addIndicator = (indicator: Indicator): boolean => {
    if (indicators.some(ind => ind.code === indicator.code)) return false;
    setIndicators(prev => [...prev, indicator]);
    return true;
  };

  const updateIndicator = (code: string, patch: Partial<Indicator>) => {
    setIndicators(prev => prev.map(ind => ind.code === code ? { ...ind, ...patch } : ind));
  };

  const removeIndicator = (code: string) => {
    setIndicators(prev => prev.filter(ind => ind.code !== code));
  };

  const isCustom = (code: string): boolean => true;

  return (
    <IndicatorsContext.Provider value={{ indicators, addIndicator, updateIndicator, removeIndicator, isCustom }}>
      {children}
    </IndicatorsContext.Provider>
  );
};
