import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { KlarLogo } from "@/components/brand/KlarLogo";
import { LogoutButton } from "@/components/internal/LogoutButton";

export const dynamic = "force-dynamic";

export default async function ConsultantLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("consultant");
  if (!user) redirect("/login?next=/consultant");

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
          <div className="flex items-center gap-3 text-sm text-foreground/60">
            <span>{user.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-content px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
