import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { setupFetchInterceptor } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";

// Pages
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import DashboardAdmin from "@/pages/DashboardAdmin";
import Games from "@/pages/Games";
import Matches from "@/pages/Matches";
import AuctionRoom from "@/pages/AuctionRoom";

// Admin Pages
import AdminFranchises from "@/pages/AdminFranchises";
import AdminPlayers from "@/pages/AdminPlayers";
import AdminAuctions from "@/pages/AdminAuctions";
import AdminMatches from "@/pages/AdminMatches";

// Franchise Pages
import FranchiseDashboard from "@/pages/FranchiseDashboard";
import FranchiseTeam from "@/pages/FranchiseTeam";
import FranchiseRecommendations from "@/pages/FranchiseRecommendations";

// Shared Pages
import Leaderboard from "@/pages/Leaderboard";

// Player Pages
import PlayerDashboard from "@/pages/PlayerDashboard";
import PlayerProfile from "@/pages/PlayerProfile";

// Initialize global fetch interceptor for auth token
setupFetchInterceptor();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!isAuthenticated) return <Redirect to="/login" />;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === "admin") return <Redirect to="/admin/dashboard" />;
    if (user.role === "franchise_owner") return <Redirect to="/franchise/dashboard" />;
    return <Redirect to="/player/dashboard" />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function DefaultDashboard() {
  const { user } = useAuth();
  if (user?.role === "admin") return <Redirect to="/admin/dashboard" />;
  if (user?.role === "franchise_owner") return <Redirect to="/franchise/dashboard" />;
  if (user?.role === "player") return <Redirect to="/player/dashboard" />;
  return <Redirect to="/login" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Dashboard redirect */}
      <Route path="/dashboard"><ProtectedRoute component={DefaultDashboard} /></Route>

      {/* Admin Routes */}
      <Route path="/admin/dashboard">
        <ProtectedRoute component={DashboardAdmin} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/games">
        <ProtectedRoute component={Games} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/franchises">
        <ProtectedRoute component={AdminFranchises} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/players">
        <ProtectedRoute component={AdminPlayers} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/matches">
        <ProtectedRoute component={AdminMatches} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/auctions">
        <ProtectedRoute component={AdminAuctions} allowedRoles={["admin"]} />
      </Route>

      {/* Franchise Routes */}
      <Route path="/franchise/dashboard">
        <ProtectedRoute component={FranchiseDashboard} allowedRoles={["franchise_owner", "admin"]} />
      </Route>
      <Route path="/franchise/team">
        <ProtectedRoute component={FranchiseTeam} allowedRoles={["franchise_owner", "admin"]} />
      </Route>
      <Route path="/franchise/auction">
        <ProtectedRoute component={AuctionRoom} allowedRoles={["franchise_owner", "admin"]} />
      </Route>
      <Route path="/franchise/recommendations">
        <ProtectedRoute component={FranchiseRecommendations} allowedRoles={["franchise_owner", "admin"]} />
      </Route>

      {/* Player Routes */}
      <Route path="/player/dashboard">
        <ProtectedRoute component={PlayerDashboard} allowedRoles={["player", "admin"]} />
      </Route>
      <Route path="/player/profile">
        <ProtectedRoute component={PlayerProfile} allowedRoles={["player", "admin"]} />
      </Route>

      {/* Shared Routes */}
      <Route path="/matches">
        <ProtectedRoute component={Matches} />
      </Route>
      <Route path="/leaderboard">
        <ProtectedRoute component={Leaderboard} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
