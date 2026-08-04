import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { UIMessage } from 'ai';
import { ChecklistBlock, buildReplyMessage } from './ChecklistBlock';

const data = {
  question: 'Do you have these for laksa?',
  deal: 'With all three I can give you the real thing; without, I can still do a coconut noodle soup.',
  rows: [
    { id: 'laksa-paste', label: 'Laksa paste', hint: 'shop-bought is fine', category: 'Condiments' as const },
    { id: 'coconut-milk', label: 'Coconut milk', category: 'Misc' as const },
    { id: 'rice-noodles', label: 'Thick rice noodles' },
  ],
};

const assistantMsg: UIMessage = { id: 'a0', role: 'assistant', parts: [] };

// The user's turn as the card itself writes it: sentence + hidden payload.
const userReply = (text: string): UIMessage => ({
  id: 'u1',
  role: 'user',
  parts: [{ type: 'text', text }],
});

const reply = (ticked: string[], absent: string[]) =>
  userReply(
    `whatever the sentence says\n\`\`\`checklist-reply\n${JSON.stringify({ ticked, absent })}\n\`\`\``
  );

const renderBlock = (props: Partial<React.ComponentProps<typeof ChecklistBlock>> = {}) =>
  render(
    <ChecklistBlock
      data={data}
      allMessages={[assistantMsg]}
      messageIndex={0}
      onSend={jest.fn()}
      onTicked={jest.fn()}
      {...props}
    />
  );

// The tick mark itself, not the row's border — the resting border already
// carries a `hover:border-primary/60`, so matching on the row would pass for
// every row whether ticked or not.
const isTicked = (label: string) =>
  /bg-primary/.test(
    screen
      .getByText(label)
      .closest('button')!
      .querySelector('span[aria-hidden]')!.className
  );

