import React, { useState } from 'react';
import { PokemonListing } from '../types/Pokemon';
import { TOTAL_LISTINGS } from '../data/mockData';
import PurchaseModal from './PurchaseModal';

// Game-related interfaces
interface ShinySnipe {
  listingId: string;
  appearTime: number;
}

interface PokemonListingsProps {
  listings: PokemonListing[];
  onPurchase: (listingId: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  gameActive?: boolean;
  activeShinySnipes?: Map<string, ShinySnipe>;
}

const PokemonListings: React.FC<PokemonListingsProps> = ({ 
  listings, 
  onPurchase, 
  onRefresh, 
  isRefreshing = false,
  gameActive = false,
  activeShinySnipes = new Map()
}) => {
  const [selectedListing, setSelectedListing] = useState<PokemonListing | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleBuyClick = (listing: PokemonListing) => {
    setSelectedListing(listing);
    setShowPurchaseModal(true);
  };

  const handlePurchaseConfirm = () => {
    if (selectedListing) {
      onPurchase(selectedListing.id);
      setShowPurchaseModal(false);
      setSelectedListing(null);
      
      // If this was the last item on the current page, go back to the previous page
      if (currentListings.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  const handlePurchaseCancel = () => {
    setShowPurchaseModal(false);
    setSelectedListing(null);
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  // Calculate pagination
  const totalPages = Math.ceil(listings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentListings = listings.slice(startIndex, endIndex);

  // Reset to page 1 if current page is out of bounds
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefreshClick = () => {
    onRefresh();
    // Stay on current page unless it becomes invalid
  };

  return (
    <div className="px-[5px] py-[5px] h-full">
      {/* Controls */}
      <div className="flex items-center justify-end mb-[8px] select-none">
        <div className="flex items-center gap-[4px]">
          <select className="bg-gtl-surface-light text-gtl-text border border-gtl-border rounded px-[6px] py-[3px] text-sm min-w-[251px] h-[27px] text-center leading-none">
            <option>Select Template</option>
          </select>
          <input 
            type="text" 
            placeholder="Search Pokemon..." 
            className="bg-gtl-surface-light text-gtl-text border border-gtl-border rounded px-[6px] py-[6px] text-sm placeholder-gtl-text-dim w-[273px] h-[27px] leading-none"
          />
          <button className="bg-gtl-surface-light text-gtl-text border border-gtl-border rounded px-[6px] py-[6px] hover:bg-gtl-primary hover:text-white text-sm min-w-[113px] h-[27px] flex items-center justify-center whitespace-nowrap overflow-hidden">
            Advanced Search
          </button>
          <button 
            disabled
            className="bg-gtl-surface-light text-gtl-text border border-gtl-border rounded px-[6px] py-[6px] text-sm min-w-[27px] h-[27px] brightness-150 cursor-default flex items-center justify-center"
            title="Clear search"
          >
            <span style={{fontSize: '14px'}}>✕</span>
          </button>
          <button 
            onClick={handleRefreshClick}
            onKeyDown={(e) => {
              if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
              }
            }}
            className="bg-gtl-surface-light text-gtl-text border border-gtl-border rounded px-[6px] py-[6px] hover:bg-gtl-primary hover:text-white text-sm min-w-[27px] h-[27px] flex items-center justify-center"
            title="Refresh listings"
          >
            <span style={{fontSize: '14px'}}>🔄</span>
          </button>
          <select className="bg-gtl-surface-light text-gtl-text border border-gtl-border rounded px-[6px] py-[3px] text-sm min-w-[149px] h-[28px] text-center leading-none">
            <option>NEWEST</option>
            <option>OLDEST</option>
            <option>PRICE LOW</option>
            <option>PRICE HIGH</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gtl-surface rounded-lg overflow-hidden border border-gtl-border select-none h-[425px]">
        <table className="w-full h-full border-separate border-spacing-[1px]">
          <thead>
            <tr className="bg-gtl-header text-gtl-text">
              <th className="px-[6px] py-[6px] text-center border border-gtl-cell-border text-sm font-medium w-[220px]">Pokémon</th>
              <th className="px-[6px] py-[6px] text-center border border-gtl-cell-border text-sm font-medium w-[60px]">Nature</th>
              <th className="px-[6px] py-[6px] text-center border border-gtl-cell-border text-sm font-medium w-[185px]">IVs</th>
              <th className="px-[6px] py-[6px] text-center border border-gtl-cell-border text-sm font-medium w-[80px]">Price</th>
              <th className="px-[6px] py-[6px] text-center border border-gtl-cell-border text-sm font-medium w-[80px]">Start Date</th>
              <th className="px-[6px] py-[6px] text-center border border-gtl-cell-border text-sm font-medium w-[80px]">End Date</th>
              <th className="px-[6px] py-[6px] text-center border border-gtl-cell-border text-sm font-medium w-[100px]">Buy</th>
            </tr>
          </thead>
          <tbody>
            {isRefreshing ? (
              // Show empty rows with same structure to maintain exact table dimensions during refresh
              Array.from({ length: Math.max(currentListings.length, 1) }, (_, index) => (
                <tr key={`empty-${index}`} className="bg-gtl-uniform-bg h-[24px]">
                  <td className="px-[5px] py-[5px] border border-gtl-cell-border h-[24px] max-h-[24px] overflow-hidden">
                    <div className="flex items-center gap-1 h-full">
                      <div className="relative border border-gtl-cell-border w-[24px] h-[24px] flex items-center justify-center flex-shrink-0">
                        <div className="absolute top-0 left-0 w-3 h-3 bg-transparent"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-transparent text-sm font-medium truncate">
                          Lv. 99 Placeholder
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-[5px] py-[5px] text-transparent border border-gtl-cell-border text-sm text-left h-[24px] max-h-[24px] overflow-hidden">Placeholder</td>
                  <td className="px-[5px] py-[5px] border border-gtl-cell-border h-[24px] max-h-[24px] overflow-hidden">
                    <div className="flex justify-between gap-0.5 text-sm text-transparent">
                      <span className="border border-gtl-cell-border px-1 py-0.5 w-[30px] text-center">31</span>
                      <span className="border border-gtl-cell-border px-1 py-0.5 w-[30px] text-center">31</span>
                      <span className="border border-gtl-cell-border px-1 py-0.5 w-[30px] text-center">31</span>
                      <span className="border border-gtl-cell-border px-1 py-0.5 w-[30px] text-center">31</span>
                      <span className="border border-gtl-cell-border px-1 py-0.5 w-[30px] text-center">31</span>
                      <span className="border border-gtl-cell-border px-1 py-0.5 w-[30px] text-center">31</span>
                    </div>
                  </td>
                  <td className="px-[5px] py-[5px] text-transparent text-left border border-gtl-cell-border text-sm font-medium h-[24px] max-h-[24px] overflow-hidden">
                    $99,999
                  </td>
                  <td className="px-[5px] py-[5px] text-transparent text-left border border-gtl-cell-border text-sm h-[24px] max-h-[24px] overflow-hidden">
                    Just now
                  </td>
                  <td className="px-[5px] py-[5px] text-transparent text-left border border-gtl-cell-border text-sm h-[24px] max-h-[24px] overflow-hidden">
                    14 days
                  </td>
                  <td className="border border-gtl-cell-border p-0 h-[24px] max-h-[24px] overflow-hidden">
                    <button className="bg-transparent border-2 border-transparent text-transparent text-sm font-medium w-[100px] h-[24px]">
                      Buy
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              currentListings.map((listing, index) => (
                  <tr 
                    key={listing.id}
                    className="bg-gtl-uniform-bg hover:bg-gtl-primary hover:bg-opacity-20 h-[24px]"
                  >
                  <td className="px-[5px] py-[5px] border border-gtl-cell-border h-[24px] max-h-[24px] overflow-hidden">
                    <div className="flex items-center gap-1 h-full">
                      <div className="relative border border-gtl-cell-border w-[70px] h-[24px] flex items-end justify-center flex-shrink-0">
                        <img 
                          src={listing.pokemon.sprite} 
                          alt={listing.pokemon.name}
                          className="pixelated"
                          style={{ 
                            imageRendering: 'pixelated',
                            maxWidth: '24px',
                            maxHeight: '24px',
                          }}
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjNDQ0IiByeD0iNCIvPgo8dGV4dCB4PSIyMCIgeT0iMjQiIGZpbGw9IiM5OTkiIGZvbnQtZmtaW1pWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Pz88L3RleHQ+Cjwvc3ZnPgo=';
                          }}
                        />
                        <div className={`absolute top-0 left-0 w-2 h-2 ${listing.pokemon.gender === 'male' ? 'bg-blue-400' : 'bg-pink-400'}`}>
                        </div>
                        {listing.pokemon.isShiny && (
                          <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400">
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-gtl-text text-sm font-medium truncate">
                          Lv. {listing.pokemon.level} {listing.pokemon.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-[5px] py-[5px] text-gtl-text border border-gtl-cell-border text-sm text-left h-[24px] max-h-[24px] overflow-hidden">{listing.nature}</td>
                  <td className="px-[5px] py-[5px] border border-gtl-cell-border h-[24px] max-h-[24px] overflow-hidden">
                    <div className="flex justify-between gap-0.5 text-sm text-gtl-text">
                      <span className={`border border-gtl-cell-border px-1 py-0.5 w-[30px] text-center ${listing.ivs.hp === 31 ? 'text-green-400' : ''}`}>{listing.ivs.hp}</span>
                      <span className={`border border-gtl-cell-border px-1 py-0.5 w-[30px] text-center ${listing.ivs.attack === 31 ? 'text-green-400' : ''}`}>{listing.ivs.attack}</span>
                      <span className={`border border-gtl-cell-border px-1 py-0.5 w-[30px] text-center ${listing.ivs.defense === 31 ? 'text-green-400' : ''}`}>{listing.ivs.defense}</span>
                      <span className={`border border-gtl-cell-border px-1 py-0.5 w-[30px] text-center ${listing.ivs.spAttack === 31 ? 'text-green-400' : ''}`}>{listing.ivs.spAttack}</span>
                      <span className={`border border-gtl-cell-border px-1 py-0.5 w-[30px] text-center ${listing.ivs.spDefense === 31 ? 'text-green-400' : ''}`}>{listing.ivs.spDefense}</span>
                      <span className={`border border-gtl-cell-border px-1 py-0.5 w-[30px] text-center ${listing.ivs.speed === 31 ? 'text-green-400' : ''}`}>{listing.ivs.speed}</span>
                    </div>
                  </td>
                  <td className="px-[5px] py-[5px] text-gtl-text text-left border border-gtl-cell-border text-sm font-medium h-[24px] max-h-[24px] overflow-hidden">
                    {formatPrice(listing.price)}
                  </td>
                  <td className="px-[5px] py-[5px] text-gtl-text text-left border border-gtl-cell-border text-sm h-[24px] max-h-[24px] overflow-hidden">
                    {listing.startDate}
                  </td>
                  <td className="px-[5px] py-[5px] text-gtl-text text-left border border-gtl-cell-border text-sm h-[24px] max-h-[24px] overflow-hidden">
                    {listing.endDate}
                  </td>
                  <td className="border border-gtl-cell-border p-0 h-[24px] max-h-[24px] overflow-hidden">
                    <button 
                      onClick={() => handleBuyClick(listing)}
                      className="bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium w-[100px] h-[24px] border-2 border-gray-600 shadow-inner"
                    >
                      Buy
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-2 text-center text-gtl-text-dim select-none">
        <p className="text-sm">Showing {startIndex + 1} to {Math.min(endIndex, listings.length)} of {TOTAL_LISTINGS.toLocaleString()} listings.</p>
      </div>

      {/* Pagination */}
      <div className="mt-[8px] flex justify-center select-none">
        <div className="flex items-center gap-[4px]">
          <button 
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className={`border border-gtl-border rounded px-[6px] py-[6px] text-sm min-w-[32px] h-[32px] ${
              currentPage === 1 
                ? 'bg-gtl-surface text-gtl-text-dim cursor-not-allowed' 
                : 'bg-gtl-surface-light text-gtl-text hover:bg-gtl-primary hover:text-white'
            }`}
          >
            &lt;&lt;
          </button>
          
          {/* Generate page numbers */}
          {Array.from({ length: Math.min(totalPages, 14) }, (_, i) => i + 1).map(page => (
            <button 
              key={page}
              onClick={() => handlePageChange(page)}
              className={`border border-gtl-border rounded px-[6px] py-[6px] text-sm min-w-[32px] h-[32px] ${
                currentPage === page
                  ? 'bg-gtl-primary text-white'
                  : 'bg-gtl-surface-light text-gtl-text hover:bg-gtl-primary hover:text-white'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button 
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`border border-gtl-border rounded px-[6px] py-[6px] text-sm min-w-[32px] h-[32px] ${
              currentPage === totalPages 
                ? 'bg-gtl-surface text-gtl-text-dim cursor-not-allowed' 
                : 'bg-gtl-surface-light text-gtl-text hover:bg-gtl-primary hover:text-white'
            }`}
          >
            &gt;&gt;
          </button>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedListing && (
        <PurchaseModal
          listing={selectedListing}
          onConfirm={handlePurchaseConfirm}
          onCancel={handlePurchaseCancel}
        />
      )}
    </div>
  );
};

export default PokemonListings; 