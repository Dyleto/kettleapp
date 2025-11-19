export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  isAdmin: boolean;
  isCoach: boolean;
  isClient: boolean;
}

export interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  picture?: string;
  linkedAt: Date;
}

export interface Coach {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  picture?: string;
  hiredAt: Date;
}
