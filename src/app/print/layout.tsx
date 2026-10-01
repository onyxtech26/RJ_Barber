// Bare layout for printable pages: no top bar, white paper, black ink.
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-white text-black print:min-h-0">{children}</div>;
}
