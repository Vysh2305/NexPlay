import React, { useState } from "react";
import { useGetLeaderboard, useListGames } from "@workspace/api-client-react";
import { Trophy, Loader2, Crown, Medal, Star, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

const rankStyles = [
  { bg: "podium-gold", icon: <Crown size={18} className="text-amber-400" />, text: "text-amber-400", glow: "0 0 30px rgba(251,191,36,0.3), 0 0 60px rgba(251,191,36,0.1)", bar: "bg-amber-400" },
  { bg: "podium-silver", icon: <Medal size={18} className="text-slate-300" />, text: "text-slate-300", glow: "0 0 20px rgba(148,163,184,0.2)", bar: "bg-slate-300" },
  { bg: "podium-bronze", icon: <Medal size={18} className="text-amber-600" />, text: "text-amber-600", glow: "0 0 20px rgba(180,83,9,0.2)", bar: "bg-amber-700" },
];

export default function Leaderboard() {
  const { data: games } = useListGames();
  const [gameId, setGameId] = useState<number | undefined>();
  const selectedGame = gameId ?? games?.[0]?.id;
  const { data: leaderboard, isLoading } = useGetLeaderboard(
    { gameId: selectedGame ?? 0 },
    { query: { enabled: !!selectedGame } }
  );

  const top3 = leaderboard?.slice(0, 3) ?? [];
  const rest = leaderboard?.slice(3) ?? [];
  const maxPoints = leaderboard?.[0]?.points ?? 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-display font-black gradient-text-white mb-1">Leaderboard</h1>
          <p className="text-muted-foreground">Season standings — ranked by wins and total points.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass text-xs font-semibold text-primary border border-primary/20">
            <Star size={12} className="fill-primary" />
            Live Rankings
          </div>
          {games && games.length > 1 && (
            <select
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white backdrop-blur-sm focus:outline-none focus:border-primary/40"
              value={selectedGame ?? ""}
              onChange={e => setGameId(parseInt(e.target.value))}
            >
              {games.map(g => <option key={g.id} value={g.id} className="bg-background">{g.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-primary w-10 h-10" />
            <p className="text-muted-foreground text-sm">Loading standings...</p>
          </div>
        </div>
      ) : !leaderboard?.length ? (
        <div className="text-center py-28 glass rounded-3xl border border-white/5">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Trophy size={40} className="text-primary/40" />
          </div>
          <h3 className="text-xl font-bold gradient-text-white mb-2">No Standings Yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto text-sm">Complete some matches to see the leaderboard come alive.</p>
        </div>
      ) : (
        <>
          {/* Podium — top 3 */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Reorder: 2nd, 1st, 3rd for podium visual */}
              {([top3[1], top3[0], top3[2]].filter(Boolean) as typeof top3).map((entry, podiumIdx) => {
                const actualRank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
                const rs = rankStyles[actualRank - 1];
                const heights = ["h-44", "h-56", "h-40"];
                return (
                  <motion.div
                    key={entry.franchiseId}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: podiumIdx * 0.1, duration: 0.5, ease: "easeOut" }}
                    className={`${rs.bg} rounded-3xl p-6 flex flex-col items-center text-center ${heights[podiumIdx]} justify-end relative overflow-hidden`}
                    style={{ boxShadow: rs.glow }}
                  >
                    {/* Rank number watermark */}
                    <div className="absolute top-3 right-4 text-7xl font-black opacity-5 leading-none select-none">
                      {actualRank}
                    </div>
                    <div className="flex items-center gap-2 mb-2">{rs.icon}</div>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-lg font-black text-white mb-3 border border-white/10">
                      {entry.franchiseName.charAt(0)}
                    </div>
                    <h3 className="font-display font-bold text-white text-lg leading-tight mb-1">{entry.franchiseName}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{entry.matchesPlayed} matches</p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-emerald-400 font-bold">{entry.wins}W</span>
                      <span className="text-red-400 font-bold">{entry.losses}L</span>
                      <span className={`font-black text-lg ${rs.text}`}>{entry.points}pts</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Full table */}
          <div className="glass rounded-3xl border border-white/6 overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-3 text-[11px] font-semibold tracking-widest uppercase text-muted-foreground border-b border-white/5">
              <div className="col-span-1">Rank</div>
              <div className="col-span-5">Franchise</div>
              <div className="col-span-2 text-center">W</div>
              <div className="col-span-2 text-center">L</div>
              <div className="col-span-2 text-right">Points</div>
            </div>
            <div className="divide-y divide-white/4">
              {leaderboard.map((entry, i) => {
                const isTop = entry.rank <= 3;
                const widthPct = Math.round((entry.points / maxPoints) * 100);
                return (
                  <motion.div
                    key={entry.franchiseId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="grid grid-cols-12 items-center px-5 py-4 hover:bg-white/3 transition-colors group relative"
                  >
                    {/* Progress bar background */}
                    <div className="absolute inset-y-0 left-0 pointer-events-none" 
                      style={{ width: `${widthPct * 0.7}%`, background: isTop ? "rgba(26,255,168,0.025)" : "rgba(255,255,255,0.01)" }} />

                    <div className="col-span-1 relative z-10">
                      {entry.rank === 1 ? <span className="text-lg">🥇</span> :
                       entry.rank === 2 ? <span className="text-lg">🥈</span> :
                       entry.rank === 3 ? <span className="text-lg">🥉</span> :
                       <span className="text-muted-foreground font-mono font-bold text-sm">#{entry.rank}</span>}
                    </div>

                    <div className="col-span-5 relative z-10 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white
                        ${isTop ? "bg-primary/20 border border-primary/20" : "bg-white/5 border border-white/5"}`}>
                        {entry.franchiseName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{entry.franchiseName}</p>
                        <p className="text-xs text-muted-foreground">{entry.matchesPlayed} played</p>
                      </div>
                    </div>

                    <div className="col-span-2 text-center relative z-10">
                      <span className="text-emerald-400 font-bold text-base">{entry.wins}</span>
                    </div>
                    <div className="col-span-2 text-center relative z-10">
                      <span className="text-red-400 font-bold text-base">{entry.losses}</span>
                    </div>
                    <div className="col-span-2 text-right relative z-10">
                      <span className={`text-base font-black ${isTop ? "text-primary" : "text-white"}`}>
                        {entry.points}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
