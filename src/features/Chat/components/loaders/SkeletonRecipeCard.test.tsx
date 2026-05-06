import { render, screen } from '@testing-library/react';
import * as reducedMotionModule from './useReducedMotion';
import { SkeletonRecipeCard } from './SkeletonRecipeCard';

jest.mock('./useReducedMotion', () => ({ useReducedMotion: jest.fn(() => false) }));

const mockUseReducedMotion = reducedMotionModule.useReducedMotion as jest.Mock;

describe('SkeletonRecipeCard', () => {
  beforeEach(() => mockUseReducedMotion.mockReturnValue(false));

  it('renders without errors', () => {
    render(<SkeletonRecipeCard />);
  });

  it('shows the "The way I make it" ribbon eyebrow', () => {
    render(<SkeletonRecipeCard />);
    expect(screen.getByText(/the way i make it/i)).toBeInTheDocument();
  });

  it('shows the "You\'ll need" ingredient prose label', () => {
    render(<SkeletonRecipeCard />);
    expect(screen.getByText(/you'll need/i)).toBeInTheDocument();
  });

  it('does not render a corner tab element', () => {
    const { container } = render(<SkeletonRecipeCard />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).not.toMatch(/rounded-xl/);
    expect(root.className).not.toMatch(/border border-border/);
  });

  it('renders three numbered step stamps', () => {
    render(<SkeletonRecipeCard />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders a static variant when reduced motion is active', () => {
    mockUseReducedMotion.mockReturnValue(true);
    const { container } = render(<SkeletonRecipeCard />);
    const animated = container.querySelectorAll('[class*="animate-"]');
    expect(animated.length).toBe(0);
  });
});
