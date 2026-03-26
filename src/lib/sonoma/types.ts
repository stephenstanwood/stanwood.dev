export interface ArrestYear {
  year: number;
  total: number;
  felony: number;
  misdemeanor: number;
  status: number;
  violent: number;
  property: number;
  drug: number;
  sex: number;
  other: number;
}

export interface DispositionYear {
  year: number;
  complaintSought: number;
  released: number;
  toOtherAgency: number;
  withinDepartment: number;
  juvenileProbation: number;
  total: number;
}

export interface CrimeYear {
  year: number;
  totalViolent: number;
  homicide: number;
  rape: number;
  robbery: number;
  aggAssault: number;
  totalProperty: number;
  burglary: number;
  vehicleTheft: number;
  larcenyTheft: number;
  violentCleared: number;
  propertyCleared: number;
}

export type CountyData<T> = {
  sonoma: T[];
  marin: T[];
  napa: T[];
  mendocino: T[];
};

export type CountyKey = keyof CountyData<unknown>;

export interface RecentArrest {
  date: string;
  charge: string;
  city: string;
  degree: string;
  race: string;
  gender: string;
  age: number;
}

export const COUNTY_COLORS: Record<CountyKey, string> = {
  sonoma: "#1e3a5f",
  marin: "#0d9488",
  napa: "#7c3aed",
  mendocino: "#d97706",
};

export const COUNTY_LABELS: Record<CountyKey, string> = {
  sonoma: "Sonoma",
  marin: "Marin",
  napa: "Napa",
  mendocino: "Mendocino",
};
