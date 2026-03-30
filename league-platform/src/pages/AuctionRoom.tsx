import React, { useState, useEffect } from "react";
import {
  useListAuctions, useListPlayers, usePlaceBid, useListBids, useListFranchises
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gavel, IndianRupee, Zap, CheckCircle2, Clock, Loader2, Users, TrendingUp, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { cn, formatINR, formatINRCompact } from "@/lib/utils";

function ScorBar({ value, max = 10, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-white/8 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%`, transition: "width 0.6s ease" }} />
    </div>
  );
}

export default function AuctionRoom() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: franchises } = useListFranchises({});
  const myFranchise = franchises?.find(f => f.ownerId === user?.id);

  const { data: auctions, isLoading: aLoading } = useListAuctions({});
  const openAuctions = auctions?.filter(a => a.status === "open") ?? [];
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(null);
  const activeAuction = openAuctions.find(a => a.id === selectedAuctionId) ?? openAuctions[0] ?? null;

  const { data: players } = useListPlayers({ available: true });
  const { data: myBids } = useListBids(activeAuction?.id ?? 0, { query: { enabled: !!activeAuction } });
  const placeBidMutation = usePlaceBid();
  const [bidAmounts, setBidAmounts] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!activeAuction) return;
    const timer = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/${activeAuction.id}/bids`] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
    }, 10000);
    return () => clearInterval(timer);
  }, [activeAuction?.id, queryClient]);

  const myBidMap = new Map(myBids?.map(b => [b.playerId, b]) ?? []);
  const totalBidded = Array.from(myBidMap.values()).reduce((sum, b) => sum + b.amount, 0);
  const budgetUsedPct = myFranchise ? Math.min(100, (totalBidded / myFranchise.totalBudget) * 100) : 0;

  const handleBid = async (playerId: number) => {
    if (!activeAuction || !myFranchise) {
      toast({ variant: "destructive", title: "No franchise", description: "You must own a franchise to bid." });
      return;
    }
    const amount = Number(bidAmounts[playerId]);
    if (!amount || amount <= 0) return;
    if (amount > myFranchise.remainingBudget) {
      toast({ variant: "destructive", title: "Over budget", description: `Remaining: ${formatINR(myFranchise.remainingBudget)}` });
      return;
    }
    try {
      await placeBidMutation.mutateAsync({ auctionId: activeAuction.id, data: { franchiseId: myFranchise.id, playerId, amount } });
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/${activeAuction.id}/bids`] });
      queryClient.invalidateQueries({ queryKey: ["/api/franchises"] });
      toast({ title: "✓ Silent Bid Placed", description: `${formatINR(amount)} locked in.` });
      setBidAmounts(prev => ({ ...prev, [playerId]: "" }));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Bid Failed", description: err?.message || "Could not place bid." });
    }
  };

  if (aLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary w-10 h-10" />
          <p className="text-muted-foreground text-sm">Loading auction room...</p>
        </div>
      </div>
    );
  }

  if (openAuctions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-3xl glass border border-white/8 flex items-center justify-center">
            <Gavel size={48} className="text-muted-foreground/40" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Clock size={18} className="text-amber-400" />
          </div>
        </div>
        <h2 className="text-2xl font-display font-bold gradient-text-white mb-2">Auction Room Closed</h2>
        <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">No active auctions right now. Check back when an admin opens the next round.</p>
        {user?.role === "admin" && (
          <p className="text-xs text-primary mt-4 glass px-4 py-2 rounded-xl border border-primary/20">As admin, go to Auctions to create and open a round.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auction Header Banner */}
      <div className="relative overflow-hidden rounded-3xl neon-border-primary p-6"
        style={{ background: "linear-gradient(135deg, rgba(26,255,168,0.08) 0%, rgba(139,92,246,0.05) 100%)" }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/25 text-primary text-xs font-bold tracking-wide">
                <span className="live-dot" />
                AUCTION OPEN
              </div>
              {openAuctions.length > 1 && (
                <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white focus:outline-none focus:border-primary/40"
                  value={activeAuction?.id ?? ""} onChange={e => setSelectedAuctionId(parseInt(e.target.value))}>
                  {openAuctions.map(a => <option key={a.id} value={a.id} className="bg-background">{a.gameName} #{a.id}</option>)}
                </select>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-display font-black gradient-text-white mb-1">
              {activeAuction?.gameName} — Auction #{activeAuction?.id}
            </h1>
            <p className="text-muted-foreground text-sm">Silent bids — highest bid per player wins when the auction closes.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeAuction?.endTime && (
              <div className="glass border border-white/10 rounded-2xl px-4 py-3 text-center min-w-28">
                <p className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase mb-1">Closes</p>
                <p className="font-bold text-secondary text-sm">
                  {formatDistanceToNow(new Date(activeAuction.endTime), { addSuffix: true })}
                </p>
              </div>
            )}
            {myFranchise && (
              <div className="glass border border-primary/15 rounded-2xl px-4 py-3 min-w-44">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase">Budget</p>
                  <p className="text-xs font-bold text-primary">{formatINRCompact(myFranchise.remainingBudget)}</p>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-500",
                    budgetUsedPct > 80 ? "bg-red-400" : budgetUsedPct > 50 ? "bg-amber-400" : "bg-primary"
                  )} style={{ width: `${budgetUsedPct}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{myBids?.length ?? 0} bids placed</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {!myFranchise && user?.role === "franchise_owner" && (
        <div className="p-4 rounded-2xl bg-amber-400/8 border border-amber-400/25 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center shrink-0">
            <Users size={16} className="text-amber-400" />
          </div>
          <p className="text-amber-300 text-sm">You don't have a franchise yet. Ask an admin to assign one. Your User ID: <span className="font-mono font-bold text-amber-200">{user.id}</span></p>
        </div>
      )}

      {/* Player Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {players?.map((player, i) => {
          const existingBid = myBidMap.get(player.id);
          const hasBid = !!existingBid;
          const aiScore = player.overallScore;
          const aiPct = Math.round((aiScore / 10) * 100);

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className={cn("auction-card p-0 overflow-hidden", hasBid && "auction-card-bid")}
            >
              {/* Card Header Gradient */}
              <div className="relative h-16 overflow-hidden"
                style={{ background: hasBid
                  ? "linear-gradient(135deg, rgba(26,255,168,0.25) 0%, rgba(26,255,168,0.05) 100%)"
                  : "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(26,255,168,0.08) 100%)" }}>
                <div className="absolute inset-0 flex items-end px-5 pb-0">
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white border-2 translate-y-5 shadow-lg",
                    hasBid ? "border-primary/40 bg-primary/20" : "border-white/15 bg-white/10")}>
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                </div>
                {hasBid && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-primary/20 border border-primary/40 px-2.5 py-1 rounded-lg text-xs text-primary font-bold">
                    <CheckCircle2 size={11} /> Bid: {formatINR(existingBid.amount)}
                  </div>
                )}
              </div>

              <div className="px-5 pb-5 pt-7">
                {/* Name & Position */}
                <div className="mb-4">
                  <h3 className="text-lg font-display font-bold text-white leading-tight">{player.username}</h3>
                  <p className="text-xs text-muted-foreground">{player.position || "No position set"}</p>
                </div>

                {/* Stats */}
                <div className="space-y-2.5 mb-4">
                  {[
                    { label: "Skill", value: player.skillRating, color: "bg-blue-400" },
                    { label: "Performance", value: player.performanceScore, color: "bg-secondary" },
                    { label: "Discipline", value: player.disciplineScore, color: "bg-emerald-400" },
                  ].map(stat => (
                    <div key={stat.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                        <span className="text-xs font-bold text-white">{stat.value.toFixed(1)}</span>
                      </div>
                      <ScorBar value={stat.value} color={stat.color} />
                    </div>
                  ))}
                </div>

                {/* AI Score */}
                <div className="flex items-center justify-between glass rounded-xl px-3 py-2.5 mb-4 border border-primary/12">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Zap size={13} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">AI Score</p>
                      <p className="text-xs text-muted-foreground/60">0.4×Skill + 0.4×Perf + 0.2×Disc</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xl font-black", aiScore >= 7 ? "text-primary" : aiScore >= 5 ? "text-amber-400" : "text-muted-foreground")}>
                      {aiScore.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">/ 10</p>
                  </div>
                </div>

                {/* Bid Input */}
                <div className="space-y-2">
                  <div className="relative">
                    <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                    <Input
                      type="number"
                      placeholder={hasBid ? `Update bid (current: ${formatINR(existingBid!.amount)})` : "Enter bid amount..."}
                      className="pl-9 bg-white/4 border-white/8 focus:border-primary/40 text-sm"
                      value={bidAmounts[player.id] || ""}
                      onChange={e => setBidAmounts({ ...bidAmounts, [player.id]: e.target.value })}
                      onKeyDown={e => e.key === "Enter" && handleBid(player.id)}
                    />
                  </div>
                  <Button
                    className="w-full font-semibold text-sm h-9"
                    variant={hasBid ? "glass" : "default"}
                    onClick={() => handleBid(player.id)}
                    disabled={!bidAmounts[player.id] || placeBidMutation.isPending || !myFranchise}
                  >
                    {hasBid ? (
                      <><TrendingUp size={14} className="mr-1.5" /> Update Bid</>
                    ) : (
                      <><Gavel size={14} className="mr-1.5" /> Place Silent Bid</>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {!players?.length && (
          <div className="col-span-3 text-center py-20 glass rounded-3xl border border-white/5">
            <BarChart3 size={40} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No available players for this auction.</p>
          </div>
        )}
      </div>
    </div>
  );
}
