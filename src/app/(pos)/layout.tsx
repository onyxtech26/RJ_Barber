import { TopBar } from '@/features/shell/top-bar';

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
