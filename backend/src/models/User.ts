export type Gender = "male" | "female" | "other";

export interface IUser {
  id: number;
  phone_number: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  gender: Gender | string | null;
  nationality: string | null;
  country_of_residence: string | null;
  wallet_balance: number | string | null;
  is_phone_verified: boolean | number;
  is_admin: boolean | number;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

export default IUser;
