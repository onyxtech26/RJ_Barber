import { ShopSettingsForm } from '@/features/settings/components/shop-settings-form';
import { getShopSettingsForEdit } from '@/features/settings/queries';

export default async function ShopSettingsPage() {
  const settings = await getShopSettingsForEdit();
  return <ShopSettingsForm settings={settings} />;
}
