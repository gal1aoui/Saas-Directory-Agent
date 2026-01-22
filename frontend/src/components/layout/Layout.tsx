import {
  Database,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Send,
  User as UserIcon,
  X,
} from "lucide-react";
import { useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { NavLink } from "./NavLink";
import Dashboard from "../dashboard/Dashboard";
import SubmissionList from "../submissions/SubmissionList";
import BulkSubmit from "../bulk-submit/BulkSubmit";
import SaasManager from "../saas/SaasManager";
import DirectoryManager from "../directories/DirectoryManager";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  return (
    <>
      <aside
        className={`
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 fixed md:static inset-y-0 left-0 z-50
          w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <Send className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Directory</h1>
                <p className="text-xs text-gray-600">Agent</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-gray-600 hover:text-gray-900"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <NavLink to="/" icon={LayoutDashboard} label="Dashboard" />
            <NavLink to="/submissions" icon={Send} label="Submissions" />
            <NavLink to="/bulk-submit" icon={Database} label="Bulk Submit" />
            <NavLink to="/saas" icon={Database} label="SaaS Products" />
            <NavLink to="/directories" icon={Globe} label="Directories" />
          </nav>

          {/* Footer with User Menu */}
          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 px-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start text-sm">
                    <span className="font-medium">{user?.username}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-40">
                      {user?.email}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            Directory Agent
          </h2>
          <div className="w-6" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/submissions" element={<SubmissionList />} />
            <Route path="/bulk-submit" element={<BulkSubmit />} />
            <Route path="/saas" element={<SaasManager />} />
            <Route path="/directories" element={<DirectoryManager />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </>
  );
}
