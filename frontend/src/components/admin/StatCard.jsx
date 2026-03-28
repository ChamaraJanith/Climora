const StatCard = ({ icon: Icon, label, value, color = 'text-[#06b6d4]', loading = false }) => {
  if (loading) {
    return (
      <div className="bg-[#F9FAFB] rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-6 bg-gray-200 rounded w-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F9FAFB] rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-150">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm ${color}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-0.5">{value ?? 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
