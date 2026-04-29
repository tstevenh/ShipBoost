const AUTH_ROUTE_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
] as const;

const PRIVATE_ROUTE_PREFIXES = [
  "/admin",
  "/dashboard",
  "/submit",
  "/edit",
] as const;

export function isAuthRoutePathname(pathname: string | null | undefined) {
  if (!pathname) {
    return false;
  }

  return AUTH_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isPrivateRoutePathname(pathname: string | null | undefined) {
  if (!pathname) {
    return false;
  }

  if (isAuthRoutePathname(pathname)) {
    return true;
  }

  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
