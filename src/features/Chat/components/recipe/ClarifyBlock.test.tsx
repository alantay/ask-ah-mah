import { fireEvent, render, screen } from '@testing-library/react';
import type { UIMessage } from 'ai';
import { ClarifyBlock } from './ClarifyBlock';

const data = {
  question: 'What kind of meal are you after?',
  options: [
    { id: 'quick', label: 'Something quick', hint: 'under 20 min' },
    { id: 'comfort', label: 'Comfort food' },
  ],
};

// The clarify block is rendered against message #0; later messages are the
// user's reply that locks a pick.
const userReply = (text: string): UIMessage => ({
  id: 'u1',
  role: 'user',
  parts: [{ type: 'text', text }],
});

const assistantMsg: UIMessage = { id: 'a0', role: 'assistant', parts: [] };

describe('ClarifyBlock', () => {
  it('renders the question and each option (label + optional hint)', () => {
    render(
      <ClarifyBlock data={data} allMessages={[assistantMsg]} messageIndex={0} onSend={jest.fn()} />
    );
    expect(screen.getByText('What kind of meal are you after?')).toBeInTheDocument();
    expect(screen.getByText('Something quick')).toBeInTheDocument();
    expect(screen.getByText('under 20 min')).toBeInTheDocument();
    expect(screen.getByText('Comfort food')).toBeInTheDocument();
  });

  it('sends the option label when a card is tapped (tap = send)', () => {
    const onSend = jest.fn();
    render(
      <ClarifyBlock data={data} allMessages={[assistantMsg]} messageIndex={0} onSend={onSend} />
    );
    fireEvent.click(screen.getByText('Something quick'));
    expect(onSend).toHaveBeenCalledWith('Something quick');
  });

  it('locks the picked option and dims/disables the rest after the user answers', () => {
    const onSend = jest.fn();
    render(
      <ClarifyBlock
        data={data}
        allMessages={[assistantMsg, userReply('Something quick')]}
        messageIndex={0}
        onSend={onSend}
      />
    );
    expect(screen.getByText('✓ Picked')).toBeInTheDocument();
    // Every option button is now disabled — the answer is locked in.
    screen.getAllByRole('button').forEach(btn => expect(btn).toBeDisabled());
    // Tapping the non-picked option does nothing.
    fireEvent.click(screen.getByText('Comfort food'));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('shows the "or just tell me" escape-hatch footer', () => {
    render(
      <ClarifyBlock data={data} allMessages={[assistantMsg]} messageIndex={0} onSend={jest.fn()} />
    );
    expect(screen.getByText(/just tell me/i)).toBeInTheDocument();
  });

  it('suppresses the picked/locked state while streaming', () => {
    render(
      <ClarifyBlock
        data={data}
        allMessages={[assistantMsg, userReply('Something quick')]}
        messageIndex={0}
        onSend={jest.fn()}
        isStreaming
      />
    );
    // No pick is derived mid-stream; buttons stay disabled (still streaming) but
    // none is marked picked.
    expect(screen.queryByText('✓ Picked')).not.toBeInTheDocument();
  });
});
