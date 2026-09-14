-- =====================================================================
--  ЛИЛИ ВЯЖЕТ — МИГРАЦИЯ 001: ФУНДАМЕНТ МАРКЕТПЛЕЙСА
-- ---------------------------------------------------------------------
--  Как запустить: Supabase → SQL Editor → New query → вставить ВЕСЬ
--  файл → Run. Скрипт выполняется целиком или не выполняется совсем
--  (при ошибке ничего не изменится). Существующие данные не удаляются.
--  Повторный запуск безопасен.
--
--  Что делает:
--   1. Закрывает дыру: раньше любой пользователь мог сам сделать себя
--      админом или мастером через консоль браузера.
--   2. Мастерские (shops): страница мастера, обложка, тема, соцсети,
--      способы доставки, публикация витрины.
--   3. Медиа мастера: фото, шортсы, полноценные видео (shop_media).
--   4. Заявки «Стать мастером», категории, настройки площадки (10%).
--   5. Заказы по мастерам + комиссия площадки + платежи ЮKassa.
--   6. Хранилище файлов (bucket «media») с правами «каждый — в свою папку».
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 0. Служебные функции
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------------
-- 1. PROFILES — роли и защита от самоназначения
-- ---------------------------------------------------------------------

alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- даты «без часового пояса» → с часовым поясом (иначе в браузере время съезжает)
alter table public.profiles alter column created_at type timestamptz using created_at at time zone 'UTC';

-- приводим роли к трём: buyer / master / admin
update public.profiles
   set role = case when role = 'admin' then 'admin'
                   when role in ('master', 'seller') then 'master'
                   else 'buyer' end
 where role is null or role not in ('buyer', 'master', 'admin');
alter table public.profiles alter column role set default 'buyer';
alter table public.profiles alter column role set not null;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('buyer', 'master', 'admin'));

-- Роль может менять только админ (или сама база через защищённые функции)
create or replace function public.protect_profile_role()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role
     and current_user in ('authenticated', 'anon')
     and not public.is_admin() then
    raise exception 'Недостаточно прав для изменения роли' using errcode = '42501';
  end if;
  if new.id is distinct from old.id then
    raise exception 'Нельзя менять id профиля' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role before update on public.profiles
  for each row execute function public.protect_profile_role();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Профиль создаётся при первом входе (роль всегда buyer)
create or replace function public.ensure_profile()
returns public.profiles language plpgsql security definer set search_path = public as $$
declare
  p public.profiles;
  meta jsonb;
begin
  if auth.uid() is null then
    raise exception 'Требуется вход' using errcode = '28000';
  end if;
  select * into p from public.profiles where id = auth.uid();
  if found then return p; end if;

  select raw_user_meta_data into meta from auth.users where id = auth.uid();
  insert into public.profiles (id, full_name, role)
  values (auth.uid(), coalesce(nullif(trim(meta->>'full_name'), ''), ''), 'buyer')
  on conflict (id) do nothing;

  select * into p from public.profiles where id = auth.uid();
  return p;
end $$;

-- ---------------------------------------------------------------------
-- 2. SHOPS — мастерская (страница мастера)
-- ---------------------------------------------------------------------

create table if not exists public.shops (
  id                 uuid primary key references public.profiles(id) on delete cascade,
  slug               text not null unique,
  name               text not null,
  tagline            text,                       -- одна строка под именем
  bio                text,                       -- «О мастере»
  city               text,
  avatar_url         text,
  cover_url          text,
  theme              text not null default 'aurora',
  socials            jsonb not null default '{}'::jsonb,   -- {"telegram": "...", "vk": "...", "instagram": "..."}
  delivery_options   jsonb not null default '[]'::jsonb,   -- [{"id":"post","name":"Почта России","price":350,"days":"5–10 дней"}]
  free_shipping_from numeric(12,2),
  delivery_note      text,
  processing_days    integer,                    -- за сколько дней мастер отправляет заказ
  legal_name         text,                       -- ФИО / название для покупателя
  inn                text,
  commission_rate    numeric(5,4),               -- null = общая ставка площадки
  is_published       boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint shops_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  constraint shops_theme_check check (theme in ('aurora', 'rose', 'lavender', 'sunset', 'mint', 'linen')),
  constraint shops_name_len check (char_length(name) between 1 and 80),
  constraint shops_commission_check check (commission_rate is null or (commission_rate >= 0 and commission_rate < 1)),
  constraint shops_https_media check (
    (avatar_url is null or avatar_url ~ '^https://') and (cover_url is null or cover_url ~ '^https://')
  )
);

-- Продавать может тот, у кого есть мастерская
create or replace function public.has_shop()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.shops where id = auth.uid());
$$;

create or replace function public.default_shop_slug(p_id uuid)
returns text language sql immutable as $$
  select 'master-' || substr(replace(p_id::text, '-', ''), 1, 8);
