import './globals.css';
import { BurgerMenu } from '@/components/layout/burger-menu';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <BurgerMenu />
        {children}
      </body>
    </html>
  )
}