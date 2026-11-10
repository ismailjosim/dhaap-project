import { redirect } from "next/navigation";
import { NotesView } from "@/components/notes/notes-view";
import { connectDB } from "@/lib/db";
import { Note, Topic } from "@/lib/models";
import { getSessionUser } from "@/lib/server-auth";

export const metadata = {
  title: "Notes — Dhaap",
  description: "Topic-wise technical notes and architectural summaries.",
};

interface NotesPageProps {
  searchParams: Promise<{ topicId?: string }>;
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const { topicId } = await searchParams;

  await connectDB();

  const [notes, topics] = await Promise.all([
    Note.find({ userId: user.id }).sort({ updatedAt: -1 }).lean(),
    Topic.find({ userId: user.id }).sort({ orderIndex: 1 }).lean(),
  ]);

  return (
    <NotesView
      initialNotes={JSON.parse(JSON.stringify(notes))}
      topics={JSON.parse(JSON.stringify(topics))}
      selectedTopicId={topicId}
    />
  );
}
