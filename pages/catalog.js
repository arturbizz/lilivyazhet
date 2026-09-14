import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { Empty, SectionTitle, SkeletonCards } from '../components/Ui';
import { IconSearch, IconClose, Spinner } from '../components/Icons';
import { supabase } from '../lib/supabase';
import { PRODUCT_CARD_SELECT } from '../lib/config';
import { plural } from '../lib/format';

const SORTS = [
  { value: 'new', label: 'Сначала новые' },
  { value: 'cheap', label: 'Сначала дешёвые' },
  { value: 'expensive', label: 'Сначала дорогие' },
];
const PAGE_SIZE = 24;

export default function Catalog() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('new');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  useEffect(() => {
    supabase
      .from('categories')
      .select('slug,name')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setCategories(data || []));
  }, []);

  // читаем параметры из адреса (?q=, ?cat=)
  useEffect(() => {
    if (!router.isReady) return;
    const q = typeof router.query.q === 'string' ? router.query.q : '';
    const c = typeof router.query.cat === 'string' ? router.query.cat : '';
    setSearch(q);
    setQuery(q);
    setCategory(c);
  }, [router.isReady, router.query.q, router.query.cat]);

  const buildQuery = useCallback(
    (from, to) => {
      let q = supabase.from('products').select(PRODUCT_CARD_SELECT, { count: 'exact' }).eq('status', 'active');
      if (category) q = q.eq('category', category);
      if (onlyAvailable) q = q.eq('in_stock', true);
      if (query.trim()) {
        const safe = query.trim().replace(/[%,()]/g, ' ');
        q = q.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
      }
      if (sort === 'cheap') q = q.order('price', { ascending: true });
      else if (sort === 'expensive') q = q.order('price', { ascending: false });
      else q = q.order('created_at', { ascending: false });
      return q.range(from, to);
    },
    [category, onlyAvailable, query, sort]
  );

  useEffect(() => {
    let active = true;
    setProducts(null);
    setPage(0);
    buildQuery(0, PAGE_SIZE - 1).then(({ data, count }) => {
      if (!active) return;
      setProducts(data || []);
      setTotal(count || 0);
    });
    return () => {
      active = false;
    };
  }, [buildQuery]);

  const loadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    const { data } = await buildQuery(nextPage * PAGE_SIZE, nextPage * PAGE_SIZE + PAGE_SIZE - 1);
    setProducts((prev) => [...(prev || []), ...(data || [])]);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const applySearch = (e) => {
    e.preventDefault();
    setQuery(search);
    const params = {};
    if (search.trim()) params.q = search.trim();
    if (category) params.cat = category;
    router.replace({ pathname: '/catalog', query: params }, undefined, { shallow: true });
  };

  const pickCategory = (slug) => {
    setCategory(slug);
    const params = {};
    if (query.trim()) params.q = query.trim();
    if (slug) params.cat = slug;
    router.replace({ pathname: '/catalog', query: params }, undefined, { shallow: true });
  };

  const title = useMemo(() => categories.find((c) => c.slug === category)?.name || 'Все работы', [categories, category]);
  const hasMore = products && products.length < total;

  return (
    <Layout title="Каталог">
      <SectionTitle
        right={
          products !== null && (
            <span className="text-sm text-gray-400 whitespace-nowrap">
              {total} {plural(total, ['работа', 'работы', 'работ'])}
            </span>
          )
        }
      >
        {title}
      </SectionTitle>

      <form onSubmit={applySearch} className="relative mb-5 max-w-xl">
        <IconSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Например: шарф, зайка, серьги"
          className="input pl-12 pr-11" />
        {search && (
          <button type="button" onClick={() => { setSearch(''); setQuery(''); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon w-8 h-8" aria-label="Очистить">
            <IconClose size={15} />
          </button>
        )}
      </form>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap mb-4">
        <button onClick={() => pickCategory('')} className={`pill ${!category ? 'pill-active' : ''}`}>Все</button>
        {categories.map((c) => (
          <button key={c.slug} onClick={() => pickCategory(c.slug)} className={`pill ${category === c.slug ? 'pill-active' : ''}`}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input py-2 w-auto text-sm pr-8">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button onClick={() => setOnlyAvailable((v) => !v)} className={`pill ${onlyAvailable ? 'pill-active' : ''}`}>
          Только в наличии
        </button>
      </div>

      {products === null ? (
        <SkeletonCards count={6} />
      ) : products.length === 0 ? (
        <Empty
          title="Ничего не нашлось"
          text="Попробуйте другое слово или посмотрите все работы — возможно, вас ждёт что‑то неожиданное."
          action={
            <button onClick={() => { setSearch(''); setQuery(''); pickCategory(''); setOnlyAvailable(false); }} className="btn-primary">
              Показать все работы
            </button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} compact />
            ))}
          </div>
          {hasMore && (
            <div className="text-center mt-10">
              <button onClick={loadMore} disabled={loadingMore} className="btn-secondary px-8">
                {loadingMore ? <Spinner size={16} /> : 'Показать ещё'}
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
