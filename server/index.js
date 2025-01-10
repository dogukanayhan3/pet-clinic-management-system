const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(bodyParser.json());

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'dogukan',
    password: '12345',
    database: 'vetdb',
});


db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).send({ message: 'No token provided' });

    jwt.verify(token, 'secret_key', (err, user) => {
        if (err) return res.status(403).send({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};
const isAdmin = (req, res, next) => {
  const query = 'SELECT is_admin FROM users WHERE id = ?';
  db.query(query, [req.user.id], (err, results) => {
    if (err) return res.status(500).send(err);
    if (results.length === 0 || !results[0].is_admin) {
      return res.status(403).send({ message: 'Unauthorized: Admin access required' });
    }
    next();
  });
};

// Admin routes
app.get('/admin/users', authenticateToken, isAdmin, (req, res) => {
  console.log('Admin users request received');
  console.log('User from token:', req.user);
  
  const query = 'SELECT id, name, email FROM users';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error in /admin/users:', err);
      return res.status(500).json({ 
        message: 'Database error occurred', 
        error: err.message 
      });
    }
    console.log('Users query successful, count:', results?.length);
    res.json(results);
  });
});

app.get('/admin/pets', authenticateToken, isAdmin, (req, res) => {
  console.log('Admin pets request received');
  
  const query = `
    SELECT p.*, u.name as owner_name 
    FROM pets p 
    JOIN users u ON p.user_id = u.id
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error in /admin/pets:', err);
      return res.status(500).json({ 
        message: 'Database error occurred', 
        error: err.message 
      });
    }
    console.log('Pets query successful, count:', results?.length);
    res.json(results);
  });
});

app.get('/admin/appointments', authenticateToken, isAdmin, (req, res) => {
  console.log('Admin appointments request received');
  
  const query = `
    SELECT 
      a.*,
      p.name as pet_name,
      u.name as owner_name,
      DATE_FORMAT(a.date, '%Y-%m-%d') as formatted_date,
      DATE_FORMAT(a.date, '%H:%i') as formatted_time
    FROM appointments a
    JOIN pets p ON a.pet_id = p.id
    JOIN users u ON a.user_id = u.id
    ORDER BY a.date DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error in /admin/appointments:', err);
      return res.status(500).json({ 
        message: 'Database error occurred', 
        error: err.message 
      });
    }
    console.log('Appointments query successful, count:', results?.length);
    res.json(results);
  });
});

// Edit a pet
app.put('/admin/pets/:id', authenticateToken, isAdmin, (req, res) => {
  const { name, species, breed, age } = req.body;
  const query = 'UPDATE pets SET name = ?, species = ?, breed = ?, age = ? WHERE id = ?';
  db.query(query, [name, species, breed, age, req.params.id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: 'Pet updated successfully' });
  });
});

// Modify the delete pet endpoint to check for existing records
app.delete('/admin/pets/:id', authenticateToken, isAdmin, (req, res) => {
  const petId = req.params.id;
  
  // Start a transaction to ensure data consistency
  db.beginTransaction(err => {
    if (err) return res.status(500).json({ error: err.message });

    // Delete medical records first
    const deleteRecordsQuery = 'DELETE FROM medical_records WHERE pet_id = ?';
    db.query(deleteRecordsQuery, [petId], (err, result) => {
      if (err) {
        return db.rollback(() => {
          res.status(500).json({ error: err.message });
        });
      }

      // Then delete the pet
      const deletePetQuery = 'DELETE FROM pets WHERE id = ?';
      db.query(deletePetQuery, [petId], (err, result) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ error: err.message });
          });
        }

        db.commit(err => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ error: err.message });
            });
          }
          res.status(200).json({ message: 'Pet and associated records deleted successfully' });
        });
      });
    });
  });
});

// Edit an appointment
app.put('/admin/appointments/:id', authenticateToken, isAdmin, (req, res) => {
  const { date, reason } = req.body;
  const query = 'UPDATE appointments SET date = ?, reason = ? WHERE id = ?';
  db.query(query, [date, reason, req.params.id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: 'Appointment updated successfully' });
  });
});

// Delete an appointment
app.delete('/admin/appointments/:id', authenticateToken, isAdmin, (req, res) => {
  const query = 'DELETE FROM appointments WHERE id = ?';
  db.query(query, [req.params.id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: 'Appointment deleted successfully' });
  });
});

