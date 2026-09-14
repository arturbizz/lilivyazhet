/* Темы оформления страницы мастерицы — все в духе «северного сияния» */
export const SHOP_THEMES = {
  aurora: { name: 'Северное сияние', colors: ['#00E5A0', '#00C2FF', '#7B61FF'] },
  rose: { name: 'Пудра', colors: ['#FF8FB8', '#FFB38A', '#C79BFF'] },
  lavender: { name: 'Лаванда', colors: ['#B59CFF', '#7B61FF', '#F0A8FF'] },
  sunset: { name: 'Закат', colors: ['#FFC46B', '#FF7A8A', '#9D7BFF'] },
  mint: { name: 'Мята', colors: ['#3ED6A0', '#9BE36D', '#2BB8C9'] },
  linen: { name: 'Лён', colors: ['#D8B58C', '#B98559', '#7E5C3A'] },
};

export function themeVars(theme) {
  const t = SHOP_THEMES[theme] || SHOP_THEMES.aurora;
  return { '--a1': t.colors[0], '--a2': t.colors[1], '--a3': t.colors[2] };
}

export const themeGradient = (theme) => {
  const c = (SHOP_THEMES[theme] || SHOP_THEMES.aurora).colors;
  return `linear-gradient(135deg, ${c[0]}, ${c[1]}, ${c[2]})`;
};
