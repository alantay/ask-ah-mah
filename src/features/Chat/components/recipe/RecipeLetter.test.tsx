import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

const CHICKEN_PAIR: RecipeLetterProps['recipe'] = {
  ...RECIPE,
  ingredients: [
    { name: 'chicken thigh', category: 'Protein', amount: '500', unit: 'g', note: undefined },
    { name: 'chicken stock', category: 'Misc', amount: '200', unit: 'ml', note: undefined },
  ],
};

const RICE_RECIPE: RecipeLetterProps['recipe'] = {
  ...RECIPE,
  ingredients: [
    { name: 'jasmine rice', category: 'Carbs', amount: '2', unit: 'cups', note: undefined },
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
    fireEvent.click(screen.getByRole('button', { name: /Never mind/ }));
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

  it('drops a row\'s pantry caption once another ticked ingredient claims the item', () => {
    // Both rows match "boneless chicken" via "chicken", and one pantry row
    // cannot answer both. Untick both and each row honestly names it; re-tick
    // one and the other's delete can no longer fire, so its caption goes too.
    mockUseSWR.mockReturnValue({
      data: {
        ingredientInventory: [
          { id: 'boneless chicken', name: 'boneless chicken', type: 'ingredient' as const, category: 'Protein' as const, dateAdded: new Date().toISOString(), lastUpdated: new Date().toISOString() },
        ],
        kitchenwareInventory: [],
      },
    });
    render(<RecipeLetter recipe={CHICKEN_PAIR} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(screen.getByRole('checkbox', { name: /chicken thigh/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /chicken stock/ }));
    expect(screen.getAllByText(/pantry: boneless chicken/)).toHaveLength(2);

    fireEvent.click(screen.getByRole('checkbox', { name: /chicken thigh/ }));
    expect(screen.getAllByText(/pantry: boneless chicken/)).toHaveLength(1);
  });

  it('never captions a kitchenware match — it is not deletable', () => {
    mockUseSWR.mockReturnValue({
      data: {
        ingredientInventory: [],
        kitchenwareInventory: [
          { id: 'rice cooker', name: 'rice cooker', type: 'kitchenware' as const, category: 'Misc' as const, dateAdded: new Date().toISOString(), lastUpdated: new Date().toISOString() },
        ],
      },
    });
    render(<RecipeLetter recipe={RICE_RECIPE} onSend={mockOnSend} />);
    openReconcile();
    expect(screen.queryByText(/pantry: rice cooker/i)).not.toBeInTheDocument();
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

describe('Reconcile submit writes the pantry then asks', () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    mockOnSend.mockReset();
    mockUseSessionContext.mockReturnValue({ userId: 'user-123' });
    mockUseSWR.mockReturnValue({ data: INVENTORY_WITH_CHICKEN });
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) }),
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const openReconcile = () =>
    fireEvent.click(
      screen.getByRole('button', { name: /Ask Ah Mah for substitutions/ }),
    );

  const callsTo = (method: string) =>
    (global.fetch as jest.Mock).mock.calls.filter(
      ([url, init]) => url === '/api/inventory' && init?.method === method,
    );

  it('adds a newly ticked ingredient with its category', async () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(screen.getByRole('checkbox', { name: /bok choy/ }));
    fireEvent.click(screen.getByRole('button', { name: /Save what I have/ }));

    await waitFor(() => expect(callsTo('POST').length).toBe(1));
    expect(JSON.parse(callsTo('POST')[0][1].body)).toEqual({
      items: [{ name: 'bok choy', type: 'ingredient', category: 'Vegetable' }],
    });
  });

  // The pantry's wording deliberately differs from the recipe's, so sending the
  // recipe's own name instead of the matched item's would fail this.
  it('deletes an unticked pantry item by its pantry name', async () => {
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
    fireEvent.click(screen.getByRole('checkbox', { name: /chicken thigh/ }));
    fireEvent.click(
      screen.getByRole('button', { name: /Ask about the 2 you're missing/ }),
    );

    await waitFor(() => expect(callsTo('DELETE').length).toBe(1));
    expect(JSON.parse(callsTo('DELETE')[0][1].body)).toEqual({
      itemNames: ['boneless chicken'],
    });
  });

  // Two pantry items match `dark soy sauce` under the loose matcher, so there is
  // no safe row to remove: the item is absent for this dish only.
  const RECIPE_SAUCE: RecipeLetterProps['recipe'] = {
    ...RECIPE,
    ingredients: [
      { name: 'dark soy sauce', category: 'Condiments', amount: '1', unit: 'tbsp', note: undefined },
    ],
  };

  const AMBIGUOUS_PANTRY = {
    data: {
      ingredientInventory: [
        { id: '1', name: 'fish sauce', type: 'ingredient' as const, category: 'Condiments' as const, dateAdded: new Date().toISOString(), lastUpdated: new Date().toISOString() },
        { id: '2', name: 'soy sauce', type: 'ingredient' as const, category: 'Condiments' as const, dateAdded: new Date().toISOString(), lastUpdated: new Date().toISOString() },
      ],
      kitchenwareInventory: [],
    },
  };

  it('sends no delete when two pantry items match the unticked ingredient', async () => {
    mockUseSWR.mockReturnValue(AMBIGUOUS_PANTRY);
    render(<RecipeLetter recipe={RECIPE_SAUCE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(screen.getByRole('checkbox', { name: /dark soy sauce/ }));
    fireEvent.click(
      screen.getByRole('button', { name: /Ask about the 1 you're missing/ }),
    );

    await waitFor(() => expect(mockOnSend).toHaveBeenCalled());
    expect(callsTo('DELETE')).toHaveLength(0);
  });

  it('still asks about an ambiguously matched unticked ingredient', async () => {
    mockUseSWR.mockReturnValue(AMBIGUOUS_PANTRY);
    render(<RecipeLetter recipe={RECIPE_SAUCE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(screen.getByRole('checkbox', { name: /dark soy sauce/ }));
    fireEvent.click(
      screen.getByRole('button', { name: /Ask about the 1 you're missing/ }),
    );

    await waitFor(() => expect(mockOnSend).toHaveBeenCalled());
    expect(mockOnSend.mock.calls[0][0]).toContain('dark soy sauce');
  });

  // `jasmine rice` matches the kitchenware row "Rice cooker" via "rice", so the
  // grid pre-ticks it — but kitchenware is not in the delete pool, and
  // `DELETE /api/inventory` has no type filter to stop it landing.
  const RECIPE_RICE: RecipeLetterProps['recipe'] = {
    ...RECIPE,
    ingredients: [
      { name: 'jasmine rice', category: 'Carbs', amount: '2', unit: 'cup', note: undefined },
    ],
  };

  const RICE_COOKER_PANTRY = {
    data: {
      ingredientInventory: [],
      kitchenwareInventory: [
        { id: '1', name: 'Rice cooker', type: 'kitchenware' as const, dateAdded: new Date().toISOString(), lastUpdated: new Date().toISOString() },
      ],
    },
  };

  it('never deletes kitchenware for an unticked ingredient', async () => {
    mockUseSWR.mockReturnValue(RICE_COOKER_PANTRY);
    render(<RecipeLetter recipe={RECIPE_RICE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(screen.getByRole('checkbox', { name: /jasmine rice/ }));
    fireEvent.click(
      screen.getByRole('button', { name: /Ask about the 1 you're missing/ }),
    );

    await waitFor(() => expect(mockOnSend).toHaveBeenCalled());
    expect(callsTo('DELETE')).toHaveLength(0);
  });

  it('adds an ingredient whose only pantry match was kitchenware', async () => {
    mockUseSWR.mockReturnValue(RICE_COOKER_PANTRY);
    render(<RecipeLetter recipe={RECIPE_RICE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(screen.getByRole('button', { name: /Save what I have/ }));

    await waitFor(() => expect(callsTo('POST').length).toBe(1));
    expect(JSON.parse(callsTo('POST')[0][1].body)).toEqual({
      items: [{ name: 'jasmine rice', type: 'ingredient', category: 'Carbs' }],
    });
  });

  it('sends an ask naming only what is still missing', async () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(
      screen.getByRole('button', { name: /Ask about the 1 you're missing/ }),
    );

    await waitFor(() => expect(mockOnSend).toHaveBeenCalled());
    const sent = mockOnSend.mock.calls[0][0] as string;
    expect(sent).toContain('bok choy');
    expect(sent).not.toContain('chicken thigh');
    expect(sent).toContain('Ginger Chicken');
  });

  // Unticking chicken thigh forces BOTH a write and a send in one submit —
  // the only scenario where the ordering is observable. A tick-only submit
  // sends nothing, so it would pass this assertion vacuously.
  it('writes the pantry before it sends', async () => {
    const order: string[] = [];
    // `mutateResource` is `async function() { return fetch(...) }` — calling it
    // (and `write()` around it) runs synchronously up to fetch's own first
    // await, so recording 'write' at invocation time would pass even if the
    // implementation forgot to `await write(...)`. Recording it only when the
    // mocked fetch RESOLVES, on a later macrotask, means an un-awaited write
    // lets 'send' land first — the only version of this test that can fail.
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            order.push('write');
            resolve({ ok: true, json: () => Promise.resolve({}) });
          }, 0);
        }),
    );
    mockOnSend.mockImplementation(() => {
      order.push('send');
    });

    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(screen.getByRole('checkbox', { name: /chicken thigh/ }));
    fireEvent.click(
      screen.getByRole('button', { name: /Ask about the 2 you're missing/ }),
    );

    await waitFor(() => expect(order).toContain('send'));
    expect(order).toEqual(['write', 'send']);
  });

  it('ignores a second submit while the first is still writing', async () => {
    // Hold the write open so both clicks land inside the same in-flight window.
    let release: (v: unknown) => void = () => {};
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ ok: true, json: () => Promise.resolve({}) });
        }),
    );

    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    // Untick chicken thigh so the submit both writes and sends.
    fireEvent.click(screen.getByRole('checkbox', { name: /chicken thigh/ }));
    const submit = screen.getByRole('button', {
      name: /Ask about the 2 you're missing/,
    });
    fireEvent.click(submit);
    fireEvent.click(submit);

    expect(submit).toBeDisabled();
    expect(callsTo('DELETE')).toHaveLength(1);

    await act(async () => {
      release(null);
    });
    expect(callsTo('DELETE')).toHaveLength(1);
    expect(mockOnSend).toHaveBeenCalledTimes(1);
  });

  it('sends nothing when the corrected list has no gaps', async () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(screen.getByRole('checkbox', { name: /bok choy/ }));
    fireEvent.click(screen.getByRole('button', { name: /Save what I have/ }));

    await waitFor(() => expect(callsTo('POST').length).toBe(1));
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('leaves reconcile mode after submit', async () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(
      screen.getByRole('button', { name: /Ask about the 1 you're missing/ }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('checkbox', { name: /bok choy/ })).not.toBeInTheDocument(),
    );
  });

  it('summarises the writes in a toast', async () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(screen.getByRole('checkbox', { name: /bok choy/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /chicken thigh/ }));
    fireEvent.click(
      screen.getByRole('button', { name: /Ask about the 1 you're missing/ }),
    );
    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Pantry updated — 1 added, 1 removed.',
      ),
    );
  });

  it('raises no toast when the ticks changed nothing', async () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(
      screen.getByRole('button', { name: /Ask about the 1 you're missing/ }),
    );
    await waitFor(() => expect(mockOnSend).toHaveBeenCalled());
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it('on a failed write, errors instead of sending and stays in reconcile mode', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({}) }),
    ) as unknown as typeof fetch;

    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(screen.getByRole('checkbox', { name: /bok choy/ }));
    fireEvent.click(screen.getByRole('button', { name: /Save what I have/ }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Aiyah, couldn't update your pantry. Try again?",
      ),
    );
    expect(mockOnSend).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: /bok choy/ })).toBeInTheDocument();
  });
});
