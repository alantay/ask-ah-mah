import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const defaultProps = {
  conversation: baseConv,
  isActive: false,
  onClick: () => {},
  onRename: jest.fn().mockResolvedValue(undefined),
  onDelete: jest.fn().mockResolvedValue(undefined),
  canDelete: true,
};

describe("ConversationItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders active state with butter bubble treatment", () => {
    const { container } = render(
      <ConversationItem {...defaultProps} isActive={true} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("bg-secondary");
    expect(card.className).toContain("border-[oklch(0.78_0.10_88)]");
  });

  it("renders inactive state with stripped chrome", () => {
    const { container } = render(
      <ConversationItem {...defaultProps} isActive={false} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain("bg-secondary");
    expect(card.className).toContain("bg-transparent");
    expect(card.className).toContain("border-transparent");
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(
      <ConversationItem {...defaultProps} onClick={onClick} />
    );
    fireEvent.click(screen.getByText("Sambal night"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows title", () => {
    render(<ConversationItem {...defaultProps} />);
    expect(screen.getByText("Sambal night")).toBeInTheDocument();
  });

  it("falls back to 'New chat' when title is null", () => {
    render(
      <ConversationItem
        {...defaultProps}
        conversation={{ ...baseConv, title: null }}
      />
    );
    expect(screen.getByText("New chat")).toBeInTheDocument();
  });

  it("renders title only — no snippet, count, or relative time", () => {
    render(
      <ConversationItem
        {...defaultProps}
        conversation={{ ...baseConv, lastMessageSnippet: "Here is a great recipe for you" }}
      />
    );
    expect(screen.queryByText(/Here is a great/)).not.toBeInTheDocument();
    expect(screen.queryByText(/msg/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
  });

  // --- New tests for hover-revealed rename/delete ---

  it("3-dot hidden at rest — actions container has opacity-0", () => {
    const { container } = render(
      <ConversationItem {...defaultProps} isActive={false} />
    );
    // The div wrapping ConversationItemMenu should have opacity-0
    const actionsDiv = container.querySelector('[class*="opacity-0"]');
    expect(actionsDiv).toBeInTheDocument();
  });

  it("Popover opens and shows Rename and Delete", async () => {
    render(<ConversationItem {...defaultProps} />);
    const trigger = screen.getByRole("button", { name: "Conversation actions" });
    fireEvent.click(trigger);
    expect(await screen.findByText("Rename")).toBeInTheDocument();
    expect(await screen.findByText("Delete")).toBeInTheDocument();
  });

  it("Rename enter commits — calls onRename with trimmed value", async () => {
    const onRename = jest.fn().mockResolvedValue(undefined);
    render(<ConversationItem {...defaultProps} onRename={onRename} />);

    // Open menu
    fireEvent.click(screen.getByRole("button", { name: "Conversation actions" }));
    // Click Rename
    fireEvent.click(await screen.findByText("Rename"));

    // Input should appear with current title
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();

    // Clear and type new value
    fireEvent.change(input, { target: { value: "  My new title  " } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(onRename).toHaveBeenCalledWith("My new title");
    });
  });

  it("Rename Esc cancels — onRename not called", async () => {
    const onRename = jest.fn().mockResolvedValue(undefined);
    render(<ConversationItem {...defaultProps} onRename={onRename} />);

    // Open menu
    fireEvent.click(screen.getByRole("button", { name: "Conversation actions" }));
    // Click Rename
    fireEvent.click(await screen.findByText("Rename"));

    // Input should appear
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Changed title" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onRename).not.toHaveBeenCalled();
    // Input should be gone
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("Delete disabled when canDelete=false", async () => {
    render(<ConversationItem {...defaultProps} canDelete={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Conversation actions" }));
    const deleteBtn = await screen.findByText("Delete");
    expect(deleteBtn.closest("button")).toBeDisabled();
  });

  it("Delete confirm calls onDelete", async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    render(<ConversationItem {...defaultProps} canDelete={true} onDelete={onDelete} />);

    // Open menu
    fireEvent.click(screen.getByRole("button", { name: "Conversation actions" }));
    // Click Delete in popover
    fireEvent.click(await screen.findByText("Delete"));

    // AlertDialog should appear — click the destructive action button
    const confirmBtn = await screen.findByRole("button", { name: "Delete" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });
});
