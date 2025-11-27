import React from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  FolderClosed,
  Users,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";
import { useAuth } from "../../shared/hooks/useAuth";
import { cn } from "../../shared/utils/helpers";

export const Sidebar: React.FC = () => {
  const { logout } = useAuth();

  // Get user data from localStorage for now
  const accessToken = localStorage.getItem("accessToken");
  let user = null;
  if (accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      user = { name: payload.name || "User", email: payload.email };
    } catch {
      user = { name: "User", email: "user@example.com" };
    }
  }

  const navItems = [
    { icon: FolderClosed, label: "My Files", active: true },
    { icon: Users, label: "Shared with Me", active: false },
    { icon: Settings, label: "Settings", active: false },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-card flex flex-col">
      <div className="p-6">
        <Link to="/dashboard" className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white fill-white/20" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            SecureShare
          </span>
        </Link>

        <Link
          to="/upload"
          className="w-full bg-brand-blue hover:bg-blue-600 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 font-medium transition-all shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Upload File
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
              item.active
                ? "bg-slate-800/50 text-white border border-slate-700/50"
                : "text-slate-400 hover:text-white hover:bg-slate-800/30"
            )}
          >
            <item.icon
              className={cn(
                "w-5 h-5",
                item.active ? "text-blue-500" : "text-slate-500"
              )}
            />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold">
            {user?.name?.charAt(0) || "J"}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || "Guest User"}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.email || "guest@example.com"}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </aside>
  );
};
