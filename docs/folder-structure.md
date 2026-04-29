# Folder Structure Rules

## Feature-Based Organization

- Each feature should be self-contained with its own components, hooks, utils, and types
- Features should be organized in `src/features/` directory
- Each feature folder should contain:
  - `components/` - Feature-specific UI components
  - `hooks/` - Feature-specific custom hooks
  - `utils/` - Feature-specific utility functions
  - `types/` - Feature-specific TypeScript types
  - `constants/` - Feature-specific constants
  - `index.ts` - Barrel export for the feature

## Shared Components

- Reusable components should be in `src/features/shared/components/`
- UI components from shadcn/ui should remain in `src/components/ui/`
- Layout components should be in `src/features/shared/components/layout/`

## File Naming

- Use kebab-case for folder names (e.g., `chat-input/`, `inventory-list/`)
- Use PascalCase for component files (e.g., `ChatInput.tsx`, `InventoryList.tsx`)
- Use camelCase for utility files (e.g., `chatUtils.ts`, `inventoryUtils.ts`)

## Import Rules

- Always use relative imports within the same feature
- Use absolute imports for cross-feature dependencies
- Import from feature barrel exports when possible

## API Routes

- API routes should be organized by feature in `src/app/api/`
- Each feature should have its own API route folder
- Example: `src/app/api/chat/route.ts`, `src/app/api/inventory/route.ts`