describe('ChecklistBlock', () => {
  it('renders the question, the deal, and each row (label + optional hint)', () => {
    renderBlock();
    expect(screen.getByText('Do you have these for laksa?')).toBeInTheDocument();
    expect(screen.getByText(/coconut noodle soup/)).toBeInTheDocument();
    expect(screen.getByText('Laksa paste')).toBeInTheDocument();
    expect(screen.getByText('shop-bought is fine')).toBeInTheDocument();
    expect(screen.getByText('Thick rice noodles')).toBeInTheDocument();
  });

  it('stages ticks without sending — the card is multi-select, not tap-to-send', () => {
    const onSend = jest.fn();
    renderBlock({ onSend });
    fireEvent.click(screen.getByText('Laksa paste'));
    fireEvent.click(screen.getByText('Coconut milk'));
    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByText('I have these 2')).toBeInTheDocument();
    // Every staged row is marked, not just the first — the count and the marks
    // must never disagree.
    expect(isTicked('Laksa paste')).toBe(true);
    expect(isTicked('Coconut milk')).toBe(true);
    expect(isTicked('Thick rice noodles')).toBe(false);
  });

  it('unticks a staged row on a second tap', () => {
    renderBlock();
    fireEvent.click(screen.getByText('Laksa paste'));
    expect(screen.getByText('I have this 1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Laksa paste'));
    expect(screen.getByText('Tell Ah Mah')).toBeInTheDocument();
  });

  it('rests on a neutral submit label and only sharpens once something is ticked', () => {
    renderBlock();
    // An untouched card must not shout a negative the user hasn't given.
    expect(screen.getByText('Tell Ah Mah')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Coconut milk'));
    expect(screen.getByText('I have this 1')).toBeInTheDocument();
  });

  it('says "all N" when every row is ticked', () => {
    renderBlock();
    data.rows.forEach(r => fireEvent.click(screen.getByText(r.label)));
    expect(screen.getByText('I have all 3')).toBeInTheDocument();
  });

  it('sends a sentence plus the reply fence, and reports the ticked rows for the Pantry', async () => {
    const onSend = jest.fn();
    const onTicked = jest.fn().mockResolvedValue(undefined);
    renderBlock({ onSend, onTicked });
    fireEvent.click(screen.getByText('Laksa paste'));
    fireEvent.click(screen.getByText('Coconut milk'));
    fireEvent.click(screen.getByText('I have these 2'));
    // The send now waits on the Pantry write.
    await waitFor(() => expect(onSend).toHaveBeenCalled());

    const sent = onSend.mock.calls[0][0] as string;
    expect(sent).toContain("I've got the Laksa paste and Coconut milk.");
    expect(sent).toContain('```checklist-reply');
    expect(sent).toContain('"ticked":["laksa-paste","coconut-milk"]');
    expect(sent).toContain('"absent":["rice-noodles"]');

    // The Pantry write is client-driven off the ticks, carrying the model's category.
    expect(onTicked).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'laksa-paste', category: 'Condiments' }),
      expect.objectContaining({ id: 'coconut-milk', category: 'Misc' }),
    ]);
  });

  it('treats ticking nothing as a real answer, not an abandonment', () => {
    const onSend = jest.fn();
    const onTicked = jest.fn();
    renderBlock({ onSend, onTicked });
    fireEvent.click(screen.getByText('Tell Ah Mah'));

    const sent = onSend.mock.calls[0][0] as string;
    expect(sent).toContain("I don't have any of those.");
    expect(sent).toContain('"ticked":[]');
    expect(sent).toContain(
      '"absent":["laksa-paste","coconut-milk","rice-noodles"]'
    );
    // Nothing was claimed, so nothing is written to the Pantry.
    expect(onTicked).not.toHaveBeenCalled();
  });

  it('replays the answer from the reply fence, not from the prose', () => {
    renderBlock({
      allMessages: [
        assistantMsg,
        // Prose that would trip a substring scan: it *names* an absent item.
        userReply(
          `I have coconut milk but no laksa paste.\n\`\`\`checklist-reply\n${JSON.stringify(
            { ticked: ['coconut-milk'], absent: ['laksa-paste', 'rice-noodles'] }
          )}\n\`\`\``
        ),
      ],
    });
    expect(screen.getByText('✓ Answered — 1 of 3')).toBeInTheDocument();
    screen.getAllByRole('button').forEach(btn => expect(btn).toBeDisabled());
  });

  it('replays a zero-tick answer as answered, distinct from an ignored card', () => {
    renderBlock({
      allMessages: [assistantMsg, reply([], ['laksa-paste', 'coconut-milk', 'rice-noodles'])],
    });
    expect(screen.getByText('✓ Answered — 0 of 3')).toBeInTheDocument();
    // Not the live state: no submit button, no escape-hatch footer.
    expect(screen.queryByText('Tell Ah Mah')).not.toBeInTheDocument();
    expect(screen.queryByText(/just tell me/i)).not.toBeInTheDocument();
  });

  it('stays live when the user ignores the card and types something else', () => {
    renderBlock({
      allMessages: [assistantMsg, userReply('actually make me something else')],
    });
    expect(screen.queryByText(/✓ Answered/)).not.toBeInTheDocument();
    expect(screen.getByText('Tell Ah Mah')).toBeInTheDocument();
  });

  it('does not claim a later card\'s answer when this one was ignored', () => {
    // Re-asking means a conversation can hold several cards, and an ignored card
    // has no reply of its own. Without stopping at the card that superseded it,
    // this one would scan forward and render itself answered with the ticks the
    // user gave the *second* card.
    const secondCard: UIMessage = {
      id: 'a1',
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: `Quick check again\n\`\`\`checklist\n${JSON.stringify(data)}\n\`\`\``,
        },
      ],
    };
    renderBlock({
      allMessages: [
        assistantMsg,
        userReply('make me laksa'),
        secondCard,
        reply(['laksa-paste'], ['coconut-milk', 'rice-noodles']),
      ],
    });
    expect(screen.queryByText(/✓ Answered/)).not.toBeInTheDocument();
    expect(screen.getByText('Tell Ah Mah')).toBeInTheDocument();
  });

  it('writes the ticks to the Pantry before sending the reply', async () => {
    // The chat turn calls getInventory, and captureMentionedInventory skips
    // checklist replies — so if the write races the send, the model can answer
    // without ever seeing what the user just ticked.
    const order: string[] = [];
    const onTicked = jest.fn(
      () =>
        new Promise<void>(resolve =>
          setTimeout(() => {
            order.push('pantry');
            resolve();
          }, 0)
        )
    );
    const onSend = jest.fn(() => {
      order.push('send');
    });
    renderBlock({ onSend, onTicked });
    fireEvent.click(screen.getByText('Laksa paste'));
    fireEvent.click(screen.getByText('I have this 1'));

    await waitFor(() => expect(onSend).toHaveBeenCalled());
    expect(order).toEqual(['pantry', 'send']);
  });

  it('shows the "or just tell me" escape-hatch footer while live', () => {
    renderBlock();
    expect(screen.getByText(/just tell me/i)).toBeInTheDocument();
  });

  it('suppresses staging and the locked state while streaming', () => {
    renderBlock({
      allMessages: [assistantMsg, reply(['laksa-paste'], ['coconut-milk', 'rice-noodles'])],
      isStreaming: true,
    });
    expect(screen.queryByText(/✓ Answered/)).not.toBeInTheDocument();
    expect(screen.queryByText('Tell Ah Mah')).not.toBeInTheDocument();
    screen.getAllByRole('button').forEach(btn => expect(btn).toBeDisabled());
  });

  it('renders a partial block mid-stream without crashing (ADR-0009)', () => {
    renderBlock({
      data: { question: 'Do you have these for la' },
      isStreaming: true,
    });
    expect(screen.getByText('Do you have these for la')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('buildReplyMessage', () => {
  it('names only the ticked rows, by label rather than id', () => {
    const msg = buildReplyMessage([data.rows[2]], [data.rows[0], data.rows[1]]);
    expect(msg).toContain("I've got the Thick rice noodles.");
    expect(msg).not.toContain('rice-noodles.');
  });

  it('carries both sides of the answer so a reply is self-contained', () => {
    const msg = buildReplyMessage([data.rows[0]], [data.rows[1], data.rows[2]]);
    expect(msg).toContain('"ticked":["laksa-paste"]');
    expect(msg).toContain('"absent":["coconut-milk","rice-noodles"]');
  });
});
