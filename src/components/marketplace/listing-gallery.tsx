"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "@/lib/icons"

// Galería del detalle: imagen grande navegable (flechas + teclado) y miniaturas
// clicables. Client component porque necesita estado de la foto seleccionada.
export function ListingGallery({
  images,
  title,
}: {
  images: { url: string }[]
  title: string
}) {
  const [idx, setIdx] = useState(0)

  if (images.length === 0) {
    return <div className="flex h-64 items-center justify-center bg-gray-50 text-6xl text-gray-300 sm:h-80">📸</div>
  }

  const go = (d: number) => setIdx((i) => (i + d + images.length) % images.length)
  const multiple = images.length > 1

  return (
    <div>
      <div className="relative h-64 select-none bg-gray-50 sm:h-96">
        <Image
          key={images[idx].url}
          src={images[idx].url}
          alt={`${title} — foto ${idx + 1}`}
          fill
          sizes="(max-width:1024px) 100vw, 640px"
          className="object-contain"
          priority
        />
        {multiple && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow ring-1 ring-black/5 transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Foto siguiente"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow ring-1 ring-black/5 transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
              {idx + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {multiple && (
        <div className="flex gap-2 overflow-x-auto p-3">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === idx}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                i === idx ? "ring-blue-500" : "ring-transparent hover:ring-gray-300"
              }`}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
