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

interface SidebarProps {
  activeTab?: "my-files" | "shared-with-me";
  onTabChange?: (tab: "my-files" | "shared-with-me") => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab = "my-files",
  onTabChange,
}) => {
  const { logout, user } = useAuth();

  // Helper function to get user initials
  const getUserInitials = (name: string): string => {
    if (!name) return "U";

    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    // Take first letter of first and last word
    return (
      words[0].charAt(0) + words[words.length - 1].charAt(0)
    ).toUpperCase();
  };

  const navItems = [
    {
      icon: FolderClosed,
      label: "My Files",
      active: activeTab === "my-files",
      onClick: () => onTabChange?.("my-files"),
    },
    {
      icon: Users,
      label: "Shared with Me",
      active: activeTab === "shared-with-me",
      onClick: () => onTabChange?.("shared-with-me"),
    },
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
            onClick={item.onClick}
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            {user?.name ? getUserInitials(user.name) : "U"}
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
