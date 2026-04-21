import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Badge, RequestStatusBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Skeleton } from '../components/Skeleton';
import { format } from 'date-fns';

export function DeviceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  useEffect(() => {
    loadDevice();
  }, [id]);

  async function loadDevice() {
    setLoading(true);
    try {
      const result = await api.getDevice(id);
      setData(result);
    } catch (err) {
      console.error('Failed to load device:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-combank-lightBlue via-white to-combank-slate p-8">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-96 w-full rounded-2xl mb-6" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-combank-lightBlue via-white to-combank-slate p-8">
        <div className="max-w-5xl mx-auto glass rounded-2xl p-12 text-center">
          <p className="text-combank-gray text-lg">Device not found</p>
        </div>
      </div>
    );
  }

  const { device, blockingIssues, healthLogs, upcomingReservations } = data;
  const hasBlockingIssues = blockingIssues.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-combank-lightBlue via-white to-combank-slate p-8">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-combank-blue hover:text-combank-navy font-medium flex items-center gap-2"
        >
          ← Back to Devices
        </button>

        {/* Device card */}
        <div className="glass rounded-2xl p-8">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-combank-navy to-combank-blue rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-5xl">📱</span>
            </div>
            <div className="flex-1">
              <Badge status={device.status} />
              <h1 className="text-3xl font-bold text-combank-navy mt-3 mb-1">{device.model}</h1>
              <p className="text-xl text-combank-gray">{device.manufacturer}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 text-sm">
            <div>
              <p className="text-combank-gray">OS</p>
              <p className="font-medium text-combank-navy">{device.os} {device.os_version}</p>
            </div>
            <div>
              <p className="text-combank-gray">Asset Tag</p>
              <p className="font-medium text-combank-navy">{device.asset_tag}</p>
            </div>
            <div>
              <p className="text-combank-gray">Serial No</p>
              <p className="font-medium text-combank-navy text-xs">{device.serial_no}</p>
            </div>
            {device.purchase_date && (
              <div>
                <p className="text-combank-gray">Purchased</p>
                <p className="font-medium text-combank-navy">{device.purchase_date}</p>
              </div>
            )}
          </div>

          {device.current_holder_name && (
            <div className="bg-combank-lightBlue rounded-lg p-4 mb-4">
              <p className="text-sm text-combank-gray">Currently checked out to:</p>
              <p className="font-medium text-combank-navy">{device.current_holder_name}</p>
              <p className="text-sm text-combank-gray">{device.current_holder_email}</p>
            </div>
          )}

          {device.notes && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-4">
              <p className="text-sm text-gray-700">{device.notes}</p>
            </div>
          )}

          {hasBlockingIssues && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
              <p className="font-semibold text-red-800">⚠️ Blocking Issues</p>
              {blockingIssues.map((issue) => (
                <p key={issue.id} className="text-sm text-red-700 mt-1">
                  • {issue.issue_type}: {issue.description}
                </p>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {device.status === 'available' && !hasBlockingIssues && (
              <button onClick={() => setShowCheckoutModal(true)} className="btn-primary">
                Request Checkout
              </button>
            )}
            {device.status === 'checked_out' && (
              <button onClick={() => setShowReturnModal(true)} className="btn-success">
                Request Return
              </button>
            )}
            <button onClick={() => setShowReserveModal(true)} className="btn-secondary">
              Reserve for Later
            </button>
            {device.status !== 'available' && (
              <button onClick={() => setShowWaitlistModal(true)} className="btn-secondary">
                Join Waitlist
              </button>
            )}
            <button onClick={() => setShowIssueModal(true)} className="btn-secondary">
              Report Issue
            </button>
          </div>
        </div>

        {/* Upcoming reservations */}
        {upcomingReservations.length > 0 && (
          <div className="glass rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-combank-navy mb-4">Upcoming Reservations</h2>
            <div className="space-y-2">
              {upcomingReservations.map((res) => (
                <div key={res.id} className="flex items-center justify-between bg-combank-lightBlue rounded-lg p-3">
                  <div>
                    <p className="font-medium text-combank-navy">{res.requester_name}</p>
                    <p className="text-sm text-combank-gray">
                      {res.reserve_from} to {res.reserve_to}
                    </p>
                  </div>
                  <RequestStatusBadge status={res.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health logs */}
        {healthLogs.length > 0 && (
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-bold text-combank-navy mb-4">Health History</h2>
            <div className="space-y-3">
              {healthLogs.map((log) => (
                <div key={log.id} className={`rounded-lg p-4 ${log.resolved ? 'bg-gray-50' : 'bg-red-50'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${log.severity === 'blocking' ? 'bg-red-200 text-red-800' : log.severity === 'major' ? 'bg-orange-200 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {log.severity}
                      </span>
                      <span className="text-sm font-medium text-gray-700">{log.issue_type}</span>
                    </div>
                    {log.resolved ? (
                      <span className="badge bg-green-100 text-green-700">Resolved</span>
                    ) : (
                      <span className="badge bg-red-100 text-red-700">Open</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{log.description}</p>
                  <p className="text-xs text-gray-500">
                    Reported by {log.reported_by_name} on {log.reported_at}
                  </p>
                  {log.resolution_notes && (
                    <p className="text-xs text-green-700 mt-2 italic">Resolution: {log.resolution_notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        deviceId={device.id}
      />
      <ReturnModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        device={device}
        onSuccess={() => {
          setShowReturnModal(false);
          loadDevice();
        }}
      />
      <ReserveModal
        isOpen={showReserveModal}
        onClose={() => setShowReserveModal(false)}
        deviceId={device.id}
      />
      <WaitlistModal
        isOpen={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
        deviceId={device.id}
      />
      <IssueModal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        deviceId={device.id}
      />
    </div>
  );
}

function ReturnModal({ isOpen, onClose, device, onSuccess }) {
  const [form, setForm] = useState({ email: '' });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // First, find the active checkout request for this device
      const activity = await api.getMyActivity(form.email);
      const activeCheckout = activity.checkouts.find(
        c => c.device_id === device.id && c.status === 'approved'
      );

      if (!activeCheckout) {
        alert('No active checkout found for this email and device.');
        return;
      }

      await api.requestReturn(activeCheckout.id, form.email);
      alert('Return request submitted! Awaiting admin approval.');
      onSuccess();
    } catch (err) {
      alert('Failed to submit return: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Return">
      <p className="text-sm text-combank-gray mb-4">
        Enter your email to request return of this device. Admin will need to approve the return.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-combank-navy mb-1">Your Email</label>
          <input
            type="email"
            required
            className="input"
            value={form.email}
            onChange={(e) => setForm({ email: e.target.value })}
            placeholder="Enter the email you used to checkout"
          />
        </div>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Submitting...' : 'Request Return'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CheckoutModal({ isOpen, onClose, deviceId }) {
  const [form, setForm] = useState({ name: '', email: '', purpose: '', returnDate: '' });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createCheckoutRequest({
        device_id: deviceId,
        requester_name: form.name,
        requester_email: form.email,
        purpose: form.purpose,
        expected_return_date: form.returnDate,
      });
      alert('Checkout request submitted! Awaiting admin approval.');
      onClose();
    } catch (err) {
      alert('Failed to submit request: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Checkout">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-combank-navy mb-1">Your Name</label>
          <input
            type="text"
            required
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-combank-navy mb-1">Your Email</label>
          <input
            type="email"
            required
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-combank-navy mb-1">Purpose</label>
          <textarea
            required
            className="input"
            rows="3"
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-combank-navy mb-1">Expected Return Date</label>
          <input
            type="date"
            required
            className="input"
            value={form.returnDate}
            onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
          />
        </div>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ReserveModal({ isOpen, onClose, deviceId }) {
  const [form, setForm] = useState({ name: '', email: '', purpose: '', from: '', to: '' });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createReservation({
        device_id: deviceId,
        requester_name: form.name,
        requester_email: form.email,
        purpose: form.purpose,
        reserve_from: form.from,
        reserve_to: form.to,
      });
      alert('Reservation request submitted! Awaiting admin approval.');
      onClose();
    } catch (err) {
      alert('Failed to submit: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reserve Device">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-combank-navy mb-1">Your Name</label>
          <input type="text" required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-combank-navy mb-1">Your Email</label>
          <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-combank-navy mb-1">Purpose</label>
          <textarea required className="input" rows="2" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-combank-navy mb-1">From</label>
            <input type="date" required className="input" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-combank-navy mb-1">To</label>
            <input type="date" required className="input" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Submitting...' : 'Submit Reservation'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

function WaitlistModal({ isOpen, onClose, deviceId }) {
  const [form, setForm] = useState({ name: '', email: '', purpose: '' });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await api.joinWaitlist({
        device_id: deviceId,
        requester_name: form.name,
        requester_email: form.email,
        purpose: form.purpose,
      });
      alert(`Added to waitlist at position ${result.position}. You'll be notified when the device is available.`);
      onClose();
    } catch (err) {
      alert('Failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Waitlist">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-combank-navy mb-1">Your Name</label>
          <input type="text" required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-combank-navy mb-1">Your Email</label>
          <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-combank-navy mb-1">Purpose</label>
          <textarea required className="input" rows="2" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
        </div>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Joining...' : 'Join Waitlist'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

function IssueModal({ isOpen, onClose, deviceId }) {
  const [form, setForm] = useState({ name: '', email: '', type: 'other', severity: 'minor', description: '' });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.reportIssue({
        device_id: deviceId,
        issue_type: form.type,
        severity: form.severity,
        description: form.description,
        reported_by_name: form.name,
        reported_by_email: form.email,
      });
      alert('Issue reported successfully. Admin will be notified.');
      onClose();
    } catch (err) {
      alert('Failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Issue">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-combank-navy mb-1">Your Name</label>
          <input type="text" required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-combank-navy mb-1">Your Email</label>
          <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-combank-navy mb-1">Issue Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="screen">Screen</option>
              <option value="battery">Battery</option>
              <option value="charging_port">Charging Port</option>
              <option value="buttons">Buttons</option>
              <option value="software">Software</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-combank-navy mb-1">Severity</label>
            <select className="input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
              <option value="blocking">Blocking</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-combank-navy mb-1">Description</label>
          <textarea required className="input" rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Submitting...' : 'Report Issue'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}
