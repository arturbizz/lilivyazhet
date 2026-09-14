/* Единый набор тонких иконок — без эмодзи, в стиле сайта */
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const Svg = ({ size = 20, children, className = '', ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`} {...base} {...rest}>
    {children}
  </svg>
);

export const IconMenu = (p) => <Svg {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Svg>;
export const IconClose = (p) => <Svg {...p}><path d="M6 18L18 6M6 6l12 12" /></Svg>;
export const IconCart = (p) => (
  <Svg {...p}><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2.5 3h2.2l2.4 11.2a1.8 1.8 0 0 0 1.8 1.4h8.3a1.8 1.8 0 0 0 1.8-1.4L21 7H6" /></Svg>
);
export const IconHeart = (p) => <Svg {...p}><path d="M12 20s-7-4.4-7-9.3A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7 2.7c0 4.9-7 9.3-7 9.3z" /></Svg>;
export const IconUser = (p) => <Svg {...p}><circle cx="12" cy="8" r="3.6" /><path d="M4.8 20a7.4 7.4 0 0 1 14.4 0" /></Svg>;
export const IconSearch = (p) => <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-3.8-3.8" /></Svg>;
export const IconPlus = (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const IconMinus = (p) => <Svg {...p}><path d="M5 12h14" /></Svg>;
export const IconTrash = (p) => <Svg {...p}><path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M6.5 7l.8 12.1A1.9 1.9 0 0 0 9.2 21h5.6a1.9 1.9 0 0 0 1.9-1.9L17.5 7" /></Svg>;
export const IconEdit = (p) => <Svg {...p}><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" /><path d="M14.5 6.5l3 3" /></Svg>;
export const IconCheck = (p) => <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7" /></Svg>;
export const IconCheckCircle = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8.3 12.4l2.6 2.6 4.8-5.2" /></Svg>;
export const IconAlert = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5" /><path d="M12 16.2h.01" /></Svg>;
export const IconSpark = (p) => <Svg {...p}><path d="M12 3l1.9 5.6 5.6 1.9-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z" /></Svg>;
export const IconMail = (p) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3.5 7.5l7.2 5a2 2 0 0 0 2.6 0l7.2-5" /></Svg>;
export const IconPhone = (p) => <Svg {...p}><path d="M6.5 3.5h3l1.5 4-2 1.4a11 11 0 0 0 5.1 5.1l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z" /></Svg>;
export const IconChevronLeft = (p) => <Svg {...p}><path d="M15 18l-6-6 6-6" /></Svg>;
export const IconChevronRight = (p) => <Svg {...p}><path d="M9 18l6-6-6-6" /></Svg>;
export const IconChevronDown = (p) => <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>;
export const IconArrowRight = (p) => <Svg {...p}><path d="M5 12h13M13 6l6 6-6 6" /></Svg>;
export const IconArrowLeft = (p) => <Svg {...p}><path d="M19 12H6M11 18l-6-6 6-6" /></Svg>;
export const IconPlay = (p) => <Svg {...p}><path d="M8 5.5l10 6.5-10 6.5z" /></Svg>;
export const IconVideo = (p) => <Svg {...p}><rect x="3" y="6" width="12" height="12" rx="2.5" /><path d="M15 10.5l5-2.6v8.2l-5-2.6z" /></Svg>;
export const IconImage = (p) => <Svg {...p}><rect x="3" y="4.5" width="18" height="15" rx="3" /><circle cx="8.8" cy="10" r="1.6" /><path d="M4 17l4.6-4.3a2 2 0 0 1 2.7 0L20 20" /></Svg>;
export const IconUpload = (p) => <Svg {...p}><path d="M12 16V4.5" /><path d="M7.5 9L12 4.5 16.5 9" /><path d="M4.5 15.5v2A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5v-2" /></Svg>;
export const IconBox = (p) => <Svg {...p}><path d="M20.5 8.2L12 12.6 3.5 8.2" /><path d="M12 12.6V21" /><path d="M12 3l8.5 4.3v9.4L12 21l-8.5-4.3V7.3z" /></Svg>;
export const IconTruck = (p) => <Svg {...p}><path d="M3 6.5h10.5v9H3z" /><path d="M13.5 9.5H17l3 3v3h-6.5z" /><circle cx="7" cy="18" r="1.7" /><circle cx="17" cy="18" r="1.7" /></Svg>;
export const IconStore = (p) => <Svg {...p}><path d="M4 9.5V19a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19V9.5" /><path d="M3.2 9.5L5 4h14l1.8 5.5a2.6 2.6 0 0 1-4.9 1.2 2.6 2.6 0 0 1-4.9 0 2.6 2.6 0 0 1-4.9 0 2.6 2.6 0 0 1-3-1.2z" /></Svg>;
export const IconSettings = (p) => <Svg {...p}><circle cx="12" cy="12" r="3.2" /><path d="M19.5 12a7.5 7.5 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7.4 7.4 0 0 0-2-1.2L14.7 3H9.3l-.4 2.7a7.4 7.4 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7.5 7.5 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7.4 7.4 0 0 0 2 1.2l.4 2.7h5.4l.4-2.7a7.4 7.4 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.06-.4.1-.8.1-1.2z" /></Svg>;
export const IconStar = (p) => <Svg {...p}><path d="M12 3.8l2.5 5 5.6.8-4 4 .9 5.6-5-2.6-5 2.6.9-5.6-4-4 5.6-.8z" /></Svg>;
export const IconClock = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5.3l3.2 2" /></Svg>;
export const IconPin = (p) => <Svg {...p}><path d="M12 21s6.5-6 6.5-10.4A6.5 6.5 0 0 0 5.5 10.6C5.5 15 12 21 12 21z" /><circle cx="12" cy="10.5" r="2.4" /></Svg>;
export const IconLink = (p) => <Svg {...p}><path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 1 0-5-5l-1.3 1.3" /><path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 1 0 5 5l1.3-1.3" /></Svg>;
export const IconShare = (p) => <Svg {...p}><circle cx="6" cy="12" r="2.4" /><circle cx="17.5" cy="6" r="2.4" /><circle cx="17.5" cy="18" r="2.4" /><path d="M8.2 10.9l7.1-3.7M8.2 13.1l7.1 3.7" /></Svg>;
export const IconWallet = (p) => <Svg {...p}><path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h11a2 2 0 0 1 2 2" /><rect x="3.5" y="7.5" width="17" height="11" rx="2.5" /><circle cx="16.5" cy="13" r="1.2" /></Svg>;
export const IconChart = (p) => <Svg {...p}><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 20v-6M12.5 20V8M17 20v-9" /></Svg>;
export const IconUsers = (p) => <Svg {...p}><circle cx="9.5" cy="8" r="3.2" /><path d="M3.5 19a6 6 0 0 1 12 0" /><path d="M16.5 5.4a3.2 3.2 0 0 1 0 5.4M17.5 14.2a5.6 5.6 0 0 1 3 4.8" /></Svg>;
export const IconClipboard = (p) => <Svg {...p}><rect x="5" y="5" width="14" height="16" rx="2.5" /><path d="M9 5V4a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4v1" /><path d="M9 11h6M9 15h4" /></Svg>;
export const IconEye = (p) => <Svg {...p}><path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" /><circle cx="12" cy="12" r="2.8" /></Svg>;
export const IconGift = (p) => <Svg {...p}><rect x="3.5" y="9" width="17" height="11.5" rx="2" /><path d="M3.5 13.5h17M12 9v11.5" /><path d="M12 9S10.8 4 8.4 4a2.2 2.2 0 0 0 0 4.4h7.2a2.2 2.2 0 0 0 0-4.4C13.2 4 12 9 12 9z" /></Svg>;
export const IconYarn = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M5 9.5c3.4 1.2 7.6 3.6 10.4 7.6M8 5.2c3 1.8 6.6 5 8.4 9.3M4.2 14c2.6.4 6.4 2.2 8.6 5.6" strokeDasharray="2.5 2" />
  </svg>
);
export const IconLogout = (p) => <Svg {...p}><path d="M15 7V5.5A1.5 1.5 0 0 0 13.5 4h-7A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20h7a1.5 1.5 0 0 0 1.5-1.5V17" /><path d="M10 12h10M17 9l3 3-3 3" /></Svg>;
export const Spinner = ({ size = 18, className = '' }) => (
  <svg className={`animate-spin ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
