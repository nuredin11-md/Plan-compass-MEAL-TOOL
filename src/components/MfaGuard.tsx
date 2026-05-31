import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Loader2, LogOut, KeyRound, AlertCircle, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface MfaGuardProps {
  children: React.ReactNode;
}

export default function MfaGuard({ children }: MfaGuardProps) {
  const { user, role, mfaRequired, aalLevel, refreshAal, signOut } = useAuth();
  const [step, setStep] = useState<"checking" | "challenge" | "enroll" | "none">("checking");
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const initMfa = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Check if user already has factors enrolled
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const activeFactors = factorsData?.all || [];
      const totpFactors = activeFactors.filter((f) => f.factor_type === "totp");

      if (totpFactors.length === 0) {
        // No factors enrolled: Begin Enrollment
        const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          issuer: "Plan Compass",
          friendlyName: user?.email || "User",
        });
        if (enrollError) throw enrollError;

        if (enrollData) {
          setFactorId(enrollData.id);
          setQrCode(enrollData.totp.qr_code);
          setSecret(enrollData.totp.secret);
          setStep("enroll");
        }
      } else {
        // Already enrolled but currently at AAL1: Challenge active factor
        const verifiedFactor = totpFactors.find((f) => f.status === "verified") || totpFactors[0];
        setFactorId(verifiedFactor.id);
        setStep("challenge");
      }
    } catch (err: any) {
      console.error("MFA Initialization failed:", err);
      setErrorMsg(err.message || "Failed to initialize multi-factor authentication.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mfaRequired) {
      setStep("checking");
      initMfa();
    } else {
      setStep("none");
    }
  }, [mfaRequired, user]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMsg("Please enter a valid 6-digit verification code.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      // Challenge and verify TOTP code
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeError) throw challengeError;

      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: otpCode.trim(),
      });
      if (verifyError) throw verifyError;

      toast.success("Identity verified successfully!");
      await refreshAal();
      setStep("none");
    } catch (err: any) {
      console.error("MFA Verification failed:", err);
      setErrorMsg(err.message || "Incorrect verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copySecretToClipboard = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success("Secret key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mfaRequired) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative backdrop blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative z-10"
      >
        {/* Top Header Panel */}
        <div className="p-6 pb-4 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/15 rounded-xl border border-violet-500/30 text-violet-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-md font-bold text-white tracking-wide">Multi-Factor Authentication</h2>
            <p className="text-xs text-slate-400 leading-tight">Elevated role security dynamic verification</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {step === "checking" && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              <p className="text-xs text-slate-400 font-medium">Validating security assurance levels…</p>
            </div>
          )}

          {step === "enroll" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                Your account holds a privileged role (<span className="text-violet-400 font-bold">{role?.replace("_", " ")}</span>).
                You are required to enroll in Multi-Factor Authentication to access the Plan Compass.
              </div>

              {qrCode && (
                <div className="text-center space-y-3">
                  <p className="text-xs font-semibold text-slate-400">1. Scan QR Code using an authenticator app:</p>
                  <div className="p-3 bg-white w-fit mx-auto rounded-xl border border-slate-800 shadow-md">
                    <img src={qrCode} alt="TOTP QR Code" className="w-40 h-40" />
                  </div>
                </div>
              )}

              {secret && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400">Or use Manual Setup Key:</p>
                  <div className="flex items-center gap-2 bg-slate-950 p-2 border border-slate-800 rounded-lg">
                    <span className="font-mono text-xs text-violet-300 truncate flex-1 leading-none select-all">{secret}</span>
                    <button
                      onClick={copySecretToClipboard}
                      className="p-1 px-1.5 border border-slate-800 rounded hover:bg-slate-850 text-slate-400 transition-colors"
                      title="Copy Setup Key"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    2. Enter 6-digit confirmation code:
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      maxLength={6}
                      pattern="\d{6}"
                      required
                      placeholder="e.g. 123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      className="w-full h-11 bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 text-sm font-semibold tracking-widest text-center text-white focus:outline-none focus:border-violet-500 transition-all font-mono"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full h-11 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify and Complete Enrollment"}
                </button>
              </form>
            </div>
          )}

          {step === "challenge" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed text-center">
                Hello department head / admin. Enter the 6-digit code from your authenticator app to authorize your session.
              </div>

              <form onSubmit={handleVerify} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                    Enter Authenticator OTP:
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      maxLength={6}
                      pattern="\d{6}"
                      required
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      className="w-full h-11 bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 text-sm font-semibold tracking-widest text-center text-white focus:outline-none focus:border-violet-500 transition-all font-mono"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full h-11 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authorize with OTP"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center px-6">
          <button
            onClick={initMfa}
            disabled={loading}
            className="text-xs hover:text-white text-slate-400 transition-colors font-semibold"
          >
            Reset Flow
          </button>
          <button
            onClick={signOut}
            className="text-xs hover:text-red-400 text-slate-400 transition-colors font-semibold flex items-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
