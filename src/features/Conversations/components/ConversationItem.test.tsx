import { render, screen, fireEvent } from "@testing-library/react";
import { ConversationItem } from "./ConversationItem";
import type { ConversationEntity } from "@/lib/conversations";

const baseConv: ConversationEntity = {
  id: "conv-1",
  userId: "user-1",
  title: "Sambal night",
  createdAt: new Date("2026-05-04T10:00:00Z"),
  updatedAt: new Date("2026-05-04T11:00:00Z"),
  _count: { messages: 5 },
};

describe("ConversationItem", () => {
  it("renders active state with butter bubble treatment", () => {
    const { container } = render(
      <ConversationItem conversation={baseConv} isActive={true} onClick={() => {}} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("bg-secondary");
    expect(card.className).toContain("border-[oklch(0.78_0.10_88)]");
  });

  it("renders inactive state with stripped chrome", () => {
    const { container } = render(
      <ConversationItem conversation={baseConv} isActive={false} onClick={() => {}} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain("bg-secondary");
    expect(card.className).toContain("bg-transparent");
    expect(card.className).toContain("border-transparent");
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(
      <ConversationItem conversation={baseConv} isActive={false} onClick={onClick} />
    );
    fireEvent.click(screen.getByText("Sambal night"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows title", () => {
    render(
      <ConversationItem conversation={baseConv} isActive={false} onClick={() => {}} />
    );
    expect(screen.getByText("Sambal night")).toBeInTheDocument();
  });

  it("falls back to 'New chat' when title is null", () => {
    render(
      <ConversationItem
        conversation={{ ...baseConv, title: null }}
        isActive={false}
        onClick={() => {}}
      />
    );
    expect(screen.getByText("New chat")).toBeInTheDocument();
  });

  it("renders title only — no snippet, count, or relative time", () => {
    render(
      <ConversationItem
        conversation={{ ...baseConv, lastMessageSnippet: "Here is a great recipe for you" }}
        isActive={false}
        onClick={() => {}}
      />
    );
    expect(screen.queryByText(/Here is a great/)).not.toBeInTheDocument();
    expect(screen.queryByText(/msg/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
  });
});
