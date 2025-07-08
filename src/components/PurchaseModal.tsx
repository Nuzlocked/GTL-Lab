import React, { useEffect } from 'react';
import { PokemonListing } from '../types/Pokemon';

interface PurchaseModalProps {
  listing: PokemonListing;
  onConfirm: () => void;
  onCancel: () => void;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ listing, onConfirm, onCancel }) => {
  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  // Add keyboard event listener for spacebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault(); // Prevent scrolling
        onConfirm();
      }
      // ESC key to cancel
      if (event.code === 'Escape' || event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    // Add event listener when modal is open
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onConfirm, onCancel]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gtl-surface border border-gtl-border rounded-lg p-6 max-w-md w-full mx-4">
        {/* Pokemon Info */}
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gtl-surface-light rounded-lg p-3 flex items-center justify-center">
            <img 
              src={listing.pokemon.sprite} 
              alt={listing.pokemon.name}
              className="w-12 h-12 pixelated"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjNDQ0IiByeD0iNCIvPgo8dGV4dCB4PSIyNCIgeT0iMjgiIGZpbGw9IiM5OTkiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Pz88L3RleHQ+Cjwvc3ZnPgo=';
              }}
            />
          </div>
          <div>
            <h3 className="text-gtl-text font-medium text-lg">
              Lv. {listing.pokemon.level} {listing.pokemon.name}
            </h3>
            <p className="text-gtl-text-dim text-sm">
              {listing.nature} Nature | {formatPrice(listing.price)}
            </p>
          </div>
        </div>

        {/* Confirmation Message */}
        <div className="text-center mb-6">
          <p className="text-gtl-text text-lg mb-2">
            Are you sure you wish to purchase that listing?
          </p>
          <p className="text-gtl-text-dim text-sm">
            Press <kbd className="bg-gtl-surface-light px-2 py-1 rounded text-xs">Space</kbd> to confirm or <kbd className="bg-gtl-surface-light px-2 py-1 rounded text-xs">Esc</kbd> to cancel
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-gtl-primary hover:bg-gtl-primary-hover text-white py-3 px-6 rounded font-medium transition-colors"
          >
            Yes
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gtl-surface-light hover:bg-gtl-border text-gtl-text py-3 px-6 rounded font-medium transition-colors"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseModal; 