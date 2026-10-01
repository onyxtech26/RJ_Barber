import { CatalogEditor } from '@/features/settings/components/catalog-editor';
import { getCatalogForEdit } from '@/features/settings/queries';

export default async function CatalogSettingsPage() {
  const catalog = await getCatalogForEdit();
  return <CatalogEditor catalog={catalog} />;
}
