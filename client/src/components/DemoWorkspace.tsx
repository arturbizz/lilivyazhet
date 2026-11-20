import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Clock3,
  FileImage,
  ImagePlus,
  LayoutDashboard,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  Video,
  X,
  XCircle,
} from "lucide-react";
import type { Category, CustomFilter, Product, SiteContent } from "../marketplace";
import "./workspace.css";

type DemoWorkspaceProps = {
  products: Product[];
  categories: Category[];
  onAddProduct: (p: Product) => void;
  onUpdateProduct: (id: string, changes: Partial<Product>) => void;
  onAddCategory: (name: string) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  customFilters: CustomFilter[];
  onAddFilter: (name: string) => void;
  onUpdateFilter: (id: string, name: string) => void;
  onDeleteFilter: (id: string) => void;
  content: SiteContent;
  onUpdateContent: (changes: Partial<SiteContent>) => void;
  onClose: () => void;
};

type Mode = "maker" | "moderation";

const MAX_IMAGE_SIZE = 700 * 1024;
const DEMO_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='700' viewBox='0 0 900 700'%3E%3Crect width='900' height='700' fill='%23eee8ee'/%3E%3Ccircle cx='450' cy='300' r='170' fill='%23c9b5c9'/%3E%3Ccircle cx='390' cy='280' r='18' fill='%23353039'/%3E%3Ccircle cx='510' cy='280' r='18' fill='%23353039'/%3E%3Cpath d='M400 370q50 40 100 0' fill='none' stroke='%23353039' stroke-width='12' stroke-linecap='round'/%3E%3Ctext x='450' y='590' text-anchor='middle' font-family='serif' font-size='34' fill='%23777085'%3Eдемо-изображение%3C/text%3E%3C/svg%3E";

const statusLabels: Record<Product["status"], string> = {
  published: "Опубликовано",
  pending: "На модерации",
  rejected: "Нужно исправить",
  draft: "Черновик",
};

const formatPrice = (price: number) => `${new Intl.NumberFormat("ru-RU").format(price)} ₽`;

