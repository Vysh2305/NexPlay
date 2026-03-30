import React, { useState } from "react";
import { useGetRecommendations, useListFranchises, useListGames } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Star, Shield, Activity, Loader2, TrendingUp, IndianRupee } from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function FranchiseRecommendations() {
  const { user } = useAuth();
  const { data: franchises } = useListFranchises({});
  const { data: games } = useListGames();
  const myFranchise = franchises?.find(f => f.ownerId === user?.id);
  const [selectedGameId, setSelectedGameId] = useState<number | undefined>(myFranchise?.gameId);

  const gameId = selectedGameId ?? myFranchise?.gameId;
  const { data: recommendations, isLoading } = useGetRecommendations(
    { franchiseId: myFranchise?.id ?? 0, gameId: gameId ?? 0 },
    { query: { enabled: !!myFranchise && !!gameId } }
  );

  if (!myFranchise) return (
    <div className="text-center py-20 text-muted-foreground">No franchise assigned to your account.</div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-white">AI Scout</h1>
        <p className="text-muted-foreground mt-1">AI-ranked player recommendations based on Skill, Performance & Discipline</p>
      </div>

      <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Scoring Formula</p>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="px-3 py-1.5 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-mono">0.4 × Skill Rating</span>
          <span className="text-muted-foreground">+</span>
          <span className="px-3 py-1.5 rounded-lg bg-blue-400/10 text-blue-400 text-sm font-mono">0.4 × Performance</span>
          <span className="text-muted-foreground">+</span>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-400/10 text-emerald-400 text-sm font-mono">0.2 × Discipline</span>
          <span className="text-muted-foreground">=</span>
          <span className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-sm font-mono font-bold">Overall Score</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-white"
          value={gameId ?? ""} onChange={e => setSelectedGameId(parseInt(e.target.value))}>
          {games?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <span className="text-sm text-muted-foreground">Budget: <span className="text-primary font-bold">{formatINR(myFranchise.remainingBudget)}</span></span>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
      ) : recommendations?.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Zap size={48} className="mx-auto mb-4 opacity-30" />
          <p>No eligible players found within your budget.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations?.map((r, idx) => (
            <Card key={r.player.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-2xl font-bold text-muted-foreground w-8 text-center">#{idx + 1}</div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-white font-bold text-lg">
                    {r.player.username.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white text-lg">{r.player.username}</p>
                    {r.player.position && <Badge className="bg-muted">{r.player.position}</Badge>}
                    {r.player.foulCount > 0 && <Badge variant="outline" className="text-amber-400 border-amber-400/30">{r.player.foulCount} fouls</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md">{r.reason}</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center text-yellow-400"><Star size={12} /><span className="font-bold">{r.player.skillRating.toFixed(1)}</span></div>
                    <p className="text-xs text-muted-foreground">Skill</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center text-blue-400"><Activity size={12} /><span className="font-bold">{r.player.performanceScore.toFixed(1)}</span></div>
                    <p className="text-xs text-muted-foreground">Perf.</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center text-emerald-400"><Shield size={12} /><span className="font-bold">{r.player.disciplineScore.toFixed(1)}</span></div>
                    <p className="text-xs text-muted-foreground">Disc.</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-primary text-xl">{r.score.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end text-primary"><IndianRupee size={14} /><span className="font-bold text-lg">{r.suggestedBid.toLocaleString("en-IN")}</span></div>
                  <p className="text-xs text-muted-foreground">Suggested bid</p>
                  <div className="flex items-center gap-1 justify-end text-emerald-400 mt-1"><TrendingUp size={12} /><span className="text-xs font-medium">{r.valueScore.toFixed(1)} value</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
