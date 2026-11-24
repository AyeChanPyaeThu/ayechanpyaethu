import Link from "next/link";

import DetailsModal from "@/components/details-modal";
import { getPublicProjects } from "@/lib/data/projects";

export default async function ProjectsListSection() {
  const projects = await getPublicProjects();

  return (
    <>
      <div className="w-full mb-12">
        {projects.length > 0 ? (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="min-w-0 neumorphic-two rounded-lg bg-white px-5 sm:px-6 lg:px-8 py-6 hover:-translate-y-2 transition duration-300"
              >
                {project.img ? (
                  <img
                    src={project.img}
                    alt={project.name}
                    className="h-44 sm:h-42 w-full object-cover rounded-3xl"
                  />
                ) : (
                  <div className="h-44 sm:h-42 w-full rounded-3xl bg-amber-50" />
                )}

                <h3 className="mt-3 text-lg sm:text-xl font-extrabold text-amber-900">
                  {project.name}
                </h3>

                <p className="text-sm sm:text-base text-gray-700">
                  {project.note}
                </p>

                <DetailsModal
                  project={project}
                  triggerClassName="mt-5 w-full py-2 rounded-3xl text-white bg-amber-800 hover:cursor-pointer hover:bg-amber-600 transition"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-gray-600">
            Projects will be added soon.
          </p>
        )}
      </div>

      <Link
        href="/#projects"
        className="neumorphic-two w-full max-w-xs sm:w-md btn-neu mb-12 text-3xl sm:text-4xl md:text-5xl text-black text-center"
      >
        Back
      </Link>
    </>
  );
}

export function ProjectsListSectionFallback() {
  return <div className="w-full min-h-64 mb-12" />;
}
