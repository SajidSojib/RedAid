import { authedRequest } from "@/lib/server-api";

export type TopDonor = {
  rank: number;
  name: string;
  image: string | null;
  donations: number;
  badge: string | null;
};

export type TopDonorsPayload = {
  donors: TopDonor[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const  getTopDonors= (query: string) =>
  authedRequest<TopDonorsPayload>(`/leaderboard${query ? `?${query}` : ""}`, {
    cache: { revalidate: 60, tags: ["top-donors"] },
  });

export const leaderboardServices = { getTopDonors };
