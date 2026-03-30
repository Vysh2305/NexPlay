import React from "react";
import { useListFranchises, useGetFranchisePlayers, useListMatches, useListAuctions } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { IndianRupee, Users, Trophy, Activity, Gavel, Zap, Loader2, ArrowRight, Shield, Star, TrendingUp } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function StatCard({ label, value, icon: Icon, color, iconBg, index }: { label: string; value: string | number; icon: React.ElementType; color: string; iconBg: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="stat-card"
    >
      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center mb-4 ${iconBg}`}>
        <Icon size={19} className={color} />
      </div>
      <p className="text-2xl font-display font-black text-white">{value}</p>
      <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
    </motion.div>
  );
}

export default function FranchiseDashboard() {
  const { user } = useAuth();
  const { data: franchises, isLoading: fLoading } = useListFranchises({});
  const myFranchise = franchises?.find(f => f.ownerId === user?.id);
  const { data: players } = useGetFranchisePlayers(myFranchise?.id ?? 0, { query: { enabled: !!myFranchise } });
  const { data: matches } = useListMatches({});
  const { data: auctions } = useListAuctions({});

  const myMatches = matches?.filter(m => m.homeTeamId === myFranchise?.id || m.awayTeamId === myFranchise?.id).slice(0, 4) ?? [];
  const openAuctions = auctions?.filter(a => a.status === "open") ?? [];
  const budgetUsed = myFranchise ? myFranchise.totalBudget - myFranchise.remainingBudget : 0;
  const budgetPct = myFranchise ? Math.round((budgetUsed / myFranchise.totalBudget) * 100) : 0;

  if (fLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary w-10 h-10" />
          <p className="text-muted-foreground text-sm">Loading franchise...</p>
        </div>
      </div>
    );
  }

  if (!myFranchise) {
    return (
      <div className="text-center py-28 glass rounded-3xl border border-white/5">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Shield size={40} className="text-primary/40" />
        </div>
        <h2 className="text-2xl font-display font-bold gradient-text-white mb-2">No Franchise Assigned</h2>
        <p className="text-muted-foreground max-w-sm mx-auto text-sm mb-4">Contact an admin to have a franchise assigned to your account.</p>
        <p className="text-xs text-muted-foreground glass inline-flex px-4 py-2 rounded-xl border border-white/8">
          Your User ID: <span className="text-primary font-mono font-bold ml-1.5">{user?.id}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center text-xl font-black text-white"
              style={{ boxShadow: "0 0 20px rgba(26,255,168,0.15)" }}>
              {myFranchise.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-display font-black gradient-text-white leading-tight">{myFranchise.name}</h1>
              <p className="text-muted-foreground text-sm">{myFranchise.gameName}</p>
            </div>
          </div>
        </div>
        {openAuctions.length > 0 && (
          <Link href="/franchise/auction">
            <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full neon-border-primary cursor-pointer hover:bg-primary/10 transition-colors"
              style={{ background: "rgba(26,255,168,0.06)" }}>
              <Gavel size={16} className="text-primary" />
              <span className="text-primary text-sm font-bold">{openAuctions.length} Auction{openAuctions.length > 1 ? "s" : ""} Open</span>
              <ArrowRight size={14} className="text-primary" />
            </div>
          </Link>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Remaining Budget" value={formatINR(myFranchise.remainingBudget)} icon={IndianRupee} color="text-primary" iconBg="bg-primary/15 border-primary/20" index={0} />
        <StatCard label={`Players (${myFranchise.playerCount}/${myFranchise.maxPlayers})`} value={`${myFranchise.playerCount} / ${myFranchise.maxPlayers}`} icon={Users} color="text-secondary" iconBg="bg-secondary/15 border-secondary/20" index={1} />
        <StatCard label="Wins" value={myFranchise.wins} icon={Trophy} color="text-emerald-400" iconBg="bg-emerald-400/15 border-emerald-400/20" index={2} />
        <StatCard label="Losses" value={myFranchise.losses} icon={Activity} color="text-red-400" iconBg="bg-red-400/15 border-red-400/20" index={3} />
      </div>

      {/* Budget bar */}
      <div className="glass rounded-2xl border border-white/6 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-muted-foreground" />
            <span className="text-sm font-medium text-white">Budget Utilization</span>
          </div>
          <span className={cn("text-sm font-bold", budgetPct > 80 ? "text-red-400" : budgetPct > 50 ? "text-amber-400" : "text-primary")}>
            {budgetPct}% used
          </span>
        </div>
        <div className="h-2 bg-white/8 rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-700", budgetPct > 80 ? "bg-red-400" : budgetPct > 50 ? "bg-amber-400" : "bg-primary")}
            style={{ width: `${budgetPct}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Spent: {formatINR(budgetUsed)}</span>
          <span>Total: {formatINR(myFranchise.totalBudget)}</span>
        </div>
      </div>

      {/* Roster + Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roster */}
        <div className="glass rounded-3xl border border-white/6 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-white text-lg">Current Roster</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{myFranchise.playerCount} active players</p>
            </div>
            <Link href="/franchise/team" className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1 transition-colors">
              Manage <ArrowRight size={12} />
            </Link>
          </div>
          {!players?.length ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                <Users size={22} className="text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground text-sm">No players yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Win auctions to build your team.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {players.slice(0, 5).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/4 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{p.username}</p>
                    <p className="text-xs text-muted-foreground">{p.position || "No position"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-primary">{p.overallScore.toFixed(1)}</p>
                    <p className="text-[10px] text-muted-foreground">AI score</p>
                  </div>
                </div>
              ))}
              {players.length > 5 && (
                <Link href="/franchise/team">
                  <p className="text-xs text-center text-primary/70 hover:text-primary pt-1 cursor-pointer transition-colors">
                    +{players.length - 5} more players →
                  </p>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Matches */}
        <div className="glass rounded-3xl border border-white/6 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-white text-lg">Your Matches</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Recent & upcoming</p>
            </div>
            <Link href="/matches" className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1 transition-colors">
              All matches <ArrowRight size={12} />
            </Link>
          </div>
          {!myMatches.length ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                <Activity size={22} className="text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground text-sm">No matches scheduled.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myMatches.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/4 transition-colors">
                  <div className={cn("w-2 h-2 rounded-full shrink-0",
                    m.status === "live" ? "bg-red-500 animate-pulse" :
                    m.status === "completed" ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {m.homeTeamName} <span className="text-muted-foreground text-xs">vs</span> {m.awayTeamName}
                    </p>
                    <p className="text-xs text-muted-foreground">{format(new Date(m.startTime), "MMM d, h:mm a")}</p>
                  </div>
                  {m.status === "live" && (
                    <span className="text-xs text-red-400 font-bold shrink-0">LIVE</span>
                  )}
                  {m.status === "completed" && (
                    <span className="text-xs font-black text-white shrink-0">{m.homeScore}–{m.awayScore}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Scout CTA */}
      <div className="relative overflow-hidden rounded-3xl p-6 border border-secondary/20"
        style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(26,255,168,0.05) 100%)" }}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/10 blur-[60px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary/15 border border-secondary/25 flex items-center justify-center"
              style={{ boxShadow: "0 0 20px rgba(139,92,246,0.2)" }}>
              <Zap size={22} className="text-secondary" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-lg">AI Scout — Player Recommendations</p>
              <p className="text-sm text-muted-foreground">AI-ranked picks based on skill, performance & discipline</p>
            </div>
          </div>
          <Link href="/franchise/recommendations">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-secondary/30 text-secondary text-sm font-bold cursor-pointer hover:bg-secondary/10 transition-colors">
              <Star size={15} /> View AI Picks <ArrowRight size={14} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
