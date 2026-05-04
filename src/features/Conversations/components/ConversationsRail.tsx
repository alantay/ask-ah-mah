import { Conversations } from "../Conversations";

export function ConversationsRail() {
  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 bg-muted paper border-r border-border overflow-hidden">
      <div className="flex flex-col gap-3 p-4 overflow-y-auto h-full">
        <Conversations />
      </div>
    </aside>
  );
}
