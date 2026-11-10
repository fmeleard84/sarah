import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getConversation, getConversationCards, getMessages } from "@/lib/conversation";
import { listArcana } from "@/lib/decks";
import { Conversation } from "./Conversation";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile, isAnonymous } = await requireSession();
  const conv = await getConversation(id, user.id);
  if (!conv) notFound();

  const [cards, messages, arcana] = await Promise.all([getConversationCards(id), getMessages(id), listArcana()]);
  const locale = profile.locale;
  const names = Object.fromEntries(arcana.map((a) => [a.number, { numeral: a.numeral, name: locale === "en" ? a.name_en : a.name_fr }]));

  return (
    <Conversation
      id={id}
      locale={locale}
      isAnonymous={isAnonymous}
      initialCards={cards}
      initialMessages={messages}
      names={names}
      myDeck={conv.deck_id === null}
      createdAt={conv.created_at}
    />
  );
}
