import React, { useState } from 'react';
import axios from 'axios';
import MedicalRecords from './MedicalRecords';

const PetList = ({ pets, setPets }) => {
  const [showPetForm, setShowPetForm] = useState(false);
  const [newPet, setNewPet] = useState({ name: '', species: '', breed: '', age: '' });
  const [error, setError] = useState('');

  const handleAddPet = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5001/pets', newPet, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const response = await axios.get('http://localhost:5001/pets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPets(response.data);
      setNewPet({ name: '', species: '', breed: '', age: '' });
      setShowPetForm(false);
      setError('');
    } catch (err) {
      setError('Error adding pet');
    }
  };

  const handleDeletePet = async (petId) => {
    if (window.confirm('Are you sure you want to delete this pet?')) {
      try {
        const response = await fetch(`http://localhost:5001/api/pets/${petId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
  
        if (response.ok) {
          setPets(pets.filter(pet => pet.id !== petId));
        } else {
          alert("The pet you are trying to delete has other appointments! First you have to delete your appointments for this pet.");
          throw new Error('Failed to delete pet');
        }
      } catch (error) {
        console.error('Error deleting pet:', error);
      }
    }
  };

  return (
    <section className="pets-section">
      <div className="section-header">
        <button onClick={() => setShowPetForm(!showPetForm)}>
          {showPetForm ? 'Cancel' : 'Add Pet'}
        </button>
      </div>

      {showPetForm && (
        <form className="add-form" onSubmit={handleAddPet}>
          <input
            type="text"
            placeholder="Pet Name"
            value={newPet.name}
            onChange={(e) => setNewPet({...newPet, name: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Species"
            value={newPet.species}
            onChange={(e) => setNewPet({...newPet, species: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Breed"
            value={newPet.breed}
            onChange={(e) => setNewPet({...newPet, breed: e.target.value})}
            required
          />
          <input
            type="number"
            placeholder="Age"
            min="0"
            value={newPet.age}
            onChange={(e) => setNewPet({...newPet, age: e.target.value})}
            required
          />
          <button type="submit">Add Pet</button>
        </form>
      )}

      <div className="pets-grid">
        {pets.map(pet => (
          <div key={pet.id} className="pet-card">
            <h3>{pet.name}</h3>
            <p>Species: {pet.species}</p>
            <p>Breed: {pet.breed}</p>
            <p>Age: {pet.age}</p>
            <div className="pet-actions">
              <button 
                onClick={() => handleDeletePet(pet.id)}
                className="delete-button"
              >
                Delete Pet
              </button>
            </div>
            <div className="pet-actions">
            <MedicalRecords petId={pet.id} petName={pet.name} />
            </div>
          </div>
        ))}
      </div>
      {error && <div className="error">{error}</div>}
    </section>
  );
};

export default PetList;