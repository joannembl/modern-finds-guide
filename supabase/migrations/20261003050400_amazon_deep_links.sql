-- Keep the existing HTTPS/domain restrictions; allow Amazon's exact deep-link host.
alter table public.products drop constraint products_affiliate_url_check;
alter table public.products add constraint products_affiliate_url_check check (
 affiliate_url ~* '^https://(amzn\.to|link\.amazon|([a-z0-9-]+\.)?amazon\.(com|ca|co\.uk|de|fr|it|es|co\.jp|com\.au|in))(/|\?|#|$)'
);
