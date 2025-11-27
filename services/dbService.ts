import { User, Session, UserRole } from '../types';

const DB_KEY = 'physiotrack_db_v3'; // Bumped version for credential update

interface StoredUser extends User {
  passwordHash: string; // In a real app, this would be a hash. Storing plain text for this demo.
}

interface DatabaseSchema {
  users: StoredUser[];
  sessions: Session[];
}

// Initial Seed Data
const INITIAL_USERS: StoredUser[] = [
  { id: 'admin-1', username: 'admin', name: 'Clinic Manager', role: 'admin', passwordHash: 'physio123' },
  { id: 'user-1', username: 'jane', name: 'Jane Doe', role: 'therapist', passwordHash: 'password' },
  { id: 'user-2', username: 'mark', name: 'Mark Smith', role: 'therapist', passwordHash: 'password' },
];

const INITIAL_DB: DatabaseSchema = {
  users: INITIAL_USERS,
  sessions: []
};

class DBService {
  private db: DatabaseSchema;

  constructor() {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      this.db = JSON.parse(stored);
    } else {
      this.db = INITIAL_DB;
      this.save();
    }
  }

  private save() {
    localStorage.setItem(DB_KEY, JSON.stringify(this.db));
  }

  // Auth Methods
  login(username: string, password: string): User | null {
    const user = this.db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    // Check password (direct comparison for demo purposes)
    if (user && user.passwordHash === password) {
      // Return user without the password field
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    }
    return null;
  }

  registerUser(name: string, username: string, password: string, role: UserRole): { success: boolean; message: string } {
    // 1. Check if username exists
    const exists = this.db.users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      return { success: false, message: 'Username already taken.' };
    }

    // 2. Create new user
    const newUser: StoredUser = {
      id: Math.random().toString(36).substring(2, 10),
      name,
      username,
      passwordHash: password,
      role
    };

    // 3. Save
    this.db.users.push(newUser);
    this.save();

    return { success: true, message: 'Account created successfully.' };
  }

  // User Methods
  getAllTherapists(): User[] {
    return this.db.users
      .filter(u => u.role === 'therapist')
      .map(({ passwordHash, ...u }) => u);
  }

  // Session Methods
  addSession(session: Session) {
    this.db.sessions.unshift(session); // Add to top
    this.save();
  }

  getSessions(userId: string, role: string): Session[] {
    if (role === 'admin') {
      return this.db.sessions;
    }
    return this.db.sessions.filter(s => s.therapistId === userId);
  }
}

export const dbService = new DBService();