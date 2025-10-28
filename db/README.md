# Supabase Database Reference

This app uses Supabase for authentication, storage, and row-level security.

Tables:
- `applications`
- `messages`
- `prompts`

All tables enforce RLS policies based on `auth.uid()` matching `user_id`.

For details, see `/README.md` → “Database Schema (Supabase)” section.