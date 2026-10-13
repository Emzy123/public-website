/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sinet.africa',
  generateRobotsTxt: false,
  outDir: 'public',
  exclude: ['/blueprint', '/transparency', '/admin/*', '/portal/*'],
};
