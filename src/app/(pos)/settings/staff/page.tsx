import { StaffEditor } from '@/features/settings/components/staff-editor';
import { getStaffForEdit } from '@/features/settings/queries';

export default async function StaffSettingsPage() {
  const { me, rows } = await getStaffForEdit();
  return <StaffEditor rows={rows} me={me} />;
}
