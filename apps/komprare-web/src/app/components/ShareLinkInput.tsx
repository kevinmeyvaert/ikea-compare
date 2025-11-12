'use client';

import { useState } from 'react';

interface ShareLinkInputProps {
  onSubmit: (shareLink: string) => void;
  isLoading: boolean;
}

export default function ShareLinkInput({
  onSubmit,
  isLoading,
}: ShareLinkInputProps) {
  const [shareLink, setShareLink] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!shareLink.trim()) {
      setError('Voer een IKEA share link in');
      return;
    }

    // Validate that it's an IKEA share link (supports both regular and applink URLs)
    const isRegularShareLink =
      shareLink.includes('ikea.com') &&
      shareLink.includes('favourites/receive-share');
    const isAppLink = shareLink.includes('applink.ikea.com');

    if (!isRegularShareLink && !isAppLink) {
      setError(
        'Ongeldige IKEA share link. De link moet een "favourites/receive-share" of "applink.ikea.com" URL zijn.'
      );
      return;
    }

    onSubmit(shareLink);
    setShareLink(''); // Clear input after submission
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-900 mb-1">
          IKEA share link
        </h2>
        <p className="text-xs text-gray-700">
          Plak je IKEA winkelwagen share link van de website of mobiele app
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="shareLink"
            className="block text-xs font-bold text-gray-700 mb-2"
          >
            Share link
          </label>
          <input
            id="shareLink"
            type="text"
            value={shareLink}
            onChange={(e) => {
              setShareLink(e.target.value);
              setError('');
            }}
            placeholder="Plak je share link hier..."
            className="w-full px-4 py-3 text-sm border-2 border-gray-900 focus:outline-none focus:border-ikea-blue transition-colors"
            disabled={isLoading}
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-3 bg-black text-white text-base font-bold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Verwerken...' : 'Vergelijk prijzen'}
        </button>
      </form>
    </div>
  );
}
