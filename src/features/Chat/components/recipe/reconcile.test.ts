import { buildReconcilePlan, matchingPantryItems } from './reconcile';
import type { InventoryItem } from '@/lib/inventory/schemas';
import type { RecipeIngredientModel } from '@/lib/recipes/schemas';

const inv = (name: string, category?: InventoryItem['category']): InventoryItem => ({
  id: name,
  name,
  type: 'ingredient',
  category,
  dateAdded: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
});

const ing = (
  name: string,
  category?: RecipeIngredientModel['category'],
): RecipeIngredientModel => ({ name, category });

describe('matchingPantryItems', () => {
  it('returns every pantry item sharing a token with the ingredient', () => {
    const items = [inv('fish sauce'), inv('dark soy sauce'), inv('galangal')];
    expect(matchingPantryItems('soy sauce', items).map(i => i.name)).toEqual([
      'fish sauce',
      'dark soy sauce',
    ]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(matchingPantryItems('candlenut', [inv('galangal')])).toEqual([]);
  });
});

describe('buildReconcilePlan', () => {
  it('adds a ticked ingredient that was not in the pantry', () => {
    const plan = buildReconcilePlan(
      [ing('galangal', 'Spice')],
      [],
      new Set(['galangal']),
    );
    expect(plan.adds).toEqual([
      { name: 'galangal', type: 'ingredient', category: 'Spice' },
    ]);
    expect(plan.deletes).toEqual([]);
    expect(plan.stillMissing).toEqual([]);
  });

  it('omits category from the add payload when the ingredient has none', () => {
    const plan = buildReconcilePlan([ing('galangal')], [], new Set(['galangal']));
    expect(plan.adds).toEqual([{ name: 'galangal', type: 'ingredient' }]);
  });

  it('deletes the MATCHED pantry name, not the ingredient name', () => {
    const plan = buildReconcilePlan(
      [ing('fresh galangal')],
      [inv('galangal')],
      new Set(),
    );
    expect(plan.deletes).toEqual(['galangal']);
  });

  it('skips the delete when two pantry items match', () => {
    const plan = buildReconcilePlan(
      [ing('dark soy sauce')],
      [inv('fish sauce'), inv('soy sauce')],
      new Set(),
    );
    expect(plan.deletes).toEqual([]);
  });

  it('still reports an ambiguous unticked ingredient as missing', () => {
    const plan = buildReconcilePlan(
      [ing('dark soy sauce')],
      [inv('fish sauce'), inv('soy sauce')],
      new Set(),
    );
    expect(plan.stillMissing.map(i => i.name)).toEqual(['dark soy sauce']);
  });

  it('reports every unticked ingredient as missing, pantry or not', () => {
    const plan = buildReconcilePlan(
      [ing('chicken thigh'), ing('galangal')],
      [inv('chicken thigh')],
      new Set(),
    );
    expect(plan.stillMissing.map(i => i.name)).toEqual([
      'chicken thigh',
      'galangal',
    ]);
  });

  it('writes nothing when the ticks agree with the pantry', () => {
    const plan = buildReconcilePlan(
      [ing('chicken thigh'), ing('galangal')],
      [inv('chicken thigh')],
      new Set(['chicken thigh']),
    );
    expect(plan.adds).toEqual([]);
    expect(plan.deletes).toEqual([]);
    expect(plan.stillMissing.map(i => i.name)).toEqual(['galangal']);
  });
});
