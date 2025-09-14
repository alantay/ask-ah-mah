# Ask Ah Mah - Project TODO

## 🎯 Project Overview

"Ask Ah Mah" is a web application that helps cooking beginners discover recipes through natural language conversation, making cooking accessible and intuitive by managing their kitchen inventory and providing personalized recipe suggestions.

## ✅ Completed Features

### Database & Infrastructure

- [x] Set up local PostgreSQL database and update environment variables
- [x] Update .env files to use PostgreSQL instead of SQLite
- [x] Run Prisma migrations to set up the database schema
- [x] Test database connection and verify everything works
- [x] Set up production PostgreSQL (Vercel Postgres or similar)

### UI/UX Improvements

- [x] Install and configure toast notification library (sonner)
- [x] Add toast notifications to inventory management functions
- [x] Test toast notifications for all inventory operations
- [x] Add shadcn/ui drawer component to the project
- [x] Convert inventory panel to use drawer component
- [x] Add button/trigger to open inventory drawer
- [x] Test drawer open/close and inventory operations

### Inventory Management

- [x] Add functionality to remove/delete items from inventory
- [x] Add remove/delete button to inventory item UI
- [x] Create API endpoint for removing inventory items

### Message Persistence

- [x] Add message persistence to database
- [x] Create Message table in Prisma schema
- [x] Create API endpoints for saving/loading messages
- [x] Store messages when AI responds
- [x] Load conversation history on app start

### SEO & Metadata

- [x] Add comprehensive metadata and Open Graph support
- [x] Add Open Graph and Twitter card metadata
- [x] Include SEO keywords and descriptions
- [x] Configure viewport and robots settings

## 🚧 In Progress

_No items currently in progress_

## 📋 Pending Features

### Recipe Management

- [ ] Add recipe download/save functionality
- [ ] Format recipes as markdown for download
- [ ] Add save/download button to recipe suggestions
- [ ] Add copy recipe to clipboard functionality
- [ ] Create saved recipes section in inventory drawer

### AI & Data Integration

- [ ] Add free recipe database resources to AI knowledge base
- [ ] Implement structured recipe response using generateObject with Recipe type

### User Experience

- [ ] Add speech-to-text functionality for voice input
- [ ] Add conversation management (clear history, etc.)

### Technical Improvements

- [ ] Add role type enum in Prisma schema for better type safety

## 🎨 UI/UX Enhancements

- [ ] Add loading state to prevent jarring scroll when messages load
- [ ] Improve mobile responsiveness
- [ ] Add dark mode toggle
- [ ] Enhance accessibility features

## 🔧 Technical Debt

- [ ] Clean up git branches (many feature branches exist)
- [ ] Add comprehensive error handling
- [ ] Implement proper logging
- [ ] Add unit tests
- [ ] Add integration tests

## 🚀 Future Enhancements

### Advanced Features

- [ ] User authentication and accounts
- [ ] Recipe rating and reviews
- [ ] Nutritional information
- [ ] Shopping list generation
- [ ] Meal planning capabilities
- [ ] Recipe sharing and community features

### Technical Improvements

- [ ] Migration to PostgreSQL database (if not already done)
- [ ] Advanced caching strategies
- [ ] Mobile app version
- [ ] Offline functionality
- [ ] Real-time collaboration features

## 📝 Notes

### Current Tech Stack

- **Frontend**: Next.js 14/15 (App Router), TypeScript, Tailwind CSS
- **AI Integration**: Vercel AI SDK with Google Gemini Flash
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Vercel
- **UI Components**: shadcn/ui
- **State Management**: SWR for data fetching

### Key Features Implemented

- Natural language inventory management
- AI-powered recipe suggestions
- Responsive drawer-based inventory UI
- Message persistence with conversation history
- Toast notifications for user feedback
- Comprehensive SEO metadata

### Development Workflow

- Using conventional commits format
- Feature branch workflow
- Prisma migrations for database changes
- SWR for client-side data fetching

---

_Last updated: $(date)_
_Total completed: 15/25 features_
