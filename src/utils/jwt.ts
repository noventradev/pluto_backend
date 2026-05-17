import jwt from "jsonwebtoken";

interface JwtTokenPayload {
  userId: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const generateToken = (payload: JwtTokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
};

export const verifyToken = (token: string): JwtTokenPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtTokenPayload;
};