// backend/services/AuthService.js
import { BaseService } from "./BaseService.js";
import * as UserModel from "../models/User.js";
import jwtGenerator from "../utils/jwtGenerator.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import config from "../config/config.js";
import { sendWelcomeEmail } from "../utils/emailService.js";

export class AuthService extends BaseService {
  async register({ name, email, password }) {
    const existing = await UserModel.findByEmail(email);
    if (existing) throw new Error("A user with this email already exists");

    return this.executeInTransaction(async (client) => {
      const user = await UserModel.create({ name, email, password }, client);
      const token = jwtGenerator(user.id);

      try {
        await sendWelcomeEmail(email, name);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }

      return { user, token };
    });
  }

  async login({ email, password }) {
    const user = await UserModel.findByEmail(email);
    if (!user) throw new Error("Invalid email or password");

    const valid = await UserModel.comparePassword(password, user.password);
    if (!valid) throw new Error("Invalid email or password");

    const token = jwtGenerator(user.id);
    const { password: pw, ...rest } = user;
    return { user: rest, token };
  }

  async getMe(userId) {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");
    return user;
  }

  socialLoginCallback(userId) {
    const token = jwtGenerator(userId);
    return `${config.cors.origin}/social-auth-callback?token=${token}`;
  }

  async forgotPassword(email) {
    const user = await UserModel.findByEmail(email);
    if (!user) throw new Error("No user exists with this email address");

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expire = Date.now() + 3600000; // 1 hour

    await this.executeInTransaction(async (client) => {
      await UserModel.updateResetToken(user.id, resetToken, expire, client);
    });

    const resetUrl = `${config.cors.origin}/reset-password/${resetToken}`;
    const message = `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset",
        html: message,
      });
      return { message: "Email has been sent" };
    } catch (err) {
      await this.executeInTransaction(async (client) => {
        await UserModel.updateResetToken(user.id, null, null, client);
      });
      throw new Error("Email could not be sent");
    }
  }

  async verifyResetToken(token) {
    const user = await UserModel.findByResetToken(token);
    if (!user || user.reset_token_expire < Date.now()) {
      throw new Error("Invalid or expired token");
    }
    return { message: "Valid token" };
  }

  async resetPassword(token, newPassword) {
    const user = await UserModel.findByResetToken(token);
    if (!user || user.reset_token_expire < Date.now()) {
      throw new Error("Invalid or expired token");
    }

    await this.executeInTransaction(async (client) => {
      await UserModel.updatePassword(user.id, newPassword, client);
    });
    return { message: "Password has been updated successfully" };
  }
}