$$;

-- Мастер не может сам поменять себе комиссию
create or replace function public.protect_shop_fields()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if new.commission_rate is distinct from old.commission_rate then
      raise exception 'Комиссию меняет только администратор' using errcode = '42501';
    end if;
    if new.id is distinct from old.id then
      raise exception 'Нельзя менять владельца мастерской' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_shop_fields on public.shops;
create trigger protect_shop_fields before update on public.shops
  for each row execute function public.protect_shop_fields();

drop trigger if exists shops_updated_at on public.shops;
create trigger shops_updated_at before update on public.shops
  for each row execute function public.set_updated_at();

-- Мастерские для тех, кто уже продаёт (включая админа, если у него есть товары)
insert into public.shops (id, slug, name, is_published)
select p.id,
       public.default_shop_slug(p.id),
       coalesce(nullif(trim(p.full_name), ''), 'Мастерская'),
       true
  from public.profiles p
 where p.role = 'master'
    or exists (select 1 from public.products pr where pr.seller_id = p.id)
    or exists (select 1 from public.masterclasses mc where mc.seller_id = p.id)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 3. CATEGORIES + APP SETTINGS
-- ---------------------------------------------------------------------

create table if not exists public.categories (
  slug       text primary key,
  name       text not null,
  sort_order integer not null default 0,
  is_active  boolean not null default true
);

insert into public.categories (slug, name, sort_order) values
  ('toys',        'Игрушки и куклы',        10),
  ('clothes',     'Одежда',                 20),
  ('accessories', 'Аксессуары',             30),
  ('jewelry',     'Украшения',              40),
  ('home',        'Для дома и интерьера',   50),
  ('kids',        'Для малышей',            60),
  ('bags',        'Сумки и кошельки',       70),
  ('cosmetics',   'Мыло и косметика',       80),
  ('gifts',       'Подарки и открытки',     90),
  ('supplies',    'Схемы и материалы',     100),
  ('other',       'Другое',                999)
on conflict (slug) do nothing;

create table if not exists public.app_settings (
  id              integer primary key default 1,
  commission_rate numeric(5,4) not null default 0.10,
  updated_at      timestamptz not null default now(),
  constraint app_settings_single check (id = 1),
  constraint app_settings_rate check (commission_rate >= 0 and commission_rate < 1)
);
insert into public.app_settings (id, commission_rate) values (1, 0.10) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 4. PRODUCTS
-- ---------------------------------------------------------------------

alter table public.products
  add column if not exists video_url       text,
  add column if not exists stock           integer not null default 1,
  add column if not exists made_to_order   boolean not null default false,
  add column if not exists production_days integer,
  add column if not exists status          text not null default 'active',
  add column if not exists is_featured     boolean not null default false,
  add column if not exists updated_at      timestamptz not null default now();

alter table public.products alter column created_at type timestamptz using created_at at time zone 'UTC';
alter table public.products alter column images set default '{}'::text[];

-- «Нет в наличии» из старой схемы → остаток 0
update public.products set stock = 0 where in_stock = false and stock = 1;

-- старые категории → новые
update public.products
   set category = case
         when category in ('вязаные', 'текстильные', 'амигуруми', 'игрушки') then 'toys'
         else 'other' end
 where category is not null
   and category not in (select slug from public.categories);

alter table public.products drop constraint if exists products_status_check;
alter table public.products add constraint products_status_check check (status in ('draft', 'active', 'archived'));
alter table public.products drop constraint if exists products_price_check;
alter table public.products add constraint products_price_check check (price >= 0) not valid;
alter table public.products drop constraint if exists products_stock_check;
alter table public.products add constraint products_stock_check check (stock >= 0);
alter table public.products drop constraint if exists products_category_fkey;
alter table public.products add constraint products_category_fkey
  foreign key (category) references public.categories(slug) on update cascade on delete set null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'products_seller_shop_fkey') then
    alter table public.products add constraint products_seller_shop_fkey
      foreign key (seller_id) references public.shops(id) on delete cascade;
  end if;
end $$;

-- in_stock держим в согласии с остатком автоматически
create or replace function public.products_sync_stock()
returns trigger language plpgsql as $$
begin
  new.in_stock := new.made_to_order or coalesce(new.stock, 0) > 0;
  return new;
end $$;

drop trigger if exists products_sync_stock on public.products;
create trigger products_sync_stock before insert or update on public.products
  for each row execute function public.products_sync_stock();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 5. MASTERCLASSES
-- ---------------------------------------------------------------------

alter table public.masterclasses add column if not exists cover_url text;
alter table public.masterclasses alter column created_at type timestamptz using created_at at time zone 'UTC';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'masterclasses_seller_shop_fkey') then
    alter table public.masterclasses add constraint masterclasses_seller_shop_fkey
      foreign key (seller_id) references public.shops(id) on delete cascade;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 6. SHOP MEDIA — фото, шортсы и видео мастера
