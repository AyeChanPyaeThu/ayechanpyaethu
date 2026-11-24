import Link from "next/link";

import DetailsModal from "@/components/details-modal";
import { getFeaturedProjects } from "@/lib/data/projects";

export default async function ProjectsSection() {
  const projects = await getFeaturedProjects();

  return (
    <section
      className="w-full neumorphic-two inset-shadow flex items-center justify-center px-5"
      id="projects"
    >
      <div className="w-full px-3 sm:px-6 lg:px-12">
        <h1 className="my-6 sm:my-8 mon-exbold text-center text-2xl sm:text-3xl lg:text-4xl text-black">
          Featured Projects
        </h1>

        <div className="flex flex-col items-end gap-5 mb-8 sm:mb-12">
          {projects.length > 0 ? (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="neumorphic-two rounded-2xl bg-white p-4 sm:p-5 lg:px-8 lg:py-6 hover:-translate-y-2 transition duration-300"
                >
                  {project.img ? (
                    <img
                      src={project.img}
                      alt={project.name}
                      className="h-40 sm:h-44 lg:h-48 w-full object-cover rounded-2xl"
                    />
                  ) : (
                    <div className="h-40 sm:h-44 lg:h-48 w-full rounded-2xl bg-amber-50" />
                  )}
                  <h3 className="mt-3 font-semibold text-orange-900">
                    {project.name}
                  </h3>
                  <p className="text-orange-700 font-bold">{project.note}</p>
                  <DetailsModal
                    project={project}
                    triggerClassName="mt-5 w-full py-2 rounded-3xl text-white bg-amber-800 hover:cursor-pointer hover:bg-amber-600"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="w-full py-8 text-center text-gray-600">
              Projects will be added soon.
            </p>
          )}

          <Link
            href="/list#projects"
            className="text-black text-xl w-full flex items-center justify-center"
          >
            More
            <span className="inline-block m-0 md:ml-2 text-amber-900 text-3xl">
              »
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function ProjectsSectionFallback() {
  return (
    <section
      className="w-full neumorphic-two inset-shadow flex items-center justify-center px-5"
      id="projects"
    >
      <div className="w-full px-3 sm:px-6 lg:px-12">
        <h1 className="my-6 sm:my-8 mon-exbold text-center text-2xl sm:text-3xl lg:text-4xl text-black">
          Featured Projects
        </h1>
        <div className="min-h-64 w-full" />
      </div>
    </section>
  );
}
