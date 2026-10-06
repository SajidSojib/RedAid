import { Navbar35 } from '@/components/navbar35'
import React from 'react'

export default function MainLayout({children}: {children: React.ReactNode}) {
  return (
    <>
        <div>
            <nav>
                <Navbar35></Navbar35>
            </nav>
            <main>
                {children}
            </main>
            <footer>

            </footer>
        </div>
    </>
  )
}
