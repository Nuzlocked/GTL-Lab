# Pokemon Auction House - Global Trade Link

A faithful recreation of the Pokemon MMO auction house interface as a web application.

## Features

- **Pokemon Listings**: Browse Pokemon with their levels, natures, IVs, and prices
- **Interactive Purchase**: Click "Buy" to see a confirmation modal (use Spacebar to confirm, Esc to cancel)
- **Manual Refresh**: Click the refresh button to add new listings
- **Purchase Simulation**: When you buy a Pokemon, it disappears and a new one appears
- **Responsive Design**: Dark theme matching the original game interface
- **Pagination**: Navigate through multiple pages of listings (10 items per page)

## Technology Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Modern React Hooks** for state management
- **Pixelated Pokemon sprites** from PokeAPI

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

## How It Works

### Interactive Features
- **Page Refresh**: New random Pokemon listings appear when you refresh the page
- **Manual Refresh**: Click the refresh button (🔄) to add new listings manually
- **Purchase Simulation**: When you buy a Pokemon, it's removed and a new one appears
- **Pagination**: Only shows 10 listings per page, click page numbers to navigate
- **Keyboard Shortcuts**: Press Spacebar to confirm purchases, Esc to cancel

### Pokemon Data
- All Pokemon have randomized IVs (Individual Values) from 0-31
- Various natures are randomly assigned
- Price ranges from $2,999 to $5,300
- Levels range from 1 to 67

### Interface Elements
- **Navigation Tabs**: Switch between different sections (only Pokemon Listings is functional)
- **Search Controls**: Template selection and advanced search (UI only)
- **Sorting Options**: Sort by newest, oldest, price (UI only)
- **Pagination**: Navigate through multiple pages of listings (functional, shows 10 items per page)

## Development

The project is structured as follows:
- `src/components/`: React components
- `src/types/`: TypeScript type definitions
- `src/data/`: Mock data generators
- `src/index.css`: Global styles with Tailwind

## Future Enhancements

- Add sorting functionality
- Implement search filters
- Add user authentication
- Connect to a real backend
- Add more Pokemon species
- Implement real-time updates with WebSockets 