create index if not exists email_marketing_campaigns_segment_id_idx
  on public.email_marketing_campaigns(segment_id);

create index if not exists email_marketing_campaigns_created_by_idx
  on public.email_marketing_campaigns(created_by);

create index if not exists email_marketing_campaigns_updated_by_idx
  on public.email_marketing_campaigns(updated_by);

create index if not exists email_marketing_deliveries_subscriber_id_idx
  on public.email_marketing_deliveries(subscriber_id);

create index if not exists email_marketing_deliveries_recipient_user_id_idx
  on public.email_marketing_deliveries(recipient_user_id);

create index if not exists email_marketing_events_subscriber_id_idx
  on public.email_marketing_events(subscriber_id);

create index if not exists email_marketing_events_recipient_user_id_idx
  on public.email_marketing_events(recipient_user_id);

create index if not exists email_marketing_segments_created_by_idx
  on public.email_marketing_segments(created_by);

create index if not exists email_marketing_segments_updated_by_idx
  on public.email_marketing_segments(updated_by);

create index if not exists email_marketing_subscribers_user_id_idx
  on public.email_marketing_subscribers(user_id);

create index if not exists email_marketing_templates_created_by_idx
  on public.email_marketing_templates(created_by);

create index if not exists email_marketing_templates_updated_by_idx
  on public.email_marketing_templates(updated_by);
