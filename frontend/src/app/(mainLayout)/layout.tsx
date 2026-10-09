import Navbar from '@/components/layout/navbar'
import React from 'react'

export default function MainLayout({children}: {children: React.ReactNode}) {
  return (
    <>
        <div>
            <nav>
                <Navbar></Navbar>
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
