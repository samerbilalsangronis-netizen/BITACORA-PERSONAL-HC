"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/Input";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: { transcript: string };
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function MarkdownEditor({ defaultValue = "" }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [tab, setTab] = useState<"escribir" | "vista">("escribir");
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const baseValueRef = useRef("");
  const finalTranscriptRef = useRef("");

  const voiceSupported = useSyncExternalStore(
    () => () => {},
    () => getSpeechRecognitionCtor() !== null,
    () => false
  );

  useEffect(() => () => recognitionRef.current?.stop(), []);

  function startListening() {
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) return;

    setVoiceError("");
    baseValueRef.current = value.trim() ? value.trimEnd() + " " : "";
    finalTranscriptRef.current = "";

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = navigator.language?.toLowerCase().startsWith("es") ? navigator.language : "es-ES";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript + " ";
        } else {
          interim += transcript;
        }
      }
      setValue(baseValueRef.current + finalTranscriptRef.current + interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech") return;
      setVoiceError(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Permiso de micrófono denegado."
          : "No se pudo reconocer la voz. Intenta de nuevo."
      );
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <div className="flex flex-1 gap-1 rounded-lg bg-surface-muted p-1 text-sm">
          {(["escribir", "vista"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-md py-1.5 font-medium transition-colors",
                tab === t ? "bg-surface border border-border text-foreground" : "text-muted"
              )}
            >
              {t === "escribir" ? "Escribir" : "Vista previa"}
            </button>
          ))}
        </div>
        {voiceSupported && tab === "escribir" && (
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            aria-pressed={listening}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              listening
                ? "border-danger/40 bg-danger/10 text-danger"
                : "border-border bg-surface text-foreground hover:bg-surface-muted"
            )}
          >
            {listening ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
                </span>
                Detener
              </>
            ) : (
              <>
                <Mic size={14} />
                Dictar
              </>
            )}
          </button>
        )}
      </div>

      {voiceError && <p className="mb-2 text-xs text-danger">{voiceError}</p>}

      {tab === "escribir" ? (
        <Textarea
          name="contenido"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={12}
          placeholder="Escribe con formato Markdown: **negrita**, _cursiva_, listas, etc. O dicta con el micrófono."
        />
      ) : (
        <div className="prose prose-sm max-w-none rounded-lg border border-border bg-surface px-4 py-3 text-foreground prose-headings:text-foreground prose-strong:text-foreground min-h-[18rem]">
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-muted">Nada que previsualizar todavía.</p>
          )}
          <input type="hidden" name="contenido" value={value} />
        </div>
      )}
    </div>
  );
}
