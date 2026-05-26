export type UserRole = "admin" | "mantenedor" | "usuario" | string;

export const FULL_ACCESS_ROLES = ["admin", "mantenedor"];

function normalizeRole(role?: UserRole | null) {
  return (role ?? "").trim().toLowerCase();
}

export function canManage(role?: UserRole | null) {
  return FULL_ACCESS_ROLES.includes(normalizeRole(role));
}

export function canDelete(role?: UserRole | null) {
  return normalizeRole(role) === "admin";
}
