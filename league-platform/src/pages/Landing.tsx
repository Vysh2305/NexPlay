import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronRight, Activity, Zap, Shield, Gavel, Star, Users, BarChart2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

const stats = [
  { value: "10K+", label: "Players Tracked" },
  { value: "500+", label: "Franchises" },
  { value: "98%", label: "Uptime" },
  { value: "24/7", label: "Live Tracking" },
];

const features = [
  {
    icon: Zap,
    color: "text-primary",
    bg: "from-primary/20 to-primary/5",
    border: "border-primary/20",
    title: "AI Scouting Engine",
    desc: "Proprietary algorithm weights Skill (40%), Performance (40%), and Discipline (20%) to surface elite talent before rivals can react.",
    badge: "Score = 0.4×Skill + 0.4×Perf + 0.2×Disc",
  },
  {
    icon: Gavel,
    color: "text-secondary",
    bg: "from-secondary/20 to-secondary/5",
    border: "border-secondary/20",
    title: "Silent Bid Auctions",
    desc: "Strategic team-building through sealed bids. Budget enforcement, auto-award on close. No house advantage — just pure strategy.",
    badge: "Live auction rounds",
  },
  {
    icon: Activity,
    color: "text-red-400",
    bg: "from-red-500/20 to-red-500/5",
    border: "border-red-500/20",
    title: "Live Match Tracking",
    desc: "Real-time scoreboard updates, foul tracking, match history, and comprehensive leaderboards — all in one place.",
    badge: "Refreshes every 15s",
  },
];

const roles = [
  { icon: Shield, label: "Admin", desc: "Full platform control — manage games, franchises, auctions, and match results.", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  { icon: Users, label: "Franchise Owner", desc: "Scout, bid, build, and manage your dynasty. AI recommendations powered by live data.", color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" },
  { icon: Star, label: "Player", desc: "Track your stats, schedule, team placement, and discipline record in real-time.", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
];

export default function Landing() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") setLocation("/admin/dashboard");
      else if (user.role === "franchise_owner") setLocation("/franchise/dashboard");
      else setLocation("/player/dashboard");
    }
  }, [isAuthenticated, user, setLocation]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/7 blur-[120px] rounded-full" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-secondary/6 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/4 blur-[100px] rounded-full" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 md:px-16 py-5 flex items-center justify-between border-b border-white/5"
        style={{ background: "rgba(10,14,25,0.8)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(26,255,168,0.9) 0%, rgba(26,255,168,0.5) 100%)", boxShadow: "0 0 20px rgba(26,255,168,0.3)" }}>
            <Trophy className="text-black" size={18} />
          </div>
          <h1 className="font-display font-black text-xl text-white tracking-tight">
            NEX<span className="text-primary">PLAY</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <button className="text-sm font-semibold text-muted-foreground hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
              Sign In
            </button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="text-sm">Get Started <ArrowRight size={14} className="ml-1.5" /></Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center px-4 py-24 md:py-36 text-center max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-8">
              <span className="flex h-2 w-2"><span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-primary" /></span>
              <span className="text-sm font-medium text-white/80">Next-Gen Sports Management — Now Live</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tight mb-6">
              <span className="gradient-text-white">Build Your</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-secondary">
                Dynasty.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              The complete platform for sports league management — silent-bid auctions, AI-powered scouting,
              live match tracking, and real-time leaderboards.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-base font-bold px-8 h-12 group">
                  Start Your Legacy
                  <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="glass" className="w-full sm:w-auto text-base h-12 px-8">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-px mt-20 w-full max-w-2xl glass rounded-3xl border border-white/6 overflow-hidden"
          >
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center py-6 px-4 hover:bg-white/3 transition-colors">
                <p className="font-display font-black text-3xl gradient-text mb-1">{s.value}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* Features */}
        <section className="px-4 md:px-16 py-16 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-black gradient-text-white mb-3">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Three powerful systems, one seamless platform.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`relative overflow-hidden rounded-3xl p-7 border ${f.border} hover:border-opacity-60 transition-all duration-300 hover:-translate-y-1`}
                style={{ background: `linear-gradient(135deg, ${f.bg.replace("from-", "").replace("to-", ", ")})`.replace("20 to", "20, ").replace("5 )", "5)") }}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.bg} border ${f.border} flex items-center justify-center mb-5`}>
                  <f.icon size={22} className={f.color} />
                </div>
                <h3 className="font-display text-xl font-bold gradient-text-white mb-3">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">{f.desc}</p>
                <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${f.color} px-3 py-1.5 rounded-lg glass border ${f.border}`}>
                  <BarChart2 size={10} /> {f.badge}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section className="px-4 md:px-16 py-16 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-black gradient-text-white mb-3">
              Your Role, Your Power
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Three distinct roles, each with tailored dashboards and capabilities.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {roles.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`glass rounded-3xl p-6 border ${r.border} hover:border-opacity-60 transition-all duration-300 hover:-translate-y-1`}
              >
                <div className={`w-12 h-12 rounded-2xl ${r.bg} border ${r.border} flex items-center justify-center mb-4`}>
                  <r.icon size={22} className={r.color} />
                </div>
                <h3 className={`font-display text-lg font-bold mb-2 ${r.color}`}>{r.label}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center glass-strong rounded-3xl border border-primary/15 p-10 md:p-16 relative overflow-hidden"
            style={{ boxShadow: "0 0 60px rgba(26,255,168,0.08), inset 0 0 60px rgba(26,255,168,0.02)" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/10 blur-[60px] rounded-full" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-3xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-6"
                style={{ boxShadow: "0 0 30px rgba(26,255,168,0.2)" }}>
                <Trophy size={32} className="text-primary" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-black gradient-text-white mb-3">Ready to Compete?</h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">Join the platform trusted by managers and players. Create your account in seconds.</p>
              <Link href="/register">
                <Button size="lg" className="text-base font-bold px-10 h-12">
                  Create Free Account <ChevronRight className="ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5 px-6 md:px-16 py-6 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-primary" />
          <span className="font-bold text-white">NEXPLAY</span>
        </div>
        <p>© {new Date().getFullYear()} · Built for champions.</p>
      </footer>
    </div>
  );
}
