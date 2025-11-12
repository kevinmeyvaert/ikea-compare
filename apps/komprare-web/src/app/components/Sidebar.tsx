'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import StoreSettingsModal from './StoreSettingsModal';

interface SidebarProps {
  children: ReactNode;
  onStoreChange?: () => void;
}

export default function Sidebar({ children, onStoreChange }: SidebarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const pathname = usePathname();

  const handleStoreChangeInternal = () => {
    setIsSettingsOpen(false);
    if (onStoreChange) {
      onStoreChange();
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname.startsWith('/product');
    }
    return pathname.startsWith(path);
  };

  return (
    <>
      <aside className="lg:w-[28rem] bg-white border-r border-gray-200 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="p-6 flex flex-col min-h-full">
          <div className="flex-1">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2 gap-3">
                <Link href="/" className="relative h-16 flex-1 cursor-pointer">
                  <Image
                    src="/assets/logo.png"
                    alt="IKEA Price Comparison"
                    fill
                    className="object-contain object-left"
                    priority
                  />
                </Link>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-ikea-blue transition-colors flex-shrink-0"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="font-medium">Winkel instellingen</span>
                </button>
              </div>
              <p className="text-sm text-gray-700">
                Altijd de juiste GRÄBPRIS.
              </p>
            </div>

            {/* Navigation */}
            <div className="mb-6 flex gap-3">
              <Link
                href="/"
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 transition-colors ${
                  isActive('/')
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-900 border-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                Enkel product
              </Link>
              <Link
                href="/share"
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 transition-colors ${
                  isActive('/share')
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-900 border-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share link
              </Link>
              <Link
                href="/upload"
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 transition-colors ${
                  isActive('/upload')
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-900 border-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Pdf upload
              </Link>
            </div>

            {/* Page-specific content */}
            <div className="mb-8">{children}</div>
          </div>

          {/* Footer - pushed to bottom */}
          <div className="mt-auto pt-6 border-t border-gray-200 space-y-3">
            <p className="text-xs text-gray-600">
              Prijzen worden in real-time opgehaald en kunnen variëren.
              Verifieer altijd op de officiële IKEA website.
            </p>
            <div className="flex items-center gap-2">
              <a
                href="https://kevinmeyvaert.be"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-gray-600 hover:text-ikea-blue transition-colors"
              >
                <Image
                  src="/kev.png"
                  alt="Kevin Meyvaert"
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Store Settings Modal */}
      <StoreSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onStoreChange={handleStoreChangeInternal}
      />
    </>
  );
}
