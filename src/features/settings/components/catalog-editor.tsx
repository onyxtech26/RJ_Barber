'use client';

import { useState, useTransition } from 'react';
import { EyeOff, Loader2, Package, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { ItemKind } from '@/lib/enums';
import { formatPercent, formatRM, parsePercent, parseRM } from '@/lib/money';
import { cn } from '@/lib/utils';
import { saveCatalogItem, saveCategory } from '../actions';
import type { CatalogForEdit } from '../queries';
import { Field } from './shop-settings-form';

type Category = CatalogForEdit[number];
type Item = Category['items'][number];
type ItemDraft = { item: Item | null; categoryId: string };

export function CatalogEditor({ catalog }: { catalog: CatalogForEdit }) {
  const [editingCategory, setEditingCategory] = useState<Category | 'new' | null>(null);
  const [editingItem, setEditingItem] = useState<ItemDraft | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Items are never deleted (old receipts refer to them) — hide them instead.
        </p>
        <Button variant="outline" size="lg" className="h-11" onClick={() => setEditingCategory('new')}>
          <Plus />
          New category
        </Button>
      </div>

      {catalog.map((category) => (
        <section key={category.id} className={cn('overflow-hidden rounded-xl border bg-card', !category.isActive && 'opacity-60')}>
          <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
            <h2 className="flex items-center gap-2 font-semibold">
              {category.name}
              {!category.isActive && <HiddenTag />}
            </h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="lg" className="h-9" onClick={() => setEditingCategory(category)}>
                <Pencil />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="h-9"
                onClick={() => setEditingItem({ item: null, categoryId: category.id })}
              >
                <Plus />
                Add item
              </Button>
            </div>
          </div>
          {category.items.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No items yet.</p>
          ) : (
            <ul className="divide-y">
              {category.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setEditingItem({ item, categoryId: category.id })}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-muted/50',
                      !item.isActive && 'text-muted-foreground'
                    )}
                    aria-label={`Edit ${item.name}`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {item.kind === 'product' && <Package className="size-4 shrink-0 text-muted-foreground" />}
                      <span className="truncate font-medium">{item.name}</span>
                      {!item.isActive && <HiddenTag />}
                    </span>
                    <span className="flex shrink-0 items-center gap-3 text-sm">
                      {item.commissionBps !== null && (
                        <span className="text-muted-foreground">{formatPercent(item.commissionBps)}% commission</span>
                      )}
                      <span className="font-semibold tabular-nums">{formatRM(item.priceSen)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {editingCategory && (
        <CategoryDialog
          category={editingCategory === 'new' ? null : editingCategory}
          nextSortOrder={catalog.length}
          onClose={() => setEditingCategory(null)}
        />
      )}
      {editingItem && (
        <ItemDialog draft={editingItem} categories={catalog} onClose={() => setEditingItem(null)} />
      )}
    </div>
  );
}

function HiddenTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <EyeOff className="size-3" />
      Hidden
    </span>
  );
}

function CategoryDialog({ category, nextSortOrder, onClose }: { category: Category | null; nextSortOrder: number; onClose: () => void }) {
  const [name, setName] = useState(category?.name ?? '');
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const result = await saveCategory({
                id: category?.id ?? null,
                name,
                isActive,
                sortOrder: category?.sortOrder ?? nextSortOrder,
              });
              if (!result.ok) return void toast.error(result.error);
              toast.success('Category saved');
              onClose();
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>{category ? 'Edit category' : 'New category'}</DialogTitle>
          </DialogHeader>
          <Field label="Name" htmlFor="category-name">
            <Input id="category-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus required />
          </Field>
          {category && (
            <label className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <span className="text-sm font-medium">Show on the terminal</span>
            </label>
          )}
          <DialogFooter>
            <Button type="submit" variant="brand" size="lg" className="h-11" disabled={isPending || !name.trim()}>
              {isPending && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ItemDialog({ draft, categories, onClose }: { draft: ItemDraft; categories: CatalogForEdit; onClose: () => void }) {
  const { item } = draft;
  const [name, setName] = useState(item?.name ?? '');
  const [categoryId, setCategoryId] = useState(draft.categoryId);
  const [kind, setKind] = useState<ItemKind>(item?.kind ?? 'service');
  const [price, setPrice] = useState(item ? (item.priceSen / 100).toFixed(2) : '');
  const [commission, setCommission] = useState(item?.commissionBps != null ? formatPercent(item.commissionBps) : '');
  const [isActive, setIsActive] = useState(item?.isActive ?? true);
  const [isPending, startTransition] = useTransition();

  const priceSen = parseRM(price);
  const commissionBps = commission.trim() === '' ? null : parsePercent(commission);
  const commissionInvalid = commission.trim() !== '' && commissionBps === null;
  const canSave = name.trim() !== '' && priceSen !== null && !commissionInvalid && !isPending;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSave) return;
            startTransition(async () => {
              const result = await saveCatalogItem({
                id: item?.id ?? null,
                categoryId,
                name,
                kind,
                priceSen: priceSen!,
                commissionBps,
                isActive,
                sortOrder: item?.sortOrder ?? categories.find((c) => c.id === categoryId)?.items.length ?? 0,
              });
              if (!result.ok) return void toast.error(result.error);
              toast.success(`${name.trim()} saved`);
              onClose();
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>{item ? `Edit ${item.name}` : 'New item'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(['service', 'product'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn('h-9 rounded-md text-sm font-medium', kind === k ? 'bg-card shadow-sm' : 'text-muted-foreground')}
              >
                {k === 'service' ? 'Service' : 'Product'}
              </button>
            ))}
          </div>

          <Field label="Name" htmlFor="item-name">
            <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoFocus required />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (RM)" htmlFor="item-price" error={price && priceSen === null ? 'e.g. 25 or 25.50' : null}>
              <Input id="item-price" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" required />
            </Field>
            <Field label="Category" htmlFor="item-category">
              <select
                id="item-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-8 rounded-lg border bg-background px-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field
            label="Commission override (%)"
            htmlFor="item-commission"
            error={commissionInvalid ? 'Enter a percentage between 0 and 100, or leave empty' : null}
          >
            <Input
              id="item-commission"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              inputMode="decimal"
              placeholder={kind === 'service' ? 'Empty = use the barber’s rate' : 'Empty = no commission'}
            />
          </Field>

          <label className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <span className="text-sm font-medium">Show on the terminal</span>
          </label>

          <DialogFooter>
            <Button type="submit" variant="brand" size="lg" className="h-11" disabled={!canSave}>
              {isPending && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
