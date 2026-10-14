import MainLayout from "./components/layouts/MainLayout";
import HeroSlider from "./components/home/hero";
import DirectorMessage from "./components/home/director-message";
import QuickAgenda from "./components/home/agenda";
import VideoFocus from "./components/home/video-focus";
import Partners from "./components/home/partners";
import Programmes from "./components/home/programme";
// import FundraisingSection from "./components/home/fundraising";

export default async function Page() {
  return (
    <MainLayout>
      <HeroSlider />
      <Programmes />
      {/* <FundraisingSection /> */}
      <DirectorMessage />
      <QuickAgenda />
      <VideoFocus />
      <Partners />
    </MainLayout>
  );
}
