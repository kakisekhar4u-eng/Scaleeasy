import Link from "next/link";
import { KlarLogo } from "@/components/brand/KlarLogo";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/knowledge/destinations", label: "Knowledge" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/integrations/crm", label: "CRM" },
  { href: "/admin/readiness", label: "Readiness" },
  { href: "/admin/audit", label: "Audit" },
];

/**
 * The admin area ships without its own authentication — it is designed to sit
 * inside the klartravels portal, which controls who can reach these URLs.
 * Protect this path at the portal / reverse-proxy level.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-content items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" aria-label="Admin home">
              <KlarLogo height={24} />
            </Link>
            <span className="text-sm font-semibold text-brand">Admin</span>
          </div>
          <Link href="/" className="btn-quiet text-sm">View public site</Link>
        </div>
        <nav aria-label="Admin" className="mx-auto flex max-w-content gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="btn-quiet whitespace-nowrap text-sm">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-content px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
