import React, { useState } from "react";
import { useListMatches, useCreateMatch, useUpdateMatch, useListGames, useListFranchises } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, MapPin, Activity, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function AdminMatches() {
  const queryClient = useQueryClient();
  const { data: games } = useListGames();
  const [gameFilter, setGameFilter] = useState<number | undefined>();
  const { data: matches, isLoading } = useListMatches({ gameId: gameFilter });
  const { data: franchises } = useListFranchises({ gameId: gameFilter });
  const createMatch = useCreateMatch();
  const updateMatch = useUpdateMatch();
  const [showCreate, setShowCreate] = useState(false);
  const [editMatch, setEditMatch] = useState<any>(null);
  const [form, setForm] = useState({ gameId: "", homeTeamId: "", awayTeamId: "", startTime: "", venue: "" });
  const [scoreForm, setScoreForm] = useState({ homeScore: 0, awayScore: 0, status: "live" as any });
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.gameId || !form.homeTeamId || !form.awayTeamId || !form.startTime) { setError("All required fields missing."); return; }
    try {
      await createMatch.mutateAsync({
        data: {
          gameId: parseInt(form.gameId), homeTeamId: parseInt(form.homeTeamId),
          awayTeamId: parseInt(form.awayTeamId), startTime: new Date(form.startTime).toISOString(),
          venue: form.venue || undefined
        }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      setShowCreate(false);
      setForm({ gameId: "", homeTeamId: "", awayTeamId: "", startTime: "", venue: "" });
    } catch { setError("Failed to create match."); }
  };

  const handleUpdateScore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMatch.mutateAsync({ matchId: editMatch.id, data: { homeScore: scoreForm.homeScore, awayScore: scoreForm.awayScore, status: scoreForm.status } });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/franchises"] });
      setEditMatch(null);
    } catch { setError("Failed to update match."); }
  };

  const statusColor = (s: string) => s === "live" ? "destructive" : s === "completed" ? "outline" : "secondary";
  const statusIcon = (s: string) => s === "live" ? "🔴 LIVE" : s === "completed" ? "✓ Done" : "⏱ Scheduled";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Matches</h1>
          <p className="text-muted-foreground mt-1">Schedule matches and update live scores.</p>
        </div>
        <div className="flex gap-3">
          <select className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-white"
            value={gameFilter ?? ""} onChange={e => setGameFilter(e.target.value ? parseInt(e.target.value) : undefined)}>
            <option value="">All Games</option>
            {games?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus size={16} /> Schedule Match</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
      ) : (
        <div className="space-y-3">
          {matches?.map(m => (
            <Card key={m.id} className={m.status === "live" ? "border-red-500/40" : ""}>
              <CardContent className="p-4 flex flex-wrap items-center gap-4">
                <Badge variant={statusColor(m.status) as any}>{statusIcon(m.status)}</Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white text-lg">{m.homeTeamName}</span>
                    <span className="text-2xl font-bold text-primary">{m.homeScore} – {m.awayScore}</span>
                    <span className="font-bold text-white text-lg">{m.awayTeamName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>{m.gameName}</span>
                    <span>{format(new Date(m.startTime), "MMM d, HH:mm")}</span>
                    {m.venue && <span className="flex items-center gap-1"><MapPin size={10} />{m.venue}</span>}
                  </div>
                </div>
                {m.status !== "completed" && (
                  <Button size="sm" variant="outline" onClick={() => { setEditMatch(m); setScoreForm({ homeScore: m.homeScore, awayScore: m.awayScore, status: m.status as any }); setError(""); }}>
                    Update Score
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {!matches?.length && <p className="text-center text-muted-foreground py-16">No matches scheduled.</p>}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Match</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Game</label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-white"
                value={form.gameId} onChange={e => setForm(f => ({ ...f, gameId: e.target.value }))}>
                <option value="">Select game...</option>
                {games?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Home Team</label>
                <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-white"
                  value={form.homeTeamId} onChange={e => setForm(f => ({ ...f, homeTeamId: e.target.value }))}>
                  <option value="">Home team...</option>
                  {franchises?.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Away Team</label>
                <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-white"
                  value={form.awayTeamId} onChange={e => setForm(f => ({ ...f, awayTeamId: e.target.value }))}>
                  <option value="">Away team...</option>
                  {franchises?.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Start Time</label>
              <Input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Venue (optional)</label>
              <Input placeholder="e.g., National Stadium" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={createMatch.isPending}>
              {createMatch.isPending ? <Loader2 className="animate-spin" size={16} /> : "Schedule Match"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editMatch} onOpenChange={v => !v && setEditMatch(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Score — {editMatch?.homeTeamName} vs {editMatch?.awayTeamName}</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateScore} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{editMatch?.homeTeamName}</label>
                <Input type="number" min={0} value={scoreForm.homeScore} onChange={e => setScoreForm(f => ({ ...f, homeScore: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{editMatch?.awayTeamName}</label>
                <Input type="number" min={0} value={scoreForm.awayScore} onChange={e => setScoreForm(f => ({ ...f, awayScore: parseInt(e.target.value) }))} />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Status</label>
              <div className="grid grid-cols-3 gap-2">
                {(["scheduled", "live", "completed"] as const).map(s => (
                  <button key={s} type="button" onClick={() => setScoreForm(f => ({ ...f, status: s }))}
                    className={`p-2 rounded-lg border text-sm capitalize transition-colors ${scoreForm.status === s ? "border-primary bg-primary/10 text-primary" : "border-input bg-background text-muted-foreground hover:text-white"}`}>
                    {s === "live" ? "🔴 Live" : s}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={updateMatch.isPending}>
              {updateMatch.isPending ? <Loader2 className="animate-spin" size={16} /> : "Update Match"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
