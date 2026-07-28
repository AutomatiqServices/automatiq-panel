import { useEffect, useRef } from 'react'

export function GlassFx() {
  const spotlightRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      if (barRef.current) barRef.current.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%'
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    if (!window.matchMedia('(pointer:fine)').matches) {
      return () => window.removeEventListener('scroll', onScroll)
    }

    let tx = window.innerWidth / 2
    let ty = window.innerHeight / 2
    let cx = tx
    let cy = ty
    let raf = 0

    const tick = () => {
      cx += (tx - cx) * 0.12
      cy += (ty - cy) * 0.12
      if (spotlightRef.current) spotlightRef.current.style.transform = `translate(${cx}px, ${cy}px)`
      if (Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5) {
        raf = requestAnimationFrame(tick)
      } else {
        raf = 0
      }
    }
    const onMouseMove = (e: MouseEvent) => {
      tx = e.clientX
      ty = e.clientY
      if (!raf) raf = requestAnimationFrame(tick)
    }
    window.addEventListener('mousemove', onMouseMove)
    tick()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouseMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 65% at 10% 15%, rgba(255,255,255,0.05) 0%, transparent 65%), radial-gradient(ellipse 60% 55% at 88% 82%, rgba(255,255,255,0.03) 0%, transparent 65%), radial-gradient(ellipse 45% 50% at 55% 45%, rgba(255,255,255,0.02) 0%, transparent 70%)',
        }}
      />
      <div
        ref={barRef}
        className="fixed top-0 left-0 z-[1200] h-[1.5px] w-0"
        style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.9), rgba(255,255,255,0.5))' }}
      />
      <div
        ref={spotlightRef}
        className="pointer-events-none fixed top-0 left-0 z-0 hidden h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full [will-change:transform] sm:block"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 65%)' }}
      />
    </>
  )
}
