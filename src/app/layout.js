import { AuthProvider } from '@/lib/AuthContext'
import { GeistSans } from 'geist/font/sans'
import './globals.css'

export const metadata = {
  title: 'Clínica Portal',
  description: 'Sistema de gestión de citas médicas'
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={GeistSans.className}>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}