import { Footer } from '@/components/layout/footer'
import Navbar from '@/components/layout/navbar'
import React from 'react'

export default function MainLayout({children}: {children: React.ReactNode}) {
  return (
    <>
        <div>
                <Navbar></Navbar>
            <main className='mb-20'>
                {children}
            </main>
            <Footer></Footer>
        </div>
    </>
  )
}
