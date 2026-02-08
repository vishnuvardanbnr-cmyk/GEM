import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  TrendingUp, 
  Receipt, 
  User,
  LogOut,
  Menu,
  X,
  Gem
} from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/team", icon: Users, label: "Team" },
  { path: "/wallet", icon: Wallet, label: "Wallet" },
  { path: "/income", icon: TrendingUp, label: "Income" },
  { path: "/transactions", icon: Receipt, label: "Transactions" },
  { path: "/profile", icon: User, label: "Profile" },
];

const mobileNavItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/income", icon: TrendingUp, label: "Income" },
  { path: "/wallet", icon: Wallet, label: "Wallet" },
  { path: "/transactions", icon: Receipt, label: "History" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function UserLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("gembot_token");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-neutral-100 z-40">
        <div className="p-6 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Gem className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-neutral-900">GEM BOT</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-neutral-600 hover:bg-neutral-50"
                }`
              }
              data-testid={`nav-${item.label.toLowerCase()}`}
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
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-neutral-100 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Gem className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading text-lg font-bold text-neutral-900">GEM BOT</span>
        </div>
        
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="mobile-menu-btn">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <div className="p-6 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <span className="font-heading text-lg font-bold">Menu</span>
              </div>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-neutral-600 hover:bg-neutral-50"
                    }`
                  }
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
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0 pb-20 lg:pb-0">
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-neutral-100 z-50 h-16 flex justify-around items-center safe-area-bottom" data-testid="mobile-nav">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                isActive
                  ? "text-emerald-600"
                  : "text-neutral-400"
              }`
            }
            data-testid={`mobile-nav-${item.label.toLowerCase()}`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
