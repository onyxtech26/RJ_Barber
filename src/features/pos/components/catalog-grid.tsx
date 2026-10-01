'use client';

import { useMemo, useState } from 'react';
import { Package, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatRM } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { CatalogCategory } from '@/features/catalog/queries';

export type CatalogEntry = CatalogCategory['items'][number];

export function CatalogGrid({
  catalog,
  onAdd,
}: {
  catalog: CatalogCategory[];
  onAdd: (item: CatalogEntry) => void;
}) {
  const [categoryId, setCategoryId] = useState<string | 'all'>('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog
      .filter((c) => categoryId === 'all' || c.id === categoryId || q !== '')
      .map((c) => ({ ...c, items: q ? c.items.filter((i) => i.name.toLowerCase().includes(q)) : c.items }))
      .filter((c) => c.items.length > 0);
  }, [catalog, categoryId, query]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 border-b bg-background p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services and products"
            className="h-11 bg-card pr-10 pl-9 text-base"
            aria-label="Search catalog"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[{ id: 'all', name: 'All' }, ...catalog].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={cn(
                'h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors',
                categoryId === c.id && !query
                  ? 'bg-primary text-primary-foreground'
                  : 'border bg-card text-muted-foreground hover:text-foreground'
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {visible.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Nothing matches “{query}”.</p>}
        {visible.map((category) => (
          <section key={category.id} className="space-y-2">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{category.name}</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {category.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onAdd(item)}
                  aria-label={`Add ${item.name}, ${formatRM(item.priceSen)}`}
                  className="flex min-h-24 flex-col justify-between rounded-xl border bg-card p-3 text-left transition-all hover:border-foreground/25 hover:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.98] active:bg-accent"
                >
                  <span className="flex items-start gap-1.5 text-sm leading-snug font-medium">
                    {item.kind === 'product' && <Package className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />}
                    {item.name}
                  </span>
                  <span className="text-base font-semibold tabular-nums">{formatRM(item.priceSen)}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
