import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Layers,
  Settings,
  Receipt,
  FileText,
  LogOut,
  Gem,
  Menu
} from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";

const navItems = [
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { path: "/admin/users", icon: Users, label: "Users" },
  { path: "/admin/levels", icon: Layers, label: "Level Settings" },
  { path: "/admin/transactions", icon: Receipt, label: "Transactions" },
  { path: "/admin/content", icon: FileText, label: "Content" },
  { path: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("gembot_admin_token");
    navigate("/admin/login");
  };

  const NavContent = ({ onItemClick }) => (
    <>
      <div className="p-6 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Gem className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-heading text-xl font-bold text-neutral-900">GEM BOT</span>
            <p className="text-xs text-neutral-500">Admin Panel</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onItemClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`
            }
            data-testid={`admin-nav-${item.label.toLowerCase().replace(' ', '-')}`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-neutral-100">
        <Button
          variant="ghost"
          className="w-full justify-start text-neutral-600 hover:text-red-600 hover:bg-red-50"
          onClick={handleLogout}
          data-testid="admin-logout-btn"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-neutral-100 z-40">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-neutral-100 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Gem className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-heading text-lg font-bold text-neutral-900">GEM BOT</span>
            <span className="text-xs text-neutral-500 ml-2">Admin</span>
          </div>
        </div>
        
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="admin-mobile-menu-btn">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <NavContent onItemClick={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
