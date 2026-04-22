"use client";

import { useEffect, useMemo, useState } from "react";

import type { Contact } from "@/types/crm";

const match = (value: string, query: string): boolean =>
  value.toLowerCase().includes(query.toLowerCase());

export function CrmDashboard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");

  const loadContacts = async () => {
    const response = await fetch("/api/contacts");
    const data = (await response.json()) as { contacts?: Contact[] };
    setContacts(data.contacts ?? []);
  };

  useEffect(() => {
    void (async () => {
      await loadContacts();
      setLoading(false);
    })();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncErrors([]);
    try {
      const response = await fetch("/api/sync/manual", { method: "POST" });
      const data = (await response.json()) as { synced?: number; failed?: number; errors?: string[] };
      setSyncResult(`Synced ${data.synced ?? 0} contacts${data.failed ? `, ${data.failed} failed` : ""}.`);
      setSyncErrors(data.errors ?? []);
      await loadContacts();
    } catch {
      setSyncResult("Sync failed. Check the console for details.");
    } finally {
      setSyncing(false);
    }
  };

  const stages = useMemo(
    () => Array.from(new Set(contacts.map((c) => c.stage).filter(Boolean))).sort(),
    [contacts],
  );

  const companies = useMemo(
    () => Array.from(new Set(contacts.map((c) => c.company).filter(Boolean))).sort(),
    [contacts],
  );

  const filtered = useMemo(
    () =>
      contacts.filter((contact) => {
        const queryMatch =
          !query ||
          [
            contact.name,
            contact.email,
            contact.phone,
            contact.website,
            contact.company,
            contact.summary,
            contact.snippet,
          ].some((field) =>
            match(field ?? "", query),
          );
        const stageMatch = !stageFilter || contact.stage === stageFilter;
        const companyMatch = !companyFilter || contact.company === companyFilter;
        return queryMatch && stageMatch && companyMatch;
      }),
    [companyFilter, contacts, query, stageFilter],
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Simple CRM</h1>
        <div className="flex items-center gap-3">
          {syncResult && <span className="text-sm text-zinc-500">{syncResult}</span>}
          <button
            onClick={() => void handleSync()}
            disabled={syncing}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      </div>

      {syncErrors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p className="font-medium mb-1">Sync errors:</p>
          <ul className="list-disc pl-4 space-y-1">
            {syncErrors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-3">
        <input
          className="rounded-md border border-zinc-300 px-3 py-2"
          placeholder="Search contacts, summary, snippet..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="rounded-md border border-zinc-300 px-3 py-2"
          value={stageFilter}
          onChange={(event) => setStageFilter(event.target.value)}
        >
          <option value="">All stages</option>
          {stages.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-zinc-300 px-3 py-2"
          value={companyFilter}
          onChange={(event) => setCompanyFilter(event.target.value)}
        >
          <option value="">All companies</option>
          {companies.map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>
      </section>

      {loading ? (
        <p className="text-zinc-600">Loading contacts...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-100">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Website</th>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Stage</th>
                <th className="px-3 py-2">Days Since Response</th>
                <th className="px-3 py-2">Summary</th>
                <th className="px-3 py-2">Snippet</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => (
                <tr key={`${contact.email}-${contact.rowNumber}`} className="border-t border-zinc-200">
                  <td className="px-3 py-2">{contact.name}</td>
                  <td className="px-3 py-2">{contact.email}</td>
                  <td className="px-3 py-2">{contact.phone}</td>
                  <td className="px-3 py-2">
                    {contact.website ? (
                      <a
                        className="text-blue-600 underline"
                        href={
                          contact.website.startsWith("http")
                            ? contact.website
                            : `https://${contact.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {contact.website}
                      </a>
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="px-3 py-2">{contact.company}</td>
                  <td className="px-3 py-2">{contact.stage}</td>
                  <td className="px-3 py-2">{contact.daysSinceResponse}</td>
                  <td className="max-w-sm px-3 py-2">{contact.summary}</td>
                  <td className="max-w-sm px-3 py-2 text-zinc-600">{contact.snippet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
