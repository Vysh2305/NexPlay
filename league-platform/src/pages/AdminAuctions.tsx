import React, { useState } from "react";
import { useListAuctions, useCreateAuction, useStartAuction, useCloseAuction, useListBids, useListGames } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Gavel, Plus, Play, X, ChevronDown, ChevronUp, Loader2, IndianRupee } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { format } from "date-fns";

function AuctionBids({ auctionId }: { auctionId: number }) {
  const { data: bids, isLoading } = useListBids(auctionId);
  if (isLoading) return <Loader2 className="animate-spin text-primary mx-auto" size={16} />;
  if (!bids?.length) return <p className="text-xs text-muted-foreground text-center py-2">No bids placed yet.</p>;
  return (
    <div className="space-y-2 mt-3">
      {bids.map(b => (
        <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-sm">
          <div>
            <span className="text-white font-medium">{b.playerName}</span>
            <span className="text-muted-foreground"> ← {b.franchiseName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold">{formatINR(b.amount)}</span>
            <Badge variant={b.status === "won" ? "default" : b.status === "lost" ? "destructive" : "outline"} className="text-xs">
              {b.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminAuctions() {
  const queryClient = useQueryClient();
  const { data: auctions, isLoading } = useListAuctions({});
  const { data: games } = useListGames();
  const createAuction = useCreateAuction();
  const startAuction = useStartAuction();
  const closeAuction = useCloseAuction();
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState({ gameId: "", endTime: "" });
  const [error, setError] = useState("");

  const statusColor = (s: string) => s === "open" ? "default" : s === "closed" ? "destructive" : "outline";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.gameId || !form.endTime) { setError("All fields required."); return; }
    try {
      await createAuction.mutateAsync({ data: { gameId: parseInt(form.gameId), endTime: new Date(form.endTime).toISOString() } });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      setShowCreate(false);
      setForm({ gameId: "", endTime: "" });
    } catch { setError("Failed to create auction."); }
  };

  const handleStart = async (id: number) => {
    await startAuction.mutateAsync({ auctionId: id });
    queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
  };

  const handleClose = async (id: number) => {
    await closeAuction.mutateAsync({ auctionId: id });
    queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/franchises"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Auctions</h1>
          <p className="text-muted-foreground mt-1">Create and manage player auctions. Close to auto-assign winners.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus size={16} /> New Auction
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
      ) : (
        <div className="space-y-4">
          {auctions?.map(a => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Gavel className="text-primary" size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-base text-white">{a.gameName} Auction #{a.id}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {a.bidCount} bids · {a.playerCount} eligible players · Ends {a.endTime ? format(new Date(a.endTime), "MMM d, HH:mm") : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColor(a.status) as any} className="capitalize">{a.status}</Badge>
                    {a.status === "pending" && (
                      <Button size="sm" className="gap-1" onClick={() => handleStart(a.id)} disabled={startAuction.isPending}>
                        <Play size={14} /> Start
                      </Button>
                    )}
                    {a.status === "open" && (
                      <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleClose(a.id)} disabled={closeAuction.isPending}>
                        <X size={14} /> Close & Assign
                      </Button>
                    )}
                    <button onClick={() => setExpanded(expanded === a.id ? null : a.id)} className="p-1 text-muted-foreground hover:text-white">
                      {expanded === a.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>
              </CardHeader>
              {expanded === a.id && (
                <CardContent>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Bids</p>
                  <AuctionBids auctionId={a.id} />
                </CardContent>
              )}
            </Card>
          ))}
          {!auctions?.length && <p className="text-center text-muted-foreground py-16">No auctions yet.</p>}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Auction</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Game / Sport</label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-white"
                value={form.gameId} onChange={e => setForm(f => ({ ...f, gameId: e.target.value }))}>
                <option value="">Select a game...</option>
                {games?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">End Time</label>
              <Input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={createAuction.isPending}>
              {createAuction.isPending ? <Loader2 className="animate-spin" size={16} /> : "Create Auction"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
