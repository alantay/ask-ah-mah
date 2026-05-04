import { render, screen, fireEvent } from "@testing-library/react";
import { ConversationItem } from "./ConversationItem";
import type { ConversationEntity } from "@/lib/conversations";

const baseConv: ConversationEntity = {
  id: "conv-1",
  userId: "user-1",
  title: "Sambal night",
  archived: false,
  createdAt: new Date("2026-05-04T10:00:00Z"),
  updatedAt: new Date("2026-05-04T11:00:00Z"),
  _count: { messages: 5 },
};

describe("ConversationItem", () => {
  it("renders active state with primary border", () => {
    const { container } = render(
      <ConversationItem conversation={baseConv} isActive={true} onClick={() => {}} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-primary");
  });

  it("renders inactive state without primary border", () => {
    const { container } = render(
      <ConversationItem conversation={baseConv} isActive={false} onClick={() => {}} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain("border-primary");
    expect(card.className).toContain("border-border");
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(
      <ConversationItem conversation={baseConv} isActive={false} onClick={onClick} />
    );
    fireEvent.click(screen.getByText("Sambal night"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows title and message count", () => {
    render(
      <ConversationItem conversation={baseConv} isActive={false} onClick={() => {}} />
    );
    expect(screen.getByText("Sambal night")).toBeInTheDocument();
    expect(screen.getByText("5 msg")).toBeInTheDocument();
  });

  it("falls back to generated title when title is null", () => {
    render(
      <ConversationItem
        conversation={{ ...baseConv, title: null }}
        isActive={false}
        onClick={() => {}}
      />
    );
    expect(screen.getByText(/kitchen/i)).toBeInTheDocument();
  });
});
