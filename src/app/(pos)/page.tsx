import { Terminal } from '@/features/pos/components/terminal';
import { getTerminalData } from '@/features/pos/queries';

export default async function TerminalPage() {
  const data = await getTerminalData();
  return <Terminal data={data} />;
}
