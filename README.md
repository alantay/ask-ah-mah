# Ask Ah Mah 🍳

_"Turn your fridge ingredients into delicious meals"_

A warm, friendly chatbot that helps you discover what to cook with the ingredients you already have. No more wasted food, no more "what should I cook?" moments - just tell Ah Mah what's in your kitchen and get inspired!

## The Problem We're Solving

Ever opened your fridge and thought "I have all these ingredients but no idea what to cook"? We've all been there. Ingredients go bad, money gets wasted, and cooking feels overwhelming.

Ask Ah Mah was born from this exact frustration - the desire to turn those random ingredients into something delicious, without the stress of complex recipes or chef-level skills.

## The Solution

Ah Mah is your friendly cooking companion who:

- **Remembers what you have** - Tell her about your ingredients and kitchen tools
- **Suggests simple recipes** - Get inspired by what's already in your kitchen
- **Encourages you** - Cooking should be fun, not scary!
- **Embraces mistakes** - Every cook learns by trying, and that's perfectly okay

## Current Features

### 🍳 Core Functionality

- **Smart Inventory Management** - Add ingredients and kitchen tools through natural conversation
- **AI-Powered Recipe Suggestions** - Get personalized recipe ideas based on what you have
- **Recipe Save & Management** - Save favorite recipes with tags and easy access
- **Friendly Chat Interface** - Talk to Ah Mah like you would a helpful friend
- **Beginner-Friendly** - No complex techniques, just good food made with love

### 🎨 User Experience

- **Modern Drawer-Based UI** - Clean, intuitive inventory management
- **Toast Notifications** - Real-time feedback for all actions
- **Recipe Display with Tags** - Beautiful recipe formatting with categorization
- **Copy to Clipboard** - Easy recipe sharing and saving
- **Responsive Design** - Works perfectly on desktop and mobile
- **Optimistic Updates** - Instant feedback with smart error handling

### 🔧 Technical Features

- **Message Persistence** - Full conversation history saved
- **Race Condition Prevention** - Smooth recipe saving experience
- **Comprehensive Testing** - 119+ passing tests for reliability
- **SEO Optimized** - Full metadata and Open Graph support
- **Error Handling** - Graceful handling of AI service issues

## Tech Stack

### Frontend

- **Next.js 14/15** - Modern React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Beautiful, responsive design
- **shadcn/ui** - Modern, accessible UI components

### Backend & AI

- **Vercel AI SDK** - Powerful AI integration with streaming
- **OpenAI GPT-4.1 Mini** - Smart, conversational AI
- **PostgreSQL** - Robust database with Prisma ORM
- **SWR** - Efficient data fetching and caching

### Development & Testing

- **Jest** - Comprehensive testing framework
- **Prisma** - Type-safe database ORM
- **Zod** - Runtime type validation
- **Conventional Commits** - Consistent commit messaging

## Getting Started

### Prerequisites

- Node.js 18+
- An OpenAI API key
- PostgreSQL database (local or hosted)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/ask-ah-mah.git
   cd ask-ah-mah
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Add your configuration to `.env.local`:

   ```
   OPENAI_API_KEY=your_api_key_here
   DATABASE_URL=your_postgresql_connection_string
   ```

4. **Set up the database**

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## How to Use

1. **Tell Ah Mah what you have** - "I have eggs, tomatoes, and some leftover rice"
2. **Ask for suggestions** - "What can I cook with these ingredients?"
3. **Get inspired** - Ah Mah will suggest simple, delicious recipes with tags
4. **Save your favorites** - Click to save recipes you love for later
5. **Manage your inventory** - Use the drawer to view and edit your ingredients
6. **Copy recipes** - Easy sharing with the copy button
7. **Cook with confidence** - Remember, the effort and love you put in is what matters!

### Pro Tips

- **Natural language works best** - "I bought some chicken" automatically adds it to your inventory
- **Be specific about quantities** - "I have 6 eggs" helps Ah Mah suggest better recipes
- **Save recipes you love** - They'll be tagged and easy to find later
- **Use the inventory drawer** - Quick access to manage what you have

## Philosophy

Cooking is love. It's how we nourish ourselves and others. You don't need to be a chef to create something wonderful - you just need to try, learn, and enjoy the process. Ah Mah believes that every effort in the kitchen is valuable, and every mistake is a step toward becoming a better cook.

## Future Plans

- **Recipe Downloads** - Save recipes as markdown files
- **Shopping Lists** - Generate lists for missing ingredients
- **Voice Input** - Speech-to-text for hands-free cooking
- **Dark Mode** - Better experience in low light
- **Advanced Features** - Nutritional info, meal planning, and more

## Contributing

We'd love your help! Whether it's suggesting new features, reporting bugs, or improving the code, every contribution helps make cooking more accessible and enjoyable.

## License

This project is open source and available under the [MIT License](LICENSE).

---

_"Cooking is like a universal language of love, and we should all learn to cook."_ - Ask Ah Mah
