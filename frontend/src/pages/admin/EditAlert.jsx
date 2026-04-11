import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, X, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
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
import Topbar from '../../components/admin/Topbar';
import api from '../../services/api';

const CATEGORIES = ['FLOOD', 'STORM', 'EARTHQUAKE', 'LANDSLIDE', 'TSUNAMI', 'WILDFIRE', 'CYCLONE', 'OTHER'];
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const DISTRICTS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara", "Hambantota", 
  "Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee", 
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla", "Moneragala", "Ratnapura", "Kegalle"
];

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

const EditAlert = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', description: '', category: '', severity: '', district: '', startAt: '', isActive: true });
  const [cities, setCities] = useState([]);
  const [cityInput, setCityInput] = useState('');
  const [locations, setLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [safetyInstructions, setSafetyInstructions] = useState('');
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this alert?")) return;
    try {
      await api.delete(`/alerts/${id}`);
      toast.success("Alert deleted successfully");
      navigate('/admin/alerts');
    } catch (err) {
      toast.error("Failed to delete alert");
    }
  };

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        const { data } = await api.get(`/alerts/${id}`);
        const alertData = data?.data || data;

        // Parse formatting
        const formattedStartAt = alertData.startAt
          ? new Date(new Date(alertData.startAt).getTime() - new Date().getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16)
          : '';
        const safetylines = alertData.safetyInstructions 
          ? (Array.isArray(alertData.safetyInstructions) ? alertData.safetyInstructions.join('\n') : alertData.safetyInstructions) 
          : '';

        let loadedCities = [];
        if (alertData.area?.cities?.length) {
            loadedCities = alertData.area.cities;
        } else if (alertData.area?.city) {
            loadedCities = [alertData.area.city];
        }

        setForm({
          title: alertData.title || '',
          description: alertData.description || '',
          category: alertData.category || '',
          severity: alertData.severity || '',
          district: alertData.area?.district || '',
          startAt: formattedStartAt,
          isActive: alertData.isActive ?? true
        });

        setCities(loadedCities);
        setLocations(alertData.locations || []);
        setSafetyInstructions(safetylines);
      } catch (err) {
        toast.error('Failed to fetch alert data');
        navigate('/admin/alerts');
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchAlert();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // properly parse boolean from string selection
    const parsedValue = name === 'isActive' ? value === 'true' : value;
    setForm((prev) => ({ ...prev, [name]: parsedValue }));
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
        safetyInstructions: instructionsArray,
        isActive: form.isActive
      };

      await api.put(`/alerts/${id}`, payload);
      toast.success('Alert updated successfully');
      navigate(`/admin/alerts/${id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update alert');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (name) =>
    `w-full px-4 py-3 text-[15px] bg-white/5 border rounded-[12px] text-white placeholder-white/40 focus:outline-none focus:bg-[rgba(255,255,255,0.08)] focus:border-[#00c6ff] focus:shadow-[0_0_12px_rgba(0,198,255,0.5)] transition-all duration-250 ${
      errors[name] ? 'border-red-500/60 focus:border-red-400 focus:shadow-[0_0_12px_rgba(255,0,0,0.4)]' : 'border-white/10'
    }`;

  if (loadingInitial) {
    return <div className="p-8 text-gray-500 font-medium">Loading alert data...</div>;
  }

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
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full animate-[fadeInUp_0.4s_ease-out_forwards]">
        <button
          onClick={() => navigate(`/admin/alerts/${id}`)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-[#00c6ff] transition-colors duration-200 mb-6"
        >
          <ArrowLeft size={16} />
          Back to Alert Details
        </button>

        <div className="relative bg-gradient-to-br from-[rgba(10,15,30,0.92)] to-[rgba(15,23,42,0.85)] backdrop-blur-[18px] border border-white/5 rounded-[20px] p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5),0_0_40px_rgba(255,140,0,0.12)] overflow-hidden group">
          {/* Depth Effect Overlays */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,150,255,0.12),transparent_60%)] pointer-events-none z-0" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,140,0,0.05),transparent_50%)] pointer-events-none z-0 mix-blend-screen" />
          
          {/* Glowing Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00c6ff] to-[#0072ff] shadow-[0_0_10px_#00c6ff] z-10" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-2xl font-bold text-white tracking-wide">Edit Alert</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/30 uppercase tracking-widest shadow-[0_0_10px_rgba(255,140,0,0.2)]">
                Editing Mode
              </span>
            </div>
            <p className="text-sm text-white/50 mb-8 font-medium">Modify the details of this emergency alert.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Title</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Severe Flood Warning" className={fieldClass('title')} />
                {errors.title && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Describe the alert in detail..." className={`${fieldClass('description')} resize-y`} />
                {errors.description && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.description}</p>}
              </div>

              {/* Safety Instructions */}
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Safety Instructions</label>
                <textarea 
                  value={safetyInstructions} 
                  onChange={(e) => setSafetyInstructions(e.target.value)} 
                  rows={4} 
                  placeholder="Enter safety instructions (one instruction per line)..." 
                  className={`${fieldClass('safetyInstructions')} resize-y`} 
                />
              </div>

              {/* Category + Severity */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">Category</label>
                  <select name="category" value={form.category} onChange={handleChange} className={`${fieldClass('category')} appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em]`}>
                    <option value="" className="bg-[#0b1120] text-white">Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#0b1120] text-white py-1">{c}</option>)}
                  </select>
                  {errors.category && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.category}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">Severity</label>
                  <select name="severity" value={form.severity} onChange={handleChange} className={`${fieldClass('severity')} appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em]`}>
                    <option value="" className="bg-[#0b1120] text-white">Select severity</option>
                    {SEVERITIES.map((s) => <option key={s} value={s} className="bg-[#0b1120] text-white py-1">{s}</option>)}
                  </select>
                  {errors.severity && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.severity}</p>}
                </div>
              </div>

              {/* District + Status */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">District</label>
                  <select name="district" value={form.district} onChange={handleChange} className={`${fieldClass('district')} appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em]`}>
                    <option value="" className="bg-[#0b1120] text-white">Select district</option>
                    {DISTRICTS.map((d) => <option key={d} value={d} className="bg-[#0b1120] text-white py-1">{d}</option>)}
                  </select>
                  {errors.district && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.district}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">Status</label>
                  <select name="isActive" value={form.isActive} onChange={handleChange} className={`${fieldClass('isActive')} appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em]`}>
                    <option value={true} className="bg-[#0b1120] text-white py-1">Active</option>
                    <option value={false} className="bg-[#0b1120] text-white py-1">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Start Date & Time</label>
                <input
                  name="startAt"
                  type="datetime-local"
                  value={form.startAt || ''}
                  onChange={handleChange}
                  className={`${fieldClass('startAt')} [color-scheme:dark]`}
                />
                {errors.startAt && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.startAt}</p>}
              </div>

              {/* Affected Areas (Cities) */}
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Affected Areas (Cities/Towns)</label>
                <input 
                  type="text" 
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyDown={handleCityKeyDown}
                  placeholder="Type city name and press Enter" 
                  className={fieldClass('city')} 
                />
                {cities.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 mt-3.5">
                    {cities.map((city, i) => (
                      <span key={i} className="flex items-center gap-2 bg-white/10 text-white text-[13px] font-medium px-3.5 py-1.5 rounded-lg border border-white/20 shadow-sm backdrop-blur-md">
                        {city}
                        <button type="button" onClick={() => removeCity(city)} className="text-white/50 hover:text-red-400 hover:bg-white/10 rounded-full p-0.5 transition-colors">
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Map Location */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-white/70 mb-3">
                  <MapPin size={16} className="text-[#38bdf8] drop-shadow-[0_0_4px_rgba(56,189,248,0.5)]" />
                  Select Map Location
                </label>
                
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search location..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className={fieldClass('search')}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-50 bg-[#0b1221] border border-white/10 w-full rounded-xl mt-1.5 max-h-60 overflow-y-auto shadow-2xl backdrop-blur-xl">
                        {suggestions.map((place, index) => (
                          <div
                            key={index}
                            onClick={() => handleSelectLocation(place)}
                            className="px-4 py-2.5 text-sm text-white/80 font-medium hover:bg-white/10 hover:text-white cursor-pointer transition-colors border-b border-white/5 last:border-0"
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
                    className="px-5 py-3 rounded-[12px] bg-white/10 border border-white/10 text-white font-medium hover:bg-white/20 transition-all duration-200"
                  >
                    Search
                  </button>
                </div>

                <div className="h-[280px] rounded-xl overflow-hidden border border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] relative z-10 group">
                  <div className="absolute inset-0 bg-black/20 pointer-events-none z-[400]" />
                  <MapContainer center={[7.8731, 80.7718]} zoom={7} scrollWheelZoom={true} style={{ height: '100%', width: '100%', pointerEvents: 'auto' }} className="z-10">
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      className="map-tiles"
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
                <p className="text-xs text-white/40 mt-3 font-medium uppercase tracking-widest pl-1">
                  Selected locations: {locations.length}
                </p>
              </div>

              {/* Submit / Action Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-3.5 rounded-[12px] bg-[rgba(255,0,0,0.08)] border border-[rgba(255,0,0,0.25)] text-[#ff4d4d] text-[15px] font-semibold hover:bg-[rgba(255,0,0,0.15)] hover:border-red-500/40 hover:shadow-[0_0_15px_rgba(255,0,0,0.2)] hover:-translate-y-[2px] transition-all duration-200 shadow-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/alerts/${id}`)}
                  className="flex-1 px-5 py-3.5 rounded-[12px] border border-white/10 text-[15px] font-semibold text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-5 py-3.5 rounded-[12px] bg-gradient-to-r from-[#00c6ff] to-[#0072ff] text-white text-[15px] font-semibold shadow-[0_0_20px_rgba(0,150,255,0.3)] hover:shadow-[0_0_25px_rgba(0,150,255,0.5)] hover:-translate-y-[2px] transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {submitting ? 'Updating Alert...' : 'Update Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditAlert;
