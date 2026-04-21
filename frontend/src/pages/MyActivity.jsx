import { useState } from 'react';
import { api } from '../lib/api';
import { RequestStatusBadge } from '../components/Badge';

export function MyActivity() {
  const [email, setEmail] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const result = await api.getMyActivity(email);
      setData(result);
    } catch (err) {
      alert('Failed to load activity: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleReturn(requestId) {
    if (!confirm('Request to return this device?')) return;
    try {
      await api.requestReturn(requestId, email);
      alert('Return request submitted! Awaiting admin approval.');
      handleSearch({ preventDefault: () => {} });
    } catch (err) {
      alert('Failed: ' + (err.message || 'Unknown error'));
    }
  }

  async function handleCancelWaitlist(waitlistId) {
    if (!confirm('Leave this waitlist?')) return;
    try {
      await api.leaveWaitlist(waitlistId, email);
      alert('Removed from waitlist.');
      handleSearch({ preventDefault: () => {} });
    } catch (err) {
      alert('Failed: ' + (err.message || 'Unknown error'));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-combank-lightBlue via-white to-combank-slate p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-combank-navy mb-2">My Activity</h1>
        <p className="text-combank-gray mb-8">Track your checkout requests, reservations, and waitlist entries</p>

        <form onSubmit={handleSearch} className="glass rounded-xl p-6 mb-6">
          <div className="flex gap-4">
            <input
              type="email"
              placeholder="Enter your email address"
              className="input flex-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>
        </form>

        {data && (
          <div className="space-y-6">
            {/* Checkouts */}
            <div className="glass rounded-xl p-6">
              <h2 className="text-xl font-bold text-combank-navy mb-4">Checkout Requests</h2>
              {data.checkouts.length === 0 ? (
                <p className="text-combank-gray">No checkout requests found.</p>
              ) : (
                <div className="space-y-3">
                  {data.checkouts.map((req) => (
                    <div key={req.id} className="bg-combank-lightBlue rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-combank-navy">
                            {req.model} ({req.manufacturer})
                          </p>
                          <p className="text-sm text-combank-gray">{req.purpose}</p>
                        </div>
                        <RequestStatusBadge status={req.status} />
                      </div>
                      <p className="text-xs text-combank-gray">
                        Requested: {req.requested_at} • Expected return: {req.expected_return_date}
                      </p>
                      {req.status === 'approved' && (
                        <button
                          onClick={() => handleReturn(req.id)}
                          className="btn-secondary text-sm mt-3"
                        >
                          Request Return
                        </button>
                      )}
                      {req.status === 'rejected' && req.rejection_reason && (
                        <p className="text-sm text-red-600 mt-2">Reason: {req.rejection_reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reservations */}
            <div className="glass rounded-xl p-6">
              <h2 className="text-xl font-bold text-combank-navy mb-4">Reservations</h2>
              {data.reservations.length === 0 ? (
                <p className="text-combank-gray">No reservations found.</p>
              ) : (
                <div className="space-y-3">
                  {data.reservations.map((res) => (
                    <div key={res.id} className="bg-combank-lightBlue rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-combank-navy">
                            {res.model} ({res.manufacturer})
                          </p>
                          <p className="text-sm text-combank-gray">{res.purpose}</p>
                        </div>
                        <RequestStatusBadge status={res.status} />
                      </div>
                      <p className="text-xs text-combank-gray">
                        {res.reserve_from} to {res.reserve_to}
                      </p>
                      {res.status === 'rejected' && res.rejection_reason && (
                        <p className="text-sm text-red-600 mt-2">Reason: {res.rejection_reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Waitlist */}
            <div className="glass rounded-xl p-6">
              <h2 className="text-xl font-bold text-combank-navy mb-4">Waitlist</h2>
              {data.waitlist.length === 0 ? (
                <p className="text-combank-gray">Not on any waitlists.</p>
              ) : (
                <div className="space-y-3">
                  {data.waitlist.map((entry) => (
                    <div key={entry.id} className="bg-combank-lightBlue rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-combank-navy">
                            {entry.model} ({entry.manufacturer})
                          </p>
                          <p className="text-sm text-combank-gray">Position: #{entry.position}</p>
                        </div>
                        <RequestStatusBadge status={entry.status} />
                      </div>
                      <p className="text-xs text-combank-gray">Joined: {entry.joined_at}</p>
                      {entry.status === 'waiting' && (
                        <button
                          onClick={() => handleCancelWaitlist(entry.id)}
                          className="btn-danger text-sm mt-3"
                        >
                          Leave Waitlist
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
