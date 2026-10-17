// Where a notification takes each person
export const requesterRequestLink = (id: string) =>
  `/dashboard/my-requests?request=${id}`;

export const donorRequestLink = (id: string) => `/requests/${id}`;
