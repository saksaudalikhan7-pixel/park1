import Link from "next/link";
import FAQClient from "./components/FAQClient";
import { getMetadata } from "@/seo/seo.config";

export const metadata = getMetadata(
    "FAQ",
    "Common questions about Ninja Inflatable Park. Find answers about age limits, clothing, food policies, and more."
);

export default function FAQ() {
    return <FAQClient />;
}
