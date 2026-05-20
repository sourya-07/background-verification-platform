import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";

import { register as registerUser } from "../services/auth.service";
import { getErrorMessage } from "../utils/format";

// Custom refinement enforces password match. The error attaches to the
// confirm field so RHF can render it next to the right input.
const schema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      await registerUser(values.name, values.email, values.password);
      navigate("/login", {
        replace: true,
        state: { justRegistered: true },
      });
    } catch (err) {
      setSubmitError(getErrorMessage(err, "Unable to create account"));
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-primary-900">Create your account</h2>
      <p className="mt-1 text-sm text-primary-500">
        Spin up a new BGV workspace in under a minute.
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label className="label">Full name</label>
          <input
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            className="input"
            {...register("name")}
          />
          {errors.name && <p className="error-text">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="input"
            {...register("email")}
          />
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Password</label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="input"
            {...register("password")}
          />
          {errors.password && (
            <p className="error-text">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="label">Confirm password</label>
          <input
            type="password"
            autoComplete="new-password"
            className="input"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="error-text">{errors.confirmPassword.message}</p>
          )}
        </div>

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
            <UserPlus className="h-4 w-4" />
          )}
          Create account
        </button>
      </form>

      <p className="mt-6 text-sm text-primary-500 text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-accent font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
