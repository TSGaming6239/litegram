# Litegram — Share your light

Litegram is a premium, original social media web application inspired by the
spirit of photo-sharing communities — but with its own visual identity, calm
aesthetic, and a handful of unique features that make posting feel lighter and
more intentional.

> A lighter, brighter social space. Share your light, one moment at a time.

---

## Features

### Core social
- Email sign-up, login, logout, forgot-password, session persistence
- Protected routes with auth guards
- Home feed with infinite scrolling, skeleton loaders, and pull-to-refresh
- Latest / Following tabs and mood-based filtering
- Explore page with trending posts, popular creators, and a discover grid
- Search users by name or username, with recent searches and suggestions
- Notifications for likes, comments, and follows (with unread badge)
- Saved posts collection (private to you)
- Create / edit / delete posts, with mood tag, location, and optional daily prompt
- Comments: add and delete your own
- Likes and quick reactions (love, funny, fire, wow)
- User profiles with avatar, cover, bio, website, location, join date
- Follow / unfollow, view followers and following
- Achievement badges (First Post, Creator, Crowd Favorite, On Fire)
- Dark and light mode with system preference detection
- Fully responsive across mobile, tablet, laptop, and desktop

### Unique to Litegram
1. **AI Caption Suggestions** — a one-tap "Suggest captions" button in the
   composer generates five creative caption ideas based on your mood and topic.
   Powered by a Supabase Edge Function.
2. **Mood Tags** — every post can carry one mood (Happy, Chill, Motivated,
   Travel, Food, Gaming, Study, Thoughtful). The feed can be filtered by mood.
3. **Daily Prompt** — one creative challenge per day on the Home page; posts can
   optionally attach the prompt.
4. **Achievement Badges** — automatically awarded for milestones (first post,
   10 posts, 100 likes, 7-day posting streak) and shown on the profile.
5. **Quick Reactions** — go beyond likes with love, funny, fire, and wow.

### Polished extras
- **Double-tap to like** with a smooth heart animation on the post image.
- **Pin posts** — pin up to 3 of your posts to the top of your profile.
- **Draft posts** — save unfinished posts (image, caption, mood, location) and
  edit, publish, or delete them later from the Drafts page.
- **Profile completion meter** — a friendly progress bar showing how complete
  your profile is, with prompts for missing fields.
- **Daily login streak** — track consecutive daily logins, with milestone badges
  for 3, 7, and 30-day streaks.
- **Emoji picker** — insert emojis into captions and comments without leaving
  the app.
- **Instant search suggestions** — live, debounced user search with recent
  searches and suggestions.
- **Copy post link** — one-tap shareable URL with a toast confirmation.
- **Theme color customization** — pick from Rose, Blue, Green, Orange, or Pink
  accent colors; saved per device alongside light/dark mode.
- **First post celebration** — a confetti animation the first time you publish.
- **Birthday badge** — optionally add your birthday; a 🎂 badge appears next to
  your name across the app on your birthday.

---

## Tech stack
- **React 18** + **TypeScript**
- **Vite** for the dev server and build
- **Tailwind CSS** for styling (with dark mode + custom design tokens)
- **Supabase** for Auth, PostgreSQL, Storage, and Edge Functions
- **lucide-react** for icons
- **react-router-dom** for routing

---

## Folder structure

```
src/
  components/      Reusable UI building blocks (Avatar, PostCard, Modal, …)
  pages/           Route-level pages (Landing, HomeFeed, Profile, …)
  layouts/         Shared layouts (AuthLayout, AppLayout)
  hooks/           Custom React hooks (useInfiniteScroll, useDebouncedValue)
  services/        Supabase data-access modules (posts, profiles, …)
  contexts/        React Context providers (Auth, Theme, Toast)
  utils/           Small helpers (cn, format, validation)
  types/           Shared TypeScript types
  lib/             Supabase client + generated DB types
  index.css        Tailwind layers + design tokens
  main.tsx         App entry
  App.tsx          Router + providers

supabase/
  functions/
    suggest-captions/   Edge function for AI caption suggestions
```

---

## Getting started

### Prerequisites
- Node.js 18+
- A Supabase project (URL + anon key)

### Install
```bash
npm install
```

### Environment variables
Create a `.env` file at the project root:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Database setup
The schema is applied via Supabase migrations. The two migrations included in
this project create:
- `profiles`, `posts`, `post_images`, `comments`, `likes`, `reactions`,
  `follows`, `saved_posts`, `notifications`, `achievements`,
  `user_achievements`, `mood_tags`, `daily_prompts`
- Storage buckets: `avatars`, `covers`, `posts`
- Row Level Security policies on every table
- A trigger that auto-creates a profile on signup
- An `award_achievements(uuid)` RPC that checks and grants badges

If you are running this against a fresh Supabase project, re-apply the
migrations (they are idempotent) using your Supabase tooling.

### Run locally
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Typecheck
```bash
npm run typecheck
```

---

## Deployment
Litegram is a static SPA — deploy the `dist/` folder to any static host
(Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, etc.). Make sure your
hosting provider has the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
environment variables set at build time, and that the Supabase project has the
schema applied and the `suggest-captions` edge function deployed.

---

## Screenshots
> Add screenshots here once you've run the app locally. Suggested captures:
> Landing, Home feed, Explore, Profile, Create post with AI caption suggestions,
> Dark mode.

---

## Future improvements
- Realtime updates for notifications and new feed posts
- Multiple-image carousel uploads
- Direct messaging
- Comment likes and threaded replies
- Hashtags and richer search
- Push notifications (PWA + service worker)
- Image optimization pipeline (variants, lazy blur placeholders)

---

## License
MIT — free to use, modify, and share. Built with care.
