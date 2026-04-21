import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { TableSkeleton } from '../components/Skeleton';

export function AdminDevices() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editDevice, setEditDevice] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    if (!t) {
      navigate('/admin/login');
      return;
    }
    setToken(t);
    loadDevices();
  }, []);

  async function loadDevices() {
    setLoading(true);
    try {
      const data = await api.getDevices({});
      setDevices(data);
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, model) {
    if (!confirm(`Delete device "${model}"? This will also delete all associated requests, reservations, and health logs.`)) {
      return;
    }
    try {
      await api.deleteDevice(id, token);
      alert('Device deleted successfully!');
      loadDevices();
    } catch (err) {
      alert('Failed to delete: ' + (err.message || 'Unknown error'));
    }
  }

  async function handleForceReturn(id, model) {
    if (!confirm(`Force return "${model}"? This will immediately mark the device as available.`)) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/devices/${id}/force-return`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to return device');
      }
      
      alert('Device returned successfully!');
      loadDevices();
    } catch (err) {
      alert('Failed to return: ' + (err.message || 'Unknown error'));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-combank-lightBlue via-white to-combank-slate p-8">
        <div className="max-w-7xl mx-auto">
          <TableSkeleton rows={10} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-combank-lightBlue via-white to-combank-slate p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-combank-navy mb-2">Manage Devices</h1>
            <p className="text-combank-gray">Add, edit, or remove devices from inventory</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              + Add Device
            </button>
            <Link to="/admin/dashboard" className="btn-secondary">
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-combank-navy text-white">
              <tr>
                <th className="text-left p-4">Model</th>
                <th className="text-left p-4">Manufacturer</th>
                <th className="text-left p-4">OS</th>
                <th className="text-left p-4">Asset Tag</th>
                <th className="text-left p-4">Serial No</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device, idx) => (
                <tr key={device.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-combank-lightBlue/30'}>
                  <td className="p-4 font-medium text-combank-navy">{device.model}</td>
                  <td className="p-4 text-combank-gray">{device.manufacturer}</td>
                  <td className="p-4 text-sm">
                    <span className="px-2 py-1 bg-combank-lightBlue rounded">
                      {device.os} {device.os_version}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-mono">{device.asset_tag}</td>
                  <td className="p-4 text-xs font-mono text-combank-gray">{device.serial_no}</td>
                  <td className="p-4">
                    <Badge status={device.status} />
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      {device.status === 'checked_out' && (
                        <button
                          onClick={() => handleForceReturn(device.id, device.model)}
                          className="px-3 py-1 bg-combank-green text-white text-sm rounded hover:brightness-110"
                        >
                          Force Return
                        </button>
                      )}
                      <button
                        onClick={() => setEditDevice(device)}
                        className="px-3 py-1 bg-combank-blue text-white text-sm rounded hover:bg-combank-navy"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(device.id, device.model)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-combank-gray text-sm mt-4">Total devices: {devices.length}</p>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editDevice) && (
        <DeviceFormModal
          device={editDevice}
          token={token}
          onClose={() => {
            setShowAddModal(false);
            setEditDevice(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditDevice(null);
            loadDevices();
          }}
        />
      )}
    </div>
  );
}

function DeviceFormModal({ device, token, onClose, onSuccess }) {
  const isEdit = !!device;
  const [form, setForm] = useState({
    model: device?.model || '',
    manufacturer: device?.manufacturer || '',
    os: device?.os || 'iOS',
    os_version: device?.os_version || '',
    serial_no: device?.serial_no || '',
    asset_tag: device?.asset_tag || '',
    purchase_date: device?.purchase_date || '',
    status: device?.status || 'available',
    notes: device?.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.updateDevice(device.id, form, token);
        alert('Device updated successfully!');
      } else {
        await api.createDevice(form, token);
        alert('Device added successfully!');
      }
      onSuccess();
    } catch (err) {
      alert('Failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={isEdit ? 'Edit Device' : 'Add New Device'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-combank-navy mb-1">Model *</label>
            <input
              type="text"
              required
              className="input"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder="e.g., iPhone 15 Pro"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-combank-navy mb-1">Manufacturer *</label>
            <input
              type="text"
              required
              className="input"
              value={form.manufacturer}
              onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
              placeholder="e.g., Apple"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-combank-navy mb-1">Operating System *</label>
            <select
              className="input"
              value={form.os}
              onChange={(e) => setForm({ ...form, os: e.target.value })}
            >
              <option value="iOS">iOS</option>
              <option value="Android">Android</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-combank-navy mb-1">OS Version</label>
            <input
              type="text"
              className="input"
              value={form.os_version}
              onChange={(e) => setForm({ ...form, os_version: e.target.value })}
              placeholder="e.g., 17.4"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-combank-navy mb-1">Serial Number *</label>
            <input
              type="text"
              required
              className="input"
              value={form.serial_no}
              onChange={(e) => setForm({ ...form, serial_no: e.target.value })}
              placeholder="e.g., SN-IP15P-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-combank-navy mb-1">Asset Tag *</label>
            <input
              type="text"
              required
              className="input"
              value={form.asset_tag}
              onChange={(e) => setForm({ ...form, asset_tag: e.target.value })}
              placeholder="e.g., QA-001"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-combank-navy mb-1">Purchase Date</label>
            <input
              type="date"
              className="input"
              value={form.purchase_date}
              onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-combank-navy mb-1">Status *</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="available">Available</option>
              <option value="checked_out">Checked Out</option>
              <option value="reserved">Reserved</option>
              <option value="under_repair">Under Repair</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-combank-navy mb-1">Notes</label>
          <textarea
            className="input"
            rows="3"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional notes about this device..."
          />
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Saving...' : isEdit ? 'Update Device' : 'Add Device'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
