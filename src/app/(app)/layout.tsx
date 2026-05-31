import { AppShell } from '@/components/layout/AppShell'
import { SupabaseSync } from '@/components/SupabaseSync'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SupabaseSync />
      <OnboardingModal />
      <AppShell>{children}</AppShell>
    </>
  )
}
