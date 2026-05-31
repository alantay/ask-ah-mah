import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { RecipeLetter, RecipeLetterProps } from './RecipeLetter';

const mockUseSessionContext = jest.fn(() => ({ userId: null as string | null }));
jest.mock('@/contexts/SessionContext', () => ({
  useSessionContext: () => mockUseSessionContext(),
}));

const mockMutate = jest.fn();
const mockUseSWR = jest.fn(() => ({ data: undefined as unknown }));
jest.mock('swr', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseSWR(...args),
  useSWRConfig: () => ({ mutate: mockMutate }),
}));

jest.mock('@/features/Recipe', () => ({
  ScaledNum: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  scaleAmount: (amount: string, ratio: number) => amount,
  CookingMode: () => null,
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
}));

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

describe('NEED pill click-to-add', () => {
  beforeEach(() => {
    mockUseSessionContext.mockReturnValue({ userId: 'user-123' });
    mockUseSWR.mockReturnValue({ data: INVENTORY_WITH_CHICKEN });
  });

  it('renders NEED pill for ingredient not in pantry', () => {
    render(<RecipeLetter recipe={RECIPE} />);
    expect(screen.getByLabelText('Add bok choy to pantry')).toBeInTheDocument();
  });

  it('renders a cart icon (not text) inside the add-to-pantry button', () => {
    render(<RecipeLetter recipe={RECIPE} />);
    const button = screen.getByLabelText('Add bok choy to pantry');
    expect(button.textContent).toBe('');
    expect(button.querySelector('svg.lucide-shopping-cart')).toBeInTheDocument();
  });

  it('renders no badge for ingredient already in pantry (HAVE removed)', () => {
    render(<RecipeLetter recipe={RECIPE} />);
    expect(screen.queryByLabelText('Add chicken thigh to pantry')).not.toBeInTheDocument();
    expect(screen.queryByText('HAVE')).not.toBeInTheDocument();
  });

  it('posts correct body and shows success toast on NEED click', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<RecipeLetter recipe={RECIPE} />);
    fireEvent.click(screen.getByLabelText('Add bok choy to pantry'));
    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith('bok choy — in the pantry now.'),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/inventory',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          items: [{ name: 'bok choy', type: 'ingredient', category: 'Vegetable' }],
          userId: 'user-123',
        }),
      }),
    );
    expect(mockMutate).toHaveBeenCalledWith('/api/inventory?userId=user-123');
  });

  it('shows error toast and leaves pill as NEED on fetch failure', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'Server error' }) });
    render(<RecipeLetter recipe={RECIPE} />);
    fireEvent.click(screen.getByLabelText('Add bok choy to pantry'));
    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Server error'));
    expect(mockMutate).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Add bok choy to pantry')).toBeInTheDocument();
  });

  it('NEED pill is disabled while request is in flight', async () => {
    let resolveRequest!: (v: unknown) => void;
    global.fetch = jest.fn().mockReturnValue(
      new Promise((r) => { resolveRequest = r; }),
    );
    render(<RecipeLetter recipe={RECIPE} />);
    const pill = screen.getByLabelText('Add bok choy to pantry');
    fireEvent.click(pill);
    expect(pill).toBeDisabled();
    resolveRequest({ ok: true, json: async () => ({}) });
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalled());
  });
});
