// AppointmentAlert.js
import React from 'react';
import { Calendar, Clock, User, FileText } from 'lucide-react';

const AppointmentAlert = ({ nextAppointment }) => {
  if (!nextAppointment) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  const isUpcoming = () => {
    const appointmentTime = new Date(nextAppointment.date);
    const now = new Date();
    const timeDiff = appointmentTime - now;
    const hoursUntil = timeDiff / (1000 * 60 * 60);
    return hoursUntil > 0 && hoursUntil <= 24;
  };

  return (
    <div className={`appointment-alert ${isUpcoming() ? 'urgent' : ''}`}>
      <div className="alert-content">
        <Calendar className="alert-icon" />
        <div className="alert-details">
          <h3 className="alert-title">
            {isUpcoming() ? 'Upcoming Appointment!' : 'Next Appointment'}
          </h3>
          <div className="alert-info">
            <div className="info-row">
              <Clock className="info-icon" />
              <span className="info-text">{formatDate(nextAppointment.date)}</span>
            </div>
            <div className="info-row">
              <User className="info-icon" />
              <span className="info-text">Pet: {nextAppointment.petName}</span>
            </div>
            <div className="info-row">
              <FileText className="info-icon" />
              <span className="info-text">Reason: {nextAppointment.reason}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentAlert;