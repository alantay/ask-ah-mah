import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { RecipeLetter, RecipeLetterProps } from './RecipeLetter';

const mockUseSessionContext = jest.fn(() => ({ userId: null as string | null }));
jest.mock('@/contexts/SessionContext', () => ({
  useSessionContext: () => mockUseSessionContext(),
}));

const mockMutate = jest.fn();
const mockUseSWR = jest.fn((..._args: unknown[]) => ({ data: undefined as unknown }));
jest.mock('swr', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseSWR(...args),
  useSWRConfig: () => ({ mutate: mockMutate }),
}));

jest.mock('@/features/Recipe', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories can't reference top-level imports (babel-plugin-jest-hoist)
  const React = require('react');
  return {
    ScaledNum: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    scaleAmount: (amount: string, ratio: number) => amount,
    CookingMode: ({
      cooked,
      onCookedChange,
    }: {
      cooked?: boolean;
      onCookedChange?: (cooked: boolean) => void;
    }) => (
      <div>
        <input
          type="checkbox"
          aria-label="I made this"
          defaultChecked={!!cooked}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCookedChange?.(e.target.checked)}
        />
      </div>
    ),
    ServingsStepper: ({
    servings,
    onDecrement,
    onIncrement,
    max = 20,
  }: {
    servings: number;
    onDecrement: () => void;
    onIncrement: () => void;
    max?: number;
  }) => (
    <div className="inline-flex">
      <button onClick={onDecrement} disabled={servings <= 1} aria-label="Decrease servings">−</button>
      <span>{servings}</span>
      <button onClick={onIncrement} disabled={servings >= max} aria-label="Increase servings">+</button>
    </div>
    ),
  };
});

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

const RECIPE: RecipeLetterProps['recipe'] = {
  title: 'Ginger Chicken',
  baseServings: 2,
  ingredients: [
    { name: 'chicken thigh', category: 'Protein', amount: '500', unit: 'g', note: undefined },
    { name: 'bok choy', category: 'Vegetable', amount: '1', unit: 'bunch', note: undefined },
  ],
  steps: [
    { title: 'Marinate', body: 'Toss chicken with soy.' },
    { title: 'Sear', body: 'High heat, one minute per side.' },
  ],
};

const INVENTORY_WITH_CHICKEN = {
  ingredientInventory: [
    {
      id: '1',
      name: 'chicken thigh',
      type: 'ingredient' as const,
      category: 'Protein' as const,
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    },
  ],
  kitchenwareInventory: [],
};

beforeEach(() => {
  mockUseSessionContext.mockReturnValue({ userId: null });
  mockUseSWR.mockReturnValue({ data: undefined });
  mockMutate.mockReset();
  mockToastSuccess.mockReset();
  mockToastError.mockReset();
});

describe('ServingsStepper inside RecipeLetter', () => {
  it('shows the initial serving count as a bare number', () => {
    render(<RecipeLetter recipe={RECIPE} />);
    const stepper = screen.getByLabelText('Decrease servings').closest('.inline-flex') as HTMLElement;
    expect(within(stepper).getByText('2')).toBeInTheDocument();
  });

  it('does not render the word "servings" or "serving" in the stepper', () => {
    render(<RecipeLetter recipe={RECIPE} />);
    const stepperWrapper = screen.getByLabelText('Decrease servings').closest('.inline-flex') as HTMLElement;
    expect(stepperWrapper).not.toBeNull();
    expect(stepperWrapper.textContent).not.toMatch(/servings?/i);
  });

  it('does not render a ratio or "from" line at any count', () => {
    render(<RecipeLetter recipe={RECIPE} />);
    expect(screen.queryByText(/from/)).toBeNull();
    fireEvent.click(screen.getByLabelText('Increase servings'));
    expect(screen.queryByText(/from/)).toBeNull();
    expect(screen.queryByText(/×/)).toBeNull();
  });

  it('decrement button is disabled at 1 serving', () => {
    render(<RecipeLetter recipe={{ ...RECIPE, baseServings: 1 }} />);
    const dec = screen.getByLabelText('Decrease servings');
    expect(dec).toBeDisabled();
  });

  it('increment button is disabled at 20 servings', () => {
    render(<RecipeLetter recipe={RECIPE} />);
    const inc = screen.getByLabelText('Increase servings');
    for (let i = 2; i < 20; i++) fireEvent.click(inc);
    expect(inc).toBeDisabled();
  });

  it('clicking increment updates the displayed count', () => {
    render(<RecipeLetter recipe={RECIPE} />);
    const stepper = screen.getByLabelText('Increase servings').closest('.inline-flex') as HTMLElement;
    fireEvent.click(screen.getByLabelText('Increase servings'));
    expect(within(stepper).getByText('3')).toBeInTheDocument();
  });

  it('clicking decrement updates the displayed count', () => {
    render(<RecipeLetter recipe={RECIPE} />);
    const stepper = screen.getByLabelText('Decrease servings').closest('.inline-flex') as HTMLElement;
    fireEvent.click(screen.getByLabelText('Decrease servings'));
    expect(within(stepper).getByText('1')).toBeInTheDocument();
  });
});

describe('RecipeLetter ingredient grid', () => {
  it('renders all ingredient names', () => {
    render(<RecipeLetter recipe={RECIPE} />);
    expect(screen.getByText('chicken thigh')).toBeInTheDocument();
    expect(screen.getByText('bok choy')).toBeInTheDocument();
  });
});

describe('Shortfall card retired', () => {
  // chicken thigh owned, bok choy + ginger missing → 1 of 3 (below 50%)
  const RECIPE_3: RecipeLetterProps['recipe'] = {
    ...RECIPE,
    ingredients: [
      ...(RECIPE.ingredients ?? []),
      { name: 'ginger', category: 'Vegetable', amount: '1', unit: 'thumb', note: undefined },
    ],
  };

  beforeEach(() => {
    mockUseSessionContext.mockReturnValue({ userId: 'user-123' });
  });

  it('no longer renders the shortfall card or its copy-shopping-list', () => {
    mockUseSWR.mockReturnValue({ data: INVENTORY_WITH_CHICKEN });
    render(<RecipeLetter recipe={RECIPE_3} />);
    expect(screen.queryByText('Shopping list')).not.toBeInTheDocument();
    expect(screen.queryByText(/Still need/)).not.toBeInTheDocument();
    expect(screen.queryByText(/You.?re almost there/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Copy shopping list/ }),
    ).not.toBeInTheDocument();
  });

  it('no longer shows inline picking tips in chat', () => {
    mockUseSWR.mockImplementation((key: unknown) =>
      typeof key === 'string' && key.startsWith('market-tip')
        ? { data: { tips: { 'bok choy': 'crisp stalks, no yellowing' } } }
        : { data: INVENTORY_WITH_CHICKEN },
    );
    render(<RecipeLetter recipe={RECIPE} />);
    expect(
      screen.queryByText('— crisp stalks, no yellowing'),
    ).not.toBeInTheDocument();
  });

  it('keeps the substitution note on an ingredient row', () => {
    mockUseSWR.mockReturnValue({ data: INVENTORY_WITH_CHICKEN });
    render(
      <RecipeLetter
        recipe={{
          ...RECIPE,
          ingredients: [
            { name: 'bok choy', category: 'Vegetable', amount: '1', unit: 'bunch', note: 'or any leafy green' },
          ],
        }}
      />,
    );
    expect(screen.getByText(/or any leafy green/)).toBeInTheDocument();
  });
});

