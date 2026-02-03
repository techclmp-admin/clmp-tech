# CLMP Tech - Construction Lifecycle Management Platform

Advanced Management Platform for Construction Lifecycle

## Technologies

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Backend)

## Getting Started

### Prerequisites

- Node.js 18+ and npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- A Supabase account and project

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Edge Functions

The project uses Supabase Edge Functions for:

- `ai-risk-analysis` - AI-powered weather risk analysis (requires `OPENAI_API_KEY` secret)
- `send-invitation` - Email invitations (requires `RESEND_API_KEY` and `SITE_URL` secrets)
- `get-weather` - Weather data fetching (requires `OPENWEATHER_API_KEY` secret)
- `geocode-location` - Location geocoding (requires `MAPBOX_ACCESS_TOKEN` secret)

To deploy edge functions, run:

```sh
supabase functions deploy <function-name>
```

### Database

The database schema can be exported using:

```sh
supabase db dump -f schema.sql
```

## Deployment

1. Build the project:

```sh
npm run build
```

2. Deploy the `dist` folder to your preferred hosting platform (Vercel, Netlify, etc.)

## License

Proprietary - All rights reserved
