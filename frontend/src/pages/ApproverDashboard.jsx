import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApproverDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [updateStatus, setUpdateStatus] = useState({ status: '', remarks: '' });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/applications/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setApplications(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/applications/${applicationId}/status`,
        updateStatus,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      fetchApplications();
      setSelectedApplication(null);
      setUpdateStatus({ status: '', remarks: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating application status');
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Application Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage and review student KYC applications</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {applications.map((application) => (
              <li key={application._id}>
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {application.studentName}
                        </h3>
                        <p className="text-sm text-gray-500">{application.email}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                          application.status
                        )}`}
                      >
                        {application.status}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        Document Type: {application.documentType}
                      </p>
                      <p className="text-sm text-gray-600">
                        Submitted: {new Date(application.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => setSelectedApplication(application)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {selectedApplication && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Review Application</h2>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={updateStatus.status}
                  onChange={(e) => setUpdateStatus({ ...updateStatus, status: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select Status</option>
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                <textarea
                  value={updateStatus.remarks}
                  onChange={(e) => setUpdateStatus({ ...updateStatus, remarks: e.target.value })}
                  rows="3"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Add your remarks here..."
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedApplication._id)}
                  disabled={!updateStatus.status}
                  className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                    !updateStatus.status ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproverDashboard; 