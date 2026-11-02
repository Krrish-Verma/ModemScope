import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { RunView } from "@/components/RunView";

export const metadata: Metadata = { title: "Experiment results" };

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <main className="app-page"><Nav /><RunView id={id} /></main>;
}
