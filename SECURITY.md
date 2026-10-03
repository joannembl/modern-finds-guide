# Security model

The frontend never authenticates an administrator with a bundled password. Supabase Auth provides sessions and database RLS enforces authorization on every request. Membership in `public.admin_users` is writable only from privileged database administration, not from browser users. Visitors and ordinary authenticated accounts can read only published products. Owner checks in the UI improve usability; they are not the security boundary.

Use only a project publishable key in VITE-prefixed variables. Never include service-role or secret keys. Product copy is escaped by React, not interpreted as HTML. Product links must use HTTPS and an allowed Amazon host; outbound links use sponsored/noopener/noreferrer. Image URLs must use HTTPS and may contact external image hosts.

Run live role/policy checks described in SETUP.md and Supabase Security Advisors before launch. The dedicated Modern Finds Guide backend is provisioned. Public API reads and rejected anonymous updates were verified; Security Advisors reported no warnings. The owner account is allowlisted and its database CRUD permissions were verified in a rolled-back transaction. Unrelated connected projects were not modified.
