import { Scissors, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { getActiveCatalog } from '@/features/catalog/queries';
import { formatRM } from '@/lib/money';

// Read-only catalog from the database. Adding to the ticket and payments are built in Phase 4.
export default async function TerminalPage() {
  const catalog = await getActiveCatalog();

  return (
    <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_400px]">
      <section className="flex flex-col gap-4 p-4">
        {catalog.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed bg-card">
            <EmptyState icon={Scissors} title="No services yet" description="Add services in Settings." />
          </div>
        ) : (
          catalog.map((category) => (
            <div key={category.id} className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">{category.name}</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                {category.items.map((item) => (
                  <div key={item.id} className="flex min-h-20 flex-col justify-between rounded-xl border bg-card p-3">
                    <span className="text-sm leading-snug font-medium">{item.name}</span>
                    <span className="text-sm font-semibold tabular-nums">{formatRM(item.priceSen)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
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
            <span className="text-2xl font-bold tabular-nums">{formatRM(0)}</span>
          </div>
          <Button variant="brand" size="xl" className="w-full" disabled>
            Charge
          </Button>
        </div>
      </aside>
    </div>
  );
}
