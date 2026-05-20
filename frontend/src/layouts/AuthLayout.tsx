import { Outlet } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

/**
 * Centered card layout used by login and register pages. The split-pane
 * branding panel on the left helps the auth screens not feel like an
 * unstyled HTML form.
 */
export function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-primary-50">
      <div className="hidden lg:flex flex-col justify-between bg-primary-900 text-white p-12">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className="text-lg font-bold">BGV Platform</span>
        </div>

        <div>
          <h1 className="text-3xl font-bold leading-tight">
            Run secure, verifiable background checks for every candidate you hire.
          </h1>
          <p className="mt-4 text-primary-300">
            Aadhaar + PAN verification, full audit trail, and professional PDF
            reports — all from a single dashboard.
          </p>
        </div>

        <div className="text-xs text-primary-400">
          &copy; {new Date().getFullYear()} BGV Platform
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
