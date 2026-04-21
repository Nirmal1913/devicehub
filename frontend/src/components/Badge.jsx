export function Badge({ status, children }) {
  const statusClasses = {
    available: 'badge-available',
    checked_out: 'badge-checked-out',
    reserved: 'badge-reserved',
    under_repair: 'badge-repair',
    retired: 'badge-retired',
  };

  const statusLabels = {
    available: 'Available',
    checked_out: 'Checked Out',
    reserved: 'Reserved',
    under_repair: 'Under Repair',
    retired: 'Retired',
  };

  return (
    <span className={`badge ${statusClasses[status] || 'badge bg-gray-200 text-gray-700'}`}>
      {children || statusLabels[status] || status}
    </span>
  );
}

export function RequestStatusBadge({ status }) {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    return_pending: 'bg-blue-100 text-blue-700',
    returned: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-gray-100 text-gray-500',
    active: 'bg-purple-100 text-purple-700',
    completed: 'bg-gray-100 text-gray-600',
    waiting: 'bg-orange-100 text-orange-700',
    notified: 'bg-blue-100 text-blue-700',
    fulfilled: 'bg-green-100 text-green-700',
  };

  const labels = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    return_pending: 'Return Pending',
    returned: 'Returned',
    cancelled: 'Cancelled',
    active: 'Active',
    completed: 'Completed',
    waiting: 'Waiting',
    notified: 'Notified',
    fulfilled: 'Fulfilled',
  };

  return (
    <span className={`badge ${classes[status] || 'bg-gray-200 text-gray-700'}`}>
      {labels[status] || status}
    </span>
  );
}
