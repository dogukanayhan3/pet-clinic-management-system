import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, Users, PawPrint, Calendar } from 'lucide-react';
import '../styles/adminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [medicalRecords, setMedicalRecords] = useState({});
  const [editPet, setEditPet] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [addRecordPetId, setAddRecordPetId] = useState(null);
const [newRecordDescription, setNewRecordDescription] = useState('');

const handleDeletePet = async (id) => {
  // Add confirmation dialog
  if (!window.confirm('Are you sure you want to delete this pet? This will also delete all associated medical records.')) {
    return;
  }

  const headers = { 
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  };

  try {
    await axios.delete(`http://localhost:5001/admin/pets/${id}`, { headers });
    setPets(pets.filter(pet => pet.id !== id));
    // Clear medical records for the deleted pet
    const updatedRecords = { ...medicalRecords };
    delete updatedRecords[id];
    setMedicalRecords(updatedRecords);
  } catch (error) {
    console.error('Error deleting pet:', error);
    alert('Failed to delete pet: ' + (error.response?.data?.message || error.message));
  }
};

const handleEditPet = async (id, updatedPet) => {
  const headers = { 
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
  };

  try {
      await axios.put(`http://localhost:5001/admin/pets/${id}`, updatedPet, { headers });
      setPets(pets.map(pet => (pet.id === id ? { ...pet, ...updatedPet } : pet)));
  } catch (error) {
      console.error('Error editing pet:', error);
  }
};

const fetchMedicalRecords = async (petId) => {
  const headers = { 
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios.get(`http://localhost:5001/admin/medical-records/${petId}`, { headers });
    setMedicalRecords(prev => ({
      ...prev,
      [petId]: response.data
    }));
  } catch (err) {
    console.error('Error fetching medical records:', err);
    alert('Failed to fetch medical records: ' + (err.response?.data?.message || err.message));
  }
};

