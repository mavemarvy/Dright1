# Promoters Rewards Campaign

Standalone Dright1 route:

- \`/promoters-rewards\`
- \`/promoters-rewards-campaign\`

The public page does not automatically post to social platforms and does not automatically redirect visitors. Users manually copy the configured share text, post it themselves, upload proof, and submit payout details.

Admin controls are inside **Admin Panel → Promoters Rewards Campaign**.

## Backend activation

Apply \`supabase/promoters_rewards_campaign.sql\` to the **Dright1** Supabase project. The project was inactive when this feature was created because the Supabase account had reached its active free-project limit.

The schema uses:
- RLS on both public tables.
- A private screenshot bucket.
- Anonymous upload/claim creation only.
- Admin-only screenshot reading and payout data access.
- An unguessable status token for safe public status checks.
- Server-side reward-slot enforcement so no more than the configured approved limit can consume rewards.
- Explicit Data API grants required by Supabase's 2026 defaults.

Do not place a service-role key in frontend environment variables.