export default function DemoWorkspace({
  products,
  categories,
  onAddProduct,
  onUpdateProduct,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  customFilters,
  onAddFilter,
  onUpdateFilter,
  onDeleteFilter,
  content,
  onUpdateContent,
  onClose,
}: DemoWorkspaceProps) {
  const [mode, setMode] = useState<Mode>("maker");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(categories[0]?.id ?? "");
  const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [seller, setSeller] = useState("Демо-имя мастерской");
  const [city, setCity] = useState("Демо-город");
  const [videoUrl, setVideoUrl] = useState("");
  const [madeToOrder, setMadeToOrder] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [imageError, setImageError] = useState("");
  const [moderationNote, setModerationNote] = useState<Record<string, string>>({});
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [filterName, setFilterName] = useState("");
  const [editingFilter, setEditingFilter] = useState<string | null>(null);
  const [editingFilterName, setEditingFilterName] = useState("");
  const [headline, setHeadline] = useState(content.headline);
  const [subheading, setSubheading] = useState(content.subheading);
  const [coverDescription, setCoverDescription] = useState(content.description);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categoryNames = useMemo(
    () => new Map(categories.map((item) => [item.id, item.name])),
    [categories],
  );
  const submittedProducts = products.filter((product) => product.id.startsWith("submission-") && product.status !== "draft");

  useEffect(() => {
    if (category && !categories.some((item) => item.id === category)) setCategory(categories[0]?.id ?? "");
  }, [categories, category]);

  useEffect(() => {
    setHeadline(content.headline); setSubheading(content.subheading); setCoverDescription(content.description);
  }, [content]);

  const handleImages = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setImageError("");
    if (files.length > 3) {
      setImageError("Можно выбрать не больше 3 изображений.");
      event.target.value = "";
      return;
    }
    const invalid = files.find((file) => !file.type.startsWith("image/") || file.size > MAX_IMAGE_SIZE);
    if (invalid) {
      setImageError(`${invalid.name}: изображение должно быть не больше 700 КБ.`);
      event.target.value = "";
      return;
    }
    Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
            reader.readAsDataURL(file);
          }),
      ),
    )
      .then(setImages)
      .catch(() => setImageError("Не удалось прочитать изображение. Попробуйте ещё раз."));
  };

  const submitProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericPrice = Number(price.replace(",", "."));
    if (!title.trim() || !category || !categories.some((item) => item.id === category) || !description.trim() || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      setFormError(!categories.some((item) => item.id === category) ? "Выбранная категория больше недоступна. Выберите актуальную категорию." : "Заполните название, категорию, описание и укажите цену больше 0.");
      return;
    }
    if (videoUrl && !/^https:\/\//i.test(videoUrl)) {
      setFormError("Ссылка на видео должна начинаться с https:// или оставьте поле пустым.");
      return;
    }
    const product: Product = {
      id: `submission-${Date.now()}`,
      title: title.trim(),
      price: numericPrice,
      category,
      image: images[0] ?? DEMO_IMAGE,
      images: images.length ? images : [DEMO_IMAGE],
      videoUrl: videoUrl.trim() || undefined,
      description: description.trim(),
      seller: seller.trim() || "Демо-имя мастерской",
      city: city.trim() || "Демо-город",
      madeToOrder,
      status: "pending",
      premium: false,
      filterIds: selectedFilterIds.filter((id) => customFilters.some((filter) => filter.id === id)),
    };
    onAddProduct(product);
    setTitle(""); setPrice(""); setDescription(""); setVideoUrl(""); setImages([]); setMadeToOrder(false); setSelectedFilterIds([]); setFormError("");
  };

  const moderate = (product: Product, status: Product["status"]) => {
    const note = moderationNote[product.id]?.trim() ?? "";
    if (status === "rejected" && !note) {
      setModerationNote((current) => ({ ...current, [product.id]: "" }));
      return;
    }
    onUpdateProduct(product.id, { status, reason: status === "rejected" ? note : undefined, premium: status === "published" ? product.premium : false });
  };

  const addCategory = () => {
    const name = categoryName.trim();
    if (!name) return;
    onAddCategory(name);
    setCategoryName("");
  };

  const deleteCategory = (item: Category) => {
    if (products.some((product) => product.category === item.id)) {
      setFormError(`Категорию «${item.name}» нельзя удалить: в ней есть карточки.`);
      return;
    }
    setFormError("");
    onDeleteCategory(item.id);
  };

  return (
    <section className="demo-workspace" aria-label="Демо-кабинет мастера и модерации">
      <header className="workspace-header">
        <div>
          <div className="workspace-kicker"><Sparkles size={15} /> Интерактивный прототип</div>
          <h1>Рабочее пространство</h1>
          <p>Два демонстрационных сценария: от заявки мастерицы до решения Лилии.</p>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Закрыть демо"><X size={19} /></button>
      </header>
      <div className="demo-warning"><CircleHelp size={17} /><span><strong>Это демонстрация.</strong> Переключатели ниже не являются защитой доступа. Не вводите персональные данные. Всё хранится только в этом браузере.</span></div>
      <nav className="mode-switch" aria-label="Режим демонстрации">
        <button className={mode === "maker" ? "mode-button active" : "mode-button"} onClick={() => setMode("maker")}><LayoutDashboard size={17} /> Кабинет мастера <span>демо</span></button>
        <button className={mode === "moderation" ? "mode-button active" : "mode-button"} onClick={() => setMode("moderation")}><ShieldCheck size={17} /> Демо модерации <span>демо</span></button>
      </nav>

      {mode === "maker" ? (
        <div className="workspace-grid">
          <form className="workspace-card product-form" onSubmit={submitProduct}>
            <div className="card-heading"><div><span className="eyebrow">Шаг 01 / мастерская</span><h2>Создать заявку</h2></div><Upload size={22} /></div>
            <p className="muted">Заполните данные работы — после отправки она попадёт на проверку.</p><p className="auth-placeholder-note">Вход через VK ID будет подключён позже.</p>
            <div className="field-grid">
              <label>Название работы<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например, Зайка в бандане" /></label>
              <label>Цена, ₽<input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="2900" /></label>
              <label>Демо-имя мастерской<input value={seller} onChange={(e) => setSeller(e.target.value)} /></label>
              <label>Демо-город<input value={city} onChange={(e) => setCity(e.target.value)} /></label>
            </div>
            <label>Категория<select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Выберите категорию</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <div className="filter-field"><span>Фильтры</span>{customFilters.length === 0 ? <span className="demo-field-note">Пока нет пользовательских фильтров.</span> : <span className="filter-check-list">{customFilters.map((filter) => <label className="filter-check" key={filter.id}><input type="checkbox" checked={selectedFilterIds.includes(filter.id)} onChange={(e) => setSelectedFilterIds((current) => e.target.checked ? [...current, filter.id] : current.filter((id) => id !== filter.id))} /><span>{filter.name}</span></label>)}</span>}</div>
            <label>Описание<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Расскажите о материалах, размере и особенностях работы" rows={5} /></label>
            <div className="upload-box"><div className="upload-title"><FileImage size={19} /><span>Фото работы <small>до 3 файлов, до 700 КБ каждый</small></span></div><label className="upload-button"><ImagePlus size={17} /> Выбрать фото<input type="file" accept="image/*" multiple onChange={handleImages} /></label>{images.length > 0 && <div className="preview-row">{images.map((src, index) => <img key={`${src}-${index}`} src={src} alt={`Предпросмотр ${index + 1}`} />)}</div>}{images.length === 0 && <div className="demo-preview"><img src={DEMO_IMAGE} alt="Демонстрационное изображение" /><span>Будет использовано демо-изображение</span></div>}</div>
            {imageError && <p className="inline-error"><AlertCircle size={15} />{imageError}</p>}
            <label className="video-field"><span><Video size={17} /> Ссылка на видео <small>необязательно, только https://</small></span><input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." /></label>
            <label className="check-row"><input type="checkbox" checked={madeToOrder} onChange={(e) => setMadeToOrder(e.target.checked)} /><span>Изготавливаю под заказ</span></label>
            {formError && <p className="inline-error"><AlertCircle size={15} />{formError}</p>}
            <button className="primary-button" type="submit"><Upload size={17} /> Отправить на модерацию</button>
          </form>
          <aside className="workspace-card submissions-card"><div className="card-heading"><div><span className="eyebrow">Шаг 02 / история</span><h2>Мои заявки</h2></div><span className="count-badge">{submittedProducts.length}</span></div>{submittedProducts.length === 0 ? <EmptyState text="Здесь появятся отправленные работы." /> : <div className="submission-list">{submittedProducts.map((product) => <article className="submission-item" key={product.id}><img src={product.image || DEMO_IMAGE} alt="" /><div className="submission-content"><div className="submission-top"><strong>{product.title}</strong><StatusPill status={product.status} /></div><span>{formatPrice(product.price)} · {categoryNames.get(product.category) ?? "Без категории"}</span>{product.reason && <p className="reason"><strong>Причина:</strong> {product.reason}</p>}</div></article>)}</div>}<div className="mini-note"><Clock3 size={16} /> Обычно проверка занимает один демонстрационный шаг.</div></aside>
        </div>
      ) : (
        <div className="moderation-layout">
          <div className="moderation-main workspace-card"><div className="card-heading"><div><span className="eyebrow">Лилия / очередь проверки</span><h2>Заявки на модерацию</h2></div><span className="count-badge">{products.filter((product) => product.status === "pending").length}</span></div>{products.length === 0 ? <EmptyState text="Пока нет карточек для проверки." /> : <div className="moderation-list">{products.map((product) => <article className={`moderation-item ${expandedId === product.id ? "expanded" : ""}`} key={product.id}><button className="moderation-summary" onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}><img src={product.image || DEMO_IMAGE} alt="" /><span className="summary-copy"><strong>{product.title}</strong><small>{product.seller} · {categoryNames.get(product.category) ?? "Без категории"}</small></span><StatusPill status={product.status} />{expandedId === product.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>{expandedId === product.id && <div className="moderation-detail"><div className="detail-gallery">{(product.images?.length ? product.images : [product.image || DEMO_IMAGE]).map((src, index) => <img key={`${src}-${index}`} src={src} alt={`${product.title}, фото ${index + 1}`} />)}</div><div className="detail-copy"><p>{product.description}</p><div className="detail-meta"><span>{formatPrice(product.price)}</span><span>{product.city}</span>{product.madeToOrder && <span>Под заказ</span>}{product.videoUrl && <a href={product.videoUrl} target="_blank" rel="noreferrer"><Video size={14} /> Видео</a>}</div>{product.status === "pending" && <><label className="reason-field">Рекомендация или причина при отклонении<textarea value={moderationNote[product.id] ?? ""} onChange={(e) => setModerationNote((current) => ({ ...current, [product.id]: e.target.value }))} placeholder="Например: добавьте фото крупнее и уточните размер" rows={3} /></label><div className="moderation-actions"><button className="secondary-button" onClick={() => moderate(product, "rejected")}><XCircle size={16} /> Отклонить</button><button className="primary-button compact" onClick={() => moderate(product, "published")}><CheckCircle2 size={16} /> Опубликовать</button></div>{product.status === "pending" && !moderationNote[product.id]?.trim() && <small className="action-hint"><CircleHelp size={14} /> Для отклонения обязательно напишите причину и рекомендацию.</small>}</>}{product.status === "published" && <label className="premium-toggle"><input type="checkbox" checked={product.premium} onChange={(e) => onUpdateProduct(product.id, { premium: e.target.checked })} /><span><Sparkles size={16} /> Премиум-отметка</span><small>Доступна только опубликованным карточкам</small></label>}{product.status === "rejected" && product.reason && <div className="rejection-box"><AlertCircle size={15} /><span><strong>Причина:</strong> {product.reason}</span></div>}</div></div>}</article>)}</div>}</div>
          <aside className="workspace-card categories-card"><div className="card-heading"><div><span className="eyebrow">Настройки каталога</span><h2>Категории и фильтры</h2></div><Tag size={21} /></div><p className="muted">Добавляйте и переименовывайте разделы. Удаление возможно только для пустой категории.</p><div className="add-category"><input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Новая категория" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }} /><button className="icon-action" onClick={addCategory} aria-label="Добавить категорию"><Plus size={17} /></button></div><div className="category-list">{categories.map((item) => <div className="category-row" key={item.id}>{editingCategory === item.id ? <><input autoFocus value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} /><button className="icon-action" onClick={() => { if (editingCategoryName.trim()) onUpdateCategory(item.id, editingCategoryName.trim()); setEditingCategory(null); }} aria-label="Сохранить"><Check size={16} /></button></> : <><span>{item.name}</span><div><button className="text-icon" onClick={() => { setEditingCategory(item.id); setEditingCategoryName(item.name); }} aria-label={`Переименовать ${item.name}`}><Pencil size={15} /></button><button className="text-icon danger" onClick={() => deleteCategory(item)} aria-label={`Удалить ${item.name}`}><Trash2 size={15} /></button></div></>}</div>)}</div><div className="demo-filter-section"><h3>Пользовательские фильтры</h3><p className="demo-field-note">Это демонстрация: изменения сохраняются только в текущем демо.</p><div className="add-category"><input value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="Новый фильтр" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const name = filterName.trim(); if (name) { onAddFilter(name); setFilterName(""); } } }} /><button className="icon-action" onClick={() => { const name = filterName.trim(); if (name) { onAddFilter(name); setFilterName(""); } }} aria-label="Добавить фильтр"><Plus size={17} /></button></div><div className="category-list">{customFilters.map((item) => <div className="category-row" key={item.id}>{editingFilter === item.id ? <><input autoFocus value={editingFilterName} onChange={(e) => setEditingFilterName(e.target.value)} /><button className="icon-action" onClick={() => { if (editingFilterName.trim()) onUpdateFilter(item.id, editingFilterName.trim()); setEditingFilter(null); }} aria-label="Сохранить"><Check size={16} /></button></> : <><span>{item.name}</span><div><button className="text-icon" onClick={() => { setEditingFilter(item.id); setEditingFilterName(item.name); }} aria-label={`Переименовать ${item.name}`}><Pencil size={15} /></button><button className="text-icon danger" onClick={() => onDeleteFilter(item.id)} aria-label={`Удалить ${item.name}`}><Trash2 size={15} /></button></div></>}</div>)}</div></div><div className="demo-content-editor"><h3>Обложка главной</h3><p className="demo-field-note">Это демонстрация редактирования контента.</p><label>Заголовок<input value={headline} onChange={(e) => setHeadline(e.target.value)} /></label><label>Подзаголовок<input value={subheading} onChange={(e) => setSubheading(e.target.value)} /></label><label>Описание<textarea value={coverDescription} onChange={(e) => setCoverDescription(e.target.value)} rows={4} /></label><button className="primary-button compact" onClick={() => onUpdateContent({ headline, subheading, description: coverDescription })}><Check size={16} /> Сохранить</button></div>{formError && <p className="inline-error"><AlertCircle size={15} />{formError}</p>}</aside>
        </div>
      )}
    </section>
  );
}

function StatusPill({ status }: { status: Product["status"] }) { return <span className={`status-pill ${status}`}>{status === "published" ? <Check size={13} /> : status === "rejected" ? <X size={13} /> : status === "pending" ? <Clock3 size={13} /> : null}{statusLabels[status]}</span>; }
function EmptyState({ text }: { text: string }) { return <div className="empty-state"><div><FileImage size={22} /></div><p>{text}</p></div>; }
