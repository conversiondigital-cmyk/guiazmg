"use client"

import { useState } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRightIcon } from "@/lib/icons"

interface GalleryImage {
  id: string
  url: string
  alt?: string
}

interface BusinessGalleryProps {
  images: GalleryImage[]
}

export function BusinessGallery({ images }: BusinessGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (!images.length) return null

  const openLightbox = (index: number) => setSelectedIndex(index)
  const closeLightbox = () => setSelectedIndex(null)

  const goNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length)
    }
  }

  const goPrev = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length)
    }
  }

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Galería</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => openLightbox(i)}
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
            >
              <Image src={img.url} alt={img.alt || `Imagen ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                className="absolute left-4 p-2 text-white hover:text-gray-300 transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext() }}
                className="absolute right-4 p-2 text-white hover:text-gray-300 transition-colors"
                aria-label="Siguiente"
              >
                <ChevronRightIcon className="h-8 w-8" />
              </button>
            </>
          )}

          <Image
            src={images[selectedIndex].url}
            alt={images[selectedIndex].alt || `Imagen ${selectedIndex + 1}`}
            width={1600}
            height={1200}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 text-white text-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  )
}
