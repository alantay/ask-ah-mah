import { fireEvent, render, screen, within } from '@testing-library/react';
import { RecipeLetter, RecipeLetterProps } from './RecipeLetter';

jest.mock('@/contexts/SessionContext', () => ({
  useSessionContext: () => ({ userId: null }),
}));

jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(() => ({ data: undefined })),
}));

jest.mock('./ScaledNum', () => ({
  ScaledNum: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const RECIPE: RecipeLetterProps['recipe'] = {
  title: 'Ginger Chicken',
  baseServings: 2,
  ingredients: [
    { name: 'chicken thigh', amount: '500', unit: 'g' },
    { name: 'bok choy', amount: '1', unit: 'bunch' },
  ],
  steps: [
    { title: 'Marinate', body: 'Toss chicken with soy.' },
    { title: 'Sear', body: 'High heat, one minute per side.' },
  ],
};

describe('ServingsStepper inside RecipeLetter', () => {
  it('shows the initial serving count with "servings" label', () => {
    render(<RecipeLetter recipe={RECIPE} />);
    const stepper = screen.getByLabelText('Decrease servings').closest('.inline-flex') as HTMLElement;
    expect(within(stepper).getByText('2 servings')).toBeInTheDocument();
  });

  it('renders the word "servings" or "serving" in the stepper', () => {
    const { container } = render(<RecipeLetter recipe={RECIPE} />);
    const stepperWrapper = container.querySelector('.inline-flex.items-stretch');
    expect(stepperWrapper).not.toBeNull();
    expect(stepperWrapper!.textContent).toMatch(/servings?/i);
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

  it('increment button is disabled at 12 servings', () => {
    render(<RecipeLetter recipe={RECIPE} />);
    const inc = screen.getByLabelText('Increase servings');
    // Click up to 12
    for (let i = 2; i < 12; i++) fireEvent.click(inc);
    expect(inc).toBeDisabled();
  });

  it('clicking increment updates the displayed count', () => {
    render(<RecipeLetter recipe={RECIPE} />);
    const stepper = screen.getByLabelText('Increase servings').closest('.inline-flex') as HTMLElement;
    fireEvent.click(screen.getByLabelText('Increase servings'));
    expect(within(stepper).getByText('3 servings')).toBeInTheDocument();
  });

  it('clicking decrement updates the displayed count', () => {
    render(<RecipeLetter recipe={RECIPE} />);
    const stepper = screen.getByLabelText('Decrease servings').closest('.inline-flex') as HTMLElement;
    fireEvent.click(screen.getByLabelText('Decrease servings'));
    expect(within(stepper).getByText('1 serving')).toBeInTheDocument();
  });
});

describe('RecipeLetter ingredient grid', () => {
  it('renders all ingredient names', () => {
    render(<RecipeLetter recipe={RECIPE} />);
    expect(screen.getByText('chicken thigh')).toBeInTheDocument();
    expect(screen.getByText('bok choy')).toBeInTheDocument();
  });
});
