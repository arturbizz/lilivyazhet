import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Check, ChevronDown, Heart, Menu, Minus, Plus, Search, ShoppingBag, SlidersHorizontal, Sparkles, UserRound, X } from 'lucide-react';
import DemoWorkspace from './components/DemoWorkspace';
import { Category, CustomFilter, Product, SiteContent, defaultCategories, demoProducts, formatPrice, heroImage } from './marketplace';

const logo = `${import.meta.env.BASE_URL}assets/lili-logo.jpg`;
type Sort = 'featured' | 'low' | 'high';

function useStored<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try { const stored = localStorage.getItem(key); return stored ? JSON.parse(stored) as T : initial; }
    catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { window.dispatchEvent(new Event('lili-storage-error')); } }, [key, value]);
  return [value, setValue];
}

function App() {
  const [products, setProducts] = useStored<Product[]>('lili-demo-products-v1', demoProducts);
  const [categories, setCategories] = useStored<Category[]>('lili-demo-categories-v1', defaultCategories);
  const [customFilters, setCustomFilters] = useStored<CustomFilter[]>('lili-demo-filters-v1', []);
  const [content, setContent] = useStored<SiteContent>('lili-demo-content-v1', { headline:'Связано руками.', subheading:'С любовью — для вас.', description:'Тёплые игрушки и особенные вещи от талантливых мастеров. Чтобы радовать и быть рядом.' });
  const [favorites, setFavorites] = useStored<string[]>('lili-demo-favorites-v1', []);
  const [basket, setBasket] = useStored<string[]>('lili-demo-basket-v1', []);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [category, setCategory] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [availability, setAvailability] = useState('all');
  const [customFilter, setCustomFilter] = useState('');
  const [sort, setSort] = useState<Sort>('featured');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [notice, setNotice] = useState('');
  const [storageIssue, setStorageIssue] = useState(false);
  const catalogRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => { if (!searchRef.current?.contains(event.target as Node)) setSearchOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  useEffect(() => {
    const warn = () => setStorageIssue(true);
    window.addEventListener('lili-storage-error', warn);
    return () => window.removeEventListener('lili-storage-error', warn);
  }, []);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setSelectedProduct(null); setCartOpen(false); } };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 3600); return () => clearTimeout(timer); }, [notice]);

  const published = products.filter(product => product.status === 'published');
  const matchingSuggestions = published.filter(product => product.title.toLowerCase().includes(query.toLowerCase().trim())).slice(0, 4);
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('ru');
    const list = products.filter(p => p.status === 'published')
      .filter(p => category === 'all' || p.category === category)
      .filter(p => !q || `${p.title} ${p.description} ${p.seller}`.toLocaleLowerCase('ru').includes(q))
      .filter(p => !minPrice || p.price >= Number(minPrice))
      .filter(p => !maxPrice || p.price <= Number(maxPrice))
      .filter(p => availability === 'all' || (availability === 'order' ? p.madeToOrder : !p.madeToOrder))
      .filter(p => !customFilter || p.filterIds?.includes(customFilter))
      .filter(p => !favoritesOnly || favorites.includes(p.id));
    if (sort === 'low') return list.sort((a, b) => a.price - b.price);
    if (sort === 'high') return list.sort((a, b) => b.price - a.price);
    return list.sort((a, b) => Number(b.premium) - Number(a.premium));
  }, [products, query, category, minPrice, maxPrice, availability, customFilter, favoritesOnly, favorites, sort]);
  const basketProducts = basket.map(id => products.find(p => p.id === id && p.status === 'published')).filter((p): p is Product => Boolean(p));
  const toggleFavorite = (id: string) => setFavorites(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const addBasket = (id: string) => { setBasket(current => current.includes(id) ? current : [...current, id]); setNotice('Добавлено в демо-корзину'); };
  const goCatalog = () => { setWorkspaceOpen(false); setTimeout(() => catalogRef.current?.scrollIntoView({ behavior: 'smooth' }), 30); };
  const resetFilters = () => { setCategory('all'); setQuery(''); setMinPrice(''); setMaxPrice(''); setAvailability('all'); setCustomFilter(''); setFavoritesOnly(false); };
  const categoryLabel = (id: string) => categories.find(c => c.id === id)?.name || 'Ручная работа';
  const updateProduct = (id: string, changes: Partial<Product>) => setProducts(current => current.map(p => p.id === id ? { ...p, ...changes } : p));

  return <div className="site-shell">
    <div className="topline"><span className="topline-slogan">ВЕЩИ С ИСТОРИЕЙ. ЛЮДИ С ДУШОЙ.</span><span className="topline-mobile-demo">ДЕМО-ВЕРСИЯ · НЕ ВВОДИТЕ ЛИЧНЫЕ ДАННЫЕ</span><span className="topline-right">Демонстрационная версия <span className="dot">•</span> не вводите личные данные</span></div>
    {storageIssue && <div className="storage-warning" role="alert">Не удалось сохранить часть демо-данных в браузере: проверьте доступ к хранилищу или удалите большие фотографии. После обновления страницы изменения могут пропасть.</div>}
    <header className="site-header">
      <button className="brand" onClick={() => { setWorkspaceOpen(false); window.scrollTo({top:0,behavior:'smooth'}); }} aria-label="Лили вяжет — на главную">
        <span className="brand-art"><img src={logo} alt="" /></span><span className="brand-copy"><strong>лили вяжет</strong><small>от сердца к сердцу</small></span>
      </button>
      <nav className="desktop-nav" aria-label="Основная навигация"><button onClick={goCatalog}>Каталог</button><button onClick={() => {setWorkspaceOpen(false); setTimeout(() => document.getElementById('about')?.scrollIntoView({behavior:'smooth'}),30);}}>О площадке</button><button onClick={() => setWorkspaceOpen(true)}>Для мастеров</button></nav>
      <div className="header-search" ref={searchRef}>
        <Search size={19} strokeWidth={1.7} /><input value={query} onFocus={() => setSearchOpen(true)} onChange={e => { setQuery(e.target.value); setSearchOpen(true); }} onKeyDown={e => { if(e.key==='Enter'){setSearchOpen(false); goCatalog();} }} placeholder="Найти что-то особенное" aria-label="Поиск по каталогу" />
        {query && <button className="search-clear" onClick={() => setQuery('')} aria-label="Очистить поиск"><X size={16}/></button>}
        {searchOpen && query && <div className="suggestions"><span className="suggestion-label">ПОДСКАЗКИ</span>{matchingSuggestions.length ? matchingSuggestions.map(p => <button key={p.id} onClick={() => {setQuery(p.title); setSearchOpen(false); goCatalog();}}><Search size={14}/>{p.title}</button>) : <p>Ничего не найдено</p>}<button className="all-results" onClick={() => {setSearchOpen(false); goCatalog();}}>Показать результаты <ArrowRight size={14}/></button></div>}
      </div>
      <div className="header-actions"><button onClick={() => {setFavoritesOnly(true); goCatalog();}} aria-label="Избранное" title="Избранное"><Heart size={21} strokeWidth={1.6}/>{favorites.length > 0 && <i>{favorites.length}</i>}</button><button onClick={() => setCartOpen(true)} aria-label="Корзина" title="Корзина"><ShoppingBag size={21} strokeWidth={1.6}/>{basket.length > 0 && <i>{basket.length}</i>}</button><button className="account-button" onClick={() => setWorkspaceOpen(true)}><UserRound size={18} strokeWidth={1.6}/><span>Кабинет</span></button></div>
    </header>

    {workspaceOpen ? <DemoWorkspace products={products} categories={categories} customFilters={customFilters} content={content} onUpdateContent={changes => setContent(current => ({...current,...changes}))} onAddFilter={name => setCustomFilters(current => [...current, {id:`filter-${Date.now()}`,name}])} onUpdateFilter={(id,name) => setCustomFilters(current => current.map(f => f.id === id ? {...f,name} : f))} onDeleteFilter={id => {setCustomFilters(current => current.filter(f => f.id !== id)); setProducts(current => current.map(p => ({...p,filterIds:p.filterIds?.filter(f => f !== id)}))); if (customFilter === id) setCustomFilter('');}} onAddProduct={p => setProducts(current => [p, ...current])} onUpdateProduct={updateProduct} onAddCategory={name => setCategories(current => [...current, {id:`cat-${Date.now()}`, name}])} onUpdateCategory={(id, name) => setCategories(current => current.map(c => c.id === id ? {...c,name} : c))} onDeleteCategory={id => {setCategories(current => current.filter(c => c.id !== id)); if (category === id) setCategory('all');}} onClose={() => setWorkspaceOpen(false)} /> : <>
      <main>
        <section className="hero wrap">
          <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/> МАРКЕТПЛЕЙС ДУШЕВНЫХ ВЕЩЕЙ</div><h1>{content.headline}<br/><em>{content.subheading}</em></h1><p>{content.description}</p><div className="hero-buttons"><button className="button primary" onClick={goCatalog}>Найти свою радость <ArrowRight size={17}/></button><button className="hero-link" onClick={() => setWorkspaceOpen(true)}>Я мастер <ArrowRight size={15}/></button></div><div className="hero-note"><span className="tiny-heart">♡</span><span>Каждая вещь создана<br/><b>с заботой и теплом</b></span></div></div>
          <div className="hero-visual"><img src={heroImage} alt="Вязаная игрушка в уютной мастерской — демонстрационное изображение"/><div className="image-label"><span className="label-star">✳</span><span>создано<br/><b>с любовью</b></span></div><div className="image-index">СОЗДАНО С ЛЮБОВЬЮ</div></div>
          <div className="hero-side-note">ОТ СЕРДЦА К СЕРДЦУ <span>✳</span> РУЧНАЯ РАБОТА</div>
        </section>
        <div className="values-bar wrap"><div><span className="value-icon">♡</span><span><b>Сделано вручную</b><small>У каждой вещи свой характер</small></span></div><div><span className="value-icon">✳</span><span><b>С теплом и заботой</b><small>Создано мастерами для вас</small></span></div><div><span className="value-icon">⌁</span><span><b>Особенный подарок</b><small>Повод порадовать близких</small></span></div><button onClick={goCatalog}>СМОТРЕТЬ КАТАЛОГ <ArrowDown size={15}/></button></div>
        <section className="catalog-section wrap" id="catalog" ref={catalogRef}>
          <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> ВЫБИРАЙТЕ С СЕРДЦЕМ</div><h2>Найдите свою <em>особенную вещь</em></h2><p>Маленькие сокровища, связанные с большой любовью.</p></div><div className="catalog-counter"><span>КОЛЛЕКЦИЯ</span><b>РУЧНАЯ РАБОТА</b></div></div>
          <div className="category-scroll" aria-label="Категории каталога"><button className={category==='all'?'active':''} onClick={() => {setCategory('all'); setFavoritesOnly(false);}}>Все работы <span>↗</span></button>{categories.map(c => <button key={c.id} className={category===c.id?'active':''} onClick={() => {setCategory(c.id); setFavoritesOnly(false);}}>{c.name}</button>)}</div>
          <div className="catalog-layout"><aside className={`filters ${filtersOpen ? 'filters-open':''}`}><div className="filter-heading"><strong>Фильтры</strong><button onClick={resetFilters}>Сбросить</button></div><div className="filter-block"><div className="filter-title">Цена, ₽ <Minus size={15}/></div><div className="price-inputs"><label><span>от</span><input type="number" min="0" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0" aria-label="Цена от" /></label><label><span>до</span><input type="number" min="0" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Любая" aria-label="Цена до" /></label></div></div><div className="filter-block"><div className="filter-title">Наличие <Minus size={15}/></div><label className="radio-row"><input type="radio" checked={availability==='all'} onChange={() => setAvailability('all')}/> Все работы</label><label className="radio-row"><input type="radio" checked={availability==='ready'} onChange={() => setAvailability('ready')}/> В наличии</label><label className="radio-row"><input type="radio" checked={availability==='order'} onChange={() => setAvailability('order')}/> На заказ</label></div>{customFilters.length > 0 && <div className="filter-block"><div className="filter-title">Дополнительно <Minus size={15}/></div><label className="radio-row"><input type="radio" checked={!customFilter} onChange={() => setCustomFilter('')}/> Все работы</label>{customFilters.map(f => <label className="radio-row" key={f.id}><input type="radio" checked={customFilter === f.id} onChange={() => setCustomFilter(f.id)}/> {f.name}</label>)}</div>}<div className="filter-block"><div className="filter-title">Подборки <Minus size={15}/></div><label className="radio-row"><input type="checkbox" checked={favoritesOnly} onChange={e => setFavoritesOnly(e.target.checked)}/> Только избранное</label></div><div className="filter-note"><Sparkles size={18}/><p>Самые красивые вещи — те, в которых живёт душа.</p></div></aside>
          <div className="catalog-content"><div className="catalog-toolbar"><div><button className="mobile-filter-button" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={17}/> Фильтры</button><span className="results-count">{filtered.length} {filtered.length===1?'работа':filtered.length>=2&&filtered.length<=4?'работы':'работ'}</span></div><label className="sort-select"><span>Сначала:</span><select value={sort} onChange={e => setSort(e.target.value as Sort)}><option value="featured">Рекомендуемые</option><option value="low">Дешевле</option><option value="high">Дороже</option></select><ChevronDown size={15}/></label></div>
            {filtered.length ? <div className="product-grid">{filtered.map(p => <article className="product-card" key={p.id}><button className="product-image" onClick={() => setSelectedProduct(p)} aria-label={`Посмотреть ${p.title}`}><img src={p.image} alt={p.title} loading="lazy"/><span className="product-tag">{p.premium ? 'ПРЕМИУМ · ДЕМО' : p.madeToOrder ? 'НА ЗАКАЗ' : 'В НАЛИЧИИ'}</span></button><button className={`favorite ${favorites.includes(p.id)?'is-favorite':''}`} onClick={() => toggleFavorite(p.id)} aria-label={favorites.includes(p.id)?'Убрать из избранного':'Добавить в избранное'}><Heart size={19} fill={favorites.includes(p.id)?'currentColor':'none'}/></button><div className="product-info"><div className="product-seller">{p.seller}</div><button className="product-title" onClick={() => setSelectedProduct(p)}>{p.title}</button><div className="product-bottom"><strong>{formatPrice(p.price)}</strong><button onClick={() => addBasket(p.id)} aria-label={`Добавить ${p.title} в демо-корзину`}><Plus size={18}/></button></div></div></article>)}</div> : <div className="empty-state"><span>♡</span><h3>Пока ничего не нашлось</h3><p>Попробуйте изменить запрос или сбросить фильтры.</p><button className="button outline" onClick={resetFilters}>Сбросить фильтры</button></div>}
            <p className="demo-catalog-note">Изображения, имена мастерских и цены приведены для примера. Это не настоящие объявления.</p>
          </div></div>
        </section>
        <section className="maker-banner wrap" id="about"><div className="maker-illustration"><img src={logo} alt="Логотип Лили вяжет"/></div><div className="maker-text"><div className="eyebrow"><span className="eyebrow-line"/> МЕСТО ДЛЯ ТВОРЧЕСТВА</div><h2>Здесь любят то,<br/><em>что сделано руками</em></h2><p>«Лили вяжет» — пространство для тех, кто вкладывает душу в каждую петельку. Давайте создавать уют вместе.</p><div className="maker-links"><button className="button primary" onClick={() => setWorkspaceOpen(true)}>Стать мастером <ArrowRight size={17}/></button><a href="https://vk.ru/lilivyazhet" target="_blank" rel="noreferrer">Наша группа ВКонтакте ↗</a></div></div><div className="banner-stamp">MADE<br/>WITH<br/>LOVE <span>♡</span></div></section>
      </main>
      <footer className="footer"><div className="wrap footer-inner"><div><div className="footer-wordmark">лили вяжет <span>♡</span></div><p>От сердца к сердцу.<br/>Пространство для тёплых вещей.</p></div><div><b>МАРКЕТПЛЕЙС</b><button onClick={goCatalog}>Каталог</button><button onClick={() => setWorkspaceOpen(true)}>Для мастеров</button><a href="https://vk.ru/lilivyazhet" target="_blank" rel="noreferrer">Мы ВКонтакте ↗</a></div><div className="footer-note"><b>ДЕМОНСТРАЦИЯ</b><p>Сайт находится в разработке. Вход VK ID, реальные заказы и общая модерация пока не подключены.</p></div></div><div className="wrap footer-bottom"><span>© Лили вяжет · демо-версия</span><span>СОЗДАНО С ТЕПЛОМ И ЗАБОТОЙ</span></div></footer>
    </>}
    <nav className="mobile-nav" aria-label="Мобильная навигация"><button onClick={() => {setWorkspaceOpen(false); window.scrollTo({top:0,behavior:'smooth'});}}><span>⌂</span>Главная</button><button onClick={goCatalog}><Search size={20}/>Каталог</button><button onClick={() => {setFavoritesOnly(true); goCatalog();}}><Heart size={20}/>Избранное</button><button onClick={() => setCartOpen(true)}><ShoppingBag size={20}/>Корзина</button><button onClick={() => setWorkspaceOpen(true)}><UserRound size={20}/>Кабинет</button></nav>
    {selectedProduct && <div className="overlay" role="presentation" onMouseDown={() => setSelectedProduct(null)}><section className="product-dialog" role="dialog" aria-modal="true" aria-label={selectedProduct.title} onMouseDown={e => e.stopPropagation()}><button className="close-dialog" onClick={() => setSelectedProduct(null)} aria-label="Закрыть"><X size={21}/></button><img className="dialog-image" src={selectedProduct.image} alt={selectedProduct.title}/><div className="dialog-content"><div className="eyebrow">{categoryLabel(selectedProduct.category)} · ДЕМО</div><h2>{selectedProduct.title}</h2><div className="dialog-seller">{selectedProduct.seller} · {selectedProduct.city}</div><div className="dialog-price">{formatPrice(selectedProduct.price)}</div><p>{selectedProduct.description}</p><div className="dialog-stock"><Check size={16}/> {selectedProduct.madeToOrder?'На заказ':'В наличии'} · пример объявления</div>{selectedProduct.videoUrl && <a className="video-link" href={selectedProduct.videoUrl} target="_blank" rel="noreferrer">Посмотреть видео ↗</a>}<div className="dialog-actions"><button className="button primary" onClick={() => addBasket(selectedProduct.id)}>В демо-корзину <ShoppingBag size={18}/></button><button className="button outline icon-button" onClick={() => toggleFavorite(selectedProduct.id)} aria-label="Избранное"><Heart size={20} fill={favorites.includes(selectedProduct.id)?'currentColor':'none'}/></button></div><small>Это демонстрационная карточка. Реальный заказ и оплата пока недоступны.</small></div></section></div>}
    {cartOpen && <div className="overlay drawer-overlay" role="presentation" onMouseDown={() => setCartOpen(false)}><section className="cart-drawer" role="dialog" aria-modal="true" aria-label="Демо-корзина" onMouseDown={e => e.stopPropagation()}><div className="drawer-header"><div><div className="eyebrow">ВАШ ВЫБОР</div><h2>Корзина <em>демо</em></h2></div><button onClick={() => setCartOpen(false)} aria-label="Закрыть корзину"><X size={22}/></button></div>{basketProducts.length ? <><div className="basket-list">{basketProducts.map(p => <div className="basket-item" key={p.id}><img src={p.image} alt=""/><div><strong>{p.title}</strong><small>{p.seller}</small><b>{formatPrice(p.price)}</b></div><button onClick={() => setBasket(current => current.filter(id => id!==p.id))} aria-label={`Удалить ${p.title}`}><X size={16}/></button></div>)}</div><div className="basket-total"><span>Итого</span><strong>{formatPrice(basketProducts.reduce((sum,p) => sum+p.price,0))}</strong></div><button className="button primary full" onClick={() => setNotice('Оформление заказов пока не подключено')}>Оформить заказ <ArrowRight size={17}/></button><p className="cart-disclaimer">Демонстрационная корзина. Оплата и оформление пока не подключены.</p></> : <div className="drawer-empty"><ShoppingBag size={32} strokeWidth={1.3}/><h3>Пока здесь пусто</h3><p>Загляните в каталог — возможно, там ждёт что-то особенное.</p><button className="button primary" onClick={() => {setCartOpen(false); goCatalog();}}>Перейти в каталог <ArrowRight size={16}/></button></div>}</section></div>}
    {notice && <div className="toast" role="status">{notice}</div>}
  </div>;
}
export default App;