// Get medical records for a pet
app.get('/admin/medical-records/:petId', authenticateToken, isAdmin, (req, res) => {
  const query = `
    SELECT * FROM medical_records 
    WHERE pet_id = ? 
    ORDER BY record_date DESC
  `;
  
  db.query(query, [req.params.petId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Add a medical record
app.post('/admin/medical-records', authenticateToken, isAdmin, (req, res) => {
  const { pet_id, record_date, description } = req.body;
  
  if (!pet_id || !description) {
    return res.status(400).json({ message: 'Pet ID and description are required' });
  }

  const query = 'INSERT INTO medical_records (pet_id, record_date, description) VALUES (?, ?, ?)';
  db.query(query, [pet_id, record_date || new Date(), description], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ 
      message: 'Medical record added successfully',
      recordId: result.insertId 
    });
  });
});

// Existing routes for users
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
  db.query(query, [name, email, hashedPassword], (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({ message: 'User registered successfully' });
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, results) => {
      if (err) return res.status(500).send(err);
      if (results.length === 0) return res.status(401).send({ message: 'User not found' });

      const user = results[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return res.status(401).send({ message: 'Invalid password' });

      // Include is_admin in the token payload for frontend use
      const token = jwt.sign(
          { 
              id: user.id, 
              is_admin: user.is_admin 
          }, 
          'secret_key', 
          { expiresIn: '1h' }
      );

      res.send({ 
          message: 'Login successful', 
          token,
          isAdmin: user.is_admin // Send admin status to frontend for conditional rendering
      });
  });
});

// New routes for pets and appointments
app.get('/pets', authenticateToken, (req, res) => {
    const query = 'SELECT * FROM pets WHERE user_id = ?';
    db.query(query, [req.user.id], (err, results) => {
        if (err) return res.status(500).send(err);
        res.send(results);
    });
});

app.get('/pets/:petId/medical-records', authenticateToken, (req, res) => {
  // First verify the pet belongs to the user making the request
  const verifyQuery = 'SELECT id FROM pets WHERE id = ? AND user_id = ?';
  db.query(verifyQuery, [req.params.petId, req.user.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0) {
      return res.status(403).json({ message: 'Unauthorized: Pet does not belong to user' });
    }

    // Fetch medical records for the pet
    const recordsQuery = `
      SELECT 
        id,
        DATE_FORMAT(record_date, '%Y-%m-%d') as record_date,
        description
      FROM medical_records 
      WHERE pet_id = ? 
      ORDER BY record_date DESC
    `;
    
    db.query(recordsQuery, [req.params.petId], (err, records) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(records);
    });
  });
});

app.post('/pets', authenticateToken, (req, res) => {
    const { name, species, breed, age } = req.body;
    const query = 'INSERT INTO pets (user_id, name, species, breed, age) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [req.user.id, name, species, breed, age], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ message: 'Pet added successfully' });
    });
});

// New routes for appointments with date formatting
// Update the appointments route in index.js to include formatted date and time strings
app.get('/appointments', authenticateToken, (req, res) => {
  const query = `
      SELECT 
          a.*, 
          p.name as petName,
          DATE_FORMAT(a.date, '%Y-%m-%d %H:%i:%s') as date,
          DATE_FORMAT(a.date, '%H:%i') as time
      FROM appointments a 
      JOIN pets p ON a.pet_id = p.id 
      WHERE a.user_id = ?
      ORDER BY a.date ASC
  `;
  
  db.query(query, [req.user.id], (err, results) => {
      if (err) return res.status(500).send(err);
      
      // Format the date strings properly for frontend use
      const formattedResults = results.map(appointment => ({
          ...appointment,
          date: appointment.date // This will now be properly formatted for frontend use (e.g., 2021-08-25 14:30:00)
      }));
      
      res.send(formattedResults);
  });
});

app.post('/appointments', authenticateToken, (req, res) => {
    const { pet_id, date, reason } = req.body;
    const query = 'INSERT INTO appointments (user_id, pet_id, date, reason) VALUES (?, ?, ?, ?)';
    db.query(query, [req.user.id, pet_id, date, reason], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ message: 'Appointment scheduled successfully' });
    });
});

app.delete('/api/pets/:id', authenticateToken, (req, res) => {
  console.log('Deleting pet with ID:', req.params.id);
  const query = 'DELETE FROM pets WHERE id = ? AND user_id = ?';
  
  db.query(query, [req.params.id, req.user.id], (err, result) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: err.message });
      }
      
      if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Pet not found or unauthorized' });
      }
      
      res.status(200).json({ message: 'Pet deleted successfully' });
  });
});

app.delete('/api/appointments/:id', authenticateToken, (req, res) => {
  console.log('Deleting appointment with ID:', req.params.id);
  const query = 'DELETE FROM appointments WHERE id = ? AND user_id = ?';
  
  db.query(query, [req.params.id, req.user.id], (err, result) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: err.message });
      }
      
      if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Appointment not found or unauthorized' });
      }
      
      res.status(200).json({ message: 'Appointment deleted successfully' });
  });
});

// Move app.listen() to be the last thing in your file to ensure all routes are defined
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});