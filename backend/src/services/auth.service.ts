import bcrypt from "bcryptjs";
import { prisma } from "../config/db";
import { signAuthToken } from "../utils/jwt";
import { Conflict, Unauthorized } from "../utils/httpError";
import { LoginInput, RegisterInput } from "../validations/auth.validation";

// 12 rounds is a reasonable balance between security and signup latency.
// On a modern laptop this works out to ~250ms per hash.
const BCRYPT_ROUNDS = 12;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

export async function registerUser(input: RegisterInput): Promise<PublicUser> {
  // Pre-check for clearer error messaging. Prisma would also reject this
  // with a unique-constraint error, but that's harder to surface cleanly.
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) {
    throw Conflict("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
    },
    select: { id: true, name: true, email: true },
  });

  return user;
}

export interface LoginResult {
  token: string;
  user: PublicUser;
}

export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  // We use the same error for "no such user" and "wrong password" on
  // purpose — anything else would let an attacker enumerate accounts.
  if (!user) throw Unauthorized("Invalid email or password");

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw Unauthorized("Invalid email or password");

  const token = signAuthToken({ userId: user.id, email: user.email });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email },
  };
}
