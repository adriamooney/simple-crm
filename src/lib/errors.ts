/**
 * Raised when a stored Google refresh token is no longer valid (e.g. Google
 * returns `invalid_grant`). The fix is always the same: reconnect the affected
 * account at /settings. Carrying the slot lets the UI point the user at the
 * right Connect button.
 */
export class ReconnectRequiredError extends Error {
  slot: 1 | 2 | null;

  constructor(slot: 1 | 2 | null, message?: string) {
    super(
      message ??
        `Google account ${slot ? `(slot ${slot}) ` : ""}needs reconnecting. Open /settings and click Connect.`,
    );
    this.name = "ReconnectRequiredError";
    this.slot = slot;
  }
}

/**
 * Detects the Google OAuth `invalid_grant` failure across the shapes googleapis
 * / gaxios can throw it in (thrown Error message, response body, or cause).
 */
export const isInvalidGrant = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const e = err as {
    message?: unknown;
    response?: { data?: { error?: unknown } };
    cause?: { message?: unknown };
  };

  if (e.response?.data?.error === "invalid_grant") return true;
  if (typeof e.message === "string" && e.message.includes("invalid_grant")) return true;
  if (typeof e.cause?.message === "string" && e.cause.message.includes("invalid_grant")) return true;
  return false;
};

/**
 * Runs a Google API call and rethrows an `invalid_grant` as a typed
 * ReconnectRequiredError tagged with the slot whose token failed.
 */
export const withReconnectGuard = async <T>(slot: 1 | 2, fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    if (isInvalidGrant(err)) throw new ReconnectRequiredError(slot);
    throw err;
  }
};
