export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  createdAt?: number;
  updatedAt?: number;
  profileImageKey?: string;
}
