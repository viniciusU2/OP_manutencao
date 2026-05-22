export type UserRole = "admin" | "mantenedor" | "usuario" | string;

export const FULL_ACCESS_ROLES = ["admin", "mantenedor"];

export function canManage(role?: UserRole | null) {
  return !!role && FULL_ACCESS_ROLES.includes(role);
}

export function canDelete(role?: UserRole | null) {
  return role === "admin";
}
