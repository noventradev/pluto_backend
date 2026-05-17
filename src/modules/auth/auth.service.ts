import { AppError } from "../../middlewares/error.middleware";
import { hashPassword, comparePassword } from "../../utils/hash";
import { generateToken } from "../../utils/jwt";
import { AuthRepository } from "./auth.repository";
import {
  RegisterRequestDto,
  LoginRequestDto,
  AuthUserResponse,
  LoginResponseData,
} from "./auth.types";

function toAuthUserResponse(user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}): AuthUserResponse {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return { id: user.id, name, email: user.email };
}

export const AuthService = {
  async register(dto: RegisterRequestDto): Promise<void> {
    const existing = await AuthRepository.findByEmail(dto.email);
    if (existing) {
      throw new AppError("Email already registered", 409);
    }

    const hashedPassword = await hashPassword(dto.password);

    await AuthRepository.create({
      firstName: dto.name,
      email: dto.email,
      password: hashedPassword,
    });
  },

  async login(dto: LoginRequestDto): Promise<LoginResponseData> {
    const user = await AuthRepository.findByEmail(dto.email);
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isMatch = await comparePassword(dto.password, user.password);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = generateToken({ userId: user.id });

    return {
      token,
      user: toAuthUserResponse(user),
    };
  },

  async getProfile(userId: string): Promise<AuthUserResponse> {
    const user = await AuthRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return toAuthUserResponse(user);
  },
};
