# Email delivery without a custom domain

The site supports Brevo as well as Resend. No delivery is enabled until setup and a real send test succeed.

1. Create a free account at https://app.brevo.com/account/register and complete its email/account verification. The owner must set the password and accept the terms personally.
2. In Brevo, create a sender using the owner's Gmail address and verify its code. Brevo may substitute an authenticated sender address on its infrastructure when a free email address is used. Transactional sending may need separate activation.
3. In GitHub repository Actions secrets, store `BREVO_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `EMAIL_FROM` (the verified bare email address). Never add service keys to public/config.js or commit them.
4. Set Actions variables `EMAIL_PROVIDER=brevo`, `SITE_URL=https://shadi2017.github.io/word-path/`. Keep `EMAIL_ENABLED` false until setup is verified.
5. Apply `supabase/migrations/20260923_languages.sql` to existing installations (applied to production on 2026-09-23). New installations must apply schema.sql then this migration.
6. Test with one approved account that opted into daily email. Once successful, set `EMAIL_ENABLED=true` and `public/config.js` emailEnabled to true, then publish.

The scheduler attempts delivery after 20:00 Cairo time. UI language controls the message; Bible language controls its Scripture quotation. Both are saved to each account. The application retains a conservative cap of 90 daily attempts regardless of provider limits.

A server-side reservation is written before sending. An uncertain or failed attempt remains `pending` in private.email_log and is not automatically retried that day, to avoid duplicate messages after a provider timeout. Inspect provider logs before any manual retry. The website never has access to this table or service endpoints.

Provider documentation:
- https://help.brevo.com/hc/en-us/articles/14925263522578-Comply-with-Gmail-Yahoo-and-Microsoft-s-requirements-for-email-senders
- https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender-From-name-and-From-email
- https://developers.brevo.com/reference/send-transac-email
