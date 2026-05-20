import { api, unwrap, type ApiEnvelope } from "./api";
import type { AuthResponse, User } from "../types";

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post<ApiEnvelope<AuthResponse>>("/auth/login", {
    email,
    password,
  });
  return unwrap(data);
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const { data } = await api.post<ApiEnvelope<{ user: User }>>(
    "/auth/register",
    { name, email, password }
  );
  return unwrap(data).user;
}
