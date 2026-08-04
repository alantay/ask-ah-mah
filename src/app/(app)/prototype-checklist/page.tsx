"use client";
// PROTOTYPE — throwaway route for wayfinder #478.
// Three variants of the multi-select checklist block, switchable via `?variant=`,
// mounted inside a realistic chat thread with the real app shell, real message
// components and the real composer. Delete this folder once the answer lands.

import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { MessageInput } from "@/features/Chat/components/MessageInput";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PrototypeSwitcher } from "./PrototypeSwitcher";
import { VariantA, sentenceA, name as nameA } from "./VariantA";
import { VariantB, sentenceB, name as nameB } from "./VariantB";
import { VariantC, sentenceC, name as nameC } from "./VariantC";
import { CHECKLIST, ahMahReply, deriveTickedNaive, listify } from "./data";

const VARIANTS = ["A", "B", "C"];
const NAMES: Record<string, string> = { A: nameA, B: nameB, C: nameC };
const SENTENCE: Record<string, (t: string[]) => string> = {
  A: sentenceA,
  B: sentenceB,
  C: sentenceC,
};

interface Turn {
  role: "user" | "assistant";
  text: string;
}

const OPENER: Turn[] = [
  { role: "user", text: "Feeling like something with soup tonight. What can I make?" },
];

function PrototypeChecklist() {
  const searchParams = useSearchParams();
  const variant = searchParams.get("variant") ?? "A";

  const [turns, setTurns] = useState<Turn[]>([]);
  const [answer, setAnswer] = useState<string[] | null>(null);
  const [abandoned, setAbandoned] = useState(false);
  const [sentText, setSentText] = useState<string | null>(null);
  const [seed, setSeed] = useState<{ text: string; nonce: number } | null>(null);

  const reset = () => {
    setTurns([]);
    setAnswer(null);
    setAbandoned(false);
    setSentText(null);
    setSeed(null);
  };

  // Block-driven submit (variants A and B): the block writes the user's turn.
  const submit = (ticked: string[]) => {
    const text = SENTENCE[variant](ticked);
    setAnswer(ticked);
    setSentText(text);
    setTurns(t => [
      ...t,
      { role: "user", text },
      { role: "assistant", text: ahMahReply(ticked.map(id => labelOf(id))) },
    ]);
  };

  // Composer-driven send. For A and B this is the escape hatch — the checklist
  // is abandoned. For C it is the ONLY path, so the ticked set has to be
  // recovered from the prose the user actually sent.
  const send = async (text: string) => {
    setSentText(text);
    if (answer !== null) {
      setTurns(t => [...t, { role: "user", text }]);
      return;
    }
    if (variant === "C") {
      const derived = deriveTickedNaive(CHECKLIST.rows, text);
      setAnswer(derived);
      setTurns([
        { role: "user", text },
        { role: "assistant", text: ahMahReply(derived.map(id => labelOf(id))) },
      ]);
      return;
    }
    setAbandoned(true);
    setTurns([
      { role: "user", text },
      {
        role: "assistant",
        text: "Okay lah, never mind the list — I go by what you told me.",
      },
    ]);
  };

  const Block = () => {
    if (variant === "B")
      return <VariantB answer={answer} abandoned={abandoned} onSubmit={submit} />;
    if (variant === "C")
      return (
        <VariantC
          answer={answer}
          abandoned={abandoned}
          onDraft={text => setSeed({ text, nonce: Date.now() })}
        />
      );
    return <VariantA answer={answer} abandoned={abandoned} onSubmit={submit} />;
  };

  return (
    <div className="flex flex-col h-full">
      <Conversation className="flex-1">
        <ConversationContent className="max-w-3xl mx-auto w-full">
          {OPENER.map((t, i) => (
            <Message key={`o${i}`} from={t.role} className="flex-col md:flex-row items-end">
              <MessageContent variant="flat">
                <Response mode="static">{t.text}</Response>
              </MessageContent>
            </Message>
          ))}

          {/* The assistant turn that carries the checklist block. */}
          <Message
            from="assistant"
            className="flex-col md:flex-row items-start md:flex-row-reverse"
          >
            <MessageContent variant="flat">
              <Response mode="static">
                Soup ah? Then Ah Mah got one in mind already.
              </Response>
              <hr className="border-t border-border my-3" />
              <Block />
            </MessageContent>
          </Message>

          {turns.map((t, i) => (
            <Message
              key={`t${i}`}
              from={t.role}
              className={`flex-col md:flex-row ${
                t.role === "user" ? "items-end" : "items-start md:flex-row-reverse"
              }`}
            >
              <MessageContent variant="flat">
                <Response mode="static">{t.text}</Response>
              </MessageContent>
            </Message>
          ))}

          {sentText !== null && <ReplayStrip sent={sentText} answer={answer} />}
        </ConversationContent>
      </Conversation>

      <MessageInput onSendMessage={send} disabled={false} seed={seed} />

      <PrototypeSwitcher
        variants={VARIANTS}
        names={NAMES}
        current={variant}
        onReset={reset}
      />
    </div>
  );
}

function labelOf(id: string): string {
  return CHECKLIST.rows.find(r => r.id === id)?.label ?? id;
}

// Instrumentation, not design. Runs today's `derivePickedId` rule (substring
// scan) over the message that actually landed in the thread, and compares it to
// what the user really ticked. Where these disagree, the replay path is lying.
function ReplayStrip({ sent, answer }: { sent: string; answer: string[] | null }) {
  const derived = deriveTickedNaive(CHECKLIST.rows, sent);
  const truth = answer ?? [];
  const wrong = CHECKLIST.rows.filter(
    r => derived.includes(r.id) !== truth.includes(r.id)
  );

  return (
    <div className="my-6 rounded-xl border border-dashed border-neutral-400 bg-neutral-900/5 p-4 font-mono text-xs leading-relaxed">
      <div className="font-bold uppercase tracking-wider mb-2 opacity-60">
        Prototype instrumentation — replay from message text
      </div>
      <div className="mb-1">
        sent: <span className="opacity-80">&ldquo;{sent}&rdquo;</span>
      </div>
      <div className="mb-1">
        truth (what was ticked):{" "}
        <span className="opacity-80">
          {truth.length ? listify(truth.map(labelOf)) : "— nothing —"}
        </span>
      </div>
      <div className="mb-1">
        derived (substring scan):{" "}
        <span className="opacity-80">
          {derived.length ? listify(derived.map(labelOf)) : "— nothing —"}
        </span>
      </div>
      {wrong.length > 0 ? (
        <div className="mt-2 font-bold text-red-600">
          ✗ replay disagrees on: {listify(wrong.map(r => r.label))} — a reload
          would show the wrong ticks.
        </div>
      ) : (
        <div className="mt-2 font-bold text-green-700">✓ replay matches</div>
      )}
      {truth.length === 0 && (
        <div className="mt-2 opacity-70">
          note: &ldquo;answered none&rdquo; and &ldquo;never answered&rdquo; both
          derive to nothing — from text alone they are indistinguishable, so
          &ldquo;confirmed absent&rdquo; cannot survive a reload.
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PrototypeChecklist />
    </Suspense>
  );
}
