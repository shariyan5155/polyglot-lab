import { LabClient } from "@/components/lab-client";

export const metadata = {
  title: "The Lab — PolyGlot Code-Lab",
  description: "Write, read and debug code in the language you think in.",
};

export default function LabPage() {
  return <LabClient />;
}
