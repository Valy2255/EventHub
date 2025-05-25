// backend/tests/models/User.test.js
import { jest } from '@jest/globals';

// Mock bcrypt
const mockHash = jest.fn();
const mockCompare = jest.fn();
const mockGenSalt = jest.fn();
jest.unstable_mockModule('bcrypt', () => ({
  default: {
    hash: mockHash,
    compare: mockCompare,
    genSalt: mockGenSalt
  }
}));

// Mock database
const mockDbQuery = jest.fn();
const mockDbPool = {
  connect: jest.fn(),
  query: jest.fn()
};
jest.unstable_mockModule('../../config/db.js', () => ({
  query: mockDbQuery,
  pool: mockDbPool
}));

describe('User Model', () => {
  let User;
  let consoleSpy, consoleErrorSpy;

  beforeAll(async () => {
    User = await import('../../models/User.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Default bcrypt mocks
    mockGenSalt.mockResolvedValue('salt123');
    mockHash.mockResolvedValue('hashedPassword123');
    mockCompare.mockResolvedValue(true);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('create', () => {
    const mockUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    };

    it('should create a new user with hashed password', async () => {
      const mockCreated = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        created_at: '2024-03-15T10:00:00Z',
        credits: 0
      };

      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await User.create(mockUserData);

      expect(mockGenSalt).toHaveBeenCalledWith(10);
      expect(mockHash).toHaveBeenCalledWith('password123', 'salt123');
      expect(mockDbQuery).toHaveBeenCalledWith({
        text: 'INSERT INTO users(name, email, password, credits) VALUES($1, $2, $3, $4) RETURNING id, name, email, role, created_at, credits',
        values: ['John Doe', 'john@example.com', 'hashedPassword123', 0]
      });
      expect(result).toEqual(mockCreated);
    });

    it('should handle bcrypt errors', async () => {
      const error = new Error('Hash failed');
      mockGenSalt.mockRejectedValue(error);

      await expect(User.create(mockUserData)).rejects.toThrow('Hash failed');
    });

    it('should handle database errors', async () => {
      const error = new Error('Unique constraint violation');
      mockDbQuery.mockRejectedValue(error);

      await expect(User.create(mockUserData)).rejects.toThrow('Unique constraint violation');
    });

    it('should not return password in result', async () => {
      const mockCreated = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        created_at: '2024-03-15T10:00:00Z',
        credits: 0
      };

      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await User.create(mockUserData);

      expect(result).not.toHaveProperty('password');
    });

    it('should initialize user with 0 credits', async () => {
      mockDbQuery.mockResolvedValue({ rows: [{ credits: 0 }] });

      await User.create(mockUserData);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.any(String),
        values: expect.arrayContaining([0]) // Credits should be 0
      });
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword123',
        role: 'user'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockUser] });

      const result = await User.findByEmail('john@example.com');

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: 'SELECT * FROM users WHERE email = $1',
        values: ['john@example.com']
      });
      expect(result).toEqual(mockUser);
    });

    it('should return undefined for non-existent email', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await User.findByEmail('nonexistent@example.com');

      expect(result).toBeUndefined();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(User.findByEmail('john@example.com')).rejects.toThrow('Database error');
    });

    it('should be case sensitive for email', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await User.findByEmail('John@Example.Com');

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: 'SELECT * FROM users WHERE email = $1',
        values: ['John@Example.Com']
      });
    });
  });

  describe('findById', () => {
    it('should find user by ID without password', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        profile_image: 'profile.jpg',
        role: 'user',
        created_at: '2024-03-15T10:00:00Z',
        credits: 100
      };

      mockDbQuery.mockResolvedValue({ rows: [mockUser] });

      const result = await User.findById(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: 'SELECT id, name, email, profile_image, role, created_at, credits FROM users WHERE id = $1',
        values: [1]
      });
      expect(result).toEqual(mockUser);
      expect(result).not.toHaveProperty('password');
    });

    it('should return undefined for non-existent user', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await User.findById(999);

      expect(result).toBeUndefined();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(User.findById(1)).rejects.toThrow('Database error');
    });

    it('should exclude password from selection', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await User.findById(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.not.stringContaining('password'),
        values: [1]
      });
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      mockCompare.mockResolvedValue(true);

      const result = await User.comparePassword('plaintext', 'hashedPassword');

      expect(mockCompare).toHaveBeenCalledWith('plaintext', 'hashedPassword');
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      mockCompare.mockResolvedValue(false);

      const result = await User.comparePassword('wrongpassword', 'hashedPassword');

      expect(mockCompare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
      expect(result).toBe(false);
    });

    it('should handle bcrypt errors', async () => {
      const error = new Error('Comparison failed');
      mockCompare.mockRejectedValue(error);

      await expect(User.comparePassword('plaintext', 'hashedPassword')).rejects.toThrow('Comparison failed');
    });
  });

  describe('updateResetToken', () => {
    it('should update reset token and expiration', async () => {
      const mockUpdated = { id: 1 };
      const expireDate = new Date('2024-03-15T11:00:00Z');
      
      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      const result = await User.updateResetToken(1, 'resetToken123', expireDate.getTime());

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: 'UPDATE users SET reset_token = $1, reset_token_expire = $2 WHERE id = $3 RETURNING id',
        values: ['resetToken123', expireDate, 1]
      });
      expect(result).toEqual(mockUpdated);
    });

    it('should handle null expiration', async () => {
      const mockUpdated = { id: 1 };
      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      const result = await User.updateResetToken(1, 'resetToken123', null);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.any(String),
        values: ['resetToken123', null, 1]
      });
      expect(result).toEqual(mockUpdated);
    });

    it('should handle database errors', async () => {
      const error = new Error('Update failed');
      mockDbQuery.mockRejectedValue(error);

      await expect(User.updateResetToken(1, 'token', Date.now())).rejects.toThrow('Update failed');
    });
  });

  describe('findByResetToken', () => {
    it('should find user by reset token', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        reset_token: 'resetToken123',
        reset_token_expire: '2024-03-15T11:00:00Z'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockUser] });

      const result = await User.findByResetToken('resetToken123');

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: 'SELECT * FROM users WHERE reset_token = $1',
        values: ['resetToken123']
      });
      expect(result).toEqual(mockUser);
    });

    it('should return undefined for invalid token', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await User.findByResetToken('invalidToken');

      expect(result).toBeUndefined();
    });
  });

  describe('updatePassword', () => {
    it('should update password and clear reset token', async () => {
      const mockUpdated = { id: 1 };
      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      const result = await User.updatePassword(1, 'newPassword123');

      expect(mockGenSalt).toHaveBeenCalledWith(10);
      expect(mockHash).toHaveBeenCalledWith('newPassword123', 'salt123');
      expect(mockDbQuery).toHaveBeenCalledWith({
        text: 'UPDATE users SET password = $1, reset_token = NULL, reset_token_expire = NULL WHERE id = $2 RETURNING id',
        values: ['hashedPassword123', 1]
      });
      expect(result).toEqual(mockUpdated);
    });

    it('should handle hashing errors', async () => {
      const error = new Error('Hash failed');
      mockHash.mockRejectedValue(error);

      await expect(User.updatePassword(1, 'newPassword')).rejects.toThrow('Hash failed');
    });

    it('should clear reset token fields', async () => {
      mockDbQuery.mockResolvedValue({ rows: [{ id: 1 }] });

      await User.updatePassword(1, 'newPassword');

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining('reset_token = NULL, reset_token_expire = NULL'),
        values: ['hashedPassword123', 1]
      });
    });
  });

  describe('addCredits', () => {
    let mockClient;
    beforeEach(() => {
      // Mock client for transaction
      mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      mockDbPool.connect.mockResolvedValue(mockClient);
    });

    it('should add credits to user and record transaction', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ credits: 150 }] }) // Update credits
        .mockResolvedValueOnce({ rows: [{ id: 1, amount: 50 }] }) // Insert transaction
        .mockResolvedValueOnce({}); // COMMIT

      const result = await User.addCredits(1, 50, 'refund', 'Refund for cancelled ticket', 'ref123', 'refund');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith({
        text: expect.stringMatching(/UPDATE users.*SET credits = credits \+ \$1.*WHERE id = \$2.*RETURNING credits/s),
        values: [50, 1]
      });
      expect(mockClient.query).toHaveBeenCalledWith({
        text: expect.stringMatching(/INSERT INTO credit_transactions.*VALUES \(\$1, \$2, \$3, \$4, \$5, \$6\)/s),
        values: [1, 50, 'refund', 'Refund for cancelled ticket', 'ref123', 'refund']
      });
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();

      expect(result).toEqual({
        currentCredits: 150,
        transaction: { id: 1, amount: 50 }
      });
    });

    it('should handle user not found error', async () => {  
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // User not found
        .mockResolvedValueOnce({}); // ROLLBACK

      await expect(User.addCredits(999, 50, 'refund', 'Description'))
        .rejects.toThrow('User with ID 999 not found');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in addCredits:', expect.any(Error));
    });

  });

  describe('getCreditBalance', () => {
    it('should get user credit balance', async () => {
      mockDbQuery.mockResolvedValue({ rows: [{ credits: 250 }] });

      const result = await User.getCreditBalance(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: 'SELECT credits FROM users WHERE id = $1',
        values: [1]
      });
      expect(result).toBe(250);
    });

    it('should throw error when user not found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await expect(User.getCreditBalance(999)).rejects.toThrow('User with ID 999 not found');
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(User.getCreditBalance(1)).rejects.toThrow('Database error');
    });
  });

  describe('getCreditTransactions', () => {
    it('should get user credit transactions with pagination', async () => {
      const mockTransactions = [
        {
          id: 1,
          user_id: 1,
          amount: 50,
          type: 'refund',
          description: 'Refund for cancelled ticket',
          created_at: '2024-03-15T10:00:00Z'
        },
        {
          id: 2,
          user_id: 1,
          amount: -25,
          type: 'purchase',
          description: 'Ticket purchase',
          created_at: '2024-03-14T10:00:00Z'
        }
      ];

      mockDbQuery.mockResolvedValue({ rows: mockTransactions });

      const result = await User.getCreditTransactions(1, 10, 0);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/SELECT \* FROM credit_transactions.*WHERE user_id = \$1.*ORDER BY created_at DESC.*LIMIT \$2 OFFSET \$3/s),
        values: [1, 10, 0]
      });
      expect(result).toEqual(mockTransactions);
    });

    it('should use default pagination parameters', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await User.getCreditTransactions(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.any(String),
        values: [1, 10, 0] // Default limit=10, offset=0
      });
    });

    it('should order transactions by created_at DESC', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await User.getCreditTransactions(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining('ORDER BY created_at DESC'),
        values: [1, 10, 0]
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(User.getCreditTransactions(1)).rejects.toThrow('Database error');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile with provided fields', async () => {
      const updateData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        profile_image: 'new-profile.jpg'
      };

      const mockUpdated = {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        profile_image: 'new-profile.jpg',
        role: 'user',
        created_at: '2024-03-15T10:00:00Z',
        credits: 100
      };

      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      const result = await User.updateProfile(1, updateData);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/UPDATE users.*SET name = COALESCE\(\$1, name\).*email = COALESCE\(\$2, email\).*profile_image = COALESCE\(\$3, profile_image\).*updated_at = NOW\(\).*WHERE id = \$4.*RETURNING/s),
        values: ['Jane Doe', 'jane@example.com', 'new-profile.jpg', 1]
      });
      expect(result).toEqual(mockUpdated);
    });

    it('should update only provided fields using COALESCE', async () => {
      const partialUpdate = { name: 'New Name' };
      const mockUpdated = { id: 1, name: 'New Name' };
      
      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      const result = await User.updateProfile(1, partialUpdate);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/COALESCE\(\$1, name\).*COALESCE\(\$2, email\).*COALESCE\(\$3, profile_image\)/s),
        values: ['New Name', undefined, undefined, 1]
      });
      expect(result).toEqual(mockUpdated);
    });

    it('should return undefined when user not found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await User.updateProfile(999, { name: 'Test' });

      expect(result).toBeUndefined();
    });

    it('should handle database errors', async () => {
      const error = new Error('Update failed');
      mockDbQuery.mockRejectedValue(error);

      await expect(User.updateProfile(1, { name: 'Test' })).rejects.toThrow('Update failed');
    });

    it('should not return password in result', async () => {
      const mockUpdated = {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'user'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      const result = await User.updateProfile(1, { name: 'Jane Doe' });

      expect(result).not.toHaveProperty('password');
    });

    it('should update timestamp', async () => {
      mockDbQuery.mockResolvedValue({ rows: [{ id: 1 }] });

      await User.updateProfile(1, { name: 'Test' });

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining('updated_at = NOW()'),
        values: expect.any(Array)
      });
    });
  });
});