-- ---------------------------------------------------------------------

create table if not exists public.shop_media (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null references public.shops(id) on delete cascade,
  kind       text not null,                -- photo | short | video
  url        text not null,                -- файл в хранилище или ссылка на VK/Rutube/YouTube
  poster_url text,                         -- обложка для загруженного видео
  title      text,
  product_id uuid references public.products(id) on delete set null,  -- «купить из видео»
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint shop_media_kind_check check (kind in ('photo', 'short', 'video')),
  constraint shop_media_https check (url ~ '^https://' and (poster_url is null or poster_url ~ '^https://'))
);

-- ---------------------------------------------------------------------
-- 7. MASTER APPLICATIONS — заявки «Стать мастером»
-- ---------------------------------------------------------------------

create table if not exists public.master_applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  shop_name     text,
  category      text,
  description   text,
  contact_info  text,
  portfolio_url text,
  status        text not null default 'pending',
  admin_comment text,
  created_at    timestamptz not null default now(),
  reviewed_at   timestamptz,
  constraint master_applications_status_check check (status in ('pending', 'approved', 'rejected'))
);

create unique index if not exists master_applications_one_pending
  on public.master_applications (user_id) where status = 'pending';

-- ---------------------------------------------------------------------
-- 8. PAYMENTS + ORDERS (заказ = один мастер; одна оплата может
--    покрывать несколько заказов из одной корзины)
-- ---------------------------------------------------------------------

create table if not exists public.payments (
  id                  uuid primary key default gen_random_uuid(),
  customer_id         uuid references public.profiles(id) on delete set null,
  amount              numeric(12,2) not null default 0,
  currency            text not null default 'RUB',
  status              text not null default 'pending',
  provider            text not null default 'yookassa',
  provider_payment_id text unique,
  confirmation_url    text,
  customer_email      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  paid_at             timestamptz,
  constraint payments_status_check check (status in ('pending', 'succeeded', 'canceled')),
  constraint payments_amount_check check (amount >= 0)
);

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.orders
  add column if not exists number            bigint generated by default as identity (start with 1001),
  add column if not exists seller_id         uuid references public.shops(id) on delete set null,
  add column if not exists payment_id        uuid references public.payments(id) on delete set null,
  add column if not exists items_total       numeric(12,2),
  add column if not exists shipping_price    numeric(12,2) not null default 0,
  add column if not exists commission_rate   numeric(5,4),
  add column if not exists commission_amount numeric(12,2) not null default 0,
  add column if not exists seller_amount     numeric(12,2),
  add column if not exists delivery_method   text,
  add column if not exists delivery_address  text,
  add column if not exists recipient_name    text,
  add column if not exists recipient_phone   text,
  add column if not exists recipient_email   text,
  add column if not exists buyer_comment     text,
  add column if not exists tracking_number   text,
  add column if not exists seller_note       text,
  add column if not exists payout_status     text not null default 'pending',
  add column if not exists paid_at           timestamptz,
  add column if not exists shipped_at        timestamptz,
  add column if not exists completed_at      timestamptz,
  add column if not exists cancelled_at      timestamptz,
  add column if not exists payout_at         timestamptz,
  add column if not exists updated_at        timestamptz not null default now();

alter table public.orders alter column created_at type timestamptz using created_at at time zone 'UTC';

update public.orders set status = 'pending'
 where status is null or status not in ('pending', 'paid', 'shipped', 'completed', 'cancelled');
alter table public.orders alter column status set default 'pending';
alter table public.orders alter column status set not null;
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'paid', 'shipped', 'completed', 'cancelled'));
alter table public.orders drop constraint if exists orders_payout_status_check;
alter table public.orders add constraint orders_payout_status_check check (payout_status in ('pending', 'paid'));

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- Позиции заказа хранят «снимок» товара: история не ломается,
-- даже если мастер изменит или удалит товар
alter table public.order_items
  add column if not exists title     text,
  add column if not exists image_url text;

update public.order_items oi
   set title = p.title, image_url = p.images[1]
  from public.products p
 where p.id = oi.product_id and oi.title is null;

