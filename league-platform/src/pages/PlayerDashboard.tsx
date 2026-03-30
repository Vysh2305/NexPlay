import React, { useState } from "react";
import { useListPlayers, useListMatches, useListFouls, useListGames, useEnrollInGame } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, Shield, Activity, AlertTriangle, Trophy, Loader2, Plus, Target, Zap, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function ScoreRing({ value, max = 10, color, label }: { value: number; max?: number; color: string; label: string }) {
  const pct = (value / max) * 100;
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={c} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-black text-sm text-white">{value.toFixed(1)}</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
    </div>
  );
}

export default function PlayerDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: allPlayers, isLoading } = useListPlayers({});
  const myProfiles = allPlayers?.filter(p => p.userId === user?.id) ?? [];
  const { data: games } = useListGames();
  const { data: fouls } = useListFouls({});
  const { data: matches } = useListMatches({});
  const enrollInGame = useEnrollInGame();
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ gameId: "", skillRating: "7", position: "" });
  const [enrollError, setEnrollError] = useState("");

  const myFouls = fouls?.filter(f => myProfiles.some(p => p.id === f.playerId)) ?? [];
  const enrolledGameIds = new Set(myProfiles.map(p => p.gameId));
  const availableGames = games?.filter(g => !enrolledGameIds.has(g.id)) ?? [];
  const myTeamIds = new Set(myProfiles.filter(p => p.franchiseId).map(p => p.franchiseId!));
  const myMatches = matches?.filter(m => myTeamIds.has(m.homeTeamId) || myTeamIds.has(m.awayTeamId)).slice(0, 4) ?? [];

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollError("");
    if (!enrollForm.gameId) { setEnrollError("Select a game first."); return; }
    try {
      await enrollInGame.mutateAsync({ gameId: parseInt(enrollForm.gameId), data: { skillRating: parseFloat(enrollForm.skillRating), position: enrollForm.position || undefined } });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setShowEnroll(false);
      setEnrollForm({ gameId: "", skillRating: "7", position: "" });
    } catch (err: any) { setEnrollError(err?.message || "Already enrolled or an error occurred."); }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary w-10 h-10" />
          <p className="text-muted-foreground text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-display font-black gradient-text-white mb-1">
            Hey, {user?.username}
          </h1>
          <p className="text-muted-foreground text-sm">
            {myProfiles.length === 0 ? "Join a game to get started." : `Active in ${myProfiles.length} game${myProfiles.length > 1 ? "s" : ""}.`}
          </p>
        </div>
        {availableGames.length > 0 && (
          <Button onClick={() => setShowEnroll(true)} variant="glass" className="gap-2 text-sm">
            <Plus size={15} /> Join Another Game
          </Button>
        )}
      </div>

      {myProfiles.length === 0 ? (
        <div className="text-center py-28 glass rounded-3xl border border-white/5">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5"
            style={{ boxShadow: "0 0 30px rgba(26,255,168,0.1)" }}>
            <Trophy size={40} className="text-primary/60" />
          </div>
          <h3 className="text-2xl font-display font-bold gradient-text-white mb-3">Ready to Play?</h3>
          <p className="text-muted-foreground max-w-sm mx-auto text-sm mb-8 leading-relaxed">
            Join a sport to get discovered by franchise owners in the auction. Your stats will be tracked in real-time.
          </p>
          <Button onClick={() => setShowEnroll(true)} size="lg" className="gap-2">
            <Plus size={18} /> Join a Game
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {myProfiles.map((profile, pi) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pi * 0.1, duration: 0.4 }}
              className="glass rounded-3xl border border-white/6 overflow-hidden"
            >
              {/* Card Header */}
              <div className="relative px-6 pt-6 pb-5 border-b border-white/5"
                style={{ background: "linear-gradient(135deg, rgba(26,255,168,0.06) 0%, rgba(139,92,246,0.04) 100%)" }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center text-xl font-black text-white shrink-0">
                      {user?.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-white text-xl leading-tight">{profile.gameName}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {profile.franchiseName && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
                            <Users size={10} /> {profile.franchiseName}
                          </span>
                        )}
                        {profile.position && (
                          <span className="text-xs text-muted-foreground border border-white/8 px-2.5 py-1 rounded-lg">{profile.position}</span>
                        )}
                        {profile.isBanned && (
                          <span className="text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-2.5 py-1 rounded-lg">Banned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Ring Grid */}
              <div className="px-6 py-6">
                <div className="flex items-center justify-around flex-wrap gap-4">
                  <ScoreRing value={profile.skillRating} label="Skill" color="#facc15" />
                  <ScoreRing value={profile.performanceScore} label="Perf" color="rgb(139,92,246)" />
                  <ScoreRing value={profile.disciplineScore} label="Disc" color="#34d399" />
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="relative w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 flex flex-col items-center justify-center"
                      style={{ boxShadow: "0 0 20px rgba(26,255,168,0.15)" }}>
                      <Zap size={13} className="text-primary mb-0.5" />
                      <span className="font-display font-black text-sm text-primary leading-none">{profile.overallScore.toFixed(1)}</span>
                    </div>
                    <p className="text-[10px] text-primary uppercase tracking-wider font-semibold">AI Score</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Fouls */}
      {myFouls.length > 0 && (
        <div className="glass rounded-3xl border border-amber-400/15 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
              <AlertTriangle size={15} className="text-amber-400" />
            </div>
            <h3 className="font-display font-bold text-amber-400">Disciplinary Record ({myFouls.length})</h3>
          </div>
          <div className="space-y-2">
            {myFouls.map(f => (
              <div key={f.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-400/5 border border-amber-400/10">
                <div>
                  <p className="text-sm text-white font-medium">{f.reason}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(f.createdAt), "MMM d, yyyy")}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span className={cn("text-xs font-bold px-2.5 py-1 rounded-lg border",
                    f.type === "major" ? "text-red-400 bg-red-400/10 border-red-400/20" : "text-amber-400 bg-amber-400/10 border-amber-400/20"
                  )}>{f.type}</span>
                  <p className="text-xs text-red-400 mt-1 font-bold">–{f.penaltyPoints} pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matches */}
      {myMatches.length > 0 && (
        <div className="glass rounded-3xl border border-white/6 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
                <Calendar size={15} className="text-blue-400" />
              </div>
              <h3 className="font-display font-bold text-white">Your Schedule</h3>
            </div>
            <Link href="/matches" className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors flex items-center gap-1">
              All matches <span>→</span>
            </Link>
          </div>
          <div className="space-y-2">
            {myMatches.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/4 transition-colors">
                <div className={cn("w-2 h-2 rounded-full shrink-0",
                  m.status === "live" ? "bg-red-500 animate-pulse" :
                  m.status === "completed" ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{m.homeTeamName} <span className="text-muted-foreground text-xs">vs</span> {m.awayTeamName}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(m.startTime), "MMM d, h:mm a")}{m.venue ? ` · ${m.venue}` : ""}</p>
                </div>
                {m.status === "live" && <span className="text-xs text-red-400 font-bold shrink-0">LIVE</span>}
                {m.status === "completed" && <span className="text-xs font-black text-white shrink-0">{m.homeScore}–{m.awayScore}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enroll Dialog */}
      <Dialog open={showEnroll} onOpenChange={setShowEnroll}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                <Plus size={16} className="text-primary" />
              </div>
              Join a Game
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEnroll} className="space-y-5 mt-2">
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">Select Sport / League</label>
              <select className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/40 transition-colors"
                value={enrollForm.gameId} onChange={e => setEnrollForm(f => ({ ...f, gameId: e.target.value }))}>
                <option value="" className="bg-background">Choose a game...</option>
                {availableGames.map(g => <option key={g.id} value={g.id} className="bg-background">{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">
                Self-Rate Your Skill <span className="text-muted-foreground font-normal">(1–10)</span>
              </label>
              <Input type="number" min={1} max={10} step={0.5} value={enrollForm.skillRating}
                onChange={e => setEnrollForm(f => ({ ...f, skillRating: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">
                Position <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input placeholder="e.g., Forward, Midfielder, Goalkeeper" value={enrollForm.position}
                onChange={e => setEnrollForm(f => ({ ...f, position: e.target.value }))} />
            </div>
            {enrollError && (
              <div className="p-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm">{enrollError}</div>
            )}
            <Button type="submit" className="w-full h-11 font-semibold" disabled={enrollInGame.isPending}>
              {enrollInGame.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              {enrollInGame.isPending ? "Joining..." : "Join Game"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
