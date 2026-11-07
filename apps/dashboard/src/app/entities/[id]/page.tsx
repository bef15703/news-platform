import { getEntityForEditor } from "./actions";
import EntityEditorClient from "./EntityEditorClient";
import { notFound } from "next/navigation";

export default async function EntityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getEntityForEditor(id);

  if (!data) {
    notFound();
  }

  return <EntityEditorClient initialData={data} entityId={id} />;
}