import { kv } from "@vercel/kv";

export type ConnectedGoogleAccount = {
  slot: 1 | 2;
  email: string;
  refreshToken: string;
  connectedAt: string;
};

const keyForSlot = (slot: 1 | 2) => `simple-crm:google:slot:${slot}`;

export async function getGoogleAccount(slot: 1 | 2): Promise<ConnectedGoogleAccount | null> {
  const value = await kv.get<ConnectedGoogleAccount>(keyForSlot(slot));
  return value ?? null;
}

export async function setGoogleAccount(account: ConnectedGoogleAccount): Promise<void> {
  await kv.set(keyForSlot(account.slot), account);
}

export async function clearGoogleAccount(slot: 1 | 2): Promise<void> {
  await kv.del(keyForSlot(slot));
}

export async function listGoogleAccounts(): Promise<ConnectedGoogleAccount[]> {
  const [a1, a2] = await Promise.all([getGoogleAccount(1), getGoogleAccount(2)]);
  return [a1, a2].filter(Boolean) as ConnectedGoogleAccount[];
}
