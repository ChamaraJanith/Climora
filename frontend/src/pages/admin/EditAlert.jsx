import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, X, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import Topbar from '../../components/admin/Topbar';
import api from '../../services/api';

const CATEGORIES = ['FLOOD', 'STORM', 'EARTHQUAKE', 'LANDSLIDE', 'TSUNAMI', 'WILDFIRE', 'CYCLONE', 'OTHER'];
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const DISTRICTS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara", "Hambantota", 
  "Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee", 
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla", "Moneragala", "Ratnapura", "Kegalle"
];

const LocationPicker = ({ location, setLocation }) => {
  useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return location ? <Marker position={[location.lat, location.lng]} /> : null;
};

const EditAlert = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', description: '', category: '', severity: '', district: '', startAt: '', isActive: true });
  const [cities, setCities] = useState([]);
  const [cityInput, setCityInput] = useState('');
  const [location, setLocation] = useState(null);
  const [safetyInstructions, setSafetyInstructions] = useState('');
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        const { data } = await api.get(`/alerts/${id}`);
        const alertData = data?.data || data;

        // Parse formatting
        const formattedStartAt = alertData.startAt ? new Date(alertData.startAt).toISOString().slice(0, 16) : '';
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
        setLocation(alertData.location?.lat ? alertData.location : null);
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
        location: location || undefined,
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
    `w-full px-4 py-2.5 text-sm bg-white border rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4] transition-all duration-150 ${
      errors[name] ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200'
    }`;

  if (loadingInitial) {
    return <div className="p-8 text-gray-500">Loading alert data...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Topbar placeholder="Search..." />
      <main className="flex-1 p-6 max-w-2xl">
        <button
          onClick={() => navigate(`/admin/alerts/${id}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#06b6d4] transition-colors duration-150 mb-6"
        >
          <ArrowLeft size={16} />
          Back to Alert Details
        </button>

        <div className="bg-[#F9FAFB] rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800 mb-1">Edit Alert</h1>
          <p className="text-sm text-gray-500 mb-6">Modify the details of this emergency alert.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Severe Flood Warning" className={fieldClass('title')} />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
              </div>
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

            {/* District + Status */}
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select name="isActive" value={form.isActive} onChange={handleChange} className={fieldClass('isActive')}>
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </select>
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date & Time</label>
              <input name="startAt" type="datetime-local" value={form.startAt} onChange={handleChange} className={fieldClass('startAt')} />
              {errors.startAt && <p className="mt-1 text-xs text-red-500">{errors.startAt}</p>}
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
              <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
                <MapContainer center={location?.lat ? [location.lat, location.lng] : [7.8731, 80.7718]} zoom={location?.lat ? 10 : 7} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <LocationPicker location={location} setLocation={setLocation} />
                </MapContainer>
              </div>
              {location && (
                <p className="mt-2 text-xs text-gray-500">
                  Selected coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(`/admin/alerts/${id}`)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white text-sm font-medium hover:from-[#0891b2] hover:to-[#2563eb] transition-all duration-150 disabled:opacity-60"
              >
                {submitting ? 'Updating...' : 'Update Alert'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditAlert;
