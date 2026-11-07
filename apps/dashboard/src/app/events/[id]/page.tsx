import { getEventForEditor } from "./actions";
import EventEditorClient from "./EventEditorClient";
import { notFound } from "next/navigation";

export default async function EventEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getEventForEditor(id);

  if (!data) {
    notFound();
  }

  return <EventEditorClient initialData={data} eventId={id} />;
}