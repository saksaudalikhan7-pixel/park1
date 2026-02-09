import React from 'react';
import PricingContent from "./components/PricingContent";
import { getPricingPlans } from "../../actions/pricing-plans";
import { getSettings } from "../../actions/settings";


import { getPublicPageSections, getPublicPricingCarouselImages } from "@/lib/public-api";
import { getMetadata } from "@/seo/seo.config";

export const metadata = getMetadata(
    "Pricing & Packages",
    "Check out our affordable ticket prices and packages. From Little Ninjas to Ninja Warriors, we have options for everyone."
);

export default async function Pricing() {
    const [
        plans,
        settings,
        sections,
        carouselImages
    ] = await Promise.all([
        getPricingPlans(),
        getSettings(),
        getPublicPageSections('pricing'),
        getPublicPricingCarouselImages()
    ]) as [any[], any, any[], any[]];

    const heroSection = sections.find((s: any) => s.section_key === 'hero');

    const hero = heroSection ? {
        title: heroSection.title,
        subtitle: heroSection.content || heroSection.subtitle, // support both fields
        image: heroSection.image_url
    } : undefined;

    return (
        <PricingContent
            plans={plans}
            settings={settings}
            hero={hero}
            carouselImages={carouselImages}
        />
    );
}
