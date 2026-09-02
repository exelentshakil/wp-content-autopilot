# Traffic analytics setup

Reuses the shop's existing Supabase project (`barakahsoft`, same credentials as
the other demos). Run `supabase_traffic.sql` in that project's SQL editor to
create the `wp_autopilot_traffic_logs` table — the dashboard degrades to an
empty state until you do.

Env vars needed (same values as the other demos in this shop):

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

View the dashboard at `/traffic`. To opt out of being tracked yourself:

```js
localStorage.setItem("disable_tracking", "true");
```
