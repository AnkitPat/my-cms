import { redirect } from 'next/navigation';
import { cmsConfig } from '@/cms.config';

export default function RootPage() {
  redirect(`/${cmsConfig.workspaces[0].id}`);
}
