import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MedicalRecords = ({ petId, petName }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchMedicalRecords = async () => {
    setLoading(true);
    try {
      const headers = { 
        Authorization: `Bearer ${localStorage.getItem('token')}` 
      };
      const response = await axios.get(`http://localhost:5001/pets/${petId}/medical-records`, { headers });
      setRecords(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch medical records');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchMedicalRecords();
    }
  }, [isExpanded, petId]);

  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className="view-records-btn"
      >
        View Medical Records
      </button>
    );
  }

  return (
    <div className="medical-records">
      <div className="medical-records-header">
        <h4>{petName}'s Medical Records</h4>
        <button 
          onClick={() => setIsExpanded(false)}
          className="close-records-btn"
        >
          Close
        </button>
      </div>

      {loading ? (
        <p>Loading records...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : records.length === 0 ? (
        <p>No medical records found</p>
      ) : (
        <div className="records-list">
          {records.map((record) => (
            <div key={record.id} className="record-item">
              <div className="record-date">{record.record_date}</div>
              <div className="record-description">{record.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;