const handleAddMedicalRecord = async () => {
  if (!addRecordPetId || !newRecordDescription.trim()) {
    alert('Please enter a description for the medical record');
    return;
  }

  const headers = { 
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios.post('http://localhost:5001/admin/medical-records', {
      pet_id: addRecordPetId,
      record_date: new Date().toISOString().split('T')[0],
      description: newRecordDescription.trim(),
    }, { headers });

    // Refresh medical records for this pet
    await fetchMedicalRecords(addRecordPetId);

    // Clear form
    setNewRecordDescription('');
    setAddRecordPetId(null);

    // Show success message
    alert('Medical record added successfully');
  } catch (err) {
    console.error('Error adding medical record:', err);
    alert('Failed to add medical record: ' + (err.response?.data?.message || err.message));
  }
};

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isAdmin = localStorage.getItem('isAdmin') === '1';
  
    if (!token || !isAdmin) {
      navigate('/login');
      return;
    }
  
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const headers = { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        
        console.log('Token being used:', token); // Debug log

        // Fetch data separately to identify which call fails
        try {
          console.log('Fetching users...');
          const usersResponse = await axios.get('http://localhost:5001/admin/users', { headers });
          console.log('Users response:', usersResponse.data);
          setUsers(usersResponse.data);
        } catch (usersError) {
          console.error('Users fetch error:', {
            status: usersError.response?.status,
            data: usersError.response?.data,
            message: usersError.message
          });
          throw new Error(`Users error: ${usersError.response?.data?.message || usersError.message}`);
        }

        try {
          console.log('Fetching pets...');
          const petsResponse = await axios.get('http://localhost:5001/admin/pets', { headers });
          console.log('Pets response:', petsResponse.data);
          setPets(petsResponse.data);
        } catch (petsError) {
          console.error('Pets fetch error:', {
            status: petsError.response?.status,
            data: petsError.response?.data,
            message: petsError.message
          });
          throw new Error(`Pets error: ${petsError.response?.data?.message || petsError.message}`);
        }

        try {
          console.log('Fetching appointments...');
          const appointmentsResponse = await axios.get('http://localhost:5001/admin/appointments', { headers });
          console.log('Appointments response:', appointmentsResponse.data);
          setAppointments(appointmentsResponse.data);
        } catch (appointmentsError) {
          console.error('Appointments fetch error:', {
            status: appointmentsError.response?.status,
            data: appointmentsError.response?.data,
            message: appointmentsError.message
          });
          throw new Error(`Appointments error: ${appointmentsError.response?.data?.message || appointmentsError.message}`);
        }

      } catch (err) {
        console.error('Final error:', err);
        setError(err.message || 'Error fetching data');
        
        if (err.response?.status === 403 || err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('isAdmin');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [navigate]);

  

  const filterData = (data) => {
    return data.filter(item => 
      Object.values(item)
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  };

  const UsersTable = () => (
    <table className="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Joined Date</th>
        </tr>
      </thead>
      <tbody>
        {filterData(users).map(user => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>{user.name}</td>
            <td>{user.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const PetsTable = () => (
    <table className="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Owner</th>
          <th>Species</th>
          <th>Breed</th>
          <th>Age</th>
          <th>Actions</th>
          <th>Medical Records</th>
        </tr>
      </thead>
      <tbody>
      {filterData(pets).map(pet => (
          
            <tr key={pet.id}>
              <td>{pet.id}</td>
              <td>{pet.name}</td>
              <td>{pet.owner_name}</td>
              <td>{pet.species}</td>
              <td>{pet.breed}</td>
              <td>{pet.age}</td>
              <td>
                <button onClick={() => setEditPet(pet)}>Edit</button>
                <button onClick={() => handleDeletePet(pet.id)}>Delete</button>
              </td>
              <td>
                <button onClick={() => fetchMedicalRecords(pet.id)}>View Records</button>
                {medicalRecords[pet.id] && (
                  <ul>
                    {medicalRecords[pet.id].map(record => (
                      <li key={record.id}>{record.description} ({record.record_date})</li>
                    ))}
                  </ul>
                )}
                <button onClick={() => setAddRecordPetId(pet.id)}>Add Record</button>
              </td>
            </tr>
      ))}
      </tbody>
    </table>
  );

  const AppointmentsTable = () => (
    <table className="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Pet Name</th>
          <th>Owner</th>
          <th>Date</th>
          <th>Time</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody>
        {filterData(appointments).map(appointment => (
          <tr key={appointment.id}>
            <td>{appointment.id}</td>
            <td>{appointment.pet_name}</td>
            <td>{appointment.owner_name}</td>
            <td>{appointment.formatted_date}</td>
            <td>{appointment.formatted_time}</td>
            <td>{appointment.reason}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="header-left">
          <h1>Admin Dashboard</h1>
        </div>
        <button onClick={() => {
          localStorage.removeItem('token');
          navigate('/login');
        }}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </header>

      <div className="admin-controls">
        <div className="tab-buttons">
          <button 
            className={activeTab === 'users' ? 'active' : ''} 
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} />
            <span>Users</span>
          </button>
          <button 
            className={activeTab === 'pets' ? 'active' : ''} 
            onClick={() => setActiveTab('pets')}
          >
            <PawPrint size={16} />
            <span>Pets</span>
          </button>
          <button 
            className={activeTab === 'appointments' ? 'active' : ''} 
            onClick={() => setActiveTab('appointments')}
          >
            <Calendar size={16} />
            <span>Appointments</span>
          </button>
        </div>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

        <div className="table-container">
          {activeTab === 'users' && <UsersTable />}
          {activeTab === 'pets' && <PetsTable />}
          {editPet && (
          <div className="edit-form">
            <h2>Edit Pet</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleEditPet(editPet.id, {
                name: e.target.name.value,
                species: e.target.species.value,
                breed: e.target.breed.value,
                age: e.target.age.value
              });
            }}>
              <input name="name" defaultValue={editPet.name} placeholder="Name" />
              <input name="species" defaultValue={editPet.species} placeholder="Species" />
              <input name="breed" defaultValue={editPet.breed} placeholder="Breed" />
              <input name="age" defaultValue={editPet.age} placeholder="Age" />
              <button type="submit">Save</button>
              <button type="button" onClick={() => setEditPet(null)}>Cancel</button>
            </form>
          </div>
        )}
        {addRecordPetId && (
          <div className="add-record-form">
              <h3>Add Medical Record for Pet ID: {addRecordPetId}</h3>
              <textarea
                  rows="4"
                  placeholder="Enter medical record details"
                  value={newRecordDescription}
                  onChange={(e) => setNewRecordDescription(e.target.value)}
              />
              <button onClick={handleAddMedicalRecord}>Save Record</button>
              <button onClick={() => setAddRecordPetId(null)}>Cancel</button>
          </div>
        )}
          {activeTab === 'appointments' && <AppointmentsTable />}
        </div>
      </div>
  );
};

export default AdminDashboard;