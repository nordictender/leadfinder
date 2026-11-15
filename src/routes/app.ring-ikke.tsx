import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { extractCvrs } from "@/lib/csv";
import { addDoNotCall, removeDoNotCall, useStore } from "@/lib/store";

export const Route = createFileRoute("/app/ring-ikke")({ component: DoNotCallPage });

function DoNotCallPage() {
  const { doNotCall, lists } = useStore();
  const [text, setText] = useState("");
  const names = new Map(lists.flatMap((l) => l.leads.map((x) => [x.company.cvr, x.company.name] as const)));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ring ikke</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Virksomheder, der har frabedt sig opkald, eller som allerede er kunder. De sorteres fra i alle søgninger, ringelister og eksporter. Reklamebeskyttede virksomheder i CVR er altid udeladt og behøver ikke stå her.
        </p>
      </div>
      <div className="space-y-2">
        <Textarea rows={4} placeholder="Indsæt CVR-numre, fx en eksport af jeres eksisterende kunder" value={text} onChange={(e) => setText(e.target.value)} />
        <Button disabled={!extractCvrs(text).length} onClick={() => {
          const cvrs = extractCvrs(text);
          addDoNotCall(cvrs);
          setText("");
          toast.success(`${cvrs.length} tilføjet til ring-ikke-listen`);
        }}>
          Tilføj {extractCvrs(text).length || ""} CVR-numre
        </Button>
      </div>
      <ul className="divide-y rounded-lg border bg-card">
        {doNotCall.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Listen er tom.</li>}
        {doNotCall.map((cvr) => (
          <li key={cvr} className="flex items-center gap-3 px-4 py-2">
            <span className="font-mono text-sm">{cvr}</span>
            <span className="truncate text-sm text-muted-foreground">{names.get(cvr)}</span>
            <Button variant="ghost" size="sm" className="ml-auto" aria-label={`Fjern ${cvr}`} onClick={() => removeDoNotCall(cvr)}>
              <X className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
