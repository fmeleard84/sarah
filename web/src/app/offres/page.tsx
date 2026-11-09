import { requireAccount } from "@/lib/session";
import { effectivePlan } from "@/lib/plans";
import { AppShell } from "@/components/AppShell";
import { PlansContent } from "@/components/PlansSheet";
import { getDict } from "@/lib/texts";

export default async function Plans({ searchParams }: { searchParams: Promise<{ paiement?: string }> }) {
  const { profile } = await requireAccount();
  const { paiement } = await searchParams;
  const t = await getDict(profile.locale);
  return (
    <AppShell locale={profile.locale} firstName={profile.first_name}>
      <div className="pt-6">
        {paiement === "ok" && <p className="fade-up mb-6 bg-surface px-4 py-3 text-[14px]">{t.plans.paid}</p>}
        <PlansContent locale={profile.locale} current={effectivePlan(profile).id} />
      </div>
    </AppShell>
  );
}
