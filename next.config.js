/** @type {import('next').NextConfig} */
// basePath — имя репозитория на GitHub Pages. Если подключите свой домен,
// поставьте здесь пустую строку ''.
const basePath = '/lilivyazhet';

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};
module.exports = nextConfig;
