import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUpdatePlayer, useEnrollInGame, useListGames, useListMatches } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Star, Shield, Activity, AlertTriangle, Trophy, Loader2,
  Edit3, Plus, User, Mail, Calendar, CheckCircle2, XCircle, Zap, MapPin
} from "lucide-react";
import { format } from "date-fns";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

/* ─── helpers ─────────────────────────── */
const TOKEN_KEY = "league_token";
function authFetch(url: string, opts?: RequestInit) {
  const token = localStorage.getItem(TOKEN_KEY);
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });
}

function ScoreBar({ label, value, max = 10, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold text-white">{value.toFixed(1)}<span className="text-muted-foreground text-xs">/{max}</span></span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ─── main page ────────────────────────── */
export default function PlayerProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updatePlayer = useUpdatePlayer();
  const enrollInGame = useEnrollInGame();
  const { data: games } = useListGames();
  const { data: allMatches } = useListMatches({});

  // Fetch current player's full profiles from /players/me
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["playersMe"],
    queryFn: async () => {
      const res = await authFetch("/api/players/me");
      if (!res.ok) throw new Error("Could not load profile");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Edit account modal
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({ username: "", email: "" });
  const [accountError, setAccountError] = useState("");
  const [accountLoading, setAccountLoading] = useState(false);

  // Edit game profile modal
  const [editProfile, setEditProfile] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({ skillRating: "", position: "" });
  const [profileError, setProfileError] = useState("");

  // Enroll modal
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ gameId: "", skillRating: "7", position: "" });
  const [enrollError, setEnrollError] = useState("");

  const enrolledGameIds = new Set((profiles || []).map((p: any) => p.gameId));
  const availableGames = (games || []).filter((g: any) => !enrolledGameIds.has(g.id));

  // My matches (across all franchises)
  const myFranchiseIds = new Set((profiles || []).filter((p: any) => p.franchiseId).map((p: any) => p.franchiseId));
  const myMatches = (allMatches || []).filter((m: any) => myFranchiseIds.has(m.homeTeamId) || myFranchiseIds.has(m.awayTeamId));

  const openEditAccount = useCallback(() => {
    setAccountForm({ username: user?.username ?? "", email: user?.email ?? "" });
    setAccountError("");
    setShowEditAccount(true);
  }, [user]);

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError("");
    setAccountLoading(true);
    try {
      const res = await authFetch("/api/auth/me", {
        method: "PUT",
        body: JSON.stringify({ username: accountForm.username, email: accountForm.email }),
      });
      if (!res.ok) {
        const err = await res.json();
        setAccountError(err.error || "Failed to update.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["getMe"] });
      setShowEditAccount(false);
    } catch {
      setAccountError("Network error.");
    } finally {
      setAccountLoading(false);
    }
  };

  const openEditProfile = (profile: any) => {
    setEditProfile(profile);
    setProfileForm({ skillRating: String(profile.skillRating), position: profile.position ?? "" });
    setProfileError("");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    try {
      await updatePlayer.mutateAsync({
        playerId: editProfile.id,
        data: {
          skillRating: parseFloat(profileForm.skillRating),
          position: profileForm.position || undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["playersMe"] });
      queryClient.invalidateQueries({ queryKey: ["listPlayers"] });
      setEditProfile(null);
    } catch { setProfileError("Failed to update."); }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollError("");
    if (!enrollForm.gameId) { setEnrollError("Select a game."); return; }
    const skill = parseFloat(enrollForm.skillRating);
    if (!skill || skill < 1 || skill > 10) { setEnrollError("Enter a skill rating between 1 and 10."); return; }
    if (!enrollForm.position.trim()) { setEnrollError("Position is required."); return; }
    try {
      await enrollInGame.mutateAsync({
        gameId: parseInt(enrollForm.gameId),
        data: { skillRating: skill, position: enrollForm.position.trim() },
      });
      queryClient.invalidateQueries({ queryKey: ["playersMe"] });
      queryClient.invalidateQueries({ queryKey: ["listPlayers"] });
      setShowEnroll(false);
      setEnrollForm({ gameId: "", skillRating: "7", position: "" });
    } catch (err: any) { setEnrollError(err?.message || "Already enrolled or error."); }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  return (
    <div className="space-y-8">

      {/* ── Account Header ── */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/30 via-secondary/20 to-transparent" />
        <CardContent className="pt-0 px-6 pb-6">
          <div className="flex flex-wrap items-end gap-4 -mt-10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-black font-bold text-3xl shadow-lg shadow-primary/30 shrink-0">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-display font-bold text-white">{user?.username}</h1>
                <Badge className="capitalize">{user?.role?.replace("_", " ")}</Badge>
              </div>
              <div className="flex items-center gap-4 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-sm text-muted-foreground"><Mail size={13} />{user?.email}</span>
                {user?.createdAt && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar size={13} />Joined {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </span>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={openEditAccount} className="gap-2 shrink-0">
              <Edit3 size={14} /> Edit Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Summary Stats ── */}
      {profiles && profiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Games Enrolled", value: profiles.length, icon: Trophy, color: "text-primary", bg: "bg-primary/10" },
            { label: "Avg Skill", value: (profiles.reduce((s: number, p: any) => s + p.skillRating, 0) / profiles.length).toFixed(1), icon: Star, color: "text-yellow-400", bg: "bg-yellow-400/10" },
            { label: "Avg Score", value: (profiles.reduce((s: number, p: any) => s + p.overallScore, 0) / profiles.length).toFixed(1), icon: Zap, color: "text-secondary", bg: "bg-secondary/10" },
            { label: "Total Fouls", value: profiles.reduce((s: number, p: any) => s + (p.fouls?.length ?? 0), 0), icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/10" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} shrink-0`}>
                  <s.icon className={s.color} size={18} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── No profiles yet ── */}
      {profiles && profiles.length === 0 && (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <Trophy size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Not enrolled in any game yet</h3>
          <p className="text-muted-foreground mb-6">Join a sport to be eligible for the auction and team selection.</p>
          <Button onClick={() => setShowEnroll(true)} className="gap-2"><Plus size={16} /> Join a Game</Button>
        </div>
      )}

      {/* ── Per-Game Profile Cards ── */}
      {profiles?.map((profile: any) => {
        const radarData = [
          { subject: "Skill", value: profile.skillRating, fullMark: 10 },
          { subject: "Performance", value: profile.performanceScore, fullMark: 10 },
          { subject: "Discipline", value: profile.disciplineScore / 10 * 10, fullMark: 10 },
          { subject: "AI Score", value: profile.overallScore, fullMark: 10 },
        ];
        return (
          <Card key={profile.id} className={profile.isBanned ? "border-destructive/40" : "hover:border-primary/30 transition-colors"}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-xl">{profile.gameName}</CardTitle>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {profile.franchiseName
                      ? <Badge className="bg-primary/20 text-primary border-primary/30">{profile.franchiseName}</Badge>
                      : <Badge variant="outline" className="text-muted-foreground">Unassigned — eligible for auction</Badge>
                    }
                    {profile.position && <Badge className="bg-white/10 text-white">{profile.position}</Badge>}
                    {profile.isBanned && <Badge variant="destructive">🚫 Banned</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-2">
                    <p className="text-3xl font-bold text-primary">{profile.overallScore.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">AI Score</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openEditProfile(profile)} className="gap-1">
                    <Edit3 size={13} /> Edit
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stats bars */}
                <div className="space-y-4">
                  <ScoreBar label="Skill Rating" value={profile.skillRating} color="bg-yellow-400" />
                  <ScoreBar label="Performance Score" value={profile.performanceScore} color="bg-blue-400" />
                  <ScoreBar label="Discipline Score" value={profile.disciplineScore} color="bg-emerald-400" />
                  <div className="pt-2 border-t border-white/5 text-xs text-muted-foreground">
                    Formula: 0.4×Skill + 0.4×Performance + 0.2×Discipline = <span className="text-primary font-bold">{profile.overallScore.toFixed(2)}</span>
                  </div>
                </div>

                {/* Radar chart */}
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#ffffff10" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#ffffff60", fontSize: 11 }} />
                      <Radar name="Stats" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Foul history */}
              {profile.fouls && profile.fouls.length > 0 && (
                <div className="mt-5 pt-4 border-t border-white/5">
                  <p className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                    <AlertTriangle size={14} /> Disciplinary Record ({profile.fouls.length} foul{profile.fouls.length !== 1 ? "s" : ""})
                  </p>
                  <div className="space-y-2">
                    {profile.fouls.map((f: any) => (
                      <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-400/5 border border-amber-400/15">
                        <div>
                          <p className="text-sm text-white">{f.reason}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(f.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <Badge variant={f.type === "major" ? "destructive" : "outline"} className="capitalize mb-1">{f.type}</Badge>
                          <p className="text-xs text-red-400 font-medium">−{f.penaltyPoints} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile.isBanned && profile.banReason && (
                <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                  <XCircle className="text-destructive shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="text-sm font-semibold text-destructive">Account Suspended</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{profile.banReason}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* ── Match Schedule ── */}
      {myMatches.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Your Match Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {myMatches.map((m: any) => (
              <div key={m.id} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${m.status === "live" ? "bg-red-500/10 border border-red-500/30" : "bg-white/5 hover:bg-white/8"}`}>
                <div className="text-center shrink-0 w-12">
                  {m.status === "live"
                    ? <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse mx-auto" />
                    : <span className="text-xs text-muted-foreground">{format(new Date(m.startTime), "MMM d")}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {m.homeTeamName} <span className="text-primary">{m.homeScore} – {m.awayScore}</span> {m.awayTeamName}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{m.gameName}</span>
                    <span>{format(new Date(m.startTime), "h:mm a")}</span>
                    {m.venue && <span className="flex items-center gap-1"><MapPin size={9} />{m.venue}</span>}
                  </div>
                </div>
                <Badge variant={m.status === "live" ? "live" : m.status === "completed" ? "outline" : "secondary"} className="text-xs shrink-0 capitalize">
                  {m.status === "live" ? "🔴 LIVE" : m.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Join Another Game Button ── */}
      {availableGames.length > 0 && profiles && profiles.length > 0 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setShowEnroll(true)} className="gap-2">
            <Plus size={16} /> Join Another Game
          </Button>
        </div>
      )}

      {/* ── Edit Account Modal ── */}
      <Dialog open={showEditAccount} onOpenChange={setShowEditAccount}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account Info</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateAccount} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Username</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-8" value={accountForm.username} onChange={e => setAccountForm(f => ({ ...f, username: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-8" type="email" value={accountForm.email} onChange={e => setAccountForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            {accountError && <p className="text-destructive text-sm">{accountError}</p>}
            <Button type="submit" className="w-full" disabled={accountLoading}>
              {accountLoading ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={14} /> Save Changes</>}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Game Profile Modal ── */}
      <Dialog open={!!editProfile} onOpenChange={v => !v && setEditProfile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile — {editProfile?.gameName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Skill Rating (1–10)</label>
              <Input type="number" min={1} max={10} step={0.5}
                value={profileForm.skillRating}
                onChange={e => setProfileForm(f => ({ ...f, skillRating: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">This affects your AI scouting score and auction value.</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Position</label>
              <Input placeholder="e.g., Forward, Goalkeeper, Midfielder"
                value={profileForm.position}
                onChange={e => setProfileForm(f => ({ ...f, position: e.target.value }))} />
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-xs text-muted-foreground space-y-1">
              <p>Current stats (set by admin):</p>
              <p>Performance: <span className="text-white">{editProfile?.performanceScore?.toFixed(1)}</span> · Discipline: <span className="text-white">{editProfile?.disciplineScore?.toFixed(1)}</span></p>
            </div>
            {profileError && <p className="text-destructive text-sm">{profileError}</p>}
            <Button type="submit" className="w-full" disabled={updatePlayer.isPending}>
              {updatePlayer.isPending ? <Loader2 className="animate-spin" size={16} /> : "Update Profile"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Enroll Modal ── */}
      <Dialog open={showEnroll} onOpenChange={setShowEnroll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join a Game</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEnroll} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Select Game</label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-white"
                value={enrollForm.gameId} onChange={e => setEnrollForm(f => ({ ...f, gameId: e.target.value }))}>
                <option value="">Choose a game...</option>
                {availableGames.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Skill Rating (1–10)</label>
              <Input type="number" min={1} max={10} step={0.5}
                value={enrollForm.skillRating}
                onChange={e => setEnrollForm(f => ({ ...f, skillRating: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Position <span className="text-destructive">*</span></label>
              <Input placeholder="e.g., Forward, Goalkeeper, Midfielder" required
                value={enrollForm.position}
                onChange={e => setEnrollForm(f => ({ ...f, position: e.target.value }))} />
            </div>
            {enrollError && <p className="text-destructive text-sm">{enrollError}</p>}
            <Button type="submit" className="w-full" disabled={enrollInGame.isPending}>
              {enrollInGame.isPending ? <Loader2 className="animate-spin" size={16} /> : "Join Game"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
