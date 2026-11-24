export interface Interest {
  id: string;
  name: string;
  description: string;
  img: string;
  icon: string | null;
}

export interface InterestRecord {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
