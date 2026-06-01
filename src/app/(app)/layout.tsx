import { AppShell } from '@/components/layout/AppShell'
import { SupabaseSync } from '@/components/SupabaseSync'
import { UserSync } from '@/components/UserSync'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SupabaseSync />
      <UserSync />
      <OnboardingModal />
      <AppShell>{children}</AppShell>
    </>
  )
}
