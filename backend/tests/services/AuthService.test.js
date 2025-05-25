import { jest } from "@jest/globals";

// Mock models and utilities using unstable_mockModule
jest.unstable_mockModule("../../models/User.js", () => ({
  findByEmail: jest.fn(),
  create: jest.fn(),
  comparePassword: jest.fn(),
  updateResetToken: jest.fn(),
  findByResetToken: jest.fn(),
  updatePassword: jest.fn(),
}));

jest.unstable_mockModule("../../utils/jwtGenerator.js", () => ({
  default: jest.fn(),
}));

jest.unstable_mockModule("../../utils/emailService.js", () => ({
  sendWelcomeEmail: jest.fn(),
}));

jest.unstable_mockModule("../../utils/sendEmail.js", () => ({
  default: jest.fn(),
}));

describe("AuthService", () => {
  let AuthService;
  let UserModel;
  let jwtGenerator;
  let sendWelcomeEmail;
  let sendEmail;
  let authService;

  beforeAll(async () => {
    UserModel = await import("../../models/User.js");
    const jwtGeneratorModule = await import("../../utils/jwtGenerator.js");
    jwtGenerator = jwtGeneratorModule.default;
    const emailServiceModule = await import("../../utils/emailService.js");
    sendWelcomeEmail = emailServiceModule.sendWelcomeEmail;
    const sendEmailModule = await import("../../utils/sendEmail.js");
    sendEmail = sendEmailModule.default;
    const { AuthService: AuthServiceClass } = await import(
      "../../services/AuthService.js"
    );
    AuthService = AuthServiceClass;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const mockUser = { id: 1, ...userData };
      const mockToken = "mock-jwt-token";

      UserModel.findByEmail.mockResolvedValue(null);
      UserModel.create.mockResolvedValue(mockUser);
      jwtGenerator.mockReturnValue(mockToken);
      sendWelcomeEmail.mockResolvedValue();

      // Mock transaction
      authService.executeInTransaction = jest.fn(async (callback) =>
        callback()
      );

      const result = await authService.register(userData);

      expect(UserModel.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(UserModel.create).toHaveBeenCalledWith(userData, undefined);
      expect(jwtGenerator).toHaveBeenCalledWith(mockUser.id);
      expect(sendWelcomeEmail).toHaveBeenCalledWith(
        userData.email,
        userData.name
      );
      expect(result).toEqual({ user: mockUser, token: mockToken });
    });

    it("should throw error if user already exists", async () => {
      UserModel.findByEmail.mockResolvedValue({
        id: 1,
        email: "test@example.com",
      });

      await expect(
        authService.register({
          name: "Test",
          email: "test@example.com",
          password: "password",
        })
      ).rejects.toThrow("A user with this email already exists");
    });
  });

  describe("login", () => {
    it("should login user successfully", async () => {
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };
      const mockUser = {
        id: 1,
        name: "Test User",
        email: credentials.email,
        password: "hashed_password",
      };
      const mockToken = "mock-jwt-token";

      UserModel.findByEmail.mockResolvedValue(mockUser);
      UserModel.comparePassword.mockResolvedValue(true);
      jwtGenerator.mockReturnValue(mockToken);

      const result = await authService.login(credentials);

      expect(UserModel.findByEmail).toHaveBeenCalledWith(credentials.email);
      expect(UserModel.comparePassword).toHaveBeenCalledWith(
        credentials.password,
        mockUser.password
      );
      expect(jwtGenerator).toHaveBeenCalledWith(mockUser.id);
      expect(result.token).toBe(mockToken);
      expect(result.user).not.toHaveProperty("password");
    });

    it("should throw error for invalid credentials", async () => {
      UserModel.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: "test@example.com",
          password: "wrong",
        })
      ).rejects.toThrow("Invalid email or password");
    });

    it("should throw error for incorrect password", async () => {
      UserModel.findByEmail.mockResolvedValue({ id: 1, password: "hashed" });
      UserModel.comparePassword.mockResolvedValue(false);

      await expect(
        authService.login({
          email: "test@example.com",
          password: "wrong",
        })
      ).rejects.toThrow("Invalid email or password");
    });
  });

  describe("forgotPassword", () => {
    it("should send password reset email successfully", async () => {
      const email = "test@example.com";
      const mockUser = { id: 1, email };

      UserModel.findByEmail.mockResolvedValue(mockUser);
      UserModel.updateResetToken.mockResolvedValue();
      sendEmail.mockResolvedValue();

      authService.executeInTransaction = jest.fn(async (callback) =>
        callback()
      );

      const result = await authService.forgotPassword(email);

      expect(UserModel.findByEmail).toHaveBeenCalledWith(email);
      expect(UserModel.updateResetToken).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalled();
      expect(result).toEqual({ message: "Email has been sent" });
    });

    it("should throw error if user not found", async () => {
      UserModel.findByEmail.mockResolvedValue(null);

      await expect(
        authService.forgotPassword("notfound@example.com")
      ).rejects.toThrow("No user exists with this email address");
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      const token = "reset-token";
      const newPassword = "newPassword123";
      const mockUser = {
        id: 1,
        reset_token: token,
        reset_token_expire: Date.now() + 3600000,
      };

      UserModel.findByResetToken.mockResolvedValue(mockUser);
      UserModel.updatePassword.mockResolvedValue();

      authService.executeInTransaction = jest.fn(async (callback) =>
        callback()
      );

      const result = await authService.resetPassword(token, newPassword);

      expect(UserModel.findByResetToken).toHaveBeenCalledWith(token);
      expect(UserModel.updatePassword).toHaveBeenCalledWith(
        mockUser.id,
        newPassword,
        undefined
      );
      expect(result).toEqual({
        message: "Password has been updated successfully",
      });
    });

    it("should throw error for expired token", async () => {
      const mockUser = {
        id: 1,
        reset_token: "token",
        reset_token_expire: Date.now() - 3600000, // Expired
      };

      UserModel.findByResetToken.mockResolvedValue(mockUser);

      await expect(
        authService.resetPassword("token", "newPassword")
      ).rejects.toThrow("Invalid or expired token");
    });
  });
});
