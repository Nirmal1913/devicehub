import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Badge } from '../components/Badge';
import { DeviceCardSkeleton } from '../components/Skeleton';

export function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', os: '', search: '' });

  useEffect(() => {
    loadDevices();
  }, [filters]);

  async function loadDevices() {
    setLoading(true);
    try {
      const data = await api.getDevices(filters);
      setDevices(data);
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-combank-lightBlue via-white to-combank-slate">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-combank-navy mb-2">QA Device Inventory</h1>
          <p className="text-combank-gray">Request devices for testing or reserve them for future use</p>
        </div>

        {/* Filters */}
        <div className="glass rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search model, manufacturer, asset tag..."
              className="input md:col-span-2"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="checked_out">Checked Out</option>
              <option value="reserved">Reserved</option>
              <option value="under_repair">Under Repair</option>
              <option value="retired">Retired</option>
            </select>
            <select
              className="input"
              value={filters.os}
              onChange={(e) => setFilters({ ...filters, os: e.target.value })}
            >
              <option value="">All OS</option>
              <option value="iOS">iOS</option>
              <option value="Android">Android</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Device grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <DeviceCardSkeleton key={i} />
            ))}
          </div>
        ) : devices.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-combank-gray text-lg">No devices found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <Link
                key={device.id}
                to={`/devices/${device.id}`}
                className="glass rounded-xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-combank-navy to-combank-blue rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl">📱</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-combank-navy mb-1 truncate">
                      {device.model}
                    </h3>
                    <p className="text-sm text-combank-gray truncate">{device.manufacturer}</p>
                  </div>
                  <Badge status={device.status} />
                </div>
                <div className="flex items-center gap-2 text-xs text-combank-gray mb-3">
                  <span className="px-2 py-1 bg-combank-lightBlue rounded">{device.os} {device.os_version}</span>
                  <span className="px-2 py-1 bg-gray-100 rounded">{device.asset_tag}</span>
                </div>
                {device.current_holder_name && (
                  <p className="text-xs text-combank-gray italic">
                    Currently with: {device.current_holder_name}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
