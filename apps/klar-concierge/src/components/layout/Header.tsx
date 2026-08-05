import Link from "next/link";
import { KlarLogo } from "@/components/brand/KlarLogo";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Klar Concierge home">
          <KlarLogo height={30} priority />
          <span className="hidden text-sm font-semibold tracking-wide text-brand sm:inline">
            Concierge
          </span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <Link href="/concierge" className="btn-quiet">Plan a Holiday</Link>
          <Link href="/concierge/discover" className="btn-quiet">Discover</Link>
          <Link href="/concierge/how-it-works" className="btn-quiet">How It Works</Link>
        </nav>
        <Link href="/concierge" className="btn-primary whitespace-nowrap px-5 text-sm">
          Plan My Holiday
        </Link>
      </div>
    </header>
  );
}
