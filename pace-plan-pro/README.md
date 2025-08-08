# Pace Plan Pro

A React Native running training plan app built with Expo Router and Supabase.

## Environment Setup

### 1. Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Configuration

The app uses `expo-constants` to read environment variables securely. Environment variables are exposed through `app.config.js` and configuration is handled in `src/config.ts`.

## Development

### Development UUID

For development and testing purposes, the app uses a hardcoded development UUID when no authenticated user is available:

```typescript
DEV_UUID = '11111111-1111-1111-1111-111111111111'
```

This UUID is used for:
- Creating training plans when `supabase.auth.getUser()` fails
- Fallback athlete ID in development mode
- Testing database operations without authentication

**Important:** In production, ensure proper user authentication is implemented to replace this development fallback.

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

2. Set up your `.env` file with Supabase credentials

3. Start the development server:
   ```bash
   npx expo start
   ```

## Project Structure

```
src/
├── config.ts          # Configuration and environment variables
├── components/        # Reusable React components
├── data/             # Data layer and services
│   ├── supabase.ts   # Supabase client configuration
│   └── planService.ts # Training plan data operations
├── logic/            # Business logic
└── theme/            # Design tokens and theming
```

## Features

- **Training Plans**: Create and manage weekly training schedules
- **Plan Library**: Browse and apply pre-built training templates
- **Custom Run Types**: Define custom workout types with intensity and pace
- **Settings**: Manage profile and preferences

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## Technology Stack

- **React Native** with Expo
- **Expo Router** for navigation
- **Supabase** for backend services
- **TypeScript** for type safety
- **Expo Constants** for environment variable management
