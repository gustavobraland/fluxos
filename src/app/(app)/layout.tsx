import { AppShell } from '@/components/layout/AppShell'
import { SupabaseSync } from '@/components/SupabaseSync'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SupabaseSync />
      <AppShell>{children}</AppShell>
    </>
  )
}
