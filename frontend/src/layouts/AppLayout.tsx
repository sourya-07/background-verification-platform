import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

/**
 * Shell for authenticated screens. Left sidebar with primary nav, top
 * bar with the signed-in user + logout. The route content renders
 * inside the <main> via <Outlet />.
 */
export function AppLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen flex bg-primary-50">
      <aside className="w-64 shrink-0 bg-primary-900 text-primary-100 flex flex-col">
        <div className="px-6 py-5 border-b border-primary-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">BGV Platform</div>
              <div className="text-[10px] text-primary-400 tracking-wider">
                BACKGROUND VERIFICATION
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <SidebarLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>
            Dashboard
          </SidebarLink>
          <SidebarLink to="/candidates" icon={<Users className="h-4 w-4" />}>
            Candidates
          </SidebarLink>
        </nav>

        <div className="p-4 border-t border-primary-800">
          <div className="text-xs text-primary-400 mb-2">Signed in as</div>
          <div className="text-sm font-medium text-white truncate">
            {user?.name ?? "—"}
          </div>
          <div className="text-xs text-primary-400 truncate">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2
                       rounded-lg text-sm font-medium text-primary-100 hover:bg-primary-800
                       border border-primary-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SidebarLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-accent text-white"
            : "text-primary-300 hover:bg-primary-800 hover:text-white"
        }`
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}
