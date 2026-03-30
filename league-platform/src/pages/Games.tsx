import React, { useState } from "react";
import { useListGames, useCreateGame, useUpdateGame } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trophy, Users, IndianRupee, Pencil, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { formatINRCompact } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function apiDelete(path: string) {
  const token = localStorage.getItem("league_token");
  return fetch(path, {
    method: "DELETE",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

export default function Games() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: games, isLoading } = useListGames();
  const createGameMutation = useCreateGame();
  const updateGameMutation = useUpdateGame();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "", description: "", rules: "", maxTeamSize: 11, minTeamSize: 5, auctionBudget: 1000000
  });
  const [createError, setCreateError] = useState("");

  const [editGame, setEditGame] = useState<{ id: number; name: string; description: string } | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [editError, setEditError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!createForm.name.trim()) { setCreateError("Game name is required."); return; }
    try {
      await createGameMutation.mutateAsync({ data: { ...createForm, status: "active" } });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      setIsCreateOpen(false);
      setCreateForm({ name: "", description: "", rules: "", maxTeamSize: 11, minTeamSize: 5, auctionBudget: 1000000 });
      toast({ title: "✅ Game Created", description: `${createForm.name} is now live.` });
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create game.");
    }
  };

  const openEdit = (game: any) => {
    setEditGame({ id: game.id, name: game.name, description: game.description ?? "" });
    setEditForm({ name: game.name, description: game.description ?? "" });
    setEditError("");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGame) return;
    setEditError("");
    if (!editForm.name.trim()) { setEditError("Game name is required."); return; }
    try {
      await updateGameMutation.mutateAsync({ gameId: editGame.id, data: { name: editForm.name.trim(), description: editForm.description.trim() } });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      setEditGame(null);
      toast({ title: "✅ Game Updated", description: "Name and description saved." });
    } catch (err: any) {
      setEditError(err?.message || "Failed to update game.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiDelete(`/api/games/${deleteTarget.id}`);
      if (!res.ok) throw new Error("Delete failed");
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({ title: "🗑️ Game Deleted", description: `${deleteTarget.name} has been removed.` });
      setDeleteTarget(null);
    } catch {
      toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete this game." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Games & Sports</h1>
          <p className="text-muted-foreground mt-1">Manage active sports leagues</p>
        </div>
        <Button onClick={() => { setIsCreateOpen(true); setCreateError(""); }}>
          <Plus size={18} className="mr-2" /> Create Game
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-primary w-8 h-8" />
        </div>
      ) : games?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
          <Trophy size={40} className="mb-3 opacity-30" />
          <p>No games yet. Create your first sport league.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games?.map((game) => (
            <Card key={game.id} className="group hover:border-primary/40 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Trophy size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={game.status === "active" ? "default" : "secondary"}>
                      {game.status.toUpperCase()}
                    </Badge>
                    {/* Edit & Delete — always visible for admin */}
                    <button
                      onClick={() => openEdit(game)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                      title="Edit name & description"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: game.id, name: game.name })}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all"
                      title="Delete game"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
                  {game.description || "No description provided."}
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Franchises</p>
                    <p className="font-semibold text-white flex items-center gap-1"><Users size={14} /> {game.franchiseCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Auction Budget</p>
                    <p className="font-semibold text-primary flex items-center gap-1"><IndianRupee size={14} /> {formatINRCompact(game.auctionBudget)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Create Game Modal ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Game</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/80">Game Name <span className="text-destructive">*</span></label>
              <Input required value={createForm.name}
                onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="e.g. Basketball Pro League" />
            </div>
            <div>
              <label className="text-sm font-medium text-white/80">Description</label>
              <textarea
                className="w-full h-24 rounded-xl border-2 border-muted bg-background/50 px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                value={createForm.description}
                onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Brief description of the league..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-white/80">Min Team Size</label>
                <Input type="number" required value={createForm.minTeamSize}
                  onChange={e => setCreateForm({ ...createForm, minTeamSize: +e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-white/80">Max Team Size</label>
                <Input type="number" required value={createForm.maxTeamSize}
                  onChange={e => setCreateForm({ ...createForm, maxTeamSize: +e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-white/80">Auction Budget (₹)</label>
              <Input type="number" required value={createForm.auctionBudget}
                onChange={e => setCreateForm({ ...createForm, auctionBudget: +e.target.value })} />
            </div>
            {createError && <p className="text-destructive text-sm">{createError}</p>}
            <Button type="submit" className="w-full mt-2" disabled={createGameMutation.isPending}>
              {createGameMutation.isPending ? <><Loader2 className="animate-spin mr-2" size={16} /> Creating…</> : "Create Game"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Game Modal (name + description only) ── */}
      <Dialog open={!!editGame} onOpenChange={open => !open && setEditGame(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Game</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2 mb-2">Only the name and description can be changed after creation.</p>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/80">Game Name <span className="text-destructive">*</span></label>
              <Input required value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-white/80">Description</label>
              <textarea
                className="w-full h-24 rounded-xl border-2 border-muted bg-background/50 px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            {editError && <p className="text-destructive text-sm">{editError}</p>}
            <div className="flex gap-3 mt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditGame(null)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={updateGameMutation.isPending}>
                {updateGameMutation.isPending ? <><Loader2 className="animate-spin mr-2" size={16} /> Saving…</> : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Modal ── */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle size={20} /> Delete Game
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-bold text-white">{deleteTarget?.name}</span>?
              This will remove the game and cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <><Loader2 className="animate-spin mr-2" size={16} /> Deleting…</> : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
