import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LocationSearch({ onLocationSelect, initialValue = "" }) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const abortControllerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // If the input represents the initial load (which is usually Colombo), don't trigger nominatim
    if (!query || query === initialValue) {
      setResults([]);
      return;
    }

    const searchLocations = async () => {
      setLoading(true);
      setShowDropdown(true);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=LK&limit=5`,
          { signal: controller.signal }
        );

        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();
        setResults(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Location search error:", error);
          toast.error("Location search failed.");
        }
      } finally {
        if (abortControllerRef.current === controller) {
          setLoading(false);
        }
      }
    };

    const debounceTimer = setTimeout(searchLocations, 400);

    return () => clearTimeout(debounceTimer);
  }, [query, initialValue]);

  const handleSelect = (loc) => {
    setQuery(loc.display_name.split(',')[0]); // Shorten display name
    setShowDropdown(false);
    onLocationSelect({
      name: loc.display_name.split(',')[0],
      display_name: loc.display_name,
      lat: loc.lat,
      lon: loc.lon
    });
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50">
      <div 
        className={`relative flex items-center bg-[#07101f]/80 backdrop-blur-xl border ${showDropdown && query ? 'border-cyan-500/50 rounded-t-2xl shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'border-white/10 rounded-2xl'} transition-all duration-300`}
      >
        <div className="pl-5 text-cyan-400">
          <Search className="w-5 h-5" />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if(query && results.length > 0) setShowDropdown(true) }}
          placeholder="Search for any city in Sri Lanka... (e.g., Kandy)"
          className="w-full bg-transparent border-none outline-none text-white px-4 py-4 text-lg placeholder:text-white/30 font-medium"
        />

        <div className="pr-5 flex items-center gap-2">
          {loading ? (
             <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
          ) : query ? (
             <button onClick={handleClear} className="text-white/40 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
               <X className="w-4 h-4" />
             </button>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {showDropdown && query && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 bg-[#0a1526]/95 backdrop-blur-2xl border border-white/10 border-t-0 rounded-b-2xl shadow-2xl overflow-hidden"
          >
            {results.length > 0 ? (
              <ul className="py-2">
                {results.map((loc, idx) => (
                  <motion.li
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={loc.place_id || idx}
                  >
                    <button
                      onClick={() => handleSelect(loc)}
                      className="w-full text-left px-5 py-3 hover:bg-white/5 flex items-start gap-3 transition-colors group"
                    >
                      <MapPin className="w-5 h-5 text-cyan-500/70 group-hover:text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-white font-medium group-hover:text-cyan-50 transition-colors">
                          {loc.display_name.split(',')[0]}
                        </div>
                        <div className="text-xs text-white/40 mt-0.5 max-w-[90%] truncate">
                          {loc.display_name.split(',').slice(1).join(',')}
                        </div>
                      </div>
                    </button>
                  </motion.li>
                ))}
              </ul>
            ) : !loading ? (
              <div className="p-5 text-center text-white/50 text-sm">
                No locations found in Sri Lanka matching "{query}"
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
