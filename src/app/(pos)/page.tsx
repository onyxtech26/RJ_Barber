import { Scissors, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';

// Layout shell only — the catalog, ticket and payment flow are built in Phase 4.
export default function TerminalPage() {
  return (
    <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_400px]">
      <section className="flex flex-col gap-4 p-4">
        <div className="flex gap-2 overflow-x-auto">
          {['All', 'Haircuts', 'Beard & Shave', 'Packages', 'Products'].map((category, i) => (
            <span
              key={category}
              className={
                i === 0
                  ? 'rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'
                  : 'rounded-full border bg-card px-4 py-2 text-sm font-medium text-muted-foreground'
              }
            >
              {category}
            </span>
          ))}
        </div>
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed bg-card">
          <EmptyState
            icon={Scissors}
            title="Service catalog"
            description="Services and products will appear here once the database is connected."
          />
        </div>
      </section>

      <aside className="flex flex-col border-t bg-card lg:border-t-0 lg:border-l">
        <div className="border-b p-4">
          <h2 className="font-semibold">Current ticket</h2>
          <p className="text-sm text-muted-foreground">Walk-in customer</p>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <EmptyState icon={ShoppingCart} title="Ticket is empty" description="Tap a service to add it." />
        </div>
        <div className="space-y-3 border-t p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-2xl font-bold tabular-nums">RM 0.00</span>
          </div>
          <Button variant="brand" size="xl" className="w-full" disabled>
            Charge
          </Button>
        </div>
      </aside>
    </div>
  );
}
