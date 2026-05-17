export interface RegisterRequestDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface JwtTokenPayload {
  userId: string;
}

export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
}

export interface LoginResponseData {
  token: string;
  user: AuthUserResponse;
}
