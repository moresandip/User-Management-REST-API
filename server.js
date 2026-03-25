const express = require('express');
const userModel = require('./userModel');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const validateUser = (req, res, next) => {
  const { name, email, age } = req.body;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
  }
  
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  
  if (age !== undefined && (typeof age !== 'number' || age < 0 || age > 150)) {
    return res.status(400).json({ error: 'Age must be a number between 0 and 150' });
  }
  
  next();
};

app.get('/users', async (req, res) => {
  try {
    const { search, sort, order } = req.query;
    const users = await userModel.getAllUsers(search, sort, order);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const user = await userModel.getUserById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/users', validateUser, async (req, res) => {
  try {
    const { name, email, age } = req.body;
    const newUser = await userModel.createUser({ name, email, age });
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.put('/users/:id', validateUser, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, age } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const updatedUser = await userModel.updateUser(id, { name, email, age });
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.delete('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const deleted = await userModel.deleteUser(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`User Management API server running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET    /users              - List all users`);
  console.log(`  GET    /users/:id          - Get user by ID`);
  console.log(`  POST   /users              - Create new user`);
  console.log(`  PUT    /users/:id          - Update user`);
  console.log(`  DELETE /users/:id          - Delete user`);
});

module.exports = app;
