import { Conversations } from "../Conversations";

export function ConversationsRail() {
  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 bg-muted paper border-r border-border overflow-hidden">
      <div className="flex flex-col p-4 h-full overflow-hidden">
        <Conversations />
      </div>
    </aside>
  );
}
