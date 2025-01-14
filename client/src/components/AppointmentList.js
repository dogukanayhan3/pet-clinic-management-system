import React, { useState } from 'react';
import axios from 'axios';

const AppointmentList = ({ appointments, setAppointments, pets }) => {
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ pet_id: '', date: '', reason: '' });
  const [error, setError] = useState('');

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5001/appointments', newAppointment, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const response = await axios.get('http://localhost:5001/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data);
      setNewAppointment({ pet_id: '', date: '', reason: '' });
      setShowAppointmentForm(false);
    } catch (err) {
      alert("The date you selected is occupied by another appointment. Please select another date.");
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        const response = await fetch(`http://localhost:5001/api/appointments/${appointmentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
  
        if (response.ok) {
          setAppointments(appointments.filter(apt => apt.id !== appointmentId));
        } else {
          throw new Error('Failed to delete appointment');
        }
      } catch (error) {
        console.error('Error deleting appointment:', error);
      }
    }
  };

  return (
    <section className="appointments-section">
      <div className="section-header">
        <button onClick={() => setShowAppointmentForm(!showAppointmentForm)}>
          {showAppointmentForm ? 'Cancel' : 'Schedule Appointment'}
        </button>
      </div>

      {showAppointmentForm && (
        <form className="add-form" onSubmit={handleAddAppointment}>
          <select
            value={newAppointment.pet_id}
            onChange={(e) => setNewAppointment({...newAppointment, pet_id: e.target.value})}
            required
          >
            <option value="">Select Pet</option>
            {pets.map(pet => (
              <option key={pet.id} value={pet.id}>{pet.name}</option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={newAppointment.date}
            onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Reason for Visit"
            value={newAppointment.reason}
            onChange={(e) => setNewAppointment({...newAppointment, reason: e.target.value})}
            required
          />
          <button type="submit">Schedule</button>
        </form>
      )}

      <div className="appointments-list">
        {appointments.map(appointment => (
          <div key={appointment.id} className="appointment-card">
            <h3>Appointment for {appointment.petName}</h3>
            <p>Date: {new Date(appointment.date).toLocaleDateString()}</p>
            <p>Time: {appointment.time}</p>
            <p>Reason: {appointment.reason}</p>
            <button 
              onClick={() => handleDeleteAppointment(appointment.id)}
              className="delete-button"
            >
              Delete Appointment
            </button>
          </div>
        ))}
      </div>
      {error && <div className="error">{error}</div>}
    </section>
  );
};

export default AppointmentList;