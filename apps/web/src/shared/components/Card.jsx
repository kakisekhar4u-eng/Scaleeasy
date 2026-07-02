// apps/web/src/shared/components/Card.jsx
// Base wrapper for every list item across all modules (Ch.10).
// TODO: implement — see handbook Ch.10 "Reusable Components".
export default function Card({ children }) {
  return <div className="rounded-lg border border-gray-200 p-4">{children}</div>;
}
