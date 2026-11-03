import { BadgeLadder } from "@/components/module/home/badge-ladder";
import { CompatibilityChecker } from "@/components/module/home/compatibility-checker";
import { Faq } from "@/components/module/home/faq";
import { Hero } from "@/components/module/home/hero";
import { HowItWorks } from "@/components/module/home/how-it-works";
import {
  LiveRequests,
  LiveRequestsFallback,
} from "@/components/module/home/live-requests";
import { TopDonorsPreview, TopDonorsPreviewFallback } from "@/components/module/home/top-donors-preview";
import React, { Suspense } from "react";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    compatibility_mode?: string;
    compatibility_type?: string;
  }>;
}) {
  const { compatibility_mode, compatibility_type } = await searchParams;
  return (
    <main>
      <Hero></Hero>
      <HowItWorks></HowItWorks>
      <CompatibilityChecker
        mode={compatibility_mode}
        type={compatibility_type}
      ></CompatibilityChecker>
      <Suspense fallback={<LiveRequestsFallback />}>
        <LiveRequests />
      </Suspense>
      <Suspense fallback={<TopDonorsPreviewFallback />}>
        <TopDonorsPreview />
      </Suspense>
      <BadgeLadder></BadgeLadder>
      <Faq></Faq>
    </main>
  );
}
