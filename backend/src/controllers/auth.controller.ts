import { Request, Response } from "express";
import { loginUser, registerUser } from "../services/auth.service";
import {
  LoginInput,
  RegisterInput,
} from "../validations/auth.validation";

export async function register(req: Request, res: Response): Promise<void> {
  const input = req.body as RegisterInput;
  const user = await registerUser(input);
  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: { user },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;
  const result = await loginUser(input);
  res.status(200).json({
    success: true,
    message: "Signed in",
    data: result,
  });
}
