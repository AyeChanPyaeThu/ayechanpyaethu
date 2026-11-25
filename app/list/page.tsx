import Link from "next/link";
import { Suspense } from "react";
import ProjectsListSection, {
  ProjectsListSectionFallback,
} from "@/components/projects-list-section";
import AchievementsListSection, {
  AchievementsListSectionFallback,
} from "@/components/achievements-list-section";

export default function List() {
  return (
    <div className="w-full flex flex-col items-center justify-center overflow-x-clip">
      {/* Projects */}
      <div
        className="w-full px-4 sm:px-6 md:px-10 lg:px-15 flex flex-col items-center"
        id="projects"
      >
        <h1 className="my-8 mon-exbold text-center underline text-3xl sm:text-4xl text-black">
          Featured Projects
        </h1>

        <Suspense fallback={<ProjectsListSectionFallback />}>
          <ProjectsListSection />
        </Suspense>
      </div>

      {/* Achievements */}
      <div
        className="w-full px-4 sm:px-6 md:px-10 lg:px-15 flex flex-col items-center"
        id="achievements"
      >
        <h1 className="my-8 mon-exbold text-center underline text-3xl sm:text-4xl text-black">
          Collection of Milestones
        </h1>

        <Suspense fallback={<AchievementsListSectionFallback />}>
          <AchievementsListSection />
        </Suspense>
      </div>
    </div>
  );
}
