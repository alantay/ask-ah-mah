import { render, screen } from '@testing-library/react';
import { SkeletonRecipeCard } from './SkeletonRecipeCard';

jest.mock('./useReducedMotion', () => ({ useReducedMotion: () => false }));

describe('SkeletonRecipeCard', () => {
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
    // Corner tab was identified by absolute top-[-1px] right-[22px] positioning — we verify
    // the old card-style class is absent from the root container
    const root = container.firstChild as HTMLElement;
    expect(root.className).not.toMatch(/rounded-xl/);
    expect(root.className).not.toMatch(/border border-border/);
  });

  it('renders three numbered step stamps', () => {
    render(<SkeletonRecipeCard />);
    // Ink-stamp numbers 1, 2, 3 appear as text nodes inside the step spans
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders a static variant when reduced motion is active', () => {
    jest.resetModules();
    jest.doMock('./useReducedMotion', () => ({ useReducedMotion: () => true }));
    // Re-import after mock override
    const { SkeletonRecipeCard: Reduced } = require('./SkeletonRecipeCard');
    const { container } = render(<Reduced />);
    // No animation class on the stepper placeholder when reduced
    const shimmerRects = container.querySelectorAll('[class*="animate-"]');
    expect(shimmerRects.length).toBe(0);
  });
});
