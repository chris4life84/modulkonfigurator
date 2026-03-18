import { useState } from 'react';
import { Link } from 'react-router-dom';
import { assetPath } from '../utils/asset-path';

interface GalleryItem {
  src: string;
  title: string;
  description?: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  // Bilder werden hier ergänzt — Beispiel:
  // { src: '/gallery/sauna-aussen.jpg', title: 'Saunakern mit Pergola', description: 'Kompakte Outdoor-Sauna mit Glasdach-Pergola' },
];

export function Galerie() {
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Inspiration & Möglichkeiten</h1>
      <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-2xl">
        Entdecken Sie die Vielfalt unserer modularen Raumsysteme. Von der privaten Sauna über das
        Home Office bis zum kompletten Wellness-Resort — jedes Projekt ist individuell und wird
        nach Ihren Wünschen realisiert.
      </p>

      {GALLERY_ITEMS.length > 0 ? (
        <>
          {/* Image grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GALLERY_ITEMS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setLightbox(idx)}
                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-wood-400"
              >
                <img
                  src={assetPath(item.src)}
                  alt={item.title}
                  className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-white/80">{item.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Lightbox */}
          {lightbox !== null && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
              onClick={() => setLightbox(null)}
            >
              <button
                className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                onClick={() => setLightbox(null)}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <img
                src={assetPath(GALLERY_ITEMS[lightbox].src)}
                alt={GALLERY_ITEMS[lightbox].title}
                className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute bottom-6 text-center text-white">
                <p className="text-lg font-semibold">{GALLERY_ITEMS[lightbox].title}</p>
                {GALLERY_ITEMS[lightbox].description && (
                  <p className="mt-1 text-sm text-white/70">{GALLERY_ITEMS[lightbox].description}</p>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Platzhalter wenn noch keine Bilder hinterlegt */
        <div className="mt-8 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
          <p className="mt-4 text-sm font-medium text-gray-500">Galerie wird vorbereitet</p>
          <p className="mt-1 text-xs text-gray-400">
            Hier werden bald Bilder unserer realisierten Projekte und Möglichkeiten zu sehen sein.
          </p>
        </div>
      )}

      {/* Info section */}
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          {
            title: 'Individuelle Gestaltung',
            text: 'Jedes Modulhaus wird nach Ihren Vorstellungen konfiguriert — von der Raumaufteilung bis zur Materialwahl.',
            icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z',
          },
          {
            title: 'Premium-Materialien',
            text: 'Robinie-Holz, Isolierverglasung, Aluminium-Pergola — hochwertige Materialien für langlebige Qualität.',
            icon: 'M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25',
          },
          {
            title: 'Persönliches Angebot',
            text: 'Konfigurieren Sie Ihr Modulhaus im 3D-Konfigurator und erhalten Sie ein individuelles Angebot inkl. aller Extras.',
            icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
          },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-5">
            <svg className="h-6 w-6 text-wood-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
            </svg>
            <h3 className="mt-3 text-sm font-semibold text-gray-900">{item.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.text}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-xl bg-wood-50 p-6 text-center">
        <p className="text-sm font-medium text-wood-800">
          Bereit für Ihr eigenes Modulhaus?
        </p>
        <Link
          to="/konfigurator"
          className="mt-3 inline-block rounded-lg bg-wood-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-700"
        >
          Jetzt konfigurieren
        </Link>
      </div>
    </div>
  );
}
