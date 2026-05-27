export interface Officer {
  name: string;
  citizenid: string;
  job: { name: string; label: string; grade: { name: string } };
  isLaw: boolean;
}

export interface Citizen {
  citizenid: string;
  charinfo: { firstname: string; lastname: string; gender: number; birthdate: string };
  job: { name: string; label: string; grade: { name: string } };
  money?: { cash: number; bank: number; bloodmoney: number };
  metadata?: { [key: string]: any };
  profilePicture?: string | null;
}

export interface CriminalRecord {
  id: number;
  citizenid: string;
  name: string;
  crime: string;
  description: string;
  fine: number;
  jailtime: number;
  officer: string;
  date: string;
}

export interface Warrant {
  id: number;
  citizenid: string;
  name: string;
  reason: string;
  status: 'active' | 'served' | 'expired';
  officer: string;
  created_at: string;
}

export interface BOLO {
  id: number;
  title: string;
  description: string;
  lastSeen: string;
  officer: string;
  date: string;
}

export interface Report {
  id: number;
  title: string;
  type: string;
  description: string;
  officers: string[];
  suspects: string[];
  evidence: string[];
  officer: string;
  officer_cid?: string;
  created_at: string;
}

export interface ReportComment {
  id: number;
  report_id: number;
  author: string;
  author_cid?: string;
  content: string;
  created_at: string;
}

export interface Stats {
  records: number;
  activeWarrants: number;
  activeBolos: number;
  reports: number;
}

export interface IncidentType {
  value: string;
  label: string;
  color: string;
}
