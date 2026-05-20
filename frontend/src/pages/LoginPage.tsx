import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, LogIn } from "lucide-react";

import { useAuthStore } from "../store/authStore";
import { login } from "../services/auth.service";
import { getErrorMessage } from "../utils/format";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const res = await login(values.email, values.password);
      setAuth(res.user, res.token);
      // Bounce to the page they were trying to access, if any.
      const dest =
        (location.state as { from?: { pathname?: string } } | null)?.from
          ?.pathname ?? "/dashboard";
      navigate(dest, { replace: true });
    } catch (err) {
      setSubmitError(getErrorMessage(err, "Unable to sign in"));
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-primary-900">Welcome back</h2>
      <p className="mt-1 text-sm text-primary-500">
        Sign in to access your verification dashboard.
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="input"
            {...register("email")}
          />
          {errors.email && (
            <p className="error-text">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="label">Password</label>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="input"
            {...register("password")}
          />
          {errors.password && (
            <p className="error-text">{errors.password.message}</p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-primary-600">
          <input type="checkbox" className="rounded" {...register("remember")} />
          Remember me on this device
        </label>

        {submitError && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          Sign in
        </button>
      </form>

      <p className="mt-6 text-sm text-primary-500 text-center">
        Don't have an account?{" "}
        <Link to="/register" className="text-accent font-medium hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
