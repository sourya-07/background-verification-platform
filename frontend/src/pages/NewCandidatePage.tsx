import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";

import { createCandidate } from "../services/candidate.service";
import {
  AADHAAR_REGEX,
  PAN_REGEX,
  PHONE_REGEX,
} from "../utils/constants";
import { getErrorMessage } from "../utils/format";

// Matches backend rules exactly. We toUpperCase the PAN before submit so
// the user can type lowercase without triggering a validation error.
const schema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().regex(PHONE_REGEX, "Phone must be exactly 10 digits"),
  aadhaarNumber: z
    .string()
    .regex(AADHAAR_REGEX, "Aadhaar must be exactly 12 digits"),
  panNumber: z
    .string()
    .transform((s) => s.toUpperCase())
    .pipe(z.string().regex(PAN_REGEX, "Invalid PAN (e.g. ABCDE1234F)")),
  dob: z.string().min(1, "Date of birth is required"),
  address: z.string().trim().min(1, "Address is required"),
});

type FormValues = z.infer<typeof schema>;

export function NewCandidatePage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const created = await createCandidate(values);
      navigate(`/candidates/${created.id}`);
    } catch (err) {
      setSubmitError(getErrorMessage(err, "Failed to create candidate"));
    }
  }

  return (
    <div>
      <Link
        to="/candidates"
        className="inline-flex items-center gap-2 text-sm text-primary-500 hover:text-primary-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to candidates
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-primary-900">New candidate</h1>
        <p className="text-sm text-primary-500 mt-1">
          Add the candidate's details. You can run verification after they're saved.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label">Full name</label>
            <input className="input" {...register("fullName")} />
            {errors.fullName && (
              <p className="error-text">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="label">Email</label>
            <input type="email" className="input" {...register("email")} />
            {errors.email && <p className="error-text">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Phone (10 digits)</label>
            <input
              inputMode="numeric"
              maxLength={10}
              className="input"
              {...register("phone")}
            />
            {errors.phone && <p className="error-text">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="label">Date of birth</label>
            <input type="date" className="input" {...register("dob")} />
            {errors.dob && <p className="error-text">{errors.dob.message}</p>}
          </div>

          <div>
            <label className="label">Aadhaar number (12 digits)</label>
            <input
              inputMode="numeric"
              maxLength={12}
              className="input font-mono"
              {...register("aadhaarNumber")}
            />
            {errors.aadhaarNumber && (
              <p className="error-text">{errors.aadhaarNumber.message}</p>
            )}
          </div>

          <div>
            <label className="label">PAN number</label>
            <input
              maxLength={10}
              className="input font-mono uppercase"
              {...register("panNumber")}
            />
            {errors.panNumber && (
              <p className="error-text">{errors.panNumber.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="label">Address</label>
          <textarea rows={3} className="input" {...register("address")} />
          {errors.address && (
            <p className="error-text">{errors.address.message}</p>
          )}
        </div>

        {submitError && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
            {submitError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-primary-100">
          <Link to="/candidates" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Save candidate
          </button>
        </div>
      </form>
    </div>
  );
}
