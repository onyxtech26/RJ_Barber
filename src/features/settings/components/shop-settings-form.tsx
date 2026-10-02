'use client';

import { useRef, useState, useTransition } from 'react';
import { ImageUp, Loader2, QrCode, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { formatPercent, parsePercent } from '@/lib/money';
import { removeDuitnowQr, updateShopSettings, uploadDuitnowQr } from '../actions';
import type { ShopSettingsForEdit } from '../queries';

export function ShopSettingsForm({ settings }: { settings: ShopSettingsForEdit }) {
  const [form, setForm] = useState({
    name: settings.name,
    address: settings.address ?? '',
    phone: settings.phone ?? '',
    receiptFooter: settings.receiptFooter ?? '',
    duitnowAccountName: settings.duitnowAccountName ?? '',
    sstEnabled: settings.sstEnabled,
    sstRate: formatPercent(settings.sstRateBps),
    sstRegNo: settings.sstRegNo ?? '',
    threshold: formatPercent(settings.discountApprovalThresholdBps),
  });
  const [isPending, startTransition] = useTransition();
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const sstRateBps = parsePercent(form.sstRate);
  const thresholdBps = parsePercent(form.threshold);

  return (
    <div className="space-y-6">
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (sstRateBps === null || thresholdBps === null) {
            toast.error('Check the percentage fields.');
            return;
          }
          startTransition(async () => {
            const result = await updateShopSettings({
              name: form.name,
              address: form.address,
              phone: form.phone,
              receiptFooter: form.receiptFooter,
              duitnowAccountName: form.duitnowAccountName,
              sstEnabled: form.sstEnabled,
              sstRateBps,
              sstRegNo: form.sstRegNo,
              discountApprovalThresholdBps: thresholdBps,
            });
            if (result.ok) toast.success('Settings saved');
            else toast.error(result.error);
          });
        }}
      >
        <Section title="Shop details" description="Shown on receipts.">
          <Field label="Shop name" htmlFor="shop-name">
            <Input id="shop-name" value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={80} required />
          </Field>
          <Field label="Address" htmlFor="shop-address">
            <Textarea id="shop-address" value={form.address} onChange={(e) => set('address', e.target.value)} maxLength={200} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" htmlFor="shop-phone">
              <Input id="shop-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} maxLength={30} />
            </Field>
            <Field label="Receipt footer" htmlFor="shop-footer">
              <Input
                id="shop-footer"
                value={form.receiptFooter}
                onChange={(e) => set('receiptFooter', e.target.value)}
                maxLength={200}
              />
            </Field>
          </div>
        </Section>

        <Section title="SST" description="Only turn on if the shop is registered for Service Tax.">
          <label className="flex items-center gap-3">
            <Switch checked={form.sstEnabled} onCheckedChange={(checked) => set('sstEnabled', checked)} />
            <span className="text-sm font-medium">Charge SST on sales</span>
          </label>
          {form.sstEnabled && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SST rate (%)" htmlFor="sst-rate" error={sstRateBps === null ? 'Enter a percentage, e.g. 8' : null}>
                <Input id="sst-rate" value={form.sstRate} onChange={(e) => set('sstRate', e.target.value)} inputMode="decimal" />
              </Field>
              <Field label="SST registration no." htmlFor="sst-reg">
                <Input id="sst-reg" value={form.sstRegNo} onChange={(e) => set('sstRegNo', e.target.value)} maxLength={40} />
              </Field>
            </div>
          )}
        </Section>

        <Section title="Discounts" description="Staff can give discounts up to this limit on their own. Above it, the owner’s PIN is needed.">
          <Field
            label="Limit without owner approval (%)"
            htmlFor="threshold"
            error={thresholdBps === null ? 'Enter a percentage between 0 and 100' : null}
          >
            <Input
              id="threshold"
              value={form.threshold}
              onChange={(e) => set('threshold', e.target.value)}
              inputMode="decimal"
              className="max-w-32"
            />
          </Field>
        </Section>

        <Section title="DuitNow" description="The name customers should see when they scan.">
          <Field label="Account name" htmlFor="duitnow-name">
            <Input
              id="duitnow-name"
              value={form.duitnowAccountName}
              onChange={(e) => set('duitnowAccountName', e.target.value)}
              maxLength={80}
              placeholder="e.g. RJ BARBER SALON"
            />
          </Field>
        </Section>

        <div className="flex justify-end">
          <Button type="submit" variant="brand" size="xl" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            Save settings
          </Button>
        </div>
      </form>

      <DuitnowQrCard hasQr={Boolean(settings.duitnowQrType)} />
    </div>
  );
}

function DuitnowQrCard({ hasQr }: { hasQr: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  // Bump after each upload so the <img> fetches the new file.
  const [version, setVersion] = useState(0);

  const upload = (file: File) => {
    const data = new FormData();
    data.set('file', file);
    startTransition(async () => {
      const result = await uploadDuitnowQr(data);
      if (result.ok) {
        toast.success('DuitNow QR updated');
        setVersion((v) => v + 1);
      } else {
        toast.error(result.error);
      }
      if (inputRef.current) inputRef.current.value = '';
    });
  };

  return (
    <Section title="DuitNow QR" description="Shown full-size on the payment screen. Use the shop’s static DuitNow QR from your bank app.">
      <div className="flex flex-wrap items-center gap-4">
        {hasQr ? (
          // eslint-disable-next-line @next/next/no-img-element -- served from the database behind auth
          <img
            src={`/duitnow-qr?v=${version}`}
            alt="Current DuitNow QR"
            className="size-40 rounded-xl border bg-white object-contain p-2"
          />
        ) : (
          <div className="flex size-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-muted-foreground">
            <QrCode className="size-8" />
            No QR yet
          </div>
        )}
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
            }}
          />
          <Button size="lg" className="h-11" disabled={isPending} onClick={() => inputRef.current?.click()}>
            {isPending ? <Loader2 className="animate-spin" /> : <ImageUp />}
            {hasQr ? 'Replace QR image' : 'Upload QR image'}
          </Button>
          {hasQr && (
            <Button
              variant="ghost"
              size="lg"
              className="h-11 text-destructive"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await removeDuitnowQr();
                  if (result.ok) toast.success('DuitNow QR removed');
                  else toast.error(result.error);
                })
              }
            >
              <Trash2 />
              Remove
            </Button>
          )}
          <p className="text-xs text-muted-foreground">PNG, JPEG or WebP, up to 4 MB.</p>
        </div>
      </div>
    </Section>
  );
}

export function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-4">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
