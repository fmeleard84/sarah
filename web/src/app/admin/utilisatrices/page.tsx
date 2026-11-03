import { createServiceClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin";
import { UsersTable, type UserRow } from "./UsersTable";

export const dynamic = "force-dynamic";

/** Comptes créés (les sessions anonymes de l'onboarding sont comptées à part). */
export default async function AdminUsers() {
  const { user: me } = await requireAdmin();
  const db = createServiceClient();

  const users: { id: string; email?: string; created_at: string; last_sign_in_at?: string; is_anonymous?: boolean }[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 500 });
    if (error || !data.users.length) break;
    users.push(...data.users);
    if (data.users.length < 500) break;
  }

  const [{ data: profiles }, { data: convs }] = await Promise.all([
    db.from("profiles").select("id, first_name, plan, plan_started_at, extra_cards, is_admin, locale"),
    db.from("conversations").select("user_id"),
  ]);
  const prof = new Map((profiles ?? []).map((p) => [p.id, p]));
  const count = new Map<string, number>();
  (convs ?? []).forEach((c) => count.set(c.user_id, (count.get(c.user_id) ?? 0) + 1));

  const anonymous = users.filter((u) => u.is_anonymous).length;
  const rows: UserRow[] = users
    .filter((u) => !u.is_anonymous && prof.has(u.id))
    .map((u) => {
      const p = prof.get(u.id)!;
      return {
        id: u.id,
        email: u.email ?? "",
        firstName: p.first_name,
        plan: p.plan,
        extraCards: p.extra_cards,
        isAdmin: p.is_admin,
        locale: p.locale,
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at ?? null,
        conversations: count.get(u.id) ?? 0,
        isMe: u.id === me.id,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <h1 className="display text-[44px]">utilisatrices.</h1>
      <p className="mt-2 text-[14px] text-ink-2">
        {rows.length} compte{rows.length > 1 ? "s" : ""} · {anonymous} session{anonymous > 1 ? "s" : ""} anonyme{anonymous > 1 ? "s" : ""} (onboarding sans compte)
      </p>
      <UsersTable rows={rows} />
    </>
  );
}
