import { jest } from '@jest/globals';

// Mock models using unstable_mockModule
jest.unstable_mockModule('../../models/PaymentMethod.js', () => ({
  findAllByUserId: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  setDefault: jest.fn(),
}));

// Mock BaseService to avoid database connection issues
jest.unstable_mockModule('../../services/BaseService.js', () => ({
  BaseService: class MockBaseService {
    async executeInTransaction(callback) {
      return callback();
    }
  }
}));

describe('PaymentMethodService', () => {
  let PaymentMethodService;
  let PaymentMethodModel;
  let paymentMethodService;

  beforeAll(async () => {
    PaymentMethodModel = await import('../../models/PaymentMethod.js');
    const { PaymentMethodService: PaymentMethodServiceClass } = await import('../../services/PaymentMethodService.js');
    PaymentMethodService = PaymentMethodServiceClass;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    paymentMethodService = new PaymentMethodService();
  });

  describe('getPaymentMethods', () => {
    it('should return user payment methods', async () => {
      const mockMethods = [
        { id: 1, card_type: 'Visa', last_four: '1234', is_default: true },
        { id: 2, card_type: 'Mastercard', last_four: '5678', is_default: false }
      ];

      PaymentMethodModel.findAllByUserId.mockResolvedValue(mockMethods);

      const result = await paymentMethodService.getPaymentMethods(1);

      expect(PaymentMethodModel.findAllByUserId).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMethods);
    });

    it('should return empty array when user has no payment methods', async () => {
      PaymentMethodModel.findAllByUserId.mockResolvedValue([]);

      const result = await paymentMethodService.getPaymentMethods(1);

      expect(result).toEqual([]);
    });
  });

  describe('getPaymentMethod', () => {
    it('should return specific payment method', async () => {
      const mockMethod = { id: 1, card_type: 'Visa', last_four: '1234' };

      PaymentMethodModel.findById.mockResolvedValue(mockMethod);

      const result = await paymentMethodService.getPaymentMethod(1, 1);

      expect(PaymentMethodModel.findById).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(mockMethod);
    });

    it('should throw error if payment method not found', async () => {
      PaymentMethodModel.findById.mockResolvedValue(null);

      await expect(paymentMethodService.getPaymentMethod(999, 1))
        .rejects.toThrow('Payment method not found');
    });
  });

  describe('addPaymentMethod', () => {
    it('should add payment method successfully', async () => {
      const paymentData = {
        cardNumber: '4111111111111111',
        cardHolderName: 'John Doe',
        expiryDate: '12/25',
        isDefault: false
      };

      const createdMethod = { 
        id: 1, 
        card_type: 'Visa', 
        last_four: '1111',
        card_holder_name: 'John Doe',
        expiry_month: '12',
        expiry_year: '25'
      };

      PaymentMethodModel.create.mockResolvedValue(createdMethod);

      const result = await paymentMethodService.addPaymentMethod(1, paymentData);

      expect(PaymentMethodModel.create).toHaveBeenCalledWith({
        userId: 1,
        cardType: 'Visa',
        lastFour: '1111',
        cardHolderName: 'John Doe',
        expiryMonth: '12',
        expiryYear: '25',
        isDefault: false,
        token: expect.stringMatching(/^tok_\d+$/)
      });
      expect(result).toEqual(createdMethod);
    });

    it('should throw error for invalid card number', async () => {
      const paymentData = {
        cardNumber: '123',
        cardHolderName: 'John Doe',
        expiryDate: '12/25'
      };

      await expect(paymentMethodService.addPaymentMethod(1, paymentData))
        .rejects.toThrow('Invalid card number');
    });

    it('should throw error for missing required fields', async () => {
      const paymentData = {
        cardNumber: '4111111111111111',
        // Missing cardHolderName and expiryDate
      };

      await expect(paymentMethodService.addPaymentMethod(1, paymentData))
        .rejects.toThrow('Missing required fields');
    });

    it('should throw error for invalid card holder name', async () => {
      const paymentData = {
        cardNumber: '4111111111111111',
        cardHolderName: 'A', // Too short
        expiryDate: '12/25'
      };

      await expect(paymentMethodService.addPaymentMethod(1, paymentData))
        .rejects.toThrow('Invalid card holder name');
    });

    it('should throw error for invalid expiry date format', async () => {
      const paymentData = {
        cardNumber: '4111111111111111',
        cardHolderName: 'John Doe',
        expiryDate: '1225' // Wrong format
      };

      await expect(paymentMethodService.addPaymentMethod(1, paymentData))
        .rejects.toThrow('Invalid expiry date format. Use MM/YY');
    });

    it('should throw error for expired card', async () => {
      const paymentData = {
        cardNumber: '4111111111111111',
        cardHolderName: 'John Doe',
        expiryDate: '01/20' // Past date
      };

      await expect(paymentMethodService.addPaymentMethod(1, paymentData))
        .rejects.toThrow('Card has expired');
    });

    it('should detect different card types correctly', async () => {
      const testCases = [
        { cardNumber: '4111111111111111', expectedType: 'Visa' },
        { cardNumber: '5555555555554444', expectedType: 'Mastercard' },
        { cardNumber: '378282246310005', expectedType: 'American Express' },
        { cardNumber: '6011111111111117', expectedType: 'Discover' },
        { cardNumber: '30569309025904', expectedType: 'Unknown' }
      ];

      for (const testCase of testCases) {
        const paymentData = {
          cardNumber: testCase.cardNumber,
          cardHolderName: 'John Doe',
          expiryDate: '12/25'
        };

        PaymentMethodModel.create.mockResolvedValue({ id: 1 });

        await paymentMethodService.addPaymentMethod(1, paymentData);

        expect(PaymentMethodModel.create).toHaveBeenCalledWith(
          expect.objectContaining({
            cardType: testCase.expectedType
          })
        );

        PaymentMethodModel.create.mockClear();
      }
    });
  });

  describe('updatePaymentMethod', () => {
    it('should update payment method successfully', async () => {
      const updateData = {
        cardHolderName: 'Jane Doe',
        expiryDate: '06/26',
        isDefault: true
      };

      const updatedMethod = { 
        id: 1, 
        card_holder_name: 'Jane Doe',
        expiry_month: '06',
        expiry_year: '26',
        is_default: true
      };

      PaymentMethodModel.update.mockResolvedValue(updatedMethod);

      const result = await paymentMethodService.updatePaymentMethod(1, 1, updateData);

      expect(PaymentMethodModel.update).toHaveBeenCalledWith(1, 1, {
        cardHolderName: 'Jane Doe',
        expiryMonth: '06',
        expiryYear: '26',
        isDefault: true
      });
      expect(result).toEqual(updatedMethod);
    });

    it('should throw error if payment method not found for update', async () => {
      PaymentMethodModel.update.mockResolvedValue(null);

      const updateData = {
        cardHolderName: 'Jane Doe',
        expiryDate: '06/26'
      };

      await expect(paymentMethodService.updatePaymentMethod(999, 1, updateData))
        .rejects.toThrow('Payment method not found');
    });

    it('should throw error for missing required fields in update', async () => {
      const updateData = {
        cardHolderName: 'Jane Doe'
        // Missing expiryDate
      };

      await expect(paymentMethodService.updatePaymentMethod(1, 1, updateData))
        .rejects.toThrow('Missing required fields');
    });
  });

  describe('setDefaultPaymentMethod', () => {
    it('should set payment method as default', async () => {
      const defaultMethod = { id: 1, is_default: true };

      PaymentMethodModel.setDefault.mockResolvedValue(defaultMethod);

      const result = await paymentMethodService.setDefaultPaymentMethod(1, 1);

      expect(PaymentMethodModel.setDefault).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(defaultMethod);
    });

    it('should throw error if payment method not found for setting default', async () => {
      PaymentMethodModel.setDefault.mockResolvedValue(null);

      await expect(paymentMethodService.setDefaultPaymentMethod(999, 1))
        .rejects.toThrow('Payment method not found');
    });
  });

  describe('deletePaymentMethod', () => {
    it('should delete payment method successfully', async () => {
      const deletedMethod = { id: 1, deleted: true };

      PaymentMethodModel.remove.mockResolvedValue(deletedMethod);

      const result = await paymentMethodService.deletePaymentMethod(1, 1);

      expect(PaymentMethodModel.remove).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(deletedMethod);
    });

    it('should throw error if payment method not found for deletion', async () => {
      PaymentMethodModel.remove.mockResolvedValue(null);

      await expect(paymentMethodService.deletePaymentMethod(999, 1))
        .rejects.toThrow('Payment method not found');
    });
  });

  describe('getDefaultPaymentMethod', () => {
    it('should return default payment method', async () => {
      const mockMethods = [
        { id: 1, card_type: 'Visa', is_default: false },
        { id: 2, card_type: 'Mastercard', is_default: true }
      ];

      PaymentMethodModel.findAllByUserId.mockResolvedValue(mockMethods);

      const result = await paymentMethodService.getDefaultPaymentMethod(1);

      expect(result).toEqual(mockMethods[1]);
    });

    it('should return null if no default payment method exists', async () => {
      const mockMethods = [
        { id: 1, card_type: 'Visa', is_default: false },
        { id: 2, card_type: 'Mastercard', is_default: false }
      ];

      PaymentMethodModel.findAllByUserId.mockResolvedValue(mockMethods);

      const result = await paymentMethodService.getDefaultPaymentMethod(1);

      expect(result).toBeNull();
    });
  });

  describe('hasPaymentMethods', () => {
    it('should return true if user has payment methods', async () => {
      const mockMethods = [{ id: 1, card_type: 'Visa' }];

      PaymentMethodModel.findAllByUserId.mockResolvedValue(mockMethods);

      const result = await paymentMethodService.hasPaymentMethods(1);

      expect(result).toBe(true);
    });

    it('should return false if user has no payment methods', async () => {
      PaymentMethodModel.findAllByUserId.mockResolvedValue([]);

      const result = await paymentMethodService.hasPaymentMethods(1);

      expect(result).toBe(false);
    });
  });
});