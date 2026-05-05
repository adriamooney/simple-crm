import Link from "next/link";

type StatusResponse = {
  accounts: { slot: 1 | 2; email: string; connectedAt: string }[];
};

async function getStatus(): Promise<StatusResponse> {
  const res = await fetch(`${process.env.APP_URL ?? "http://localhost:3000"}/api/oauth/google/status`, {
    cache: "no-store",
  });
  if (!res.ok) return { accounts: [] };
  return (await res.json()) as StatusResponse;
}

export default async function SettingsPage(props: PageProps<"/settings">) {
  const searchParams = await props.searchParams;
  const oauth = searchParams.oauth as string | undefined;
  const reason = searchParams.reason as string | undefined;
  const slot = searchParams.slot as string | undefined;

  const status = await getStatus();
  const bySlot = new Map(status.accounts.map((a) => [String(a.slot), a]));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Link className="text-blue-600 underline" href="/">
          Back to CRM
        </Link>
      </div>

      {oauth === "success" ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-green-800">
          Connected slot {slot}.
        </div>
      ) : null}
      {oauth === "error" ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-800">
          OAuth error: {reason}
        </div>
      ) : null}

      <section className="rounded-lg border border-zinc-200 p-4">
        <h2 className="mb-3 text-lg font-medium">Google Connections</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((n) => {
            const slotKey = String(n);
            const account = bySlot.get(slotKey);
            return (
              <div key={slotKey} className="rounded-md border border-zinc-200 p-4">
                <div className="mb-2 font-medium">Gmail slot {slotKey}</div>
                <div className="mb-3 text-sm text-zinc-700">
                  {account ? (
                    <>
                      Connected as <span className="font-medium">{account.email}</span>
                      <div className="text-xs text-zinc-500">Connected at {account.connectedAt}</div>
                    </>
                  ) : (
                    "Not connected"
                  )}
                </div>
                <a
                  className="inline-flex rounded-md bg-black px-3 py-2 text-sm font-medium text-white"
                  href={`/api/oauth/google/start?slot=${slotKey}`}
                >
                  {account ? "Reconnect" : "Connect"}
                </a>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-sm text-zinc-600">
          After connecting both slots, the hourly sync can run without manual refresh tokens.
        </p>
      </section>
    </main>
  );
}

