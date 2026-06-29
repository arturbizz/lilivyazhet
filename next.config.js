/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['ваш-проект.supabase.co'], // замените на ваш supabase URL
  },
};
module.exports = nextConfig;
