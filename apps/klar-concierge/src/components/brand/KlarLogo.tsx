import Image from "next/image";

/**
 * The exact official Klar Travels logo, as supplied.
 * Never recreate, redraw or restyle this asset.
 */
export function KlarLogo({ height = 36, priority = false }: { height?: number; priority?: boolean }) {
  const width = Math.round(height * (1320 / 624));
  return (
    <Image
      src="/brand/klar-logo.png"
      alt="Klar Travels"
      width={width}
      height={height}
      priority={priority}
      style={{ height, width: "auto" }}
    />
  );
}
