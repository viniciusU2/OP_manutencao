export type UserRole = "admin" | "mantenedor" | "operador" | "usuario" | string;

export const FULL_ACCESS_ROLES = ["admin", "mantenedor"];
export const OPERATIONAL_ACCESS_ROLES = ["admin", "mantenedor"];
// O operador (Centro de Operações) só trabalha com SI.
export const SI_ACCESS_ROLES = ["admin", "mantenedor", "operador"];
export const OPERATOR_MENU_PATHS = ["/si"];

function normalizeRole(role?: UserRole | null) {
  return (role ?? "").trim().toLowerCase();
}

export function isOperator(role?: UserRole | null) {
  return normalizeRole(role) === "operador";
}

export function canManage(role?: UserRole | null) {
  return FULL_ACCESS_ROLES.includes(normalizeRole(role));
}

export function canAccessOperational(role?: UserRole | null) {
  return OPERATIONAL_ACCESS_ROLES.includes(normalizeRole(role));
}

export function canDelete(role?: UserRole | null) {
  return normalizeRole(role) === "admin";
}
