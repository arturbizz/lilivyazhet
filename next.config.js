/** @type {import('next').NextConfig} */

// Сайт на GitHub Pages живёт по адресу https://ЛОГИН.github.io/ИМЯ-РЕПОЗИТОРИЯ/,
// поэтому все ссылки на файлы должны начинаться с имени репозитория.
// Раньше оно было вписано вручную, и при несовпадении сайт открывался
// без оформления. Теперь имя берётся из самого GitHub — править ничего не нужно.
const repo = (process.env.GITHUB_REPOSITORY || '').split('/')[1] || '';
const isUserSite = repo.toLowerCase().endsWith('.github.io');

// Если подключите свой домен — задайте переменную SITE_BASE_PATH со значением ''
const basePath =
  process.env.SITE_BASE_PATH !== undefined
    ? process.env.SITE_BASE_PATH
    : repo && !isUserSite
    ? `/${repo}`
    : '';

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};
module.exports = nextConfig;
