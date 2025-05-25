// backend/tests/models/Payment.test.js
import { jest } from '@jest/globals';

describe('Payment Model', () => {
  let Payment;
  let mockClient, mockGlobalPool;

  beforeAll(async () => {
    // Mock global.pool before importing the module
    mockGlobalPool = {
      query: jest.fn()
    };
    global.pool = mockGlobalPool;
    
    Payment = await import('../../models/Payment.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock client
    mockClient = {
      query: jest.fn()
    };
  });

  afterAll(() => {
    delete global.pool;
  });

  describe('create', () => {
    const mockPaymentData = {
      user_id: 1,
      amount: 99.99,
      currency: 'USD',
      payment_method: 'card',
      transaction_id: 'txn_123456',
      status: 'completed'
    };

    it('should create a payment record', async () => {
      const mockCreated = { id: 1, ...mockPaymentData };
      mockClient.query.mockResolvedValue({ rows: [mockCreated] });

      const result = await Payment.create(mockClient, mockPaymentData);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO payments.*VALUES \(\$1, \$2, \$3, \$4, \$5, \$6\).*RETURNING \*/s),
        [1, 99.99, 'USD', 'card', 'txn_123456', 'completed']
      );
      expect(result).toEqual(mockCreated);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockClient.query.mockRejectedValue(error);

      await expect(Payment.create(mockClient, mockPaymentData)).rejects.toThrow('Database error');
    });

    it('should create payment with all required fields', async () => {
      const mockCreated = { id: 1, ...mockPaymentData };
      mockClient.query.mockResolvedValue({ rows: [mockCreated] });

      await Payment.create(mockClient, mockPaymentData);

      const callArgs = mockClient.query.mock.calls[0][1];
      expect(callArgs).toEqual([
        mockPaymentData.user_id,
        mockPaymentData.amount,
        mockPaymentData.currency,
        mockPaymentData.payment_method,
        mockPaymentData.transaction_id,
        mockPaymentData.status
      ]);
    });
  });

  describe('linkTicketToPayment', () => {
    it('should link a ticket to a payment', async () => {
      const mockLinked = { payment_id: 1, ticket_id: 5 };
      mockClient.query.mockResolvedValue({ rows: [mockLinked] });

      const result = await Payment.linkTicketToPayment(mockClient, 1, 5);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO payment_tickets \(payment_id, ticket_id\)\s+VALUES \(\$1, \$2\)\s+RETURNING \*/s),
        [1, 5]
      );
      expect(result).toEqual(mockLinked);
    });

    it('should handle database errors', async () => {
      const error = new Error('Link failed');
      mockClient.query.mockRejectedValue(error);

      await expect(Payment.linkTicketToPayment(mockClient, 1, 5)).rejects.toThrow('Link failed');
    });
  });

  describe('findById', () => {
    it('should find payment by ID', async () => {
      const mockPayment = {
        id: 1,
        user_id: 1,
        amount: 99.99,
        status: 'completed'
      };

      mockGlobalPool.query.mockResolvedValue({ rows: [mockPayment] });

      const result = await Payment.findById(1);

      expect(mockGlobalPool.query).toHaveBeenCalledWith(
        'SELECT * FROM payments WHERE id = $1',
        [1]
      );
      expect(result).toEqual(mockPayment);
    });

    it('should return undefined for non-existent payment', async () => {
      mockGlobalPool.query.mockResolvedValue({ rows: [] });

      const result = await Payment.findById(999);

      expect(result).toBeUndefined();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockGlobalPool.query.mockRejectedValue(error);

      await expect(Payment.findById(1)).rejects.toThrow('Database error');
    });
  });

  describe('findByUserId', () => {
    it('should find payments by user ID', async () => {
      const mockPayments = [
        { id: 1, user_id: 1, amount: 99.99, created_at: '2024-03-15T10:00:00Z' },
        { id: 2, user_id: 1, amount: 49.99, created_at: '2024-03-14T10:00:00Z' }
      ];

      mockGlobalPool.query.mockResolvedValue({ rows: mockPayments });

      const result = await Payment.findByUserId(1);

      expect(mockGlobalPool.query).toHaveBeenCalledWith(
        'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC',
        [1]
      );
      expect(result).toEqual(mockPayments);
    });

    it('should return empty array for user with no payments', async () => {
      mockGlobalPool.query.mockResolvedValue({ rows: [] });

      const result = await Payment.findByUserId(999);

      expect(result).toEqual([]);
    });

    it('should order payments by created_at DESC', async () => {
      mockGlobalPool.query.mockResolvedValue({ rows: [] });

      await Payment.findByUserId(1);

      expect(mockGlobalPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
        [1]
      );
    });
  });

  describe('getPaymentTickets', () => {
    it('should get tickets associated with a payment', async () => {
      const mockTickets = [
        {
          id: 1,
          ticket_type_name: 'VIP',
          event_name: 'Concert Night',
          price: 99.99
        },
        {
          id: 2,
          ticket_type_name: 'General',
          event_name: 'Concert Night',
          price: 49.99
        }
      ];

      mockGlobalPool.query.mockResolvedValue({ rows: mockTickets });

      const result = await Payment.getPaymentTickets(1);

      expect(mockGlobalPool.query).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT t\.\*, tt\.name as ticket_type_name, e\.name as event_name.*FROM tickets t.*JOIN payment_tickets pt ON t\.id = pt\.ticket_id.*WHERE pt\.payment_id = \$1/s),
        [1]
      );
      expect(result).toEqual(mockTickets);
    });

    it('should return empty array for payment with no tickets', async () => {
      mockGlobalPool.query.mockResolvedValue({ rows: [] });

      const result = await Payment.getPaymentTickets(999);

      expect(result).toEqual([]);
    });
  });

  describe('findByPaymentMethod', () => {
    it('should find payments by user ID and payment method', async () => {
      const mockPayments = [
        { id: 1, user_id: 1, payment_method: 'card', amount: 99.99 },
        { id: 3, user_id: 1, payment_method: 'card', amount: 149.99 }
      ];

      mockGlobalPool.query.mockResolvedValue({ rows: mockPayments });

      const result = await Payment.findByPaymentMethod(1, 'card');

      expect(mockGlobalPool.query).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT \* FROM payments\s+WHERE user_id = \$1 AND payment_method = \$2\s+ORDER BY created_at DESC/s),
        [1, 'card']
      );
      expect(result).toEqual(mockPayments);
    });

    it('should return empty array when no payments found', async () => {
      mockGlobalPool.query.mockResolvedValue({ rows: [] });

      const result = await Payment.findByPaymentMethod(1, 'paypal');

      expect(result).toEqual([]);
    });

    it('should order results by created_at DESC', async () => {
      mockGlobalPool.query.mockResolvedValue({ rows: [] });

      await Payment.findByPaymentMethod(1, 'card');

      expect(mockGlobalPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
        [1, 'card']
      );
    });
  });

  describe('getCreditTransactions', () => {
    it('should get credit transactions associated with a payment', async () => {
      const mockTransactions = [
        {
          id: 1,
          amount: 50.00,
          type: 'refund',
          description: 'Refund for cancelled ticket'
        },
        {
          id: 2,
          amount: 25.00,
          type: 'partial_refund',
          description: 'Partial refund'
        }
      ];

      mockGlobalPool.query.mockResolvedValue({ rows: mockTransactions });

      const result = await Payment.getCreditTransactions(1);

      expect(mockGlobalPool.query).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT ct\.\*\s+FROM credit_transactions ct\s+WHERE ct\.reference_id = \$1 AND ct\.reference_type = 'payment'/s),
        [1]
      );
      expect(result).toEqual(mockTransactions);
    });

    it('should return empty array for payment with no credit transactions', async () => {
      mockGlobalPool.query.mockResolvedValue({ rows: [] });

      const result = await Payment.getCreditTransactions(999);

      expect(result).toEqual([]);
    });

    it('should filter by reference_type payment', async () => {
      mockGlobalPool.query.mockResolvedValue({ rows: [] });

      await Payment.getCreditTransactions(1);

      expect(mockGlobalPool.query).toHaveBeenCalledWith(
        expect.stringContaining("ct.reference_type = 'payment'"),
        [1]
      );
    });
  });
});