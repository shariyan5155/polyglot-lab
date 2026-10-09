import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Privacy Policy — PolyGlot Code-Lab" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 2026">
      <p>
        PolyGlot Code-Lab sends the code you paste to the Google Gemini API so
        it can write an explanation or a bug report in the language you chose.
        That is the only thing we do with it.
      </p>
      <p>
        We do not persistently store, log, or sell your source code snippets or
        your session data to third parties. Nothing you paste is used to build
        a profile of you.
      </p>
      <p>
        Because snippets travel to a third-party API, please don&apos;t paste
        secrets such as API keys, passwords, or private customer data.
      </p>
    </LegalPage>
  );
}