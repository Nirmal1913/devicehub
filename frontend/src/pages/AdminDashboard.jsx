import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { RequestStatusBadge } from '../components/Badge';
import { TableSkeleton } from '../components/Skeleton';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    if (!t) {
      navigate('/admin/login');
      return;
    }
    setToken(t);
    loadPending(t);
  }, []);

  async function loadPending(t) {
    setLoading(true);
    try {
      const data = await api.getPending(t);
      setPending(data);
    } catch (err) {
      console.error('Failed to load pending:', err);
      if (err.message?.includes('401') || err.message?.includes('403')) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveCheckout(id) {
    try {
      await api.approveCheckout(id, token);
      alert('Checkout approved!');
      loadPending(token);
    } catch (err) {
      alert('Failed: ' + (err.message || 'Unknown error'));
    }
  }

  async function handleRejectCheckout(id, reason) {
    try {
      await api.rejectCheckout(id, reason, token);
      alert('Checkout rejected.');
      setRejectModal(null);
      loadPending(token);
    } catch (err) {
      alert('Failed: ' + (err.message || 'Unknown error'));
    }
  }

  async function handleApproveReturn(id) {
    try {
      await api.approveReturn(id, token);
      alert('Return approved! Device is now available.');
      loadPending(token);
    } catch (err) {
      alert('Failed: ' + (err.message || 'Unknown error'));
    }
  }

  async function handleApproveReservation(id) {
    try {
      await api.approveReservation(id, token);
      alert('Reservation approved!');
      loadPending(token);
    } catch (err) {
      alert('Failed: ' + (err.message || 'Unknown error'));
    }
  }

  async function handleRejectReservation(id, reason) {
    try {
      await api.rejectReservation(id, reason, token);
      alert('Reservation rejected.');
      setRejectModal(null);
      loadPending(token);
    } catch (err) {
      alert('Failed: ' + (err.message || 'Unknown error'));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-combank-lightBlue via-white to-combank-slate p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 w-48 skeleton mb-2" />
            <div className="h-4 w-64 skeleton" />
          </div>
          <TableSkeleton rows={8} />
        </div>
      </div>
    );
  }

  const totalPending = (pending?.checkouts?.length || 0) + (pending?.returns?.length || 0) + (pending?.reservations?.length || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-combank-lightBlue via-white to-combank-slate p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-combank-navy mb-2">Admin Dashboard</h1>
            <p className="text-combank-gray">Approve requests and manage devices</p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/devices" className="btn-secondary">
              Manage Devices
            </Link>
            <Link to="/admin/analytics" className="btn-secondary">
              View Analytics
            </Link>
          </div>
        </div>

        {totalPending === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-xl text-combank-gray">🎉 All caught up! No pending approvals.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Checkouts */}
            {pending.checkouts.length > 0 && (
              <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-bold text-combank-navy mb-4">
                  Pending Checkout Requests ({pending.checkouts.length})
                </h2>
                <div className="space-y-3">
                  {pending.checkouts.map((req) => (
                    <div key={req.id} className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-combank-navy">
                            {req.model} ({req.asset_tag})
                          </p>
                          <p className="text-sm text-combank-gray">
                            Requested by: <span className="font-medium">{req.requester_name}</span> ({req.requester_email})
                          </p>
                          <p className="text-sm text-combank-gray">Purpose: {req.purpose}</p>
                          <p className="text-xs text-combank-gray mt-1">
                            Return by: {req.expected_return_date}
                          </p>
                        </div>
                        <RequestStatusBadge status={req.status} />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleApproveCheckout(req.id)}
                          className="btn-success text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ type: 'checkout', id: req.id })}
                          className="btn-danger text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Returns */}
            {pending.returns.length > 0 && (
              <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-bold text-combank-navy mb-4">
                  Pending Return Requests ({pending.returns.length})
                </h2>
                <div className="space-y-3">
                  {pending.returns.map((req) => (
                    <div key={req.id} className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-combank-navy">
                            {req.model} ({req.asset_tag})
                          </p>
                          <p className="text-sm text-combank-gray">
                            Return requested by: <span className="font-medium">{req.requester_name}</span>
                          </p>
                          <p className="text-xs text-combank-gray mt-1">
                            Checked out: {req.approved_at} • Expected: {req.expected_return_date}
                          </p>
                        </div>
                        <RequestStatusBadge status={req.status} />
                      </div>
                      <button
                        onClick={() => handleApproveReturn(req.id)}
                        className="btn-success text-sm mt-3"
                      >
                        Approve Return
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Reservations */}
            {pending.reservations.length > 0 && (
              <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-bold text-combank-navy mb-4">
                  Pending Reservations ({pending.reservations.length})
                </h2>
                <div className="space-y-3">
                  {pending.reservations.map((res) => (
                    <div key={res.id} className="bg-purple-50 border-l-4 border-purple-400 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-combank-navy">
                            {res.model} ({res.asset_tag})
                          </p>
                          <p className="text-sm text-combank-gray">
                            Reserved by: <span className="font-medium">{res.requester_name}</span> ({res.requester_email})
                          </p>
                          <p className="text-sm text-combank-gray">Purpose: {res.purpose}</p>
                          <p className="text-xs text-combank-gray mt-1">
                            {res.reserve_from} to {res.reserve_to}
                          </p>
                        </div>
                        <RequestStatusBadge status={res.status} />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleApproveReservation(res.id)}
                          className="btn-success text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ type: 'reservation', id: res.id })}
                          className="btn-danger text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRejectModal(null)} />
          <div className="relative glass rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-combank-navy mb-4">Rejection Reason</h3>
            <textarea
              className="input mb-4"
              rows="3"
              placeholder="Enter reason for rejection..."
              id="reject-reason"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const reason = document.getElementById('reject-reason').value;
                  if (!reason) return alert('Please enter a reason');
                  if (rejectModal.type === 'checkout') {
                    handleRejectCheckout(rejectModal.id, reason);
                  } else {
                    handleRejectReservation(rejectModal.id, reason);
                  }
                }}
                className="btn-danger flex-1"
              >
                Confirm Reject
              </button>
              <button onClick={() => setRejectModal(null)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
