// backend/tests/models/TicketType.test.js
import { jest } from '@jest/globals';

// Mock database
const mockDbQuery = jest.fn();
jest.unstable_mockModule('../../config/db.js', () => ({
  query: mockDbQuery
}));

describe('TicketType Model - Additional Tests', () => {
    let TicketType;
    let consoleSpy, consoleErrorSpy;

    beforeAll(async () => {
        TicketType = await import('../../models/TicketType.js');
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock console methods
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('findByEventId - Additional Tests', () => {
        it('should handle different event IDs correctly', async () => {
            const mockTicketTypes = [
                { id: 1, event_id: 123, name: 'Early Bird', price: 15.50 },
                { id: 2, event_id: 123, name: 'Regular', price: 25.00 }
            ];

            mockDbQuery.mockResolvedValue({ rows: mockTicketTypes });

            const result = await TicketType.findByEventId(123);

            expect(mockDbQuery).toHaveBeenCalledWith({
                text: expect.stringContaining('SELECT * FROM ticket_types'),
                values: [123]
            });
            expect(result).toEqual(mockTicketTypes);
        });

        it('should handle string event ID by passing it through', async () => {
            mockDbQuery.mockResolvedValue({ rows: [] });

            await TicketType.findByEventId('456');

            expect(mockDbQuery).toHaveBeenCalledWith({
                text: expect.stringContaining('WHERE event_id = $1'),
                values: ['456']
            });
        });

        it('should handle null event ID', async () => {
            mockDbQuery.mockResolvedValue({ rows: [] });

            await TicketType.findByEventId(null);

            expect(mockDbQuery).toHaveBeenCalledWith({
                text: expect.any(String),
                values: [null]
            });
        });

        it('should handle undefined event ID', async () => {
            mockDbQuery.mockResolvedValue({ rows: [] });

            await TicketType.findByEventId(undefined);

            expect(mockDbQuery).toHaveBeenCalledWith({
                text: expect.any(String),
                values: [undefined]
            });
        });

        it('should verify ORDER BY clause is present', async () => {
            mockDbQuery.mockResolvedValue({ rows: [] });

            await TicketType.findByEventId(1);

            expect(mockDbQuery).toHaveBeenCalledWith({
                text: expect.stringContaining('ORDER BY price ASC'),
                values: [1]
            });
        });

        it('should handle large event ID', async () => {
            const largeEventId = 999999999;
            mockDbQuery.mockResolvedValue({ rows: [] });

            await TicketType.findByEventId(largeEventId);

            expect(mockDbQuery).toHaveBeenCalledWith({
                text: expect.any(String),
                values: [largeEventId]
            });
        });

        it('should handle negative event ID', async () => {
            mockDbQuery.mockResolvedValue({ rows: [] });

            await TicketType.findByEventId(-1);

            expect(mockDbQuery).toHaveBeenCalledWith({
                text: expect.any(String),
                values: [-1]
            });
        });

        it('should handle float event ID', async () => {
            mockDbQuery.mockResolvedValue({ rows: [] });

            await TicketType.findByEventId(1.5);

            expect(mockDbQuery).toHaveBeenCalledWith({
                text: expect.any(String),
                values: [1.5]
            });
        });

        it('should handle SQL injection attempts safely', async () => {
            const maliciousId = "1; DROP TABLE ticket_types; --";
            mockDbQuery.mockResolvedValue({ rows: [] });

            await TicketType.findByEventId(maliciousId);

            expect(mockDbQuery).toHaveBeenCalledWith({
                text: expect.any(String),
                values: [maliciousId]
            });
        });

        it('should handle connection timeout errors', async () => {
            const timeoutError = new Error('connection timeout');
            timeoutError.code = 'ETIMEDOUT';
            mockDbQuery.mockRejectedValue(timeoutError);

            await expect(TicketType.findByEventId(1)).rejects.toThrow('connection timeout');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error finding ticket types:', timeoutError);
        });

        it('should handle connection pool exhaustion', async () => {
            const poolError = new Error('all connections are busy');
            poolError.code = 'ECONNREFUSED';
            mockDbQuery.mockRejectedValue(poolError);

            await expect(TicketType.findByEventId(1)).rejects.toThrow('all connections are busy');
        });

        it('should return ticket types with all expected fields', async () => {
            const completeTicketType = {
                id: 1,
                event_id: 1,
                name: 'Premium',
                description: 'Premium access with perks',
                price: 199.99,
                quantity: 25,
                available_quantity: 20,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-15T12:30:00Z'
            };

            mockDbQuery.mockResolvedValue({ rows: [completeTicketType] });

            const result = await TicketType.findByEventId(1);

            expect(result[0]).toHaveProperty('id');
            expect(result[0]).toHaveProperty('event_id');
            expect(result[0]).toHaveProperty('name');
            expect(result[0]).toHaveProperty('price');
            expect(result[0]).toHaveProperty('quantity');
            expect(result[0]).toHaveProperty('available_quantity');
        });
    });

    describe('findById - Additional Tests', () => {
        it('should handle different ticket type IDs', async () => {
            const mockTicketType = {
                id: 999,
                event_id: 1,
                name: 'Student Discount',
                price: 12.50
            };

            mockDbQuery.mockResolvedValue({ rows: [mockTicketType] });

            const result = await TicketType.findById(999);

            expect(mockDbQuery).toHaveBeenCalledWith({
                text: expect.stringContaining('SELECT * FROM ticket_types'),
                values: [999]
            });
            expect(result).toEqual(mockTicketType);
        });

        it('should handle string ID conversion', async () => {
            mockDbQuery.mockResolvedValue({ rows: [] });

            await TicketType.findById('123');

            expect(mockDbQuery).toHaveBeenCalledWith({
                text: expect.stringContaining('WHERE id = $1'),
                values: ['123']
            });
        });

        it('should handle null ID', async () => {
            mockDbQuery.mockResolvedValue({ rows: [] });

            const result = await TicketType.findById(null);

            expect(mockDbQuery).toHaveBeenCalledWith({
                text: expect.any(String),
                values: [null]
            });
            expect(result).toBeUndefined();
        });

        it('should handle undefined ID', async () => {
            mockDbQuery.mockResolvedValue({ rows: [] });

            const result = await TicketType.findById(undefined);

            expect(result).toBeUndefined();
        });

        it('should handle zero ID', async () => {
            mockDbQuery.mockResolvedValue({ rows: [] });

            await TicketType.findById(0);

            expect(mockDbQuery).toHaveBeenCalledWith({
                text: expect.any(String),
                values: [0]
            });
        });

        it('should handle negative ID', async () => {
            mockDbQuery.mockResolvedValue({ rows: [] });

            await TicketType.findById(-1);

            expect(mockDbQuery).toHaveBeenCalledWith({
                text: expect.any(String),
                values: [-1]
            });
        });

        it('should handle very large ID', async () => {
            const largeId = Number.MAX_SAFE_INTEGER;
            mockDbQuery.mockResolvedValue({ rows: [] });

            await TicketType.findById(largeId);

            expect(mockDbQuery).toHaveBeenCalledWith({
                text: expect.any(String),
                values: [largeId]
            });
        });

        it('should handle boolean ID', async () => {
            mockDbQuery.mockResolvedValue({ rows: [] });

            await TicketType.findById(true);

            expect(mockDbQuery).toHaveBeenCalledWith({
                text: expect.any(String),
                values: [true]
            });
        });

        it('should handle network errors', async () => {
            const networkError = new Error('network error');
            networkError.code = 'ENETUNREACH';
            mockDbQuery.mockRejectedValue(networkError);

            await expect(TicketType.findById(1)).rejects.toThrow('network error');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error finding ticket type:', networkError);
        });

        it('should handle permission errors', async () => {
            const permError = new Error('permission denied for table ticket_types');
            permError.code = '42501';
            mockDbQuery.mockRejectedValue(permError);

            await expect(TicketType.findById(1)).rejects.toThrow('permission denied');
        });

        it('should return first row when multiple results', async () => {
            const mockTicketTypes = [
                { id: 1, name: 'First' },
                { id: 1, name: 'Second' }
            ];

            mockDbQuery.mockResolvedValue({ rows: mockTicketTypes });

            const result = await TicketType.findById(1);

            expect(result).toEqual(mockTicketTypes[0]);
        });
    });

    describe('updateAvailability - Edge Cases', () => {
        const mockTicketType = {
            id: 1,
            quantity: 100,
            available_quantity: 50
        };

        it('should handle zero quantity change', async () => {
            mockDbQuery
                .mockResolvedValueOnce({ rows: [mockTicketType] })
                .mockResolvedValueOnce({ rows: [mockTicketType] });

            const result = await TicketType.updateAvailability(1, 0);

            expect(mockDbQuery).toHaveBeenCalledWith({
                text: expect.stringContaining('UPDATE ticket_types'),
                values: [1, 50] // No change: 50 + 0 = 50
            });
            expect(result).toEqual(mockTicketType);
        });

        it('should handle maximum positive change', async () => {
            const maxChange = mockTicketType.quantity - mockTicketType.available_quantity;
            const updatedTicketType = { ...mockTicketType, available_quantity: 100 };

            mockDbQuery
                .mockResolvedValueOnce({ rows: [mockTicketType] })
                .mockResolvedValueOnce({ rows: [updatedTicketType] });

            const result = await TicketType.updateAvailability(1, maxChange);

            expect(result.available_quantity).toBe(100);
        });

        it('should handle maximum negative change', async () => {
            const maxNegativeChange = -mockTicketType.available_quantity;
            const updatedTicketType = { ...mockTicketType, available_quantity: 0 };

            mockDbQuery
                .mockResolvedValueOnce({ rows: [mockTicketType] })
                .mockResolvedValueOnce({ rows: [updatedTicketType] });

            const result = await TicketType.updateAvailability(1, maxNegativeChange);

            expect(result.available_quantity).toBe(0);
        });

        it('should handle NaN ticket type ID', async () => {
            await expect(TicketType.updateAvailability(NaN, 10))
                .rejects.toThrow('Invalid ticket type ID (NaN) or quantity change (10)');
        });

        it('should handle NaN quantity change', async () => {
            await expect(TicketType.updateAvailability(1, NaN))
                .rejects.toThrow('Invalid ticket type ID (1) or quantity change (NaN)');
        });

        it('should handle Infinity values', async () => {
            await expect(TicketType.updateAvailability(Infinity, 10))
                .rejects.toThrow('Invalid ticket type ID (Infinity) or quantity change (10)');
        });

        it('should handle empty string inputs', async () => {
            await expect(TicketType.updateAvailability('', ''))
                .rejects.toThrow('Invalid ticket type ID () or quantity change ()');
        });

        it('should handle whitespace inputs', async () => {
            await expect(TicketType.updateAvailability('  ', '  '))
                .rejects.toThrow('Invalid ticket type ID (  ) or quantity change (  )');
        });

        it('should handle special string inputs', async () => {
            await expect(TicketType.updateAvailability('abc', 'xyz'))
                .rejects.toThrow('Invalid ticket type ID (abc) or quantity change (xyz)');
        });

        it('should handle concurrent updates', async () => {
            mockDbQuery
                .mockResolvedValueOnce({ rows: [mockTicketType] })
                .mockResolvedValueOnce({ rows: [{ ...mockTicketType, available_quantity: 60 }] });

            const promise1 = TicketType.updateAvailability(1, 10);
            const promise2 = TicketType.updateAvailability(1, 5);

            await Promise.all([promise1, promise2]);

            expect(mockDbQuery).toHaveBeenCalledTimes(4); // 2 findById + 2 updates
        });
    });

    describe('decreaseAvailability - Edge Cases', () => {
        it('should handle zero quantity', async () => {
            const mockTicketType = { id: 1, quantity: 100, available_quantity: 50 };
            
            mockDbQuery
                .mockResolvedValueOnce({ rows: [mockTicketType] })
                .mockResolvedValueOnce({ rows: [mockTicketType] });

            const result = await TicketType.decreaseAvailability(1, 0);

            expect(mockDbQuery).toHaveBeenCalledWith({
                text: expect.stringContaining('UPDATE'),
                values: [1, 50] // 50 - 0 = 50
            });
        });

        it('should handle very large positive quantity', async () => {
            const mockTicketType = { id: 1, quantity: 100, available_quantity: 100 };
            
            mockDbQuery.mockResolvedValueOnce({ rows: [mockTicketType] });

            await expect(TicketType.decreaseAvailability(1, 200))
                .rejects.toThrow('Available quantity cannot be negative');
        });

        it('should handle very large negative quantity', async () => {
            const mockTicketType = { id: 1, quantity: 100, available_quantity: 10 };
            const updatedTicketType = { ...mockTicketType, available_quantity: 0 };
            
            mockDbQuery
                .mockResolvedValueOnce({ rows: [mockTicketType] })
                .mockResolvedValueOnce({ rows: [updatedTicketType] });

            const result = await TicketType.decreaseAvailability(1, -10);

            expect(result.available_quantity).toBe(0);
        });
    });

    describe('increaseAvailability - Edge Cases', () => {
        it('should handle zero quantity', async () => {
            const mockTicketType = { id: 1, quantity: 100, available_quantity: 50 };
            
            mockDbQuery
                .mockResolvedValueOnce({ rows: [mockTicketType] })
                .mockResolvedValueOnce({ rows: [mockTicketType] });

            const result = await TicketType.increaseAvailability(1, 0);

            expect(mockDbQuery).toHaveBeenCalledWith({
                text: expect.stringContaining('UPDATE'),
                values: [1, 50] // 50 + 0 = 50
            });
        });

        it('should handle quantity that would exceed total', async () => {
            const mockTicketType = { id: 1, quantity: 100, available_quantity: 50 };
            
            mockDbQuery.mockResolvedValueOnce({ rows: [mockTicketType] });

            await expect(TicketType.increaseAvailability(1, 100))
                .rejects.toThrow('Cannot have more available tickets (150) than total tickets (100)');
        });

        it('should handle maximum valid increase', async () => {
            const mockTicketType = { id: 1, quantity: 100, available_quantity: 50 };
            const updatedTicketType = { ...mockTicketType, available_quantity: 100 };
            
            mockDbQuery
                .mockResolvedValueOnce({ rows: [mockTicketType] })
                .mockResolvedValueOnce({ rows: [updatedTicketType] });

            const result = await TicketType.increaseAvailability(1, 50);

            expect(result.available_quantity).toBe(100);
        });

        it('should handle very large negative quantity', async () => {
            const mockTicketType = { id: 1, quantity: 100, available_quantity: 0 };
            const updatedTicketType = { ...mockTicketType, available_quantity: 50 };
            
            mockDbQuery
                .mockResolvedValueOnce({ rows: [mockTicketType] })
                .mockResolvedValueOnce({ rows: [updatedTicketType] });

            const result = await TicketType.increaseAvailability(1, -50);

            expect(result.available_quantity).toBe(50);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle transaction deadlock errors', async () => {
            const deadlockError = new Error('deadlock detected');
            deadlockError.code = '40P01';
            mockDbQuery.mockRejectedValue(deadlockError);

            await expect(TicketType.findByEventId(1)).rejects.toThrow('deadlock detected');
        });

        it('should handle disk full errors', async () => {
            const diskError = new Error('could not extend file: No space left on device');
            diskError.code = '53100';
            mockDbQuery.mockRejectedValue(diskError);

            await expect(TicketType.findById(1)).rejects.toThrow('No space left on device');
        });

        it('should handle constraint violation on update', async () => {
            const mockTicketType = { id: 1, quantity: 100, available_quantity: 50 };
            const constraintError = new Error('check constraint violation');
            constraintError.code = '23514';
            
            mockDbQuery
                .mockResolvedValueOnce({ rows: [mockTicketType] })
                .mockRejectedValueOnce(constraintError);

            await expect(TicketType.updateAvailability(1, 10))
                .rejects.toThrow('check constraint violation');
        });

        it('should handle ticket type with zero total quantity', async () => {
            const zeroQuantityTicketType = { id: 1, quantity: 0, available_quantity: 0 };
            
            mockDbQuery.mockResolvedValueOnce({ rows: [zeroQuantityTicketType] });

            await expect(TicketType.updateAvailability(1, 1))
                .rejects.toThrow('Cannot have more available tickets (1) than total tickets (0)');
        });

        it('should handle ticket type with negative total quantity', async () => {
            const negativeQuantityTicketType = { id: 1, quantity: -10, available_quantity: 0 };
            
            mockDbQuery.mockResolvedValueOnce({ rows: [negativeQuantityTicketType] });

            await expect(TicketType.updateAvailability(1, 1))
                .rejects.toThrow('Cannot have more available tickets (1) than total tickets (-10)');
        });

        it('should handle ticket type with null quantities', async () => {
            const nullQuantityTicketType = { id: 1, quantity: null, available_quantity: null };
            
            mockDbQuery.mockResolvedValueOnce({ rows: [nullQuantityTicketType] });

            await expect(TicketType.updateAvailability(1, 1))
                .rejects.toThrow();
        });

        it('should handle simultaneous read operations', async () => {
            const mockTicketTypes = [{ id: 1, event_id: 1, name: 'Test' }];
            
            mockDbQuery.mockResolvedValue({ rows: mockTicketTypes });

            const promises = Array(5).fill().map(() => TicketType.findByEventId(1));
            const results = await Promise.all(promises);

            expect(results).toHaveLength(5);
            results.forEach(result => {
                expect(result).toEqual(mockTicketTypes);
            });
        });

        it('should handle connection recovery scenarios', async () => {
            const connectionError = new Error('connection terminated unexpectedly');
            connectionError.code = '08006';

            mockDbQuery
                .mockRejectedValueOnce(connectionError)
                .mockResolvedValueOnce({ rows: [] });

            await expect(TicketType.findByEventId(1)).rejects.toThrow('connection terminated unexpectedly');

            // Subsequent call should work
            const result = await TicketType.findByEventId(1);
            expect(result).toEqual([]);
        });
    });
});