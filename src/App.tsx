import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserRoute, AgentRoute, AdminRoute } from "@/components/RoleBasedRoute";
import { RoleRedirect } from "@/components/RoleRedirect";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SendMoney from "./pages/SendMoney";
import Withdraw from "./pages/Withdraw";
import Deposit from "./pages/Deposit";
import Transactions from "./pages/Transactions";
import Airtime from "./pages/Airtime";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import AgentDashboard from "./pages/AgentDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            
            {/* Role-based redirect at root */}
            <Route path="/" element={<RoleRedirect />} />
            
            {/* User routes - NOT accessible by admins */}
            <Route path="/home" element={<UserRoute><Index /></UserRoute>} />
            <Route path="/send" element={<UserRoute><SendMoney /></UserRoute>} />
            <Route path="/withdraw" element={<UserRoute><Withdraw /></UserRoute>} />
            <Route path="/deposit" element={<UserRoute><Deposit /></UserRoute>} />
            <Route path="/transactions" element={<UserRoute><Transactions /></UserRoute>} />
            <Route path="/airtime" element={<UserRoute><Airtime /></UserRoute>} />
            <Route path="/settings" element={<UserRoute><Settings /></UserRoute>} />
            
            {/* Agent route - only agents */}
            <Route path="/agent" element={<AgentRoute><AgentDashboard /></AgentRoute>} />
            
            {/* Admin route - ONLY admins */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
