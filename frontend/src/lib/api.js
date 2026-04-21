const API_BASE = '/api';

export const api = {
  // Devices
  getDevices: (params = {}) => 
    fetch(`${API_BASE}/devices?${new URLSearchParams(params)}`).then(r => r.json()),
  
  getDevice: (id) => 
    fetch(`${API_BASE}/devices/${id}`).then(r => r.json()),

  // Checkout requests
  createCheckoutRequest: (data) =>
    fetch(`${API_BASE}/checkout-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  requestReturn: (id, email) =>
    fetch(`${API_BASE}/checkout-requests/${id}/request-return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester_email: email }),
    }).then(r => r.json()),

  // Reservations
  createReservation: (data) =>
    fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  // Waitlist
  joinWaitlist: (data) =>
    fetch(`${API_BASE}/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  leaveWaitlist: (id, email) =>
    fetch(`${API_BASE}/waitlist/${id}?requester_email=${encodeURIComponent(email)}`, {
      method: 'DELETE',
    }).then(r => r.json()),

  // Health logs
  reportIssue: (data) =>
    fetch(`${API_BASE}/health-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  // Activity
  getMyActivity: (email) =>
    fetch(`${API_BASE}/my-activity?email=${encodeURIComponent(email)}`).then(r => r.json()),

  // Admin
  adminLogin: (username, password) =>
    fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(r => r.json()),

  getPending: (token) =>
    fetch(`${API_BASE}/admin/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),

  approveCheckout: (id, token) =>
    fetch(`${API_BASE}/admin/checkout-requests/${id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),

  rejectCheckout: (id, reason, token) =>
    fetch(`${API_BASE}/admin/checkout-requests/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    }).then(r => r.json()),

  approveReturn: (id, token) =>
    fetch(`${API_BASE}/admin/checkout-requests/${id}/approve-return`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),

  approveReservation: (id, token) =>
    fetch(`${API_BASE}/admin/reservations/${id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),

  rejectReservation: (id, reason, token) =>
    fetch(`${API_BASE}/admin/reservations/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    }).then(r => r.json()),

  createDevice: (data, token) =>
    fetch(`${API_BASE}/admin/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  updateDevice: (id, data, token) =>
    fetch(`${API_BASE}/admin/devices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  deleteDevice: (id, token) =>
    fetch(`${API_BASE}/admin/devices/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),

  resolveHealthIssue: (id, notes, token) =>
    fetch(`${API_BASE}/admin/health-logs/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ resolution_notes: notes }),
    }).then(r => r.json()),

  getAnalytics: (token) =>
    fetch(`${API_BASE}/admin/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),

  getAuditLog: (params, token) =>
    fetch(`${API_BASE}/admin/audit-log?${new URLSearchParams(params)}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),
};
