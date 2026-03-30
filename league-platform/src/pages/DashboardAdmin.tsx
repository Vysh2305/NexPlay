import React from "react";
import { useGetAdminStats, useListMatches, useListFranchises } from "@workspace/api-client-react";
import { Trophy, Users, Shield, Activity, Gavel, Loader2, ArrowRight, MapPin, Zap, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { motion } from "framer-motion";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong border border-white/10 rounded-xl px-4 py-3 text-sm">
        <p className="text-muted-foreground mb-1 font-medium">{label}</p>
        <p className="text-primary font-bold">{payload[0].value} total</p>
      </div>
    );
  }
  return null;
};

export default function DashboardAdmin() {
  const { data: stats, isLoading } = useGetAdminStats({ query: { refetchInterval: 30000 } });
  const { data: matches } = useListMatches({}, { query: { refetchInterval: 15000 } });
  const { data: franchises } = useListFranchises({});

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary w-10 h-10" />
          <p className="text-muted-foreground text-sm">Loading platform stats...</p>
        </div>
      </div>
    );
  }

  const liveMatches = matches?.filter(m => m.status === "live") ?? [];
  const recentMatches = matches?.slice(0, 6) ?? [];

  const statCards = [
    { label: "Total Games", value: stats?.totalGames ?? 0, icon: Trophy, color: "text-primary", iconBg: "bg-primary/15 border-primary/20", glow: "rgba(26,255,168,0.15)", href: "/admin/games" },
    { label: "Active Players", value: stats?.totalPlayers ?? 0, icon: Users, color: "text-secondary", iconBg: "bg-secondary/15 border-secondary/20", glow: "rgba(139,92,246,0.15)", href: "/admin/players" },
    { label: "Franchises", value: stats?.totalFranchises ?? 0, icon: Shield, color: "text-emerald-400", iconBg: "bg-emerald-400/15 border-emerald-400/20", glow: "rgba(52,211,153,0.15)", href: "/admin/franchises" },
    { label: "Live Now", value: stats?.liveMatches ?? 0, icon: Activity, color: "text-red-400", iconBg: "bg-red-400/15 border-red-400/20", glow: "rgba(239,68,68,0.15)", href: "/admin/matches" },
    { label: "Auctions Open", value: stats?.activeAuctions ?? 0, icon: Gavel, color: "text-amber-400", iconBg: "bg-amber-400/15 border-amber-400/20", glow: "rgba(251,191,36,0.15)", href: "/admin/auctions" },
    { label: "Total Matches", value: stats?.totalMatches ?? 0, icon: TrendingUp, color: "text-blue-400", iconBg: "bg-blue-400/15 border-blue-400/20", glow: "rgba(96,165,250,0.15)", href: "/admin/matches" },
  ];

  const chartData = [
    { name: "Games", count: stats?.totalGames ?? 0 },
    { name: "Franchises", count: stats?.totalFranchises ?? 0 },
    { name: "Players", count: stats?.totalPlayers ?? 0 },
    { name: "Matches", count: stats?.totalMatches ?? 0 },
    { name: "Live", count: stats?.liveMatches ?? 0 },
    { name: "Auctions", count: stats?.activeAuctions ?? 0 },
  ];

  const quickActions = [
    { href: "/admin/games", icon: Trophy, color: "text-primary", bg: "bg-primary/10 border-primary/15", label: "Manage Games", desc: "Create leagues & configure sports" },
    { href: "/admin/auctions", icon: Gavel, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/15", label: "Manage Auctions", desc: "Start, monitor & close rounds" },
    { href: "/admin/matches", icon: Activity, color: "text-red-400", bg: "bg-red-400/10 border-red-400/15", label: "Manage Matches", desc: "Schedule & update live scores" },
    { href: "/admin/players", icon: Users, color: "text-secondary", bg: "bg-secondary/10 border-secondary/15", label: "Manage Players", desc: "Fouls, bans & player profiles" },
    { href: "/admin/franchises", icon: Shield, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/15", label: "Manage Franchises", desc: "Create & configure teams" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-display font-black gradient-text-white mb-1">Platform Overview</h1>
          <p className="text-muted-foreground text-sm">Real-time stats across all games, franchises, and matches.</p>
        </div>
        {liveMatches.length > 0 && (
          <Link href="/admin/matches">
            <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full neon-border-red cursor-pointer hover:bg-red-500/10 transition-colors"
              style={{ background: "rgba(239,68,68,0.08)" }}>
              <span className="live-dot" />
              <span className="text-red-400 text-sm font-bold">{liveMatches.length} Live Match{liveMatches.length > 1 ? "es" : ""}</span>
            </div>
          </Link>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
          >
            <Link href={s.href}>
              <div className="stat-card group cursor-pointer"
                style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05)` }}>
                <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center mb-3 ${s.iconBg} transition-transform duration-200 group-hover:scale-110`}>
                  <s.icon size={19} className={s.color} />
                </div>
                <p className="text-3xl font-display font-black text-white mb-0.5">{s.value}</p>
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart */}
        <div className="glass rounded-3xl border border-white/6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-white text-lg">Platform Summary</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Current counts across all categories</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
              <Zap size={14} className="text-primary" />
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgba(26,255,168,0.3)" />
                    <stop offset="95%" stopColor="rgba(26,255,168,0)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.25)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(26,255,168,0.2)", strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="rgba(26,255,168,0.8)"
                  strokeWidth={2}
                  fill="url(#primaryGrad)"
                  dot={{ fill: "rgba(26,255,168,0.9)", r: 4, strokeWidth: 0 }}
                  activeDot={{ fill: "#1AFFA8", r: 6, strokeWidth: 2, stroke: "rgba(26,255,168,0.3)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass rounded-3xl border border-white/6 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-white text-lg">Quick Actions</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Jump to key management areas</p>
            </div>
          </div>
          <div className="space-y-2">
            {quickActions.map((action, i) => (
              <Link href={action.href} key={action.href}>
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-transparent hover:border-white/8 hover:bg-white/4 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${action.bg} ${action.color}`}>
                      <action.icon size={17} />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.desc}</p>
                    </div>
                  </div>
                  <ArrowRight size={15} className="text-muted-foreground/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Matches */}
      {recentMatches.length > 0 && (
        <div className="glass rounded-3xl border border-white/6 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-white text-lg">Recent Matches</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Latest match activity</p>
            </div>
            <Link href="/admin/matches" className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-semibold">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-1">
            {recentMatches.map(m => (
              <div key={m.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/4 transition-colors group">
                <div className={`w-2 h-2 rounded-full shrink-0 ${m.status === "live" ? "bg-red-500 animate-pulse" : m.status === "completed" ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                <div className={`text-xs font-bold shrink-0 w-16 ${m.status === "live" ? "text-red-400" : m.status === "completed" ? "text-emerald-400" : "text-muted-foreground"}`}>
                  {m.status === "live" ? "LIVE" : m.status === "completed" ? "FINAL" : "SCHED"}
                </div>
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="text-white font-semibold text-sm truncate">{m.homeTeamName}</span>
                  <span className="text-primary font-black text-sm shrink-0">{m.homeScore ?? 0} – {m.awayScore ?? 0}</span>
                  <span className="text-white font-semibold text-sm truncate">{m.awayTeamName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  {m.venue && <><MapPin size={10} /><span>{m.venue} ·</span></>}
                  <span>{format(new Date(m.startTime), "MMM d")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
