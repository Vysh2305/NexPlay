import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Trophy, Users, Activity, Gavel, LayoutDashboard, 
  Target, LogOut, Menu, Zap, Shield, X, Flame, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChatWidget } from "@/components/ChatWidget";
import NotificationBell from "@/components/NotificationBell";

const roleConfig = {
  admin: { label: "Admin", color: "text-amber-400", dot: "bg-amber-400", border: "border-amber-400/30", bg: "bg-amber-400/10" },
  franchise_owner: { label: "Franchise", color: "text-secondary", dot: "bg-secondary", border: "border-secondary/30", bg: "bg-secondary/10" },
  player: { label: "Player", color: "text-primary", dot: "bg-primary", border: "border-primary/30", bg: "bg-primary/10" },
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isFranchise, isPlayer, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const role = user?.role as keyof typeof roleConfig | undefined;
  const rc = role ? roleConfig[role] : roleConfig.player;

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "overview" },
    { href: "/admin/games", label: "Games", icon: Trophy, section: "manage" },
    { href: "/admin/franchises", label: "Franchises", icon: Shield, section: "manage" },
    { href: "/admin/players", label: "Players", icon: Users, section: "manage" },
    { href: "/admin/matches", label: "Matches", icon: Activity, section: "manage" },
    { href: "/admin/auctions", label: "Auctions", icon: Gavel, section: "manage" },
  ];

  const franchiseLinks = [
    { href: "/franchise/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "overview" },
    { href: "/franchise/team", label: "My Team", icon: Users, section: "team" },
    { href: "/franchise/auction", label: "Auction Room", icon: Gavel, section: "team" },
    { href: "/franchise/recommendations", label: "AI Scout", icon: Zap, section: "team" },
    { href: "/matches", label: "Live Matches", icon: Activity, section: "league" },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy, section: "league" },
  ];

  const playerLinks = [
    { href: "/player/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "overview" },
    { href: "/player/profile", label: "My Profile", icon: Target, section: "profile" },
    { href: "/matches", label: "Schedule", icon: Activity, section: "league" },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy, section: "league" },
  ];

  const links = isAdmin ? adminLinks : isFranchise ? franchiseLinks : isPlayer ? playerLinks : [];

  const sections = Array.from(new Set(links.map(l => l.section)));

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(26,255,168,0.9) 0%, rgba(26,255,168,0.6) 100%)", boxShadow: "0 0 20px rgba(26,255,168,0.4)" }}>
            <Trophy className="text-black" size={20} />
          </div>
          <div>
            <h1 className="font-display font-black text-xl tracking-tight text-white leading-none">
              NEX<span className="text-primary">PLAY</span>
            </h1>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">Management Platform</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 mb-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-5 overflow-y-auto pb-4">
        {sections.map(section => {
          const sectionLinks = links.filter(l => l.section === section);
          return (
            <div key={section}>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60 px-3 mb-1.5">
                {section}
              </p>
              <div className="space-y-0.5">
                {sectionLinks.map((link) => {
                  const isActive = location === link.href || location.startsWith(link.href + "/");
                  const Icon = link.icon;
                  return (
                    <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)}>
                      <div className={cn("sidebar-link", isActive ? "sidebar-link-active" : "sidebar-link-inactive")}>
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
                          isActive ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground group-hover:text-white"
                        )}>
                          <Icon size={16} />
                        </div>
                        <span className={cn("text-sm font-medium", isActive ? "text-primary" : "")}>
                          {link.label}
                        </span>
                        {isActive && (
                          <motion.div layoutId="nav-pill" className="ml-auto w-1 h-4 rounded-full bg-primary" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="px-3 pb-4 pt-2 border-t border-white/5">
        <div className={cn("flex items-center gap-3 px-3 py-3 rounded-xl mb-2", rc.bg, rc.border, "border")}>
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-white/10 to-white/5 flex items-center justify-center text-sm font-bold text-white border border-white/10">
              {(user?.name || user?.username || "?").charAt(0).toUpperCase()}
            </div>
            <div className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background", rc.dot)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-none mb-1">{user?.name || user?.username}</p>
            <div className={cn("inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase", rc.color)}>
              <Flame size={8} /> {rc.label}
            </div>
          </div>
          <NotificationBell />
        </div>
        <button 
          onClick={logout}
          className="flex items-center w-full gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-red-400 hover:bg-red-400/8 rounded-xl transition-all duration-200 border border-transparent hover:border-red-400/20"
        >
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <LogOut size={15} />
          </div>
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col shrink-0" 
        style={{ background: "linear-gradient(180deg, rgba(15,20,35,0.95) 0%, rgba(10,14,25,0.98) 100%)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Ambient glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/6 blur-[100px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-secondary/5 blur-[100px] rounded-full pointer-events-none -z-10" />

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 sticky top-0 z-40"
          style={{ background: "rgba(10,14,25,0.95)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Trophy className="text-primary" size={18} />
            </div>
            <h1 className="font-display font-black text-lg text-white">NEX<span className="text-primary">PLAY</span></h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors">
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="md:hidden absolute top-[57px] left-0 w-72 h-[calc(100vh-57px)] z-50 flex flex-col overflow-y-auto"
              style={{ background: "rgba(10,14,25,0.98)", backdropFilter: "blur(32px)", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
              <SidebarContent />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Top Bar — always visible for all roles */}
        <div className="hidden md:flex items-center justify-between px-6 py-3 border-b border-white/5 sticky top-0 z-40"
          style={{ background: "rgba(10,14,25,0.85)", backdropFilter: "blur(24px)" }}>
          {/* Breadcrumb / page title */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={cn("text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md", rc.bg, rc.color, "border", rc.border)}>
              {rc.label}
            </span>
            <ChevronRight size={13} className="opacity-40" />
            <span className="text-white/70 font-medium truncate max-w-xs">
              {user?.name || user?.username}
            </span>
          </div>

          {/* Right side — bell + greeting */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden lg:block">
              <p className="text-xs text-muted-foreground leading-none">Notifications</p>
            </div>
            <NotificationBell />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
      <ChatWidget userRole={user?.role} />
    </div>
  );
}
