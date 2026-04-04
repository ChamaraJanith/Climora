import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import Topbar from '../../components/admin/Topbar';
import api from '../../services/api';
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const CATEGORIES = ['FLOOD', 'STORM', 'EARTHQUAKE', 'LANDSLIDE', 'TSUNAMI', 'WILDFIRE', 'CYCLONE', 'OTHER'];
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const DISTRICTS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara", "Hambantota", 
  "Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee", 
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla", "Moneragala", "Ratnapura", "Kegalle"
];

const INITIAL = { title: '', description: '', category: '', severity: '', district: '', startAt: '' };

const MapClickHandler = ({ setLocations }) => {
  useMapEvents({
    click(e) {
      console.log("MAP CLICK", e.latlng);
      setLocations(prev => [
        ...prev,
        {
          lat: e.latlng.lat,
          lng: e.latlng.lng
        }
      ]);
    }
  });
  return null;
};

const MapFocus = ({ locations }) => {
  const map = useMap();
  useEffect(() => {
    if (locations && locations.length > 0) {
      const last = locations[locations.length - 1];
      map.setView([last.lat, last.lng], 12);
    }
  }, [locations, map]);
  return null;
};

let timeout;

const CreateAlert = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [cities, setCities] = useState([]);
  const [cityInput, setCityInput] = useState('');
  const [locations, setLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [safetyInstructions, setSafetyInstructions] = useState('');
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleCityKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = cityInput.trim();
      if (val && !cities.includes(val)) {
        setCities([...cities, val]);
      }
      setCityInput('');
    }
  };

  const removeCity = (cityToRemove) => {
    setCities(cities.filter(c => c !== cityToRemove));
  };

  const fetchSuggestions = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await api.get(`/alerts/search-location?q=${query}`);
      const data = res.data;
      setSuggestions(data);
      setShowSuggestions(true);
      
    } catch (err) {
      console.error("Autocomplete error", err);
    }
  };

  const handleSelectLocation = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);

    setLocations(prev => [...prev, { lat, lng }]);

    setSearchQuery(place.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const res = await api.get(`/alerts/search-location?q=${searchQuery}`);
      const data = res.data;

      if (data.length > 0) {
        const { lat, lon } = data[0];

        setLocations(prev => [
          ...prev,
          {
            lat: parseFloat(lat),
            lng: parseFloat(lon)
          }
        ]);
        setSearchQuery("");
      } else {
        toast.error("Location not found");
      }
    } catch (err) {
      console.error("Search failed", err);
      toast.error("Location search failed");
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim())       errs.title       = 'Title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.category)           errs.category    = 'Category is required';
    if (!form.severity)           errs.severity    = 'Severity is required';
    if (!form.district.trim())    errs.district    = 'District is required';
    if (!form.startAt)            errs.startAt     = 'Start date is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const instructionsArray = safetyInstructions
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '');

      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        severity: form.severity,
        area: { 
          district: form.district,
          cities: cities
        },
        locations: locations,
        startAt: new Date(form.startAt).toISOString(),
        safetyInstructions: instructionsArray
      };

      await api.post('/alerts', payload);
      toast.success('Alert created successfully');
      navigate('/admin/alerts');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create alert');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (name) =>
    `w-full px-4 py-2.5 text-sm bg-white border rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4] transition-all duration-150 ${
      errors[name] ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200'
    }`;

  const handleSearchChange = (value) => {
    setSearchQuery(value);

    clearTimeout(timeout);

    timeout = setTimeout(() => {
      fetchSuggestions(value);
    }, 500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Topbar placeholder="Search..." />
      <main className="flex-1 p-6 max-w-2xl">
        <button
          onClick={() => navigate('/admin/alerts')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#06b6d4] transition-colors duration-150 mb-6"
        >
          <ArrowLeft size={16} />
          Back to Alerts
        </button>

        <div className="bg-[#F9FAFB] rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800 mb-1">Create New Alert</h1>
          <p className="text-sm text-gray-500 mb-6">Fill in the details to publish a new emergency alert.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Severe Flood Warning" className={fieldClass('title')} />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Describe the alert in detail..." className={fieldClass('description')} />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
            </div>

            {/* Safety Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Safety Instructions</label>
              <textarea 
                value={safetyInstructions} 
                onChange={(e) => setSafetyInstructions(e.target.value)} 
                rows={4} 
                placeholder="Enter safety instructions (one instruction per line)..." 
                className={fieldClass('safetyInstructions')} 
              />
            </div>

            {/* Category + Severity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select name="category" value={form.category} onChange={handleChange} className={fieldClass('category')}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Severity</label>
                <select name="severity" value={form.severity} onChange={handleChange} className={fieldClass('severity')}>
                  <option value="">Select severity</option>
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.severity && <p className="mt-1 text-xs text-red-500">{errors.severity}</p>}
              </div>
            </div>

            {/* District + Start Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">District</label>
                <select name="district" value={form.district} onChange={handleChange} className={fieldClass('district')}>
                  <option value="">Select district</option>
                  {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.district && <p className="mt-1 text-xs text-red-500">{errors.district}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date & Time</label>
                <input name="startAt" type="datetime-local" value={form.startAt} onChange={handleChange} className={fieldClass('startAt')} />
                {errors.startAt && <p className="mt-1 text-xs text-red-500">{errors.startAt}</p>}
              </div>
            </div>

            {/* Affected Areas (Cities) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Affected Areas (Cities/Towns)</label>
              <input 
                type="text" 
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={handleCityKeyDown}
                placeholder="Type city name and press Enter" 
                className={fieldClass('city')} 
              />
              {cities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {cities.map((city, i) => (
                    <span key={i} className="flex items-center gap-1.5 bg-cyan-50 text-cyan-700 text-sm px-3 py-1.5 rounded-full border border-cyan-100">
                      {city}
                      <button type="button" onClick={() => removeCity(city)} className="hover:bg-cyan-200 rounded-full p-0.5">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Map Location */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <MapPin size={16} className="text-[#06b6d4]" />
                Select Map Location
              </label>
              
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search location..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full px-3 py-2 border rounded-lg text-gray-800 bg-white placeholder-gray-400 caret-black focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4] transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 bg-white border border-gray-200 w-full rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                      {suggestions.map((place, index) => (
                        <div
                          key={index}
                          onClick={() => handleSelectLocation(place)}
                          className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          {place.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  className="px-4 py-2 bg-[#06b6d4] text-white rounded-lg hover:bg-[#0891b2] transition-colors"
                >
                  Search
                </button>
              </div>

              <div className="h-64 rounded-xl overflow-hidden border border-gray-200 relative z-10">
                <MapContainer center={[7.8731, 80.7718]} zoom={7} scrollWheelZoom={true} style={{ height: '100%', width: '100%', pointerEvents: 'auto' }} className="z-10">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapClickHandler setLocations={setLocations} />

                  {locations.map((loc, index) => (
                    <Marker
                      key={index}
                      position={[loc.lat, loc.lng]}
                      eventHandlers={{
                        click: () => {
                          setLocations(prev => prev.filter((_, i) => i !== index));
                        }
                      }}
                    />
                  ))}

                  {locations.length > 0 && (
                    <MapFocus locations={locations} />
                  )}
                </MapContainer>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Selected locations: {locations.length}
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin/alerts')}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white text-sm font-medium hover:from-[#0891b2] hover:to-[#2563eb] transition-all duration-150 disabled:opacity-60"
              >
                {submitting ? 'Creating...' : 'Create Alert'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateAlert;
