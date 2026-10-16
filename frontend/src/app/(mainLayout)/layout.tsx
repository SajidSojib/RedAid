import Navbar from '@/components/layout/navbar'
import React from 'react'

export default function MainLayout({children}: {children: React.ReactNode}) {
  return (
    <>
        <div>
                <Navbar></Navbar>
            <main>
                {children}
            </main>
            <footer>

            </footer>
        </div>
    </>
  )
}
