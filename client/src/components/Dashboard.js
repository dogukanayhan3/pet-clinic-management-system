// Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PetList from './PetList';
import AppointmentList from './AppointmentList';
import AppointmentAlert from './AppointmentAlert';
import { 
  LogOut, 
  Layout, 
  Gauge,
  PawPrint, 
  Calendar,
  Bell,
  User
} from 'lucide-react';
import '../styles/dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState({
    totalPets: 0,
    upcomingAppointments: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [petsRes, appointmentsRes] = await Promise.all([
          axios.get('http://localhost:5001/pets', { headers }),
          axios.get('http://localhost:5001/appointments', { headers })
        ]);
        setPets(petsRes.data);
        setAppointments(appointmentsRes.data);
        
        // Find upcoming appointments and set next appointment
        const now = new Date();
        const upcoming = appointmentsRes.data.filter(apt => new Date(apt.date) >= now);
        const sortedAppointments = upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (sortedAppointments.length > 0) {
          setNextAppointment(sortedAppointments[0]);
        }

        // Set user info stats
        setUserInfo({
          totalPets: petsRes.data.length,
          upcomingAppointments: upcoming.length
        });

      } catch (err) {
        setError('Error fetching data');
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) return (
    <div className="dashboard-loading">
      <div className="loading-spinner"></div>
      <p>Loading your dashboard...</p>
    </div>
  );
  
  if (error) return (
    <div className="dashboard-error">
      <span className="error-icon">⚠️</span>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <Layout className="header-icon" />
          <h1>My Pet Dashboard</h1>
        </div>
        
        <div className="header-right">
          <div className="user-info">
            <User className="user-icon" />
            <span>Welcome back!</span>
          </div>
          <button className="logout-button" onClick={() => {
            localStorage.removeItem('token');
            navigate('/login');
          }}>
            <LogOut className="button-icon" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-stats">
          <div className="stat-card">
            <PawPrint className="stat-icon" />
            <div className="stat-info">
              <h3>Total Pets</h3>
              <p>{userInfo.totalPets}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <Calendar className="stat-icon" />
            <div className="stat-info">
              <h3>Upcoming Appointments</h3>
              <p>{userInfo.upcomingAppointments}</p>
            </div>
          </div>
          
          <div className="stat-card notifications">
            <Bell className="stat-icon" />
            <div className="stat-info">
              <h3>Notifications</h3>
              <p>{nextAppointment ? "1 upcoming" : "None"}</p>
            </div>
          </div>
        </div>

        {nextAppointment && (
          <AppointmentAlert nextAppointment={nextAppointment} />
        )}

        <div className="dashboard-sections">
          <section className="dashboard-section">
            <div className="section-header">
              <div className="section-title">
                <PawPrint className="section-icon" />
                <h2>My Pets</h2>
              </div>
            </div>
            <PetList pets={pets} setPets={setPets} />
          </section>

          <section className="dashboard-section">
            <div className="section-header">
              <div className="section-title">
                <Calendar className="section-icon" />
                <h2>Appointments</h2>
              </div>
            </div>
            <AppointmentList 
              appointments={appointments} 
              setAppointments={setAppointments}
              pets={pets}
            />
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;