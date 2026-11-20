export type ProductStatus = 'published' | 'pending' | 'rejected' | 'draft';
export type Category = { id: string; name: string };
export type CustomFilter = { id: string; name: string };
export type SiteContent = { headline: string; subheading: string; description: string };
export type Product = {
  id: string;
  title: string;
  price: number;
  category: string;
  image: string;
  images?: string[];
  videoUrl?: string;
  description: string;
  seller: string;
  city: string;
  madeToOrder: boolean;
  status: ProductStatus;
  reason?: string;
  premium: boolean;
  filterIds?: string[];
};

export const defaultCategories: Category[] = [
  { id: 'toys', name: 'Игрушки' },
  { id: 'animals', name: 'Зверята' },
  { id: 'dolls', name: 'Куклы' },
  { id: 'kids', name: 'Для малышей' },
  { id: 'home', name: 'Для дома' },
  { id: 'accessories', name: 'Аксессуары' },
];

const images = '/manus-storage/async-images/Lw8cPvtYZdwPUc37valmhl';
export const heroImage = `${images}/image-1.webp`;
export const demoProducts: Product[] = [
  { id:'demo-bunny', title:'Зайка в нежном банте', price: 2900, category:'animals', image:`${images}/image-2.webp`, description:'Мягкая игрушка, связанная вручную. Пример оформления карточки: здесь появится описание настоящей работы мастера.', seller:'Мастерская «Тёплые нити»', city:'Москва', madeToOrder:false, status:'published', premium:true },
  { id:'demo-bear', title:'Мишка с шарфиком', price: 3400, category:'animals', image:`${images}/image-3.webp`, description:'Пример работы ручной вязки: уютный мишка с шарфиком. Карточка и цена демонстрационные.', seller:'Мастерская «Добрый клубок»', city:'Санкт-Петербург', madeToOrder:false, status:'published', premium:false },
  { id:'demo-fox', title:'Лисёнок Рыжик', price: 3100, category:'toys', image:`${images}/image-4.webp`, description:'Демонстрационный пример вязаной игрушки. Настоящие изделия появятся после подключения площадки.', seller:'Мастерская «Лесные истории»', city:'Казань', madeToOrder:true, status:'published', premium:false },
  { id:'demo-duck', title:'Утёнок в чепчике', price: 2400, category:'kids', image:`${images}/image-5.webp`, description:'Пример карточки для маркетплейса мастеров. Изображение и цена не относятся к реальному товару.', seller:'Мастерская «Ниточка»', city:'Екатеринбург', madeToOrder:true, status:'published', premium:false },
];
export const formatPrice = (price: number) => `${new Intl.NumberFormat('ru-RU').format(price)} ₽`;
