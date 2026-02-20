export interface IEmployee {
  id?: string;
  org_id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  status?: string;
  skills?: any; 
  wallet_address?: string;
}