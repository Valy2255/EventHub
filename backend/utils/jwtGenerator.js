import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export default function jwtGenerator(userId) {
  const payload = {
    user: {
      id: userId
    }
  };

  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}