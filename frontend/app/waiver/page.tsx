import WaiverForm from "./components/WaiverForm";
import { getMetadata } from "@/seo/seo.config";

export const metadata = getMetadata(
    "Sign Waiver",
    "Sign your digital liability waiver for Ninja Inflatable Park online. Save time at the entrance!"
);

export default function WaiverPage() {
    return <WaiverForm />;
}
