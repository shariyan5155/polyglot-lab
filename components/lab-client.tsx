"use client";

import dynamic from "next/dynamic";
import { LabSkeleton } from "@/components/lab-skeleton";

const Lab = dynamic(() => import("@/components/lab").then((mod) => mod.Lab), {
  ssr: false,
  loading: () => <LabSkeleton />,
});

export function LabClient() {
  return <Lab />;
}
