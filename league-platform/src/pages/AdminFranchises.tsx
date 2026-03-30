import React, { useState, useEffect } from "react";
import {
  useListFranchises, useCreateFranchise, useListGames,
  useGetFranchisePlayers
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, IndianRupee, Plus, Trophy, ChevronRight, Loader2, Target } from "lucide-react";
import { formatINR } from "@/lib/utils";

function FranchiseDetail({ franchise }: { franchise: any }) {
  const { data: players, isLoading } = useGetFranchisePlayers(franchise.id);
  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Roster</p>
      {isLoading ? <Loader2 className="animate-spin text-primary" size={16} /> :
        players && players.length > 0 ? players.map((p: any) => (
          <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
            <span className="text-sm text-white">{p.username}</span>
            <Badge variant="outline" className="text-xs">{p.position || "—"}</Badge>
          </div>
        )) : <p className="text-xs text-muted-foreground">No players yet.</p>}
    </div>
  );
}

type AppUser = { id: number; username: string; email: string; role: string };

export default function AdminFranchises() {
  const queryClient = useQueryClient();
  const { data: franchises, isLoading } = useListFranchises({});
  const { data: games } = useListGames();
  const createFranchise = useCreateFranchise();
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", ownerId: "", gameId: "", totalBudget: "100000", maxPlayers: "15" });
  const [error, setError] = useState("");
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    fetch("/api/users").then(r => r.ok ? r.json() : []).then((data: AppUser[]) => {
      setUsers(data.filter(u => u.role === "franchise_owner"));
    }).catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.ownerId || !form.gameId) {
      setError("All fields are required."); return;
    }
    try {
      await createFranchise.mutateAsync({
        data: {
          name: form.name,
          ownerId: parseInt(form.ownerId),
          gameId: parseInt(form.gameId),
          totalBudget: parseFloat(form.totalBudget),
          maxPlayers: parseInt(form.maxPlayers),
        }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/franchises"] });
      setShowCreate(false);
      setForm({ name: "", ownerId: "", gameId: "", totalBudget: "100000", maxPlayers: "15" });
    } catch (err: any) {
      setError(err?.message || "Failed to create franchise.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Franchises</h1>
          <p className="text-muted-foreground mt-1">Manage all team franchises across sports.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus size={16} /> New Franchise
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {franchises?.map((f) => (
            <Card key={f.id} className="cursor-pointer hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-white">{f.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{f.gameName} · Owner: {f.ownerName}</p>
                  </div>
                  <Badge variant={f.playerCount >= f.maxPlayers ? "destructive" : "outline"}>
                    {f.playerCount}/{f.maxPlayers}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-muted-foreground">Budget Left</p>
                    <p className="font-bold text-primary text-lg">{formatINR(f.remainingBudget)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-muted-foreground">Record</p>
                    <p className="font-bold text-white text-lg">{f.wins}W – {f.losses}L</p>
                  </div>
                </div>
                <button
                  onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                  className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-white transition-colors px-2 py-1"
                >
                  <span>View Roster</span>
                  <ChevronRight size={14} className={`transition-transform ${expanded === f.id ? "rotate-90" : ""}`} />
                </button>
                {expanded === f.id && <FranchiseDetail franchise={f} />}
              </CardContent>
            </Card>
          ))}
          {!franchises?.length && (
            <div className="col-span-3 text-center py-20 text-muted-foreground">
              No franchises yet. Create one to get started.
            </div>
          )}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Franchise</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Franchise Name</label>
              <Input placeholder="e.g., Thunder FC" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Franchise Owner</label>
              {users.length > 0 ? (
                <select
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-white"
                  value={form.ownerId}
                  onChange={e => setForm(f => ({ ...f, ownerId: e.target.value }))}
                >
                  <option value="">Select an owner...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                  ))}
                </select>
              ) : (
                <div>
                  <Input type="number" placeholder="User ID (no franchise_owner accounts found)" value={form.ownerId} onChange={e => setForm(f => ({ ...f, ownerId: e.target.value }))} />
                  <p className="text-xs text-amber-400 mt-1">Create a franchise_owner account via Register first.</p>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Game / Sport</label>
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-white"
                value={form.gameId}
                onChange={e => setForm(f => ({ ...f, gameId: e.target.value }))}
              >
                <option value="">Select a game...</option>
                {games?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Total Budget ($)</label>
                <Input type="number" value={form.totalBudget} onChange={e => setForm(f => ({ ...f, totalBudget: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Max Players</label>
                <Input type="number" value={form.maxPlayers} onChange={e => setForm(f => ({ ...f, maxPlayers: e.target.value }))} />
              </div>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={createFranchise.isPending}>
              {createFranchise.isPending ? <Loader2 className="animate-spin" size={16} /> : "Create Franchise"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
