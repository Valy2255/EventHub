// backend/tests/models/SocialAccount.test.js
import { jest } from "@jest/globals";

// Mock database
const mockDbQuery = jest.fn();
jest.unstable_mockModule("../../config/db.js", () => ({
  query: mockDbQuery,
}));

describe("SocialAccount Model", () => {
  let SocialAccount;
  let consoleSpy, consoleErrorSpy;

  beforeAll(async () => {
    SocialAccount = await import("../../models/SocialAccount.js");
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console methods
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("create", () => {
    const mockSocialAccountData = {
      user_id: 1,
      provider: "google",
      provider_id: "123456789",
      provider_data: {
        email: "user@gmail.com",
        name: "John Doe",
        picture: "https://example.com/photo.jpg",
      },
    };

    it("should create a new social account", async () => {
      const mockCreated = { id: 1, ...mockSocialAccountData };
      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await SocialAccount.create(mockSocialAccountData);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: `INSERT INTO social_accounts(user_id, provider, provider_id, provider_data) 
           VALUES($1, $2, $3, $4) 
           RETURNING *`,
        values: [
          1,
          "google",
          "123456789",
          {
            email: "user@gmail.com",
            name: "John Doe",
            picture: "https://example.com/photo.jpg",
          },
        ],
      });
      expect(result).toEqual(mockCreated);
    });

    it("should create social account with Facebook provider", async () => {
      const facebookData = {
        user_id: 2,
        provider: "facebook",
        provider_id: "fb123456",
        provider_data: {
          email: "user@facebook.com",
          name: "Jane Doe",
          picture: "https://facebook.com/photo.jpg",
        },
      };

      const mockCreated = { id: 2, ...facebookData };
      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await SocialAccount.create(facebookData);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: `INSERT INTO social_accounts(user_id, provider, provider_id, provider_data) 
           VALUES($1, $2, $3, $4) 
           RETURNING *`,
        values: [
          2,
          "facebook",
          "fb123456",
          {
            email: "user@facebook.com",
            name: "Jane Doe",
            picture: "https://facebook.com/photo.jpg",
          },
        ],
      });
      expect(result).toEqual(mockCreated);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      mockDbQuery.mockRejectedValue(error);

      await expect(SocialAccount.create(mockSocialAccountData)).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should create account with minimal data", async () => {
      const minimalData = {
        user_id: 1,
        provider: "google",
        provider_id: "123456789",
        provider_data: {},
      };

      const mockCreated = { id: 1, ...minimalData };
      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await SocialAccount.create(minimalData);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: `INSERT INTO social_accounts(user_id, provider, provider_id, provider_data) 
           VALUES($1, $2, $3, $4) 
           RETURNING *`,
        values: [1, "google", "123456789", {}],
      });
      expect(result).toEqual(mockCreated);
    });

    it("should handle null provider_data", async () => {
      const dataWithNullProviderData = {
        user_id: 1,
        provider: "google",
        provider_id: "123456789",
        provider_data: null,
      };

      const mockCreated = { id: 1, ...dataWithNullProviderData };
      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await SocialAccount.create(dataWithNullProviderData);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: `INSERT INTO social_accounts(user_id, provider, provider_id, provider_data) 
           VALUES($1, $2, $3, $4) 
           RETURNING *`,
        values: [1, "google", "123456789", null],
      });
      expect(result).toEqual(mockCreated);
    });

    it("should create account with GitHub provider", async () => {
      const githubData = {
        user_id: 3,
        provider: "github",
        provider_id: "gh987654",
        provider_data: {
          login: "johndoe",
          name: "John Doe",
          email: "john@github.com",
          avatar_url: "https://github.com/avatar.jpg",
        },
      };

      const mockCreated = { id: 3, ...githubData };
      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await SocialAccount.create(githubData);

      expect(result).toEqual(mockCreated);
      expect(mockDbQuery).toHaveBeenCalledTimes(1);
    });

    it("should handle provider_data with nested objects", async () => {
      const nestedData = {
        user_id: 4,
        provider: "linkedin",
        provider_id: "li555666",
        provider_data: {
          profile: {
            firstName: "John",
            lastName: "Doe",
            emailAddress: "john@linkedin.com",
            pictureUrl: "https://linkedin.com/photo.jpg",
          },
          positions: [
            { title: "Developer", company: "Tech Corp" },
            { title: "Senior Developer", company: "Other Corp" },
          ],
          educations: [
            { schoolName: "University", degree: "Computer Science" },
          ],
        },
      };

      const mockCreated = { id: 4, ...nestedData };
      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await SocialAccount.create(nestedData);

      expect(result).toEqual(mockCreated);
    });

    it("should handle extremely long provider_id", async () => {
      const longData = {
        user_id: 5,
        provider: "custom",
        provider_id: "a".repeat(1000),
        provider_data: { email: "test@example.com" },
      };

      const mockCreated = { id: 5, ...longData };
      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await SocialAccount.create(longData);

      expect(result).toEqual(mockCreated);
    });

    it("should handle special characters in provider_data", async () => {
      const specialData = {
        user_id: 6,
        provider: "custom",
        provider_id: "special123",
        provider_data: {
          name: "José María González-Pérez",
          email: "josé@example.com",
          bio: "Developer with 10+ years experience 🚀",
          skills: ["JavaScript", "Node.js", "React", "SQL"],
        },
      };

      const mockCreated = { id: 6, ...specialData };
      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await SocialAccount.create(specialData);

      expect(result).toEqual(mockCreated);
    });

    it("should handle provider_data with timestamps", async () => {
      const timestampData = {
        user_id: 7,
        provider: "microsoft",
        provider_id: "ms789456",
        provider_data: {
          email: "user@outlook.com",
          createdAt: "2024-01-15T10:30:00Z",
          lastLogin: "2024-03-15T14:22:33Z",
          tokenExpiry: "2024-04-15T10:30:00Z",
        },
      };

      const mockCreated = { id: 7, ...timestampData };
      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await SocialAccount.create(timestampData);

      expect(result).toEqual(mockCreated);
    });

    it("should handle constraint violation errors", async () => {
      const constraintError = new Error(
        'violates foreign key constraint "social_accounts_user_id_fkey"'
      );
      constraintError.code = "23503";
      mockDbQuery.mockRejectedValue(constraintError);

      await expect(SocialAccount.create(mockSocialAccountData)).rejects.toThrow(
        "violates foreign key constraint"
      );
    });

    it("should handle connection timeout during create", async () => {
      const timeoutError = new Error("Connection timeout");
      timeoutError.code = "ETIMEDOUT";
      mockDbQuery.mockRejectedValue(timeoutError);

      await expect(SocialAccount.create(mockSocialAccountData)).rejects.toThrow(
        "Connection timeout"
      );
    });

    it("should handle numeric provider_id", async () => {
      const numericData = {
        user_id: 8,
        provider: "numeric",
        provider_id: 123456789,
        provider_data: { email: "numeric@example.com" },
      };

      const mockCreated = { id: 8, ...numericData };
      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await SocialAccount.create(numericData);

      expect(result).toEqual(mockCreated);
    });
  });

  describe("findByProviderAndProviderId", () => {
    it("should find social account by provider and provider ID", async () => {
      const mockSocialAccount = {
        id: 1,
        user_id: 1,
        provider: "google",
        provider_id: "123456789",
        provider_data: {
          email: "user@gmail.com",
          name: "John Doe",
        },
        created_at: "2024-03-15T10:00:00Z",
      };

      mockDbQuery.mockResolvedValue({ rows: [mockSocialAccount] });

      const result = await SocialAccount.findByProviderAndProviderId(
        "google",
        "123456789"
      );

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: "SELECT * FROM social_accounts WHERE provider = $1 AND provider_id = $2",
        values: ["google", "123456789"],
      });
      expect(result).toEqual(mockSocialAccount);
    });

    it("should return undefined when social account not found", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await SocialAccount.findByProviderAndProviderId(
        "google",
        "nonexistent"
      );

      expect(result).toBeUndefined();
    });

    it("should find Facebook social account", async () => {
      const mockFacebookAccount = {
        id: 2,
        user_id: 2,
        provider: "facebook",
        provider_id: "fb123456",
        provider_data: {
          email: "user@facebook.com",
          name: "Jane Doe",
        },
      };

      mockDbQuery.mockResolvedValue({ rows: [mockFacebookAccount] });

      const result = await SocialAccount.findByProviderAndProviderId(
        "facebook",
        "fb123456"
      );

      expect(result).toEqual(mockFacebookAccount);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error occurred");
      mockDbQuery.mockRejectedValue(error);

      await expect(
        SocialAccount.findByProviderAndProviderId("google", "123456789")
      ).rejects.toThrow("Database error occurred");
    });

    it("should handle case-sensitive provider names", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await SocialAccount.findByProviderAndProviderId("Google", "123456789");

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: "SELECT * FROM social_accounts WHERE provider = $1 AND provider_id = $2",
        values: ["Google", "123456789"],
      });
    });

    it("should handle special characters in provider_id", async () => {
      const specialProviderId = "user@domain.com";
      mockDbQuery.mockResolvedValue({ rows: [] });

      await SocialAccount.findByProviderAndProviderId(
        "email",
        specialProviderId
      );

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: "SELECT * FROM social_accounts WHERE provider = $1 AND provider_id = $2",
        values: ["email", specialProviderId],
      });
    });

    it("should handle numeric provider_id as string", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await SocialAccount.findByProviderAndProviderId("google", 123456789);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: "SELECT * FROM social_accounts WHERE provider = $1 AND provider_id = $2",
        values: ["google", 123456789],
      });
    });

    it("should handle whitespace in parameters", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await SocialAccount.findByProviderAndProviderId(
        "  google  ",
        "  123456789  "
      );

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: "SELECT * FROM social_accounts WHERE provider = $1 AND provider_id = $2",
        values: ["  google  ", "  123456789  "],
      });
    });

    it("should handle provider_id with URL format", async () => {
      const urlProviderId = "https://provider.com/user/123456789";
      mockDbQuery.mockResolvedValue({ rows: [] });

      await SocialAccount.findByProviderAndProviderId("custom", urlProviderId);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: "SELECT * FROM social_accounts WHERE provider = $1 AND provider_id = $2",
        values: ["custom", urlProviderId],
      });
    });

    it("should handle provider_id with JSON format", async () => {
      const jsonProviderId = '{"id": 123, "type": "user"}';
      mockDbQuery.mockResolvedValue({ rows: [] });

      await SocialAccount.findByProviderAndProviderId(
        "json-provider",
        jsonProviderId
      );

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: "SELECT * FROM social_accounts WHERE provider = $1 AND provider_id = $2",
        values: ["json-provider", jsonProviderId],
      });
    });

    it("should handle very short provider and provider_id", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await SocialAccount.findByProviderAndProviderId("a", "1");

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: "SELECT * FROM social_accounts WHERE provider = $1 AND provider_id = $2",
        values: ["a", "1"],
      });
    });

    it("should handle provider with numbers", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await SocialAccount.findByProviderAndProviderId("oauth2", "token123");

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: "SELECT * FROM social_accounts WHERE provider = $1 AND provider_id = $2",
        values: ["oauth2", "token123"],
      });
    });

    it("should handle simultaneous queries", async () => {
      const mockAccount1 = { id: 1, provider: "google", provider_id: "123" };
      const mockAccount2 = { id: 2, provider: "facebook", provider_id: "456" };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockAccount1] })
        .mockResolvedValueOnce({ rows: [mockAccount2] });

      const [result1, result2] = await Promise.all([
        SocialAccount.findByProviderAndProviderId("google", "123"),
        SocialAccount.findByProviderAndProviderId("facebook", "456"),
      ]);

      expect(result1).toEqual(mockAccount1);
      expect(result2).toEqual(mockAccount2);
      expect(mockDbQuery).toHaveBeenCalledTimes(2);
    });

    it("should handle provider_id with base64 encoding", async () => {
      const base64ProviderId = "dXNlcjEyMzQ1Ng=="; // base64 for 'user123456'
      mockDbQuery.mockResolvedValue({ rows: [] });

      await SocialAccount.findByProviderAndProviderId(
        "base64-provider",
        base64ProviderId
      );

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: "SELECT * FROM social_accounts WHERE provider = $1 AND provider_id = $2",
        values: ["base64-provider", base64ProviderId],
      });
    });

    it("should handle provider_id with UUID format", async () => {
      const uuidProviderId = "550e8400-e29b-41d4-a716-446655440000";
      mockDbQuery.mockResolvedValue({ rows: [] });

      await SocialAccount.findByProviderAndProviderId(
        "uuid-provider",
        uuidProviderId
      );

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: "SELECT * FROM social_accounts WHERE provider = $1 AND provider_id = $2",
        values: ["uuid-provider", uuidProviderId],
      });
    });

    it("should handle provider_id with hex format", async () => {
      const hexProviderId = "0x1a2b3c4d5e6f";
      mockDbQuery.mockResolvedValue({ rows: [] });

      await SocialAccount.findByProviderAndProviderId(
        "hex-provider",
        hexProviderId
      );

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: "SELECT * FROM social_accounts WHERE provider = $1 AND provider_id = $2",
        values: ["hex-provider", hexProviderId],
      });
    });
  });

  describe("additional edge cases", () => {
    it("should handle create with array in provider_data", async () => {
      const arrayData = {
        user_id: 10,
        provider: "array-provider",
        provider_id: "arr123",
        provider_data: {
          emails: ["primary@example.com", "secondary@example.com"],
          roles: ["user", "admin"],
          permissions: ["read", "write", "delete"],
        },
      };

      const mockCreated = { id: 10, ...arrayData };
      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await SocialAccount.create(arrayData);

      expect(result).toEqual(mockCreated);
    });

    it("should handle create with boolean values in provider_data", async () => {
      const booleanData = {
        user_id: 11,
        provider: "boolean-provider",
        provider_id: "bool123",
        provider_data: {
          emailVerified: true,
          twoFactorEnabled: false,
          isActive: true,
          isPremium: false,
        },
      };

      const mockCreated = { id: 11, ...booleanData };
      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await SocialAccount.create(booleanData);

      expect(result).toEqual(mockCreated);
    });

    it("should handle malformed JSON in database response", async () => {
      const error = new Error("invalid input syntax for type json");
      error.code = "22P02";
      mockDbQuery.mockRejectedValue(error);

      await expect(
        SocialAccount.create({
          user_id: 1,
          provider: "test",
          provider_id: "test123",
          provider_data: { malformed: "data" },
        })
      ).rejects.toThrow("invalid input syntax for type json");
    });

    it("should handle transaction rollback scenarios", async () => {
      const rollbackError = new Error("current transaction is aborted");
      rollbackError.code = "25P02";
      mockDbQuery.mockRejectedValue(rollbackError);

      await expect(
        SocialAccount.findByProviderAndProviderId("google", "123456789")
      ).rejects.toThrow("current transaction is aborted");
    });

    it("should handle concurrent access conflicts", async () => {
      const concurrencyError = new Error(
        "could not serialize access due to concurrent update"
      );
      concurrencyError.code = "40001";
      mockDbQuery.mockRejectedValue(concurrencyError);

      await expect(
        SocialAccount.create({
          user_id: 1,
          provider: "test",
          provider_id: "test123",
          provider_data: {},
        })
      ).rejects.toThrow("could not serialize access due to concurrent update");
    });
  });
});
