import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useId, useRef, useState } from "react";
import { AlertCircle, ImagePlus, LoaderCircle, X } from "lucide-react";
import { preparePhoto } from "../utils/preparePhoto";

interface MessageInputProps {
  onSendMessage: (message: string, photo?: string) => Promise<boolean | void>;
  disabled: boolean;
  // Overrides the form's default outer padding. Used by the first-run hero to
  // sit the composer flush with the opener cards instead of the bottom bar.
  className?: string;
}

export const MessageInput = ({
  onSendMessage,
  disabled,
  className,
}: MessageInputProps) => {
  const [input, setInput] = useState("");
  const [photo, setPhoto] = useState<string>();
  const [photoName, setPhotoName] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");
  const errorId = useId();
  const attachButton = useRef<HTMLButtonElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const canSend = !!(input.trim() || photo) && !disabled && !preparing;
  const photoButtonClassName = "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 transition-colors";
  const composerClassName = "max-w-5xl mx-auto rounded-xl border border-border/60 bg-muted/50 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/40";

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (canSend && !submitting.current) {
          submitting.current = true;
          try {
            const text = input.trim() ? input : "What can you tell me about this photo?";
            const sent = photo ? await onSendMessage(text, photo) : await onSendMessage(text);
            if (sent !== false) {
              setInput("");
              setPhoto(undefined);
              setPhotoName("");
              setError("");
            }
          } finally {
            submitting.current = false;
          }
        }
      }}
      className={cn("p-4", className)}
    >
      <input
        ref={fileInput}
        type="file"
        tabIndex={-1}
        accept="image/jpeg,image/png,image/webp"
        aria-label="Choose a photo"
        className="hidden"
        disabled={disabled || preparing}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setError("");
          setPreparing(true);
          try {
            setPhoto(await preparePhoto(file));
            setPhotoName(file.name);
          } catch (error) {
            setError(error instanceof Error ? error.message : "Couldn't prepare this photo. Try another one.");
          } finally {
            setPreparing(false);
          }
        }}
      />
      <div className={composerClassName}>
        {(photo || preparing) && (
          <div className="mx-3 flex items-center gap-3 border-b border-border/60 py-3" aria-busy={preparing}>
            {photo ? (
              // Inline JPEGs are already resized; Next Image adds no optimization.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Photo ready to send" width={64} height={64} className="size-16 shrink-0 rounded-lg bg-card object-contain" />
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <ImagePlus aria-hidden="true" className="size-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p role="status" className="text-sm font-medium">{preparing ? "Preparing photo…" : "Photo attached"}</p>
              <p className="truncate text-xs text-muted-foreground" title={photoName}>{preparing ? "Getting it ready to send" : photoName}</p>
            </div>
            {photo && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 rounded-lg text-muted-foreground"
                aria-label="Remove photo"
                disabled={disabled || preparing}
                onClick={() => {
                  setPhoto(undefined);
                  setPhotoName("");
                  setError("");
                  attachButton.current?.focus();
                }}
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            )}
          </div>
        )}
        <div className="flex items-center gap-1 px-3 py-1">
          <Input
            aria-label="Message Ah Mah"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            placeholder={disabled ? "Sending…" : "Ask Ah Mah…"}
            className="flex-1 border-none shadow-none bg-transparent focus-visible:ring-0 px-0"
          />
          <button
            ref={attachButton}
            type="button"
            aria-describedby={error ? errorId : undefined}
            aria-label={photo ? "Replace photo" : "Attach photo"}
            title={photo ? "Replace photo" : "Attach photo"}
            disabled={disabled || preparing}
            onClick={() => fileInput.current?.click()}
            className={cn(photoButtonClassName, photo && "bg-accent text-foreground")}
          >
            {preparing ? <LoaderCircle aria-hidden="true" className="size-5 motion-safe:animate-spin" /> : <ImagePlus aria-hidden="true" className="size-5" />}
          </button>
          <Button
            type="submit"
            size="icon"
            aria-label="Send message"
            variant={canSend ? "default" : "ghost"}
            className="shrink-0 disabled:cursor-not-allowed rounded-lg h-11 w-11"
            disabled={!canSend}
          >
            <svg
              aria-hidden="true"
              focusable="false"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.235 5.68609C20.667 4.49109 19.509 3.33309 18.314 3.76609L3.70904 9.04809C2.51004 9.48209 2.36504 11.1181 3.46804 11.7571L8.13004 14.4561L12.293 10.2931C12.4816 10.1109 12.7342 10.0101 12.9964 10.0124C13.2586 10.0147 13.5095 10.1199 13.6949 10.3053C13.8803 10.4907 13.9854 10.7415 13.9877 11.0037C13.99 11.2659 13.8892 11.5185 13.707 11.7071L9.54404 15.8701L12.244 20.5321C12.882 21.6351 14.518 21.4891 14.952 20.2911L20.235 5.68609Z"
                fill="currentColor"
              />
            </svg>
          </Button>
        </div>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mx-auto mt-2 flex max-w-5xl items-start gap-2 text-sm text-danger">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </form>
  );
};
