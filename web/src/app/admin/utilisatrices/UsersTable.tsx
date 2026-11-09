"use client";

import { useMemo, useState } from "react";
import { toast } from "@/components/Toast";
import type { PlanId } from "@/lib/plans";
import { setExtraCards, setUserAdmin, setUserPlan } from "../actions";

export interface UserRow {
  id: string;
  email: string;
  firstName: string | null;
  plan: PlanId;
  extraCards: number;
  isAdmin: boolean;
  locale: string;
  createdAt: string;
  lastSignIn: string | null;
  conversations: number;
  isMe: boolean;
}

const PLAN_NAMES: Record<PlanId, string> = { exploration: "Exploration", early: "Early adopter", intention: "Intention", ritual: "Ritual", clarity: "Clarity" };
const date = (s: string | null) => (s ? new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "jamais");

export function UsersTable({ rows }: { rows: UserRow[] }) {
  const [q, setQ] = useState("");
  const visible = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? rows.filter((r) => r.email.toLowerCase().includes(s) || (r.firstName ?? "").toLowerCase().includes(s)) : rows;
  }, [rows, q]);

  return (
    <>
      <input className="admin-input mt-8 max-w-sm" placeholder="Chercher un email ou un prénom" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-ink text-[11px] uppercase tracking-[0.14em] text-ink-3">
              <th className="py-3 pr-4 font-medium">Compte</th>
              <th className="py-3 pr-4 font-medium">Offre</th>
              <th className="py-3 pr-4 font-medium">Cartes en réserve</th>
              <th className="py-3 pr-4 font-medium">Conversations</th>
              <th className="py-3 pr-4 font-medium">Inscription</th>
              <th className="py-3 pr-4 font-medium">Dernière connexion</th>
              <th className="py-3 font-medium">Admin</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <Row key={r.id} row={r} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Row({ row }: { row: UserRow }) {
  const [plan, setPlan] = useState(row.plan);
  const [extra, setExtra] = useState(String(row.extraCards));
  const [admin, setAdmin] = useState(row.isAdmin);

  async function changePlan(p: PlanId) {
    const prev = plan;
    setPlan(p);
    const res = await setUserPlan(row.id, p);
    if (!res.ok) {
      setPlan(prev);
      return toast(res.error);
    }
    toast(`${row.email} : offre ${PLAN_NAMES[p]}.`);
  }

  async function saveExtra() {
    const n = Number(extra);
    if (!Number.isFinite(n) || n === row.extraCards) return;
    const res = await setExtraCards(row.id, n);
    toast(res.ok ? `${row.email} : ${n} carte${n > 1 ? "s" : ""} en réserve.` : res.error);
  }

  async function toggleAdmin(v: boolean) {
    if (v && !confirm(`Donner l'accès à l'administration à ${row.email} ?`)) return;
    setAdmin(v);
    const res = await setUserAdmin(row.id, v);
    if (!res.ok) {
      setAdmin(!v);
      return toast(res.error);
    }
    toast(v ? `${row.email} a maintenant accès à l'admin.` : `${row.email} n'a plus accès à l'admin.`);
  }

  return (
    <tr className="border-b border-rule align-middle">
      <td className="py-3 pr-4">
        <p className="text-ink">{row.firstName || "Sans prénom"}</p>
        <p className="text-[12px] text-ink-3">
          {row.email} · {row.locale.toUpperCase()}
        </p>
      </td>
      <td className="py-3 pr-4">
        <select className="admin-input w-36 py-1.5" value={plan} onChange={(e) => changePlan(e.target.value as PlanId)}>
          {(Object.keys(PLAN_NAMES) as PlanId[]).map((p) => (
            <option key={p} value={p}>
              {PLAN_NAMES[p]}
            </option>
          ))}
        </select>
      </td>
      <td className="py-3 pr-4">
        <input
          type="number"
          min={0}
          className="admin-input w-20 py-1.5"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          onBlur={saveExtra}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
      </td>
      <td className="py-3 pr-4 tabular-nums">{row.conversations}</td>
      <td className="py-3 pr-4 text-ink-2">{date(row.createdAt)}</td>
      <td className="py-3 pr-4 text-ink-2">{date(row.lastSignIn)}</td>
      <td className="py-3">
        <input type="checkbox" className="accent-[#558BBB]" checked={admin} disabled={row.isMe} onChange={(e) => toggleAdmin(e.target.checked)} />
      </td>
    </tr>
  );
}
