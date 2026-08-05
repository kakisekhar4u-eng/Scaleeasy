import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold text-brand">That page has wandered off</h1>
      <p className="mt-3 max-w-md text-foreground/65">
        The page you&rsquo;re looking for doesn&rsquo;t exist. Your holiday plans, however, are
        right where you left them.
      </p>
      <Link href="/" className="btn-primary mt-6">Back to Klar Concierge</Link>
    </div>
  );
}
