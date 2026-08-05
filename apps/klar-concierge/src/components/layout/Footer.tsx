import Link from "next/link";
import { KlarLogo } from "@/components/brand/KlarLogo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-content flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3">
          <KlarLogo height={26} />
          <p className="max-w-md text-sm text-foreground/70">
            AI-assisted holiday planning, finished by real Klar travel experts.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/concierge" className="text-brand hover:underline">Plan a Holiday</Link>
          <Link href="/concierge/discover" className="text-brand hover:underline">Discover</Link>
          <Link href="/concierge/how-it-works" className="text-brand hover:underline">How It Works</Link>
          <Link href="/privacy" className="text-brand hover:underline">Privacy</Link>
          <Link href="/terms" className="text-brand hover:underline">Terms</Link>
        </nav>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-foreground/50">
        © {new Date().getFullYear()} Klar Travels. Klar Concierge prepares your plan — a Klar
        travel expert confirms every detail before anything is booked.
      </div>
    </footer>
  );
}
