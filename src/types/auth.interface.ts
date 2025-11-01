export interface Authentication {
  username: string;
}

export enum UserRole {
  ADMIN = 1,
  MODERATOR = 2,
  CUSTOMER = 3,
  COLLABORATOR = 4,
  STAFF = 5,
}