-- Пересоздаём внешние ключи order_items с правильным поведением при удалении
do $$
declare c record;
begin
  for c in
    select con.conname, a.attname
      from pg_constraint con
      join pg_attribute a on a.attrelid = con.conrelid and a.attnum = any (con.conkey)
     where con.conrelid = 'public.order_items'::regclass and con.contype = 'f'
       and a.attname in ('order_id', 'product_id')
  loop
    execute format('alter table public.order_items drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.order_items add constraint order_items_order_id_fkey
  foreign key (order_id) references public.orders(id) on delete cascade;
alter table public.order_items add constraint order_items_product_id_fkey
  foreign key (product_id) references public.products(id) on delete set null;

-- Старые заказы: проставляем мастера и суммы, где это однозначно
update public.orders o
   set seller_id = x.seller_id
  from (select oi.order_id, min(p.seller_id::text)::uuid as seller_id
          from public.order_items oi join public.products p on p.id = oi.product_id
         group by oi.order_id
        having count(distinct p.seller_id) = 1) x
 where x.order_id = o.id and o.seller_id is null
   and exists (select 1 from public.shops s where s.id = x.seller_id);
update public.orders set items_total = total where items_total is null;

-- ---------------------------------------------------------------------
-- 9. ИНДЕКСЫ
-- ---------------------------------------------------------------------

create index if not exists products_seller_idx       on public.products (seller_id);
create index if not exists products_category_idx     on public.products (category);
create index if not exists products_status_created   on public.products (status, created_at desc);
create index if not exists masterclasses_seller_idx  on public.masterclasses (seller_id);
create index if not exists orders_customer_idx       on public.orders (customer_id, created_at desc);
create index if not exists orders_seller_idx         on public.orders (seller_id, created_at desc);
create index if not exists orders_payment_idx        on public.orders (payment_id);
create index if not exists order_items_order_idx     on public.order_items (order_id);
create index if not exists order_items_product_idx   on public.order_items (product_id);
create index if not exists shop_media_shop_idx       on public.shop_media (shop_id, kind, sort_order);
create index if not exists shops_published_idx       on public.shops (is_published, created_at desc);
create index if not exists payments_customer_idx     on public.payments (customer_id, created_at desc);
create index if not exists master_applications_user  on public.master_applications (user_id);

-- ---------------------------------------------------------------------
-- 10. RLS — ПРАВА ДОСТУПА
-- ---------------------------------------------------------------------

alter table public.profiles            enable row level security;
alter table public.shops               enable row level security;
alter table public.products            enable row level security;
alter table public.masterclasses       enable row level security;
alter table public.shop_media          enable row level security;
alter table public.categories          enable row level security;
alter table public.app_settings        enable row level security;
alter table public.master_applications enable row level security;
alter table public.payments            enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;

-- убираем старые политики (имена из вашей базы)
drop policy if exists "Public profiles are viewable by everyone"      on public.profiles;
drop policy if exists "Users can update own profile"                  on public.profiles;
drop policy if exists "Products are viewable by everyone"             on public.products;
drop policy if exists "Sellers can delete own products"               on public.products;
drop policy if exists "Sellers can insert their products"             on public.products;
drop policy if exists "Sellers can update own products"               on public.products;
drop policy if exists "Masterclasses are viewable by everyone"        on public.masterclasses;
drop policy if exists "Sellers can insert own masterclasses"          on public.masterclasses;
drop policy if exists "Sellers can update own masterclasses"          on public.masterclasses;
drop policy if exists "Customers see own orders"                      on public.orders;
drop policy if exists "Sellers see orders containing their products"  on public.orders;

-- чтобы скрипт можно было запускать повторно
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies
            where schemaname = 'public' and policyname like 'lv\_%' escape '\'
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- PROFILES: публичны только профили мастеров; свой — всегда; админ — все
create policy lv_profiles_select on public.profiles for select
  using (role = 'master' or id = (select auth.uid()) or public.is_admin());
create policy lv_profiles_update on public.profiles for update
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- SHOPS
create policy lv_shops_select on public.shops for select
  using (is_published or id = (select auth.uid()) or public.is_admin());
create policy lv_shops_update on public.shops for update
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());
create policy lv_shops_admin_insert on public.shops for insert
  with check (public.is_admin());
create policy lv_shops_admin_delete on public.shops for delete
  using (public.is_admin());

-- PRODUCTS: покупатели видят активные товары опубликованных мастерских
create policy lv_products_select on public.products for select
  using (
    (status = 'active' and exists (select 1 from public.shops s where s.id = products.seller_id and s.is_published))
    or seller_id = (select auth.uid())
    or public.is_admin()
  );
create policy lv_products_insert on public.products for insert
  with check (seller_id = (select auth.uid()) and public.has_shop());
create policy lv_products_update on public.products for update
  using (seller_id = (select auth.uid()) or public.is_admin())
  with check (seller_id = (select auth.uid()) or public.is_admin());
create policy lv_products_delete on public.products for delete
  using (seller_id = (select auth.uid()) or public.is_admin());

-- MASTERCLASSES
create policy lv_mc_select on public.masterclasses for select
  using (
    exists (select 1 from public.shops s where s.id = masterclasses.seller_id and s.is_published)
    or seller_id = (select auth.uid())
    or public.is_admin()
  );
create policy lv_mc_insert on public.masterclasses for insert
  with check (seller_id = (select auth.uid()) and public.has_shop());
