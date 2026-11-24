import Link from "next/link";
import { Suspense } from "react";
import { certificates } from "../data/projects";
import ProjectsListSection, { ProjectsListSectionFallback } from "@/components/projects-list-section";
import DetailsModal from "@/components/details-modal";

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
          Achievements
        </h1>

        <div className="w-full mb-12">
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {certificates.map((p) => (
              <div
                key={p.id}
                className="min-w-0 neumorphic-two rounded-lg bg-white px-5 sm:px-6 lg:px-8 py-6 hover:-translate-y-2 transition duration-300"
              >
                <img
                  src={p.img}
                  alt={p.name}
                  className="h-44 sm:h-42 w-full object-cover rounded-3xl"
                />

                <h3 className="mt-3 text-lg sm:text-xl font-extrabold text-amber-900">
                  {p.name}
                </h3>

                <p className="text-sm sm:text-base text-gray-700">{p.note}</p>

                <DetailsModal
                  project={p}
                  variant="certificate"
                  triggerClassName="mt-5 w-full py-2 rounded-3xl text-white bg-amber-800 hover:cursor-pointer hover:bg-amber-600 transition"
                />
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/#achievements"
          className="neumorphic-two w-full max-w-xs sm:w-md btn-neu mb-12 text-3xl sm:text-4xl md:text-5xl text-black text-center"
        >
          Back
        </Link>
      </div>
    </div>
  );
}
