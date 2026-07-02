type CachedAuthContext = {
  userId: string;
  organizationId: string;
  clerkOrgId: string;
  role: "admin" | "member";
};

const AUTH_CACHE_TTL_MS = 15 * 60 * 1000;

type CacheEntry = {
  ctx: CachedAuthContext;
  expiresAt: number;
};

const authCache = new Map<string, CacheEntry>();

function cacheKey(clerkUserId: string, clerkOrgId: string) {
  return `${clerkUserId}:${clerkOrgId}`;
}

export function getCachedAuthContext(
  clerkUserId: string,
  clerkOrgId: string,
  { allowStale = false }: { allowStale?: boolean } = {},
): CachedAuthContext | null {
  const entry = authCache.get(cacheKey(clerkUserId, clerkOrgId));
  if (!entry) return null;
  if (!allowStale && entry.expiresAt < Date.now()) {
    authCache.delete(cacheKey(clerkUserId, clerkOrgId));
    return null;
  }
  return entry.ctx;
}

export function setCachedAuthContext(
  clerkUserId: string,
  clerkOrgId: string,
  ctx: CachedAuthContext,
) {
  authCache.set(cacheKey(clerkUserId, clerkOrgId), {
    ctx,
    expiresAt: Date.now() + AUTH_CACHE_TTL_MS,
  });
}
