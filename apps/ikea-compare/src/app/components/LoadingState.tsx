import Image from 'next/image';

export default function LoadingState() {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-12 px-4">
      {/* Loading Image */}
      <div className="relative w-full max-w-xs aspect-square mb-8">
        <Image
          src="/assets/loading.png"
          alt="Loading"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Spinner */}
      <div className="mb-6">
        <div className="w-12 h-12 border-4 border-ikea-blue border-t-transparent rounded-full animate-spin"></div>
      </div>

      {/* Loading Message */}
      <div className="text-center space-y-3 max-w-xl">
        <h3 className="text-xl font-bold text-gray-900">Prijsinformatie ophalen...</h3>
        <p className="text-gray-600 leading-relaxed">
          We halen prijzen op van IKEA België, Nederland en Frankrijk. Dit kan even duren,
          vooral als je veel verschillende producten zoekt.
        </p>
        <p className="text-sm text-gray-500">
          Even geduld alsjeblieft...
        </p>
      </div>
    </div>
  );
}
