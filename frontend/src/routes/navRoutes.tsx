import { MenuItem } from "@/components/navbar35";
import { Zap, Sunset, Trees, Book } from "lucide-react";
export const navbarBeforeLogin: MenuItem[] = [
    { title: "Home", url: "/" },
    { title: "Blood Banks", url: "/blood-banks" },
    { title: "Top Donors", url: "/top-donors" },
]

export const navbarAfterLogin: MenuItem[] = [
  { title: "Home", url: "/" },
  { title: "Blood Banks", url: "/blood-banks" },
  { title: "Top Donors", url: "/top-donors" },
  {
    title: "Dashboard",
    url: "#",
    items: [
      {
        title: "My Donations",
        description: "Your donation history, points, and badges",
        icon: <Zap className="size-5 shrink-0" />,
        url: "/dashboard/my-donations",
      },
      {
        title: "Item2",
        description: "Description for item2",
        icon: <Sunset className="size-5 shrink-0" />,
        url: "#",
      },
      {
        title: "Item3",
        description: "Description for item3",
        icon: <Trees className="size-5 shrink-0" />,
        url: "#",
      },
      {
        title: "Item4",
        description: "Description for item4",
        icon: <Book className="size-5 shrink-0" />,
        url: "#",
      },
    ],
  },
];