describe('Substitutions opens reconcile mode', () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    mockOnSend.mockReset();
    mockUseSessionContext.mockReturnValue({ userId: 'user-123' });
    mockUseSWR.mockReturnValue({ data: INVENTORY_WITH_CHICKEN });
  });

  const openReconcile = () =>
    fireEvent.click(
      screen.getByRole('button', { name: /Ask Ah Mah for substitutions/ }),
    );

  it('offers the nudge when a pantry is tracked', () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    expect(
      screen.getByRole('button', { name: /Ask Ah Mah for substitutions/ }),
    ).toBeInTheDocument();
  });

  it('still offers the nudge when the pantry says nothing is missing', () => {
    mockUseSWR.mockReturnValue({
      data: {
        ingredientInventory: [
          { id: '1', name: 'chicken thigh', type: 'ingredient' as const, category: 'Protein' as const, dateAdded: new Date().toISOString(), lastUpdated: new Date().toISOString() },
          { id: '2', name: 'bok choy', type: 'ingredient' as const, category: 'Vegetable' as const, dateAdded: new Date().toISOString(), lastUpdated: new Date().toISOString() },
        ],
        kitchenwareInventory: [],
      },
    });
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    expect(
      screen.getByRole('button', { name: /Ask Ah Mah for substitutions/ }),
    ).toBeInTheDocument();
  });

  it('hides the nudge when no pantry is tracked', () => {
    mockUseSWR.mockReturnValue({
      data: { ingredientInventory: [], kitchenwareInventory: [] },
    });
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    expect(
      screen.queryByRole('button', { name: /Ask Ah Mah for substitutions/ }),
    ).not.toBeInTheDocument();
  });

  it('sends nothing when the nudge is tapped', () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('gives every ingredient a checkbox, pre-ticked from the pantry', () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    expect(screen.getByRole('checkbox', { name: /chicken thigh/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /bok choy/ })).not.toBeChecked();
  });

  it('toggles a checkbox on click', () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    const box = screen.getByRole('checkbox', { name: /bok choy/ });
    fireEvent.click(box);
    expect(box).toBeChecked();
  });

  it('labels submit with the count still unticked', () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    expect(
      screen.getByRole('button', { name: /Ask about the 1 you're missing/ }),
    ).toBeInTheDocument();
  });

  it('offers to save instead of ask when nothing is left missing', () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(screen.getByRole('checkbox', { name: /bok choy/ }));
    expect(
      screen.getByRole('button', { name: /Save what I have/ }),
    ).toBeInTheDocument();
  });

  it('hides the cart buttons while reconciling', () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    expect(
      screen.queryByRole('button', { name: /Add bok choy to shopping list/ }),
    ).not.toBeInTheDocument();
  });

  it('discards ticks on exit without writing', () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(screen.getByRole('checkbox', { name: /bok choy/ }));
    fireEvent.click(screen.getByRole('button', { name: /Done/ }));
    expect(screen.queryByRole('checkbox', { name: /bok choy/ })).not.toBeInTheDocument();
    openReconcile();
    expect(screen.getByRole('checkbox', { name: /bok choy/ })).not.toBeChecked();
  });

  it('names the matched pantry item when it differs from the ingredient', () => {
    mockUseSWR.mockReturnValue({
      data: {
        ingredientInventory: [
          { id: '1', name: 'boneless chicken', type: 'ingredient' as const, category: 'Protein' as const, dateAdded: new Date().toISOString(), lastUpdated: new Date().toISOString() },
        ],
        kitchenwareInventory: [],
      },
    });
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    expect(screen.getByText(/pantry: boneless chicken/)).toBeInTheDocument();
  });
});

describe('Recipe cart adds to the shopping list', () => {
  beforeEach(() => {
    mockUseSessionContext.mockReturnValue({ userId: 'user-123' });
    mockUseSWR.mockReturnValue({ data: INVENTORY_WITH_CHICKEN });
  });

  it('renders the cart button for an ingredient not on hand', () => {
    render(<RecipeLetter recipe={RECIPE} />);
    expect(screen.getByLabelText('Add bok choy to shopping list')).toBeInTheDocument();
  });

  it('renders a cart icon (not text) inside the button', () => {
    render(<RecipeLetter recipe={RECIPE} />);
    const button = screen.getByLabelText('Add bok choy to shopping list');
    expect(button.textContent).toBe('');
    expect(button.querySelector('svg.lucide-shopping-cart')).toBeInTheDocument();
  });

  it('renders no cart for an ingredient already on hand', () => {
    render(<RecipeLetter recipe={RECIPE} />);
    expect(screen.queryByLabelText('Add chicken thigh to shopping list')).not.toBeInTheDocument();
  });

  it('posts to /api/shopping-list and confirms on click', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<RecipeLetter recipe={RECIPE} />);
    fireEvent.click(screen.getByLabelText('Add bok choy to shopping list'));
    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith('bok choy — on the list.'),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/shopping-list',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          items: [{ name: 'bok choy', category: 'Vegetable' }],
        }),
      }),
    );
    expect(mockMutate).toHaveBeenCalledWith('/api/shopping-list?userId=user-123');
  });

  it('shows an error toast and keeps the cart on failure', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'Server error' }) });
    render(<RecipeLetter recipe={RECIPE} />);
    fireEvent.click(screen.getByLabelText('Add bok choy to shopping list'));
    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Server error'));
    expect(mockMutate).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Add bok choy to shopping list')).toBeInTheDocument();
  });

  it('disables the cart while the request is in flight', async () => {
    let resolveRequest!: (v: unknown) => void;
    global.fetch = jest.fn().mockReturnValue(
      new Promise((r) => { resolveRequest = r; }),
    );
    render(<RecipeLetter recipe={RECIPE} />);
    const cart = screen.getByLabelText('Add bok choy to shopping list');
    fireEvent.click(cart);
    expect(cart).toBeDisabled();
    resolveRequest({ ok: true, json: async () => ({}) });
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalled());
  });
});
