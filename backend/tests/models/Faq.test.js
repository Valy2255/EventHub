// backend/tests/models/Faq.test.js
import { jest } from '@jest/globals';

// Mock database
const mockDbQuery = jest.fn();
jest.unstable_mockModule('../../config/db.js', () => ({
  query: mockDbQuery
}));

describe('Faq Model', () => {
  let Faq;

  beforeAll(async () => {
    Faq = await import('../../models/Faq.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllFAQs', () => {
    it('should get all active FAQs ordered by display_order', async () => {
      const mockFAQs = [
        {
          id: 1,
          question: 'What is EventHub?',
          answer: 'EventHub is a platform...',
          display_order: 1
        },
        {
          id: 2,
          question: 'How do I buy tickets?',
          answer: 'You can buy tickets by...',
          display_order: 2
        }
      ];

      mockDbQuery.mockResolvedValue({ rows: mockFAQs });

      const result = await Faq.getAllFAQs();

      expect(mockDbQuery).toHaveBeenCalledWith(
        'SELECT id, question, answer, display_order FROM faqs WHERE is_active = true ORDER BY display_order ASC',
        []
      );
      expect(result).toEqual(mockFAQs);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      mockDbQuery.mockRejectedValue(error);

      await expect(Faq.getAllFAQs()).rejects.toThrow('Error fetching FAQs: Database connection failed');
    });

    it('should return empty array when no FAQs found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Faq.getAllFAQs();

      expect(result).toEqual([]);
    });
  });

  describe('createFAQ', () => {
    const mockFaqData = {
      question: 'New FAQ question?',
      answer: 'New FAQ answer',
      display_order: 5
    };

    it('should create a new FAQ', async () => {
      const mockCreated = { id: 1, ...mockFaqData };
      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await Faq.createFAQ(mockFaqData);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO faqs \(question, answer, display_order\)\s+VALUES \(\$1, \$2, \$3\)\s+RETURNING id, question, answer, display_order/s),
        ['New FAQ question?', 'New FAQ answer', 5]
      );
      expect(result).toEqual(mockCreated);
    });

    it('should create FAQ with custom client', async () => {
      const mockClient = { query: jest.fn() };
      const mockCreated = { id: 1, ...mockFaqData };
      mockClient.query.mockResolvedValue({ rows: [mockCreated] });

      const result = await Faq.createFAQ(mockFaqData, mockClient);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO faqs \(question, answer, display_order\)\s+VALUES \(\$1, \$2, \$3\)\s+RETURNING id, question, answer, display_order/s),
        ['New FAQ question?', 'New FAQ answer', 5]
      );
      expect(result).toEqual(mockCreated);
    });

    it('should use default display_order when not provided', async () => {
      const dataWithoutOrder = {
        question: 'New FAQ question?',
        answer: 'New FAQ answer'
      };
      const mockCreated = { id: 1, ...dataWithoutOrder, display_order: 0 };
      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await Faq.createFAQ(dataWithoutOrder);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.any(String),
        ['New FAQ question?', 'New FAQ answer', 0]
      );
      expect(result).toEqual(mockCreated);
    });

    it('should handle database errors', async () => {
      const error = new Error('Constraint violation');
      mockDbQuery.mockRejectedValue(error);

      await expect(Faq.createFAQ(mockFaqData)).rejects.toThrow('Error creating FAQ: Constraint violation');
    });
  });

  describe('updateFAQ', () => {
    const mockUpdateData = {
      question: 'Updated question?',
      answer: 'Updated answer',
      display_order: 3,
      is_active: true
    };

    it('should update an FAQ with all fields', async () => {
      const mockUpdated = { id: 1, ...mockUpdateData };
      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      const result = await Faq.updateFAQ(1, mockUpdateData);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE faqs SET updated_at = CURRENT_TIMESTAMP, question = \$1, answer = \$2, display_order = \$3, is_active = \$4 WHERE id = \$5/),
        ['Updated question?', 'Updated answer', 3, true, 1]
      );
      expect(result).toEqual(mockUpdated);
    });

    it('should update FAQ with partial data', async () => {
      const partialData = { question: 'Updated question only?' };
      const mockUpdated = { id: 1, question: 'Updated question only?' };
      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      const result = await Faq.updateFAQ(1, partialData);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE faqs SET updated_at = CURRENT_TIMESTAMP, question = \$1 WHERE id = \$2/),
        ['Updated question only?', 1]
      );
      expect(result).toEqual(mockUpdated);
    });

    it('should update FAQ with custom client', async () => {
      const mockClient = { query: jest.fn() };
      const mockUpdated = { id: 1, ...mockUpdateData };
      mockClient.query.mockResolvedValue({ rows: [mockUpdated] });

      const result = await Faq.updateFAQ(1, mockUpdateData, mockClient);

      expect(mockClient.query).toHaveBeenCalled();
      expect(result).toEqual(mockUpdated);
    });

    it('should return null when FAQ not found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Faq.updateFAQ(999, mockUpdateData);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = new Error('Update failed');
      mockDbQuery.mockRejectedValue(error);

      await expect(Faq.updateFAQ(1, mockUpdateData)).rejects.toThrow('Error updating FAQ: Update failed');
    });

    it('should handle undefined values gracefully', async () => {
      const dataWithUndefined = {
        question: 'Updated question?',
        answer: undefined,
        display_order: 3
      };
      const mockUpdated = { id: 1, question: 'Updated question?', display_order: 3 };
      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      const result = await Faq.updateFAQ(1, dataWithUndefined);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE faqs SET updated_at = CURRENT_TIMESTAMP, question = \$1, display_order = \$2 WHERE id = \$3/),
        ['Updated question?', 3, 1]
      );
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('deleteFAQ', () => {
    it('should delete an FAQ', async () => {
      mockDbQuery.mockResolvedValue({ rows: [{ id: 1 }] });

      const result = await Faq.deleteFAQ(1);

      expect(mockDbQuery).toHaveBeenCalledWith(
        'DELETE FROM faqs WHERE id = $1 RETURNING id',
        [1]
      );
      expect(result).toBe(true);
    });

    it('should delete FAQ with custom client', async () => {
      const mockClient = { query: jest.fn() };
      mockClient.query.mockResolvedValue({ rows: [{ id: 1 }] });

      const result = await Faq.deleteFAQ(1, mockClient);

      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM faqs WHERE id = $1 RETURNING id',
        [1]
      );
      expect(result).toBe(true);
    });

    it('should return false when FAQ not found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Faq.deleteFAQ(999);

      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      const error = new Error('Delete failed');
      mockDbQuery.mockRejectedValue(error);

      await expect(Faq.deleteFAQ(1)).rejects.toThrow('Error deleting FAQ: Delete failed');
    });
  });

  describe('updateOrder', () => {
    const mockOrderData = [
      { id: 1, display_order: 2 },
      { id: 2, display_order: 1 },
      { id: 3, display_order: 3 }
    ];

    it('should update FAQ order with transaction', async () => {
      mockDbQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // UPDATE 1
        .mockResolvedValueOnce({}) // UPDATE 2
        .mockResolvedValueOnce({}) // UPDATE 3
        .mockResolvedValueOnce({}); // COMMIT

      const result = await Faq.updateOrder(mockOrderData);

      expect(mockDbQuery).toHaveBeenCalledWith('BEGIN', []);
      expect(mockDbQuery).toHaveBeenCalledWith(
        'UPDATE faqs SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [2, 1]
      );
      expect(mockDbQuery).toHaveBeenCalledWith(
        'UPDATE faqs SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [1, 2]
      );
      expect(mockDbQuery).toHaveBeenCalledWith(
        'UPDATE faqs SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [3, 3]
      );
      expect(mockDbQuery).toHaveBeenCalledWith('COMMIT', []);
      expect(result).toBe(true);
    });

    it('should update FAQ order with custom client (no transaction management)', async () => {
      const mockClient = { query: jest.fn() };
      mockClient.query.mockResolvedValue({});

      const result = await Faq.updateOrder(mockOrderData, mockClient);

      expect(mockClient.query).toHaveBeenCalledTimes(3); // Only the updates, no BEGIN/COMMIT
      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE faqs SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [2, 1]
      );
      expect(result).toBe(true);
    });

    it('should rollback on error when using own transaction', async () => {
      const error = new Error('Update failed');
      mockDbQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(error) // First UPDATE fails
        .mockResolvedValueOnce({}); // ROLLBACK

      await expect(Faq.updateOrder(mockOrderData)).rejects.toThrow('Error updating FAQ order: Update failed');

      expect(mockDbQuery).toHaveBeenCalledWith('BEGIN', []);
      expect(mockDbQuery).toHaveBeenCalledWith('ROLLBACK', []);
    });

    it('should not manage transaction with custom client', async () => {
      const mockClient = { query: jest.fn() };
      const error = new Error('Update failed');
      mockClient.query.mockRejectedValueOnce(error);

      await expect(Faq.updateOrder(mockOrderData, mockClient)).rejects.toThrow('Error updating FAQ order: Update failed');

      // Should not call BEGIN or ROLLBACK
      expect(mockDbQuery).not.toHaveBeenCalledWith('BEGIN', []);
      expect(mockDbQuery).not.toHaveBeenCalledWith('ROLLBACK', []);
    });

    it('should handle empty order data', async () => {
      mockDbQuery
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}); // COMMIT

      const result = await Faq.updateOrder([]);

      expect(mockDbQuery).toHaveBeenCalledWith('BEGIN', []);
      expect(mockDbQuery).toHaveBeenCalledWith('COMMIT', []);
      expect(result).toBe(true);
    });
  });
});