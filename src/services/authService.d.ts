export function loginUser(email: string, password: string): Promise<{ token: string; uuid: string }>;
export function signupUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
): Promise<{ uuid: string; [key: string]: unknown }>;
export function getUserById(uuid: string): Promise<unknown>;
export function logoutUser(): void;
export function getCurrentUserId(): string | null;
export function getCurrentToken(): string | null;
export function isLoggedIn(): boolean;
