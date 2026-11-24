import { getPageSections } from '@/app/actions/page-sections';
import { getGalleryItems } from '@/app/actions/gallery';
import { getInstagramReels } from '@/app/actions/instagram-reels';
import { HeroEditor } from '@/components/admin/cms/home/HeroEditor';
import { AboutEditor } from '@/components/admin/cms/home/AboutEditor';
import { GalleryManager } from '@/components/admin/cms/home/GalleryManager';
import { ReelsManager } from '@/components/admin/cms/home/ReelsManager';
import { PromotionsManager } from '@/components/admin/cms/home/PromotionsManager';
import { CMSBackLink } from '@/components/admin/cms/CMSBackLink';

export default async function HomeAdminPage() {
    // Fetch all data in parallel
    const [sections, gallery, reels] = await Promise.all([
        getPageSections('home'),
        getGalleryItems(),
        getInstagramReels()
    ]);

    // Find specific sections or use undefined (editors will handle defaults)
    const heroSection = sections.find((s: any) => s.section_key === 'hero');
    const aboutSection = sections.find((s: any) => s.section_key === 'about');

    // Promotion slider images have their own manager; party carousel belongs to the parties page
    const promotionItems = gallery.filter((item: any) => item.category === 'home_promotions');
    const homeGalleryItems = gallery.filter((item: any) =>
        item.category !== 'parties_carousel' && item.category !== 'home_promotions');

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <CMSBackLink />
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Home Page Editing</h1>
                <p className="text-slate-500">Manage content for the main landing page</p>
            </div>

            <div className="grid gap-8">
                <section>
                    <HeroEditor section={heroSection} pageSlug="home" />
                </section>

                <section>
                    <PromotionsManager items={promotionItems} />
                </section>

                <section>
                    <AboutEditor section={aboutSection} pageSlug="home" />
                </section>

                <section>
                    <GalleryManager items={homeGalleryItems} />
                </section>



                <section>
                    <ReelsManager items={reels} />
                </section>
            </div>
        </div>
    );
}

