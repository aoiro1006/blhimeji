import type { GalleryImage } from "@/types";

interface GalleryGridProps {
  images: GalleryImage[];
  columns?: 2 | 3;
}

export default function GalleryGrid({ images, columns = 3 }: GalleryGridProps) {
  if (images.length === 0) {
    return <p className="text-gray-500 text-sm">写真はまだありません</p>;
  }

  const gridClass =
    columns === 2
      ? "grid sm:grid-cols-2 gap-4"
      : "grid sm:grid-cols-2 lg:grid-cols-3 gap-4";

  return (
    <div className={gridClass}>
      {images.map((image) => (
        <figure
          key={image.id}
          className="group overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200/80 shadow-sm"
        >
          <div className="aspect-[4/3] overflow-hidden bg-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.caption || "大会写真"}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          {image.caption && (
            <figcaption className="px-3 py-2.5 text-sm text-gray-600 bg-white">
              {image.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
