import { TypeUser } from './TypeUser';

export interface RegisterRequest {
  name: string;
  lastName: string;
  username: string;
  password: string;
  type: TypeUser;
}
