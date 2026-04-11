import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Loader2, X, CornerDownLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LocationSearch({ onLocationSelect, initialValue = "", isSearching = false }) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [isUsingKeyboard, setIsUsingKeyboard] = useState(false);
  
  const abortControllerRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const resultsRef = useRef([]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync scroll with keyboard navigation
  useEffect(() => {
    if (highlightIndex >= 0 && resultsRef.current[highlightIndex]) {
      resultsRef.current[highlightIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [highlightIndex]);

  // Reset highlights when suggestions change
  useEffect(() => {
    setHighlightIndex(-1);
    setIsUsingKeyboard(false);
  }, [results]);

  useEffect(() => {
    // If the input represents the initial load (empty for this version), don't trigger nominatim
    if (!query || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
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
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=LK&limit=6&addressdetails=1`,
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

    const debounceTimer = setTimeout(searchLocations, 350);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelect = useCallback((loc) => {
    if (!loc) return;
    
    // Robust parsing of location name
    const displayName = loc.display_name;
    const cleanName = loc.address?.city || loc.address?.town || loc.address?.village || displayName.split(',')[0].trim();
    
    setQuery(cleanName);
    setShowDropdown(false);
    setResults([]);
    setHighlightIndex(-1);
    
    onLocationSelect({
      name: cleanName,
      display_name: displayName,
      lat: loc.lat,
      lon: loc.lon
    });

    // Maintain focus on input after selection
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onLocationSelect]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsUsingKeyboard(true);
      setShowDropdown(true);
      setHighlightIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsUsingKeyboard(true);
      setHighlightIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0) {
        handleSelect(results[highlightIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlightIndex(-1);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    setHighlightIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        staggerChildren: 0.05,
        duration: 0.2,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: -10,
      transition: { duration: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50">
      <div 
        className={`relative flex items-center bg-[#07101f]/80 backdrop-blur-xl border transition-all duration-300 ${
          showDropdown && query && results.length > 0 
            ? 'border-cyan-500/50 rounded-t-2xl shadow-[0_0_30px_rgba(6,182,212,0.1)]' 
            : 'border-white/10 rounded-2xl'
        }`}
      >
        <div className="pl-5 text-cyan-400">
          <Search className="w-5 h-5" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if(query && results.length > 0) setShowDropdown(true) }}
          placeholder="Search for any city in Sri Lanka..."
          className="w-full bg-transparent border-none outline-none text-white px-4 py-4 text-lg placeholder:text-white/30 font-medium"
          aria-label="Location search"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          role="combobox"
        />

        <div className="pr-5 flex items-center gap-2">
          {(loading || isSearching) ? (
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
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-full left-0 right-0 z-[9999] mt-2 bg-[#0a1526]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto"
          >
            {loading && results.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                <p className="text-white/40 text-sm font-medium">Searching locations...</p>
              </div>
            ) : results.length > 0 ? (
              <ul className="py-2 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10" role="listbox">
                {results.map((loc, idx) => {
                  const isActive = highlightIndex === idx;
                  const displayName = loc.display_name;
                  const parts = displayName.split(',');
                  const mainName = loc.address?.city || loc.address?.town || loc.address?.village || parts[0].trim();
                  const subName = parts.slice(1).join(',').trim();

                  return (
                    <motion.li
                      key={loc.place_id || idx}
                      variants={itemVariants}
                      ref={el => resultsRef.current[idx] = el}
                      role="option"
                      aria-selected={isActive}
                    >
                      <button
                        onClick={() => handleSelect(loc)}
                        onMouseEnter={() => {
                          setHighlightIndex(idx);
                          setIsUsingKeyboard(false);
                        }}
                        className={`w-full text-left px-5 py-4 flex items-center justify-between transition-all duration-200 group relative ${
                          isActive ? 'bg-white/5 active:scale-[0.98]' : 'hover:bg-white/5'
                        }`}
                      >
                        {/* Active Indicator Bar */}
                        {isActive && (
                          <motion.div 
                            layoutId="activeIndicator"
                            className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                          />
                        )}

                        <div className="flex items-start gap-4 flex-1">
                          <div className={`mt-1 p-2 rounded-lg transition-colors duration-300 ${
                            isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/30 group-hover:text-white/50'
                          }`}>
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="overflow-hidden">
                            <div className={`text-base font-semibold transition-colors duration-300 ${
                              isActive ? 'text-white' : 'text-white/80'
                            }`}>
                              {mainName}
                            </div>
                            <div className="text-xs text-white/40 truncate max-w-md mt-0.5">
                              {subName || "Sri Lanka"}
                            </div>
                          </div>
                        </div>

                        {/* Press Enter Hint */}
                        <AnimatePresence>
                          {isActive && isUsingKeyboard && (
                            <motion.div
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-wider"
                            >
                              <span>Enter</span>
                              <CornerDownLeft className="w-3 h-3" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            ) : !loading ? (
              <div className="p-10 text-center">
                <p className="text-white/40 text-sm">
                  No locations found matching <span className="text-white/60">"{query}"</span>
                </p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
