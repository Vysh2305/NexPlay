import React, { useState } from "react";
import { useListPlayers, useListGames, useAddFoul, useBanPlayer } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Ban, Search, Loader2, Star, Shield } from "lucide-react";

export default function AdminPlayers() {
  const queryClient = useQueryClient();
  const { data: games } = useListGames();
  const [gameFilter, setGameFilter] = useState<number | undefined>();
  const [search, setSearch] = useState("");
  const { data: players, isLoading } = useListPlayers({ gameId: gameFilter });
  const addFoul = useAddFoul();
  const banPlayer = useBanPlayer();

  const [foulTarget, setFoulTarget] = useState<any>(null);
  const [foulForm, setFoulForm] = useState({ type: "minor" as "minor" | "major", reason: "" });
  const [banTarget, setBanTarget] = useState<any>(null);
  const [banReason, setBanReason] = useState("");
  const [actionError, setActionError] = useState("");

  const filtered = (players || []).filter(p =>
    p.username.toLowerCase().includes(search.toLowerCase()) || (p.position || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleAddFoul = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    if (!foulForm.reason) { setActionError("Reason is required."); return; }
    try {
      await addFoul.mutateAsync({ data: { playerId: foulTarget.id, type: foulForm.type, reason: foulForm.reason } });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setFoulTarget(null);
      setFoulForm({ type: "minor", reason: "" });
    } catch { setActionError("Failed to add foul."); }
  };

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    if (!banReason) { setActionError("Reason is required."); return; }
    try {
      await banPlayer.mutateAsync({ playerId: banTarget.id, data: { reason: banReason } });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setBanTarget(null);
      setBanReason("");
    } catch { setActionError("Failed to ban player."); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Players</h1>
        <p className="text-muted-foreground mt-1">Manage players, issue fouls, and enforce discipline.</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or position..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-white"
          value={gameFilter ?? ""}
          onChange={e => setGameFilter(e.target.value ? parseInt(e.target.value) : undefined)}
        >
          <option value="">All Games</option>
          {games?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <Card key={p.id}>
              <CardContent className="p-4 flex flex-wrap items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                  {p.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white">{p.username}</p>
                    {p.isBanned && <Badge variant="destructive">Banned</Badge>}
                    {p.franchiseName && <Badge variant="outline">{p.franchiseName}</Badge>}
                    {p.position && <Badge className="bg-muted">{p.position}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.gameName || "No game"}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-yellow-400"><Star size={12} /><span className="font-bold">{p.skillRating.toFixed(1)}</span></div>
                    <p className="text-xs text-muted-foreground">Skill</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-emerald-400"><Shield size={12} /><span className="font-bold">{p.disciplineScore.toFixed(1)}</span></div>
                    <p className="text-xs text-muted-foreground">Disc.</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-primary">{p.overallScore.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-red-400">{p.foulCount}</p>
                    <p className="text-xs text-muted-foreground">Fouls</p>
                  </div>
                </div>
                {!p.isBanned && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="gap-1 text-amber-400 border-amber-400/30 hover:bg-amber-400/10" onClick={() => { setFoulTarget(p); setActionError(""); }}>
                      <AlertTriangle size={14} /> Foul
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { setBanTarget(p); setActionError(""); }}>
                      <Ban size={14} /> Ban
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {!filtered.length && <p className="text-center text-muted-foreground py-16">No players found.</p>}
        </div>
      )}

      <Dialog open={!!foulTarget} onOpenChange={v => !v && setFoulTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue Foul — {foulTarget?.username}</DialogTitle></DialogHeader>
          <form onSubmit={handleAddFoul} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Foul Type</label>
              <div className="grid grid-cols-2 gap-3">
                {(["minor", "major"] as const).map(t => (
                  <button key={t} type="button" onClick={() => setFoulForm(f => ({ ...f, type: t }))}
                    className={`p-3 rounded-xl border text-sm font-medium capitalize transition-colors ${foulForm.type === t ? "border-primary bg-primary/10 text-primary" : "border-input bg-background text-muted-foreground hover:text-white"}`}>
                    {t} ({t === "minor" ? "-5" : "-15"} pts)
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Reason</label>
              <Input placeholder="Describe the infraction..." value={foulForm.reason} onChange={e => setFoulForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
            {actionError && <p className="text-destructive text-sm">{actionError}</p>}
            <Button type="submit" className="w-full" disabled={addFoul.isPending}>
              {addFoul.isPending ? <Loader2 className="animate-spin" size={16} /> : "Issue Foul"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!banTarget} onOpenChange={v => !v && setBanTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ban Player — {banTarget?.username}</DialogTitle></DialogHeader>
          <form onSubmit={handleBan} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Ban Reason</label>
              <Input placeholder="State the reason for ban..." value={banReason} onChange={e => setBanReason(e.target.value)} />
            </div>
            {actionError && <p className="text-destructive text-sm">{actionError}</p>}
            <Button type="submit" variant="destructive" className="w-full" disabled={banPlayer.isPending}>
              {banPlayer.isPending ? <Loader2 className="animate-spin" size={16} /> : "Confirm Ban"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
