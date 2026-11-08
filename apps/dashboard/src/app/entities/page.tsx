import React from "react";
import { getEntitiesList } from "./actions";
import EntityDirectoryClient from "./EntityDirectoryClient";

export const dynamic = "force-dynamic";

export default async function EntitiesPage() {
  const initialEntities = await getEntitiesList({ category: "all" });

  return <EntityDirectoryClient initialEntities={initialEntities} />;
}