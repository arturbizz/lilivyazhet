import Link from 'next/link';
import { Img } from './Ui';
import { ORDER_STATUS, dateRu, rub } from '../lib/format';
import { productUrl, shopUrl } from '../lib/config';
import { IconTruck, IconPin, IconPhone, IconUser } from './Icons';

/* Карточка заказа. mode: 'buyer' | 'seller' | 'admin' */
export default function OrderCard({ order, mode = 'buyer', actions = null }) {
  const status = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
  const items = order.order_items || [];

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="font-heading font-semibold text-gray-900">Заказ №{order.number}</p>
          <p className="text-xs text-gray-400 mt-0.5">{dateRu(order.created_at, true)}</p>
        </div>
        <span className={`badge ${status.cls}`}>{status.label}</span>
      </div>

      {mode === 'buyer' && order.shop?.slug && (
        <Link href={shopUrl(order.shop.slug)} className="flex items-center gap-2.5 mb-4 text-sm text-gray-500 hover:text-gray-900 w-fit">
          <span className="w-7 h-7 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            <Img src={order.shop.avatar_url} alt="" className="w-full h-full" />
          </span>
          {order.shop.name}
        </Link>
      )}

      <div className="space-y-3 mb-4">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
              <Img src={it.image_url} alt="" className="w-full h-full" />
            </span>
            <span className="flex-1 min-w-0">
              {it.product_id ? (
                <Link href={productUrl(it.product_id)} className="text-sm text-gray-800 hover:text-gray-500 line-clamp-1">
                  {it.title || 'Работа'}
                </Link>
              ) : (
                <span className="text-sm text-gray-800 line-clamp-1">{it.title || 'Работа'}</span>
              )}
              <span className="block text-xs text-gray-400 mt-0.5">{it.quantity} × {rub(it.price)}</span>
            </span>
            <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{rub(it.price * it.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-50 pt-4 space-y-1.5 text-sm">
        <div className="flex justify-between text-gray-500">
          <span>Работы</span><span>{rub(order.items_total ?? order.total)}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span className="flex items-center gap-1.5"><IconTruck size={14} /> {order.delivery_method || 'Доставка'}</span>
          <span>{Number(order.shipping_price) > 0 ? rub(order.shipping_price) : 'бесплатно'}</span>
        </div>
        <div className="flex justify-between font-semibold text-gray-900 pt-1">
          <span>{mode === 'buyer' ? 'Итого' : 'Оплачено покупателем'}</span>
          <span>{rub(order.total)}</span>
        </div>
        {mode !== 'buyer' && (
          <>
            <div className="flex justify-between text-gray-400 text-xs">
              <span>Комиссия площадки {order.commission_rate ? `${Math.round(order.commission_rate * 100)}%` : ''}</span>
              <span>−{rub(order.commission_amount)}</span>
            </div>
            <div className="flex justify-between text-aurora-green font-semibold">
              <span>К выплате мастерице</span><span>{rub(order.seller_amount)}</span>
            </div>
          </>
        )}
      </div>

      {order.tracking_number && (
        <p className="mt-4 text-sm bg-gray-50 rounded-2xl px-4 py-3">
          <span className="text-gray-400">Трек‑номер: </span>
          <span className="font-medium text-gray-900 select-text">{order.tracking_number}</span>
        </p>
      )}
      {order.seller_note && <p className="mt-3 text-sm text-gray-500 leading-relaxed">{order.seller_note}</p>}

      {mode !== 'buyer' && (
        <div className="mt-4 pt-4 border-t border-gray-50 space-y-1.5 text-sm text-gray-600">
          <p className="flex items-center gap-2"><IconUser size={14} className="text-gray-400" /> {order.recipient_name}</p>
          <p className="flex items-center gap-2"><IconPhone size={14} className="text-gray-400" /> <span className="select-text">{order.recipient_phone}</span></p>
          <p className="flex items-start gap-2"><IconPin size={14} className="text-gray-400 mt-0.5" /> <span className="select-text">{order.delivery_address}</span></p>
          {order.recipient_email && <p className="text-xs text-gray-400 ml-6 select-text">{order.recipient_email}</p>}
          {order.buyer_comment && (
            <p className="bg-amber-50/60 text-amber-700 rounded-2xl px-4 py-3 mt-2 leading-relaxed">{order.buyer_comment}</p>
          )}
        </div>
      )}

      {actions && <div className="mt-5 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export const ORDER_SELECT =
  'id,number,status,total,items_total,shipping_price,commission_rate,commission_amount,seller_amount,' +
  'delivery_method,delivery_address,recipient_name,recipient_phone,recipient_email,buyer_comment,' +
  'tracking_number,seller_note,payout_status,created_at,paid_at,shipped_at,completed_at,payment_id,seller_id,customer_id,' +
  'order_items(id,title,image_url,quantity,price,product_id)';
