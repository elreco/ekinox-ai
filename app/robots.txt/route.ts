export function GET() {
  const robotsTxt = `
User-agent: *
Allow: /

# Important pages
Allow: /search
Allow: /pricing

# Disallow auth pages from being indexed
Disallow: /auth/
Disallow: /dashboard/
Disallow: /api/

# Temporarily disable discover page from indexing
Disallow: /discover

# Sitemap location
Sitemap: https://www.ekinox.app/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1
`.trim()

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  })
}
