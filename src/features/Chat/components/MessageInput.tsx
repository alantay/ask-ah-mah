import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

export const MessageInput = ({
  onSendMessage,
  disabled,
}: MessageInputProps) => {
  const [input, setInput] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (input.trim()) {
          await onSendMessage(input); // Save user message
          setInput("");
        }
      }}
      className=" p-4"
    >
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          placeholder={
            disabled ? `Sending your question...` : `Ask Ah Mah a question...`
          }
          className="flex-1"
        />
        <Button
          type="submit"
          aria-label="Send message"
          className="disabled:cursor-not-allowed"
          disabled={disabled}
        >
          <svg
            aria-hidden="true"
            focusable="false"
            width="24"
            height="24"
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
    </form>
  );
};
