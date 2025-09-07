import type { Metadata, Viewport } from 'next'
import { Inter as FontSans } from 'next/font/google'

import { Analytics } from '@vercel/analytics/next'

import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

import { SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'

import AppSidebar from '@/components/app-sidebar'
import ArtifactRoot from '@/components/artifact/artifact-root'
import Header from '@/components/header'
import { ThemeProvider } from '@/components/theme-provider'

import './globals.css'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans'
})

const title = 'Ekinox AI - AI-Powered Research & Content Discovery Platform'
const description =
  'Discover trending articles, research papers, videos & podcasts with AI. Get intelligent answers from trusted sources across technology, business, science & more. Free AI search engine with generative UI.'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.ekinox.app'),
  title: {
    default: title,
    template: '%s | Ekinox AI'
  },
  description,
  keywords: [
    'AI search engine',
    'content discovery',
    'research platform',
    'AI-powered answers',
    'trending news',
    'academic papers',
    'generative UI',
    'artificial intelligence',
    'tech news',
    'business insights'
  ],
  authors: [{ name: 'Ekinox AI Team' }],
  creator: 'Ekinox AI',
  publisher: 'Ekinox AI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.ekinox.app',
    siteName: 'Ekinox AI',
    title,
    description,
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ekinox AI - AI-Powered Research & Content Discovery Platform'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/images/og-image.png'],
    creator: '@miiura',
    site: '@ekinox_ai'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION
  },
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  let user = null
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = await createClient()
    const {
      data: { user: supabaseUser }
    } = await supabase.auth.getUser()
    user = supabaseUser
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Ekinox AI',
              description: 'AI-Powered Research & Content Discovery Platform',
              url: 'https://www.ekinox.app',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://www.ekinox.app/search?q={search_term_string}',
                'query-input': 'required name=search_term_string'
              },
              publisher: {
                '@type': 'Organization',
                name: 'Ekinox AI',
                url: 'https://www.ekinox.app',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://www.ekinox.app/images/logo.png'
                }
              }
            })
          }}
        />
      </head>
      <body
        className={cn(
          'min-h-screen flex flex-col font-sans antialiased',
          fontSans.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider defaultOpen>
            <AppSidebar user={user} />
            <div className="flex flex-col flex-1">
              <Header user={user} />
              <main
                id="main-content"
                className="flex flex-1 min-h-0"
                role="main"
              >
                <ArtifactRoot>{children}</ArtifactRoot>
              </main>
            </div>
          </SidebarProvider>
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
