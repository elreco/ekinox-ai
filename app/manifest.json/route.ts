export function GET() {
  const manifest = {
    name: 'Ekinox AI - AI-Powered Research & Content Discovery Platform',
    short_name: 'Ekinox AI',
    description: 'Discover trending articles, research papers, videos & podcasts with AI. Get intelligent answers from trusted sources.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    categories: ['productivity', 'education', 'news'],
    lang: 'en',
    scope: '/',
    orientation: 'portrait-primary'
  }

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=86400'
    }
  })
}