import React from "react";
import { useListFranchises, useGetFranchisePlayers, useRemovePlayerFromFranchise } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserMinus, Users, Loader2, Star, Shield, Activity, AlertTriangle } from "lucide-react";

export default function FranchiseTeam() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: franchises, isLoading: fLoading } = useListFranchises({});
  const myFranchise = franchises?.find(f => f.ownerId === user?.id);
  const { data: players, isLoading: pLoading } = useGetFranchisePlayers(myFranchise?.id ?? 0, { query: { enabled: !!myFranchise } });
  const removePlayer = useRemovePlayerFromFranchise();

  const handleRemove = async (playerId: number) => {
    if (!myFranchise) return;
    await removePlayer.mutateAsync({ franchiseId: myFranchise.id, playerId });
    queryClient.invalidateQueries({ queryKey: ["getFranchisePlayers", myFranchise.id] });
    queryClient.invalidateQueries({ queryKey: ["listFranchises"] });
  };

  if (fLoading || pLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  if (!myFranchise) return (
    <div className="text-center py-20">
      <Users size={48} className="text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">No Franchise Assigned</h2>
      <p className="text-muted-foreground">Contact an admin to have a franchise assigned to your account.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">{myFranchise.name} — Roster</h1>
          <p className="text-muted-foreground mt-1">{myFranchise.playerCount}/{myFranchise.maxPlayers} players · ₹{myFranchise.remainingBudget.toLocaleString("en-IN")} remaining budget</p>
        </div>
        <div className="flex gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-center">
            <p className="text-xl font-bold text-emerald-400">{myFranchise.wins}</p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 text-center">
            <p className="text-xl font-bold text-red-400">{myFranchise.losses}</p>
            <p className="text-xs text-muted-foreground">Losses</p>
          </div>
        </div>
      </div>

      {!players?.length ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
          <Users size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Roster is empty</h3>
          <p className="text-muted-foreground">Win auctions to add players to your team.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {players.map(p => (
            <Card key={p.id}>
              <CardContent className="p-4 flex flex-wrap items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {p.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white text-lg">{p.username}</p>
                    {p.position && <Badge className="bg-muted">{p.position}</Badge>}
                    {p.isBanned && <Badge variant="destructive">Banned</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                </div>
                <div className="flex gap-5">
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center text-yellow-400">
                      <Star size={14} /><span className="font-bold">{p.skillRating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Skill</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center text-blue-400">
                      <Activity size={14} /><span className="font-bold">{p.performanceScore.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Perf.</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center text-emerald-400">
                      <Shield size={14} /><span className="font-bold">{p.disciplineScore.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Disc.</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-primary text-lg">{p.overallScore.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                  {p.foulCount > 0 && (
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center text-amber-400">
                        <AlertTriangle size={14} /><span className="font-bold">{p.foulCount}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Fouls</p>
                    </div>
                  )}
                </div>
                <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
                  onClick={() => handleRemove(p.id)} disabled={removePlayer.isPending}>
                  <UserMinus size={14} /> Release
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
