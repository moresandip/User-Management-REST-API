const database = require('./database');

class UserModel {
  constructor() {
    this.db = database.getDatabase();
  }

  async getAllUsers(search = '', sortBy = 'id', order = 'asc') {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM users';
      let params = [];

      if (search) {
        query += ' WHERE name LIKE ? OR email LIKE ?';
        params.push(`%${search}%`, `%${search}%`);
      }

      const validSortFields = ['id', 'name', 'email', 'age', 'created_at'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'id';
      const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      
      query += ` ORDER BY ${sortField} ${sortOrder}`;

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getUserById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE id = ?';
      
      this.db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async createUser(user) {
    return new Promise((resolve, reject) => {
      const { name, email, age } = user;
      const query = 'INSERT INTO users (name, email, age) VALUES (?, ?, ?)';
      
      this.db.run(query, [name, email, age], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...user });
        }
      });
    });
  }

  async updateUser(id, updates) {
    return new Promise((resolve, reject) => {
      const { name, email, age } = updates;
      const query = `
        UPDATE users 
        SET name = ?, email = ?, age = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      this.db.run(query, [name, email, age, id], function(err) {
        if (err) {
          reject(err);
        } else {
          if (this.changes === 0) {
            resolve(null);
          } else {
            resolve({ id, ...updates });
          }
        }
      });
    });
  }

  async deleteUser(id) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM users WHERE id = ?';
      
      this.db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }
}

module.exports = new UserModel();
