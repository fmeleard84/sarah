import { requireAccount } from "@/lib/session";
import { effectivePlan } from "@/lib/plans";
import { AppShell } from "@/components/AppShell";
import { PlansContent } from "@/components/PlansSheet";

export default async function Plans() {
  const { profile } = await requireAccount();
  return (
    <AppShell locale={profile.locale} firstName={profile.first_name}>
      <div className="pt-6">
        <PlansContent locale={profile.locale} current={effectivePlan(profile).id} />
      </div>
    </AppShell>
  );
}
