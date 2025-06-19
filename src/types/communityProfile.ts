export interface ChurchProfile {
  id: number;
  created_at: string;
  church_id: string;
  number_of_active_members: number | null;
  number_of_pledging_members: number | null;
  parochial_report: string | null;
  dream: string | null;
  accomplish: string | null;
  community_description: string | null;
  name: string | null;
}
