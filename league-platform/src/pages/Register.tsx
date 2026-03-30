import React, { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Mail, Lock, User as UserIcon, Hash, Shield, AlertCircle, ArrowRight, ChevronDown, ChevronUp, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister, RegisterRequestRole } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

function CharCount({ value, max, exact }: { value: string; max: number; exact?: boolean }) {
  const len = value.length;
  const ok = exact ? len === max : len <= max;
  const pct = Math.min(len / max, 1);
  return (
    <div className="flex items-center justify-between mt-1.5">
      <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden mr-3">
        <div
          className={cn("h-full rounded-full transition-all duration-200", ok ? "bg-primary" : len > max ? "bg-red-400" : "bg-amber-400")}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <span className={cn("text-[11px] font-mono font-bold tabular-nums", ok ? "text-primary" : len > max ? "text-red-400" : "text-muted-foreground")}>
        {len}/{max}
      </span>
    </div>
  );
}

export default function Register() {
  const [name, setName] = useState("");
  const [psid, setPsid] = useState("");
  const [sponsorId, setSponsorId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterRequestRole>("player");
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const registerMutation = useRegister();
  const { login } = useAuth();

  const isFranchise = role === "franchise_owner";

  const sanitizePsid = (v: string) => v.toLowerCase().replace(/[^a-z0-9_]/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (role === "admin" && adminCode !== "NEXPLAY_ADMIN_2024") {
      setErrorMsg("Invalid admin access code.");
      return;
    }

    if (psid.length !== 8) {
      setErrorMsg("PSID must be exactly 8 characters.");
      return;
    }

    if (isFranchise) {
      if (sponsorId.length !== 10) {
        setErrorMsg("Sponsor ID must be exactly 10 characters.");
        return;
      }
    }

    try {
      const res = await registerMutation.mutateAsync({
        data: {
          name,
          username: psid,
          ...(isFranchise ? { sponsorId } : {}),
          email,
          password,
          role,
        },
      });
      login(res.token);
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-row-reverse">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md py-6"
        >
          {/* Brand */}
          <div className="mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(26,255,168,0.9) 0%, rgba(26,255,168,0.6) 100%)" }}>
              <Shield className="text-black" size={18} />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl text-white leading-none">
                NEX<span className="text-primary">PLAY</span>
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Management Platform</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-black text-white mb-1">Create Account</h2>
            <p className="text-muted-foreground text-sm">Join the elite sports management platform.</p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive">
              <AlertCircle size={18} className="shrink-0" />
              <span className="text-sm font-medium">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="text-sm font-medium text-white/80 ml-1 mb-2 block">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => { setRole("player"); setShowAdmin(false); setSponsorId(""); }}
                  className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${
                    role === "player" ? "border-primary bg-primary/10 text-primary" : "border-muted bg-card hover:bg-white/5"
                  }`}
                >
                  <div className="font-bold text-sm">Player</div>
                  <div className="text-xs mt-0.5 opacity-70">Join a team</div>
                </div>
                <div
                  onClick={() => { setRole("franchise_owner"); setShowAdmin(false); }}
                  className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${
                    role === "franchise_owner" ? "border-secondary bg-secondary/10 text-secondary" : "border-muted bg-card hover:bg-white/5"
                  }`}
                >
                  <div className="font-bold text-sm">Franchise</div>
                  <div className="text-xs mt-0.5 opacity-70">Build a team</div>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/80 ml-1">Full Name</label>
              <Input
                type="text" required placeholder="Your full name"
                value={name} onChange={e => setName(e.target.value)} icon={<UserIcon size={18} />}
              />
            </div>

            {/* PSID — 8 chars for both roles */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-white/80 ml-1">
                PSID <span className="text-muted-foreground font-normal">(Player ID)</span>
                <span className="text-destructive ml-1">*</span>
              </label>
              <Input
                type="text" required
                placeholder="Exactly 8 characters"
                maxLength={8}
                value={psid}
                onChange={e => setPsid(sanitizePsid(e.target.value))}
                icon={<Hash size={18} />}
              />
              <CharCount value={psid} max={8} exact />
              <p className="text-xs text-muted-foreground ml-1">Lowercase, numbers, underscores only. Exactly 8 characters. Cannot be changed later.</p>
            </div>

            {/* Sponsor ID — franchise only, 10 chars */}
            {isFranchise && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1"
              >
                <label className="text-sm font-medium text-white/80 ml-1">
                  Sponsor ID
                  <span className="text-destructive ml-1">*</span>
                </label>
                <Input
                  type="text" required
                  placeholder="Exactly 10 characters"
                  maxLength={10}
                  value={sponsorId}
                  onChange={e => setSponsorId(sanitizePsid(e.target.value))}
                  icon={<Fingerprint size={18} />}
                />
                <CharCount value={sponsorId} max={10} exact />
                <p className="text-xs text-muted-foreground ml-1">Your franchise sponsor identifier. Exactly 10 characters.</p>
              </motion.div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/80 ml-1">Email Address</label>
              <Input
                type="email" required placeholder="athlete@example.com"
                value={email} onChange={e => setEmail(e.target.value)} icon={<Mail size={18} />}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/80 ml-1">Password</label>
              <Input
                type="password" required placeholder="Min. 8 characters"
                value={password} onChange={e => setPassword(e.target.value)} icon={<Lock size={18} />}
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={registerMutation.isPending}>
              Create Account <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </form>

          {/* Admin access collapsible */}
          <div className="mt-5 border border-white/5 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => { setShowAdmin(!showAdmin); setRole(showAdmin ? "player" : "admin"); setSponsorId(""); }}
              className="w-full flex items-center justify-between px-4 py-3 text-xs text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Shield size={13} className="text-amber-400" />
                Admin Account Access
              </span>
              {showAdmin ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {showAdmin && (
              <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                <p className="text-xs text-amber-400/80">
                  Admin accounts require a special access code provided by the platform operator.
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60 ml-1">Admin Access Code</label>
                  <Input
                    type="password" placeholder="Enter admin code"
                    value={adminCode} onChange={e => setAdminCode(e.target.value)} icon={<Shield size={16} />}
                  />
                </div>
              </div>
            )}
          </div>

          <p className="mt-5 text-center text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-semibold">Sign in</Link>
          </p>
        </motion.div>
      </div>

      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Stadium"
          className="absolute inset-0 w-full h-full object-cover transform scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background via-background/80 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 p-8 bg-black/40 backdrop-blur-md rounded-3xl border border-white/10">
          <h2 className="font-display text-3xl font-bold text-white mb-3">Your Game. Your Platform.</h2>
          <p className="text-primary/80 text-sm">NEXPLAY — Where champions are built.</p>
        </div>
      </div>
    </div>
  );
}
