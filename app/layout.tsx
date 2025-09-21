import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Innomatics Research Labs',
  description: 'Created by Innomatics Research Labs',
  generator: 'Innomatics Research Labs',
  icons: {
    icon: [
      { url: '/slice_cheese_meal_food_pizza_fast_icon_266944.ico', sizes: '16x16 32x32', type: 'image/x-icon' }
    ],
    shortcut: '/slice_cheese_meal_food_pizza_fast_icon_266944.ico',
    apple: '/slice_cheese_meal_food_pizza_fast_icon_266944.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/slice_cheese_meal_food_pizza_fast_icon_266944.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/slice_cheese_meal_food_pizza_fast_icon_266944.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/slice_cheese_meal_food_pizza_fast_icon_266944.ico" sizes="180x180" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
