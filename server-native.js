const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Simple in-memory database for now
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 30, created_at: new Date().toISOString() },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25, created_at: new Date().toISOString() }
];
let nextId = 3;

// CORS headers
const setCORSHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
};

// Parse request body
const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
};

// Validate user data
const validateUser = (user) => {
  const { name, email, age } = user;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { valid: false, error: 'Name is required and must be a non-empty string' };
  }
  
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { valid: false, error: 'Valid email is required' };
  }
  
  if (age !== undefined && (typeof age !== 'number' || age < 0 || age > 150)) {
    return { valid: false, error: 'Age must be a number between 0 and 150' };
  }
  
  return { valid: true };
};

// Send JSON response
const sendJSON = (res, statusCode, data) => {
  setCORSHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    setCORSHeaders(res);
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // GET /users
    if (path === '/users' && method === 'GET') {
      const { search, sort, order } = parsedUrl.query;
      let filteredUsers = [...users];

      // Search functionality
      if (search) {
        filteredUsers = filteredUsers.filter(user => 
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Sort functionality
      const validSortFields = ['id', 'name', 'email', 'age', 'created_at'];
      const sortField = validSortFields.includes(sort) ? sort : 'id';
      const sortOrder = order === 'desc' ? -1 : 1;

      filteredUsers.sort((a, b) => {
        if (a[sortField] < b[sortField]) return -1 * sortOrder;
        if (a[sortField] > b[sortField]) return 1 * sortOrder;
        return 0;
      });

      sendJSON(res, 200, filteredUsers);
      return;
    }

    // GET /users/:id
    const userMatch = path.match(/^\/users\/(\d+)$/);
    if (userMatch && method === 'GET') {
      const id = parseInt(userMatch[1]);
      const user = users.find(u => u.id === id);
      
      if (!user) {
        sendJSON(res, 404, { error: 'User not found' });
        return;
      }
      
      sendJSON(res, 200, user);
      return;
    }

    // POST /users
    if (path === '/users' && method === 'POST') {
      const userData = await parseBody(req);
      const validation = validateUser(userData);
      
      if (!validation.valid) {
        sendJSON(res, 400, { error: validation.error });
        return;
      }

      // Check for duplicate email
      if (users.some(u => u.email === userData.email)) {
        sendJSON(res, 409, { error: 'Email already exists' });
        return;
      }

      const newUser = {
        id: nextId++,
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      users.push(newUser);
      sendJSON(res, 201, newUser);
      return;
    }

    // PUT /users/:id
    if (userMatch && method === 'PUT') {
      const id = parseInt(userMatch[1]);
      const userData = await parseBody(req);
      const validation = validateUser(userData);
      
      if (!validation.valid) {
        sendJSON(res, 400, { error: validation.error });
        return;
      }

      const userIndex = users.findIndex(u => u.id === id);
      
      if (userIndex === -1) {
        sendJSON(res, 404, { error: 'User not found' });
        return;
      }

      // Check for duplicate email (excluding current user)
      if (users.some(u => u.email === userData.email && u.id !== id)) {
        sendJSON(res, 409, { error: 'Email already exists' });
        return;
      }

      users[userIndex] = {
        ...users[userIndex],
        ...userData,
        updated_at: new Date().toISOString()
      };

      sendJSON(res, 200, users[userIndex]);
      return;
    }

    // DELETE /users/:id
    if (userMatch && method === 'DELETE') {
      const id = parseInt(userMatch[1]);
      const userIndex = users.findIndex(u => u.id === id);
      
      if (userIndex === -1) {
        sendJSON(res, 404, { error: 'User not found' });
        return;
      }

      users.splice(userIndex, 1);
      sendJSON(res, 204, {});
      return;
    }

    // 404 for unknown routes
    sendJSON(res, 404, { error: 'Endpoint not found' });

  } catch (error) {
    console.error('Server error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`User Management API server running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET    /users              - List all users`);
  console.log(`  GET    /users/:id          - Get user by ID`);
  console.log(`  POST   /users              - Create new user`);
  console.log(`  PUT    /users/:id          - Update user`);
  console.log(`  DELETE /users/:id          - Delete user`);
  console.log(`\nExample usage:`);
  console.log(`  curl http://localhost:${PORT}/users`);
  console.log(`  curl -X POST http://localhost:${PORT}/users -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@example.com","age":28}'`);
});

module.exports = server;