create policy lv_mc_update on public.masterclasses for update
  using (seller_id = (select auth.uid()) or public.is_admin())
  with check (seller_id = (select auth.uid()) or public.is_admin());
create policy lv_mc_delete on public.masterclasses for delete
  using (seller_id = (select auth.uid()) or public.is_admin());

-- SHOP MEDIA
create policy lv_media_select on public.shop_media for select
  using (
    exists (select 1 from public.shops s where s.id = shop_media.shop_id and s.is_published)
    or shop_id = (select auth.uid())
    or public.is_admin()
  );
create policy lv_media_insert on public.shop_media for insert
  with check (shop_id = (select auth.uid()) and public.has_shop());
create policy lv_media_update on public.shop_media for update
  using (shop_id = (select auth.uid()) or public.is_admin())
  with check (shop_id = (select auth.uid()) or public.is_admin());
create policy lv_media_delete on public.shop_media for delete
  using (shop_id = (select auth.uid()) or public.is_admin());

-- CATEGORIES / SETTINGS: читают все, меняет админ
create policy lv_categories_select on public.categories for select using (true);
create policy lv_categories_admin on public.categories for all
  using (public.is_admin()) with check (public.is_admin());
create policy lv_settings_select on public.app_settings for select using (true);
create policy lv_settings_admin on public.app_settings for update
  using (public.is_admin()) with check (public.is_admin());

-- MASTER APPLICATIONS
create policy lv_apps_select on public.master_applications for select
  using (user_id = (select auth.uid()) or public.is_admin());
create policy lv_apps_insert on public.master_applications for insert
  with check (user_id = (select auth.uid()) and status = 'pending'
              and admin_comment is null and reviewed_at is null);
create policy lv_apps_admin_update on public.master_applications for update
  using (public.is_admin()) with check (public.is_admin());

-- PAYMENTS: создаются только через place_order, меняются только сервером
create policy lv_payments_select on public.payments for select
  using (customer_id = (select auth.uid()) or public.is_admin());

-- ORDERS: покупатель — свои; мастер — свои ОПЛАЧЕННЫЕ; админ — все.
-- Создание и смена статусов — только через функции ниже.
create policy lv_orders_select on public.orders for select
  using (
    customer_id = (select auth.uid())
    or (seller_id = (select auth.uid()) and paid_at is not null)
    or public.is_admin()
  );
create policy lv_orders_admin_update on public.orders for update
  using (public.is_admin()) with check (public.is_admin());
create policy lv_orders_admin_delete on public.orders for delete
  using (public.is_admin());

create policy lv_order_items_select on public.order_items for select
  using (exists (
    select 1 from public.orders o
     where o.id = order_items.order_id
       and (o.customer_id = (select auth.uid())
            or (o.seller_id = (select auth.uid()) and o.paid_at is not null)
            or public.is_admin())
  ));

-- ---------------------------------------------------------------------
-- 11. ФУНКЦИИ (RPC), которые вызывает сайт
-- ---------------------------------------------------------------------

