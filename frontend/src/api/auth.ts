import { api } from "@/api/client";
import type { AuthResponse, User } from "@/types";

export function register(email: string, password: string, fullName?: string): Promise<AuthResponse> {
  return api.post<AuthResponse>("/auth/register", { email, password, full_name: fullName });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return api.post<AuthResponse>("/auth/login", { email, password });
}

export function me(): Promise<User> {
  return api.get<User>("/auth/me");
}
