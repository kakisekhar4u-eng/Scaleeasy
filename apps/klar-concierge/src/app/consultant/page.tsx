import Link from "next/link";
import { getDb } from "@/lib/db";
import { stageFromDb } from "@/lib/enums";

export const dynamic = "force-dynamic";

const STAGE_BADGE: Record<string, string> = {
  "new-enquiry": "bg-brand-soft text-brand",
  converted: "bg-success-soft text-success",
  lost: "bg-surface-muted text-foreground/50",
};

export default async function ConsultantDashboard() {
  const db = getDb();
  const [leads, newCount, highPriority, crmFailed, followUpsDue, converted, lost] =
    await Promise.all([
      db.lead.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          reference: true,
          customerName: true,
          selectedDestinationSlug: true,
          stage: true,
          priority: true,
          leadScore: true,
          crmStatus: true,
          consultantOwner: true,
          followUpDueAt: true,
          updatedAt: true,
        },
      }),
      db.lead.count({ where: { stage: "new_enquiry" } }),
      db.lead.count({ where: { priority: { in: ["high", "urgent"] }, stage: { notIn: ["converted", "lost"] } } }),
      db.lead.count({ where: { crmStatus: { in: ["failed", "manual_intervention"] } } }),
      db.lead.count({ where: { followUpDueAt: { lte: new Date() }, stage: { notIn: ["converted", "lost"] } } }),
      db.lead.count({ where: { stage: "converted" } }),
      db.lead.count({ where: { stage: "lost" } }),
    ]);

  const stats = [
    { label: "New leads", value: newCount },
    { label: "High priority", value: highPriority },
    { label: "CRM failures", value: crmFailed },
    { label: "Follow-ups due", value: followUpsDue },
    { label: "Converted", value: converted },
    { label: "Lost", value: lost },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand">Leads</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="card py-4 text-center">
            <p className="text-2xl font-bold text-brand">{s.value}</p>
            <p className="mt-1 text-xs text-foreground/60">{s.label}</p>
          </div>
        ))}
      </div>

      {leads.length === 0 ? (
        <div className="card mt-8 py-14 text-center text-foreground/60">
          <p className="font-medium text-brand">No leads yet</p>
          <p className="mt-1 text-sm">New enquiries from Klar Concierge will appear here.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-foreground/55">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">CRM</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const stage = stageFromDb(lead.stage);
                return (
                  <tr key={lead.id} className="border-b border-line last:border-0 hover:bg-surface-muted">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link href={`/consultant/leads/${lead.id}`} className="text-brand underline">
                        {lead.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{lead.customerName}</td>
                    <td className="px-4 py-3">{lead.selectedDestinationSlug ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${STAGE_BADGE[stage] ?? "bg-surface-muted text-foreground/70"}`}>
                        {stage}
                      </span>
                    </td>
                    <td className="px-4 py-3">{lead.priority}</td>
                    <td className="px-4 py-3">{lead.leadScore}</td>
                    <td className="px-4 py-3 text-xs">{lead.consultantOwner ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">{lead.crmStatus.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-xs text-foreground/55">
                      {lead.updatedAt.toISOString().slice(0, 10)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
