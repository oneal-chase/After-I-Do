-- 004_guest_name.sql — optional guest signature on photo uploads
alter table public.photos add column if not exists guest_name text;
