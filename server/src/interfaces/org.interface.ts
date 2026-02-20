export interface IOrganization {
  id?: string; 
  name: string;
  slug: string;
  email: string;
  password_hash: string;
  plan?: string;
  created_at?: Date;
}

export interface ICreateOrgDTO {
  name: string;
  email: string;
  password: string; 
}