-- Оформление заказа: цены, доставка и комиссия считаются на сервере.
-- p_items:    [{"product_id": "...", "qty": 1}, ...]
-- p_contact:  {"name","phone","email","address","comment"}
-- p_delivery: {"<id мастера>": "<id способа доставки>"}
-- Возвращает id платежа (для перехода к оплате).
create or replace function public.place_order(p_items jsonb, p_contact jsonb, p_delivery jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid        uuid := auth.uid();
  v_pids       uuid[];
  v_qtys       int[];
  v_rate_def   numeric;
  v_payment_id uuid;
  v_order_id   uuid;
  v_total      numeric(12,2) := 0;
  v_ship       numeric(12,2);
  v_method     text;
  v_rate       numeric;
  v_comm       numeric(12,2);
  v_opt        jsonb;
  r            record;
begin
  if v_uid is null then
    raise exception 'Войдите, чтобы оформить заказ' using errcode = '28000';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Корзина пуста';
  end if;
  if coalesce(trim(p_contact->>'name'), '') = ''
     or coalesce(trim(p_contact->>'phone'), '') = ''
     or coalesce(trim(p_contact->>'address'), '') = '' then
    raise exception 'Укажите имя, телефон и адрес доставки';
  end if;

  perform public.ensure_profile();

  select array_agg(product_id order by product_id), array_agg(qty order by product_id)
    into v_pids, v_qtys
    from (select (e->>'product_id')::uuid as product_id,
                 least(99, sum(greatest(1, coalesce((e->>'qty')::int, 1))))::int as qty
            from jsonb_array_elements(p_items) e
           group by 1) t;

  for r in
    select c.product_id, c.qty, p.id as pid, p.title, p.stock, p.made_to_order,
           p.status, p.seller_id, coalesce(s.is_published, false) as published
      from unnest(v_pids, v_qtys) as c(product_id, qty)
      left join public.products p on p.id = c.product_id
      left join public.shops s on s.id = p.seller_id
  loop
    if r.pid is null or r.status <> 'active' or not r.published then
      raise exception 'Один из товаров больше недоступен — обновите корзину';
    end if;
    if not r.made_to_order and r.stock < r.qty then
      raise exception 'Недостаточно в наличии: «%» (осталось %)', r.title, r.stock;
    end if;
    if r.seller_id = v_uid then
      raise exception 'Нельзя купить собственный товар';
    end if;
  end loop;

  select commission_rate into v_rate_def from public.app_settings where id = 1;
  v_rate_def := coalesce(v_rate_def, 0.10);

  insert into public.payments (customer_id, amount, customer_email)
  values (v_uid, 0, left(nullif(trim(p_contact->>'email'), ''), 200))
  returning id into v_payment_id;

  for r in
    select p.seller_id,
           sum(p.price * c.qty)::numeric(12,2) as items_total,
           s.delivery_options, s.free_shipping_from, s.commission_rate
      from unnest(v_pids, v_qtys) as c(product_id, qty)
      join public.products p on p.id = c.product_id
      join public.shops s on s.id = p.seller_id
     group by p.seller_id, s.delivery_options, s.free_shipping_from, s.commission_rate
  loop
    v_opt := null;
    select value into v_opt
      from jsonb_array_elements(coalesce(r.delivery_options, '[]'::jsonb))
     where value->>'id' = coalesce(p_delivery->>(r.seller_id::text), '')
     limit 1;
    if v_opt is null then
      select value into v_opt from jsonb_array_elements(coalesce(r.delivery_options, '[]'::jsonb)) limit 1;
    end if;

    if v_opt is null then
      v_ship := 0;
      v_method := 'По договорённости с мастером';
    else
      v_ship := case when coalesce(v_opt->>'price', '') ~ '^[0-9]+(\.[0-9]+)?$'
                     then (v_opt->>'price')::numeric else 0 end;
      v_method := coalesce(nullif(v_opt->>'name', ''), 'Доставка');
      if r.free_shipping_from is not null and r.items_total >= r.free_shipping_from then
        v_ship := 0;
      end if;
    end if;

    -- Комиссия площадки — с суммы товаров (доставку мастер оплачивает сам)
    v_rate := coalesce(r.commission_rate, v_rate_def);
    v_comm := round(r.items_total * v_rate, 2);

    insert into public.orders (
      customer_id, seller_id, payment_id, status,
      items_total, shipping_price, total, commission_rate, commission_amount, seller_amount,
      delivery_method, delivery_address, recipient_name, recipient_phone, recipient_email, buyer_comment
    ) values (
      v_uid, r.seller_id, v_payment_id, 'pending',
      r.items_total, v_ship, r.items_total + v_ship, v_rate, v_comm, r.items_total + v_ship - v_comm,
      left(v_method, 120), left(trim(p_contact->>'address'), 500), left(trim(p_contact->>'name'), 120),
      left(trim(p_contact->>'phone'), 40), left(nullif(trim(p_contact->>'email'), ''), 200),
      left(nullif(trim(p_contact->>'comment'), ''), 1000)
    ) returning id into v_order_id;

    insert into public.order_items (order_id, product_id, quantity, price, title, image_url)
    select v_order_id, p.id, c.qty, p.price, p.title, p.images[1]
      from unnest(v_pids, v_qtys) as c(product_id, qty)
      join public.products p on p.id = c.product_id
     where p.seller_id = r.seller_id;

    v_total := v_total + r.items_total + v_ship;
  end loop;

  if v_total <= 0 then
    raise exception 'Сумма заказа должна быть больше нуля';
  end if;

  update public.payments set amount = v_total where id = v_payment_id;
  return v_payment_id;
end $$;

-- Смена статуса заказа.
--   мастер:     paid → shipped (с трек-номером), shipped → completed
--   покупатель: shipped → completed («Получила»), pending → cancelled
--   админ:      любой переход
create or replace function public.update_order_status(p_order_id uuid, p_status text, p_tracking text default null, p_note text default null)
returns public.orders language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  v_uid uuid := auth.uid();
  v_ok boolean := false;
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'Заказ не найден'; end if;

  if public.is_admin() then
    v_ok := p_status in ('pending', 'paid', 'shipped', 'completed', 'cancelled');
  elsif o.seller_id = v_uid and o.paid_at is not null then
    v_ok := (o.status = 'paid' and p_status = 'shipped')
         or (o.status = 'shipped' and p_status in ('shipped', 'completed'));
  elsif o.customer_id = v_uid then
    v_ok := (o.status = 'shipped' and p_status = 'completed')
         or (o.status = 'pending' and p_status = 'cancelled');
  end if;

  if not v_ok then
    raise exception 'Нельзя перевести заказ из статуса «%» в «%»', o.status, p_status using errcode = '42501';
  end if;

  update public.orders set
    status          = p_status,
    tracking_number = coalesce(nullif(trim(p_tracking), ''), tracking_number),
    seller_note     = coalesce(nullif(trim(p_note), ''), seller_note),
    shipped_at      = case when p_status = 'shipped' and shipped_at is null then now() else shipped_at end,
    completed_at    = case when p_status = 'completed' then now() else completed_at end,
    cancelled_at    = case when p_status = 'cancelled' then now() else cancelled_at end
  where id = p_order_id
  returning * into o;

  -- если покупатель отменил неоплаченный заказ и других заказов в платеже не осталось
  if p_status = 'cancelled' and o.payment_id is not null
     and not exists (select 1 from public.orders where payment_id = o.payment_id and status <> 'cancelled') then
    update public.payments set status = 'canceled' where id = o.payment_id and status = 'pending';
  end if;
  return o;
end $$;

-- Покупатель отменяет неоплаченную покупку (все заказы этой оплаты)
create or replace function public.cancel_payment(p_payment_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v public.payments;
begin
  select * into v from public.payments where id = p_payment_id for update;
  if not found or (v.customer_id is distinct from auth.uid() and not public.is_admin()) then
    raise exception 'Оплата не найдена' using errcode = '42501';
  end if;
  if v.status <> 'pending' then
    raise exception 'Эту покупку уже нельзя отменить';
  end if;
  update public.payments set status = 'canceled' where id = p_payment_id;
  update public.orders set status = 'cancelled', cancelled_at = now()
   where payment_id = p_payment_id and status = 'pending';
end $$;

-- Отметка о выплате мастеру (пока выплаты делаются вручную)
create or replace function public.admin_mark_payout(p_order_id uuid, p_paid boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Только для администратора' using errcode = '42501'; end if;
  update public.orders
     set payout_status = case when p_paid then 'paid' else 'pending' end,
         payout_at     = case when p_paid then now() else null end
   where id = p_order_id;
end $$;

-- Рассмотрение заявки мастера: одобрение сразу открывает мастерскую
create or replace function public.admin_review_application(p_id uuid, p_approve boolean, p_comment text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  a public.master_applications;
  v_name text;
begin
  if not public.is_admin() then raise exception 'Только для администратора' using errcode = '42501'; end if;
  select * into a from public.master_applications where id = p_id for update;
  if not found then raise exception 'Заявка не найдена'; end if;

  update public.master_applications
     set status = case when p_approve then 'approved' else 'rejected' end,
         admin_comment = nullif(trim(p_comment), ''),
         reviewed_at = now()
   where id = p_id;

  if p_approve then
    update public.profiles set role = 'master' where id = a.user_id and role = 'buyer';
    select coalesce(nullif(trim(a.shop_name), ''), nullif(trim(full_name), ''), 'Мастерская')
      into v_name from public.profiles where id = a.user_id;
    insert into public.shops (id, slug, name)
    values (a.user_id, public.default_shop_slug(a.user_id), left(v_name, 80))
    on conflict (id) do nothing;
  end if;
end $$;

-- Админ открывает мастерскую себе или любому пользователю без заявки
create or replace function public.admin_open_shop(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  if not public.is_admin() then raise exception 'Только для администратора' using errcode = '42501'; end if;
  update public.profiles set role = 'master' where id = p_user and role = 'buyer';
  select coalesce(nullif(trim(full_name), ''), 'Мастерская') into v_name from public.profiles where id = p_user;
  if v_name is null then raise exception 'Пользователь не найден'; end if;
  insert into public.shops (id, slug, name)
  values (p_user, public.default_shop_slug(p_user), left(v_name, 80))
  on conflict (id) do nothing;
end $$;

create or replace function public.admin_set_role(p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Только для администратора' using errcode = '42501'; end if;
  if p_role not in ('buyer', 'master', 'admin') then raise exception 'Неизвестная роль'; end if;
  if p_user = auth.uid() and p_role <> 'admin' then raise exception 'Нельзя снять права администратора с себя'; end if;
  update public.profiles set role = p_role where id = p_user;
end $$;

-- Список пользователей с email (email не хранится в открытой таблице)
create or replace function public.admin_list_users()
returns table (id uuid, email text, full_name text, role text, created_at timestamptz, has_shop boolean)
language sql stable security definer set search_path = public as $$
  select p.id, u.email::text, p.full_name, p.role, p.created_at,
         exists (select 1 from public.shops s where s.id = p.id)
    from public.profiles p
    left join auth.users u on u.id = p.id
   where public.is_admin()
   order by p.created_at desc nulls last;
$$;

-- Счётчик продаж для витрины мастера
create or replace function public.shop_stats(p_shop uuid)
returns table (products_count bigint, sales_count bigint)
language sql stable security definer set search_path = public as $$
  select (select count(*) from public.products where seller_id = p_shop and status = 'active'),
         (select count(*) from public.orders where seller_id = p_shop and status in ('paid', 'shipped', 'completed'));
$$;

-- --- Вызываются ТОЛЬКО сервером (Edge Function оплаты) ---

create or replace function public.mark_payment_succeeded(p_payment_id uuid, p_provider_payment_id text)
returns void language plpgsql security definer set search_path = public as $$
declare v public.payments;
begin
  select * into v from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Платёж не найден'; end if;
  if v.status = 'succeeded' then return; end if;  -- повторное уведомление — ничего не делаем

  update public.payments
     set status = 'succeeded', paid_at = now(),
         provider_payment_id = coalesce(provider_payment_id, p_provider_payment_id)
   where id = p_payment_id;

  update public.orders
     set status = 'paid', paid_at = now(), cancelled_at = null
   where payment_id = p_payment_id and status in ('pending', 'cancelled');

  -- списываем остатки (изделия «на заказ» не списываются)
  update public.products p
     set stock = greatest(0, p.stock - x.qty)
    from (select oi.product_id, sum(oi.quantity) as qty
            from public.order_items oi
            join public.orders o on o.id = oi.order_id
           where o.payment_id = p_payment_id and oi.product_id is not null
           group by oi.product_id) x
   where p.id = x.product_id and not p.made_to_order;
end $$;

create or replace function public.mark_payment_canceled(p_payment_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.payments set status = 'canceled' where id = p_payment_id and status = 'pending';
  update public.orders set status = 'cancelled', cancelled_at = now()
   where payment_id = p_payment_id and status = 'pending';
end $$;

-- Права на функции
revoke all on function public.mark_payment_succeeded(uuid, text) from public, anon, authenticated;
revoke all on function public.mark_payment_canceled(uuid)        from public, anon, authenticated;
grant execute on function public.mark_payment_succeeded(uuid, text) to service_role;
grant execute on function public.mark_payment_canceled(uuid)        to service_role;

revoke all on function public.place_order(jsonb, jsonb, jsonb)                  from public, anon;
revoke all on function public.update_order_status(uuid, text, text, text)       from public, anon;
revoke all on function public.cancel_payment(uuid)                              from public, anon;
revoke all on function public.admin_mark_payout(uuid, boolean)                  from public, anon;
revoke all on function public.admin_review_application(uuid, boolean, text)     from public, anon;
revoke all on function public.admin_open_shop(uuid)                             from public, anon;
revoke all on function public.admin_set_role(uuid, text)                        from public, anon;
revoke all on function public.admin_list_users()                                from public, anon;
revoke all on function public.ensure_profile()                                  from public, anon;
grant execute on function public.place_order(jsonb, jsonb, jsonb)               to authenticated;
grant execute on function public.update_order_status(uuid, text, text, text)    to authenticated;
grant execute on function public.cancel_payment(uuid)                           to authenticated;
grant execute on function public.admin_mark_payout(uuid, boolean)               to authenticated;
grant execute on function public.admin_review_application(uuid, boolean, text)  to authenticated;
grant execute on function public.admin_open_shop(uuid)                          to authenticated;
grant execute on function public.admin_set_role(uuid, text)                     to authenticated;
grant execute on function public.admin_list_users()                             to authenticated;
grant execute on function public.ensure_profile()                               to authenticated;
grant execute on function public.shop_stats(uuid)                               to anon, authenticated;
grant execute on function public.is_admin()                                     to anon, authenticated;
grant execute on function public.has_shop()                                     to anon, authenticated;

-- Права на новые таблицы (RLS всё равно решает, какие строки видны)
grant select on public.shops, public.categories, public.app_settings, public.shop_media to anon;
grant select, insert, update, delete on public.shops, public.shop_media, public.master_applications,
  public.categories, public.app_settings to authenticated;
grant select on public.payments to authenticated;
grant all on public.shops, public.shop_media, public.master_applications, public.categories,
  public.app_settings, public.payments to service_role;

-- ---------------------------------------------------------------------
-- 12. ХРАНИЛИЩЕ ФАЙЛОВ: bucket «media»
--     Каждый пользователь загружает только в свою папку <user_id>/...
--     Лимит 50 МБ на файл (лимит бесплатного тарифа Supabase).
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif',
              'video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "lv_media_insert_own" on storage.objects;
drop policy if exists "lv_media_select_own" on storage.objects;
drop policy if exists "lv_media_update_own" on storage.objects;
drop policy if exists "lv_media_delete_own" on storage.objects;

create policy "lv_media_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "lv_media_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "lv_media_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "lv_media_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid()::text));

commit;

-- Готово. Проверка: select slug, name, is_published from public.shops;
