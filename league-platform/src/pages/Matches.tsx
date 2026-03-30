import React from "react";
import { useListMatches } from "@workspace/api-client-react";
import { Calendar, MapPin, Activity, Loader2, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

function TeamAvatar({ name, color }: { name: string; color?: string }) {
  return (
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white border border-white/10 ${color ?? "bg-primary/20"}`}
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)" }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function Matches() {
  const { data: matches, isLoading } = useListMatches(
    {},
    { query: { refetchInterval: 15000 } }
  );

  const liveMatches = matches?.filter(m => m.status === "live") ?? [];
  const scheduled = matches?.filter(m => m.status === "scheduled") ?? [];
  const completed = matches?.filter(m => m.status === "completed") ?? [];
  const sorted = [...liveMatches, ...scheduled, ...completed];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary w-10 h-10" />
          <p className="text-muted-foreground text-sm">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-display font-black gradient-text-white mb-1">Matches</h1>
          <p className="text-muted-foreground text-sm">Live results, schedule & history · refreshes every 15s</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {liveMatches.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full neon-border-red"
              style={{ background: "rgba(239,68,68,0.08)" }}>
              <span className="live-dot" />
              <span className="text-red-400 text-sm font-bold">{liveMatches.length} Live Now</span>
            </div>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground glass px-4 py-2 rounded-full border border-white/6">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> {scheduled.length} upcoming</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground/40" /> {completed.length} completed</span>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-28 glass rounded-3xl border border-white/5">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Activity size={40} className="text-primary/40" />
          </div>
          <h3 className="text-xl font-bold gradient-text-white mb-2">No Matches Yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto text-sm">Matches will appear here once scheduled by the admin.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((match, i) => {
            const isLive = match.status === "live";
            const isCompleted = match.status === "completed";
            const isScheduled = match.status === "scheduled";

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className={`relative overflow-hidden rounded-3xl transition-all duration-300 ${isLive ? "neon-border-red" : "border border-white/6"}`}
                style={{
                  background: isLive
                    ? "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(15,20,35,0.95) 40%)"
                    : isCompleted
                    ? "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(15,20,35,0.95) 100%)"
                    : "linear-gradient(135deg, rgba(26,255,168,0.03) 0%, rgba(15,20,35,0.95) 100%)",
                  boxShadow: isLive ? "0 0 40px rgba(239,68,68,0.12)" : undefined,
                }}
              >
                {/* Live pulsing bar */}
                {isLive && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
                )}

                <div className="flex flex-col lg:flex-row">
                  {/* Match Meta */}
                  <div className="lg:w-56 p-6 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-white/5 shrink-0">
                    {/* Status Badge */}
                    {isLive && (
                      <div className="flex items-center gap-2 mb-4">
                        <span className="live-dot" />
                        <span className="text-red-400 font-bold text-xs tracking-wider uppercase">Live Now</span>
                      </div>
                    )}
                    {isCompleted && (
                      <div className="flex items-center gap-1.5 mb-4">
                        <CheckCircle size={13} className="text-emerald-400" />
                        <span className="text-emerald-400 font-semibold text-xs tracking-wider uppercase">Final</span>
                      </div>
                    )}
                    {isScheduled && (
                      <div className="flex items-center gap-1.5 mb-4">
                        <Clock size={13} className="text-muted-foreground" />
                        <span className="text-muted-foreground font-semibold text-xs tracking-wider uppercase">Scheduled</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-white font-semibold text-sm mb-1">
                      <Calendar size={13} className="text-primary/70 shrink-0" />
                      {format(new Date(match.startTime), "MMM d, yyyy")}
                    </div>
                    <div className="text-muted-foreground text-xs mb-3">
                      {format(new Date(match.startTime), "h:mm a")}
                    </div>
                    {match.venue && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{match.venue}</span>
                      </div>
                    )}
                    <div className="mt-3 text-[10px] font-semibold tracking-widest uppercase text-primary/60 border border-primary/15 rounded-lg px-2 py-1 w-fit">
                      {match.gameName}
                    </div>
                  </div>

                  {/* Scoreboard */}
                  <div className="flex-1 p-6 lg:p-8 flex items-center justify-between">
                    {/* Home Team */}
                    <div className="flex flex-col items-center gap-2 w-[30%]">
                      <TeamAvatar name={match.homeTeamName || "H"} color="bg-primary/20" />
                      <h3 className="font-display font-bold text-white text-center text-sm lg:text-base leading-tight">
                        {match.homeTeamName || `Team ${match.homeTeamId}`}
                      </h3>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Home</span>
                    </div>

                    {/* Score Center */}
                    <div className="flex flex-col items-center gap-2 w-[40%]">
                      {isLive || isCompleted ? (
                        <div className="flex items-center gap-3 lg:gap-5">
                          <span className="score-display text-4xl lg:text-6xl font-black text-white score-roll">
                            {match.homeScore ?? 0}
                          </span>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-muted-foreground text-lg">:</span>
                            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                          </div>
                          <span className="score-display text-4xl lg:text-6xl font-black text-white score-roll">
                            {match.awayScore ?? 0}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-14 h-14 rounded-2xl glass border border-white/8">
                          <span className="text-muted-foreground font-black italic text-lg">VS</span>
                        </div>
                      )}
                      {isLive && (
                        <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium animate-pulse">
                          <Activity size={11} /> In Progress
                        </div>
                      )}
                      {isCompleted && (
                        <div className="text-xs text-muted-foreground font-medium">
                          {(match.homeScore ?? 0) > (match.awayScore ?? 0) ? `${match.homeTeamName} wins` :
                           (match.awayScore ?? 0) > (match.homeScore ?? 0) ? `${match.awayTeamName} wins` :
                           "Draw"}
                        </div>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center gap-2 w-[30%]">
                      <TeamAvatar name={match.awayTeamName || "A"} color="bg-secondary/20" />
                      <h3 className="font-display font-bold text-white text-center text-sm lg:text-base leading-tight">
                        {match.awayTeamName || `Team ${match.awayTeamId}`}
                      </h3>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Away</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
