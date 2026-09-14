import { useEffect, useRef, useState } from 'react';
import { IconAlert, IconClose, IconSpark, Spinner, IconYarn } from './Icons';

/* Заглушка вместо фото */
export function Placeholder({ className = '', icon = true }) {
  return (
    <div className={`aurora-soft w-full h-full flex items-center justify-center ${className}`}>
      {icon && <IconYarn size={40} className="text-gray-300" />}
    </div>
  );
}

/* Картинка с плавным появлением и заглушкой */
export function Img({ src, alt = '', className = '', imgClassName = 'object-cover', ...rest }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);
  if (!src || failed) return <Placeholder className={className} />;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && <div className="absolute inset-0 skeleton rounded-none" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`w-full h-full transition-opacity duration-500 ${imgClassName} ${loaded ? 'opacity-100' : 'opacity-0'}`}
        {...rest}
      />
    </div>
  );
}

/* Сообщение в форме: ошибка / успех / подсказка */
export function Notice({ type = 'info', children, className = '' }) {
  if (!children) return null;
  const cls =
    type === 'error'
      ? 'border-red-100 bg-red-50/70 text-red-500'
      : type === 'success'
      ? 'border-aurora-green/20 bg-aurora-green/5 text-aurora-green'
      : 'border-aurora-blue/20 bg-aurora-blue/5 text-aurora-blue';
  return (
    <div className={`animate-fade-in flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm ${cls} ${className}`}>
      {type === 'error' ? <IconAlert size={16} /> : <IconSpark size={16} />}
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}

/* Пустое состояние */
export function Empty({ icon: Icon = IconYarn, title, text, action }) {
  return (
    <div className="text-center py-16 px-4 animate-fade-in">
      <div className="mx-auto w-16 h-16 rounded-2xl aurora-chip mb-5">
        <Icon size={28} />
      </div>
      <h3 className="font-heading font-semibold text-lg text-gray-800 mb-2">{title}</h3>
      {text && <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Loading({ text = 'Загружаем…', className = 'py-20' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-gray-400 ${className}`}>
      <Spinner size={26} className="text-aurora-green" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

export function SkeletonCards({ count = 6, className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="skeleton h-56 mb-4" />
          <div className="skeleton h-4 w-2/3 mb-2" />
          <div className="skeleton h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/* Модальное окно */
export function Modal({ open, onClose, title, children, size = 'md' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  const width = size === 'lg' ? 'max-w-3xl' : size === 'sm' ? 'max-w-sm' : 'max-w-xl';
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-gray-900/30 backdrop-blur-sm p-0 sm:p-4"
      onMouseDown={(e) => e.target === ref.current && onClose?.()}
      ref={ref}
    >
      <div className={`animate-pop-in bg-white w-full ${width} rounded-t-3xl sm:rounded-3xl shadow-xl border border-gray-100 max-h-[92vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm flex items-center justify-between gap-4 px-5 sm:px-7 py-4 border-b border-gray-100 rounded-t-3xl">
          <h3 className="font-heading font-bold text-lg text-gray-900">{title}</h3>
          <button onClick={onClose} className="btn-icon" aria-label="Закрыть"><IconClose size={18} /></button>
        </div>
        <div className="px-5 sm:px-7 py-6">{children}</div>
      </div>
    </div>
  );
}

/* Подтверждение опасного действия */
export function ConfirmDialog({ open, title = 'Точно удалить?', text, confirmLabel = 'Удалить', onConfirm, onClose, busy }) {
  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={title} size="sm">
      {text && <p className="text-gray-600 text-sm leading-relaxed mb-6">{text}</p>}
      <div className="flex gap-3">
        <button onClick={onConfirm} disabled={busy} className="btn-danger flex-1 py-2.5">
          {busy ? <Spinner size={16} /> : confirmLabel}
        </button>
        <button onClick={onClose} disabled={busy} className="btn-secondary flex-1 py-2.5">Отмена</button>
      </div>
    </Modal>
  );
}

/* Заголовок раздела с тонкой линией */
export function SectionTitle({ children, right, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 mb-6 ${className}`}>
      <h2 className="font-heading font-bold text-xl sm:text-2xl text-gray-900">{children}</h2>
      <span className="accent-line hidden sm:block" />
      {right}
    </div>
  );
}

export function Field({ label, hint, error, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
      {error ? <p className="text-xs text-red-500 mt-1.5 ml-1">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex items-start gap-3 select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${checked ? 'bg-aurora-green' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
      <span>
        <span className="block text-sm font-medium text-gray-800">{label}</span>
        {hint && <span className="block text-xs text-gray-400 mt-0.5 leading-relaxed">{hint}</span>}
      </span>
    </label>
  );
}
