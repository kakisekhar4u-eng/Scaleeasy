import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const records = await getDb().auditRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand">Audit log</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Recent internal actions. Personal data is masked before storage.
      </p>
      {records.length === 0 ? (
        <div className="card mt-8 py-14 text-center text-foreground/60">
          <p className="font-medium text-brand">No audit records yet</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-foreground/55">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 text-xs text-foreground/60">
                    {r.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                  </td>
                  <td className="px-4 py-2.5 text-xs">{r.actor}</td>
                  <td className="px-4 py-2.5">{r.action}</td>
                  <td className="px-4 py-2.5 text-xs">{r.entity ?? "—"} {r.entityId ?? ""}</td>
                  <td className="px-4 py-2.5 text-xs text-foreground/60">
                    {r.detail ? JSON.stringify(r.detail) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
