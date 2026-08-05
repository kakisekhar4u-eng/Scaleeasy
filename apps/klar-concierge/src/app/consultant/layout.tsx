import Link from "next/link";
import { KlarLogo } from "@/components/brand/KlarLogo";

export const dynamic = "force-dynamic";

/**
 * The consultant workspace ships without its own authentication — it is
 * designed to sit inside the klartravels portal, which controls who can
 * reach these URLs. Protect this path at the portal / reverse-proxy level.
 */
export default function ConsultantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-content items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/consultant" aria-label="Consultant workspace home">
              <KlarLogo height={24} />
            </Link>
            <span className="text-sm font-semibold text-brand">Consultant Workspace</span>
          </div>
          <Link href="/" className="btn-quiet text-sm">View public site</Link>
        </div>
      </header>
      <main className="mx-auto max-w-content px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
