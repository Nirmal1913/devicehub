import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function AdminAnalytics() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    if (!t) {
      navigate('/admin/login');
      return;
    }
    setToken(t);
    loadAnalytics(t);
  }, []);

  async function loadAnalytics(t) {
    setLoading(true);
    try {
      const data = await api.getAnalytics(t);
      console.log('Analytics data:', data);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      alert('Failed to load analytics: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  if (loading || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-combank-lightBlue via-white to-combank-slate p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl" />
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ['#003366', '#0066CC', '#00A86B', '#64748B', '#E6F2FF'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-combank-lightBlue via-white to-combank-slate p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-combank-navy mb-2">Analytics</h1>
            <p className="text-combank-gray">Device usage insights and metrics</p>
          </div>
          <Link to="/admin/dashboard" className="btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass rounded-xl p-6">
            <p className="text-sm text-combank-gray mb-1">Utilization Rate</p>
            <p className="text-3xl font-bold text-combank-navy">{analytics.utilizationRate}%</p>
          </div>
          <div className="glass rounded-xl p-6">
            <p className="text-sm text-combank-gray mb-1">Avg Checkout Duration</p>
            <p className="text-3xl font-bold text-combank-navy">{analytics.avgCheckoutDays} days</p>
          </div>
          <div className="glass rounded-xl p-6">
            <p className="text-sm text-combank-gray mb-1">Overdue Rate</p>
            <p className="text-3xl font-bold text-red-600">{analytics.overdueRate}%</p>
          </div>
          <div className="glass rounded-xl p-6">
            <p className="text-sm text-combank-gray mb-1">Currently Overdue</p>
            <p className="text-3xl font-bold text-orange-600">{analytics.currentOverdueCount}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Most Requested Devices */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-xl font-bold text-combank-navy mb-4">Most Requested Devices (30 days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.mostRequested.slice(0, 10)}>
                <XAxis dataKey="model" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="request_count" fill="#0066CC" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Requesters */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-xl font-bold text-combank-navy mb-4">Top Requesters</h2>
            <div className="space-y-3">
              {analytics.topRequesters.slice(0, 8).map((req, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-combank-navy text-sm">{req.requester_name}</p>
                    <p className="text-xs text-combank-gray">{req.requester_email}</p>
                  </div>
                  <span className="badge bg-combank-blue text-white">
                    {req.checkout_count} checkouts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Health Hotspots and Idle Devices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health Hotspots */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-xl font-bold text-combank-navy mb-4">Health Hotspots (30 days)</h2>
            {analytics.healthHotspots.length === 0 ? (
              <p className="text-combank-gray">No issues reported recently.</p>
            ) : (
              <div className="space-y-3">
                {analytics.healthHotspots.map((device, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-combank-navy text-sm">{device.model}</p>
                      <p className="text-xs text-combank-gray">{device.manufacturer}</p>
                    </div>
                    <span className="badge bg-red-600 text-white">
                      {device.issue_count} issues
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Idle Devices */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-xl font-bold text-combank-navy mb-4">
              Idle Devices (60+ days) — Consider Retiring
            </h2>
            {analytics.idleDevices.length === 0 ? (
              <p className="text-combank-gray">All devices are actively used.</p>
            ) : (
              <div className="space-y-3">
                {analytics.idleDevices.map((device, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-combank-navy text-sm">{device.model}</p>
                      <p className="text-xs text-combank-gray">{device.manufacturer} • {device.asset_tag}</p>
                    </div>
                    <span className="badge bg-gray-300 text-gray-700">Idle</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
