import { AuthProvider } from '@/lib/AuthContext'
import './globals.css'

export const metadata = {
  title: 'Clínica Portal',
  description: 'Sistema de gestión de citas médicas'
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}