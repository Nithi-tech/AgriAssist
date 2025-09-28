// src/lib/policies.ts

// Define the shape of a policy
export interface AgriculturalPolicy {
  id: string;
  title: string;
  description: string;
  state: string;
  category: string;
}

// Sample policy data (temporary, replace with API/db calls later)
const policies: AgriculturalPolicy[] = [
  {
    id: "1",
    title: "Subsidy on Seeds",
    description: "Farmers get 40% subsidy on certified seeds.",
    state: "Tamil Nadu",
    category: "Subsidy"
  },
  {
    id: "2",
    title: "Drip Irrigation Scheme",
    description: "50% subsidy for drip irrigation systems.",
    state: "Andhra Pradesh",
    category: "Irrigation"
  }
];

// --- Functions for accessing policies ---

export function getAllPolicies(): AgriculturalPolicy[] {
  return policies;
}

export function getPoliciesByState(state: string): AgriculturalPolicy[] {
  return policies.filter(p => p.state.toLowerCase() === state.toLowerCase());
}

export function searchPolicies(keyword: string): AgriculturalPolicy[] {
  return policies.filter(
    p =>
      p.title.toLowerCase().includes(keyword.toLowerCase()) ||
      p.description.toLowerCase().includes(keyword.toLowerCase())
  );
}
