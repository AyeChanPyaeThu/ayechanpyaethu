import Link from "next/link";
import { projects } from "../data/projects";
import { ChevronsRight } from "lucide-react";
import DetailsModal from "@/components/details-modal";

export default function List() {
  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* Projects  */}
      <div className="w-full px-15 flex flex-col items-center" id="projects">
        <h1 className="my-8 mon-exbold text-center underline text-4xl text-black">
          Featured Projects
        </h1>
        <div className="flex justify-between items-center mb-12">
          <div className="w-full grid md:grid-cols-3 gap-6 ">
            <>
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="neumorphic-two rounded-lg bg-white px-8 py-6 hover:-translate-y-2 transition"
                >
                  <img
                    src={p.img}
                    alt={p.name}
                    className="h-42 w-full object-cover rounded-2xl"
                  />
                  <h3 className="mt-3 text-xl font-extrabold text-amber-900">
                    {p.name}
                  </h3>
                  <p className="text-gray-700">{p.note}</p>
                  <DetailsModal
                    project={p}
                    triggerClassName="mt-5 w-full py-2 rounded-xl text-white bg-amber-800 hover:cursor-pointer hover:bg-amber-600"
                  />
                </div>
              ))}{" "}
            </>
          </div>
        </div>

        <Link
          href="/#projects"
          className="neumorphic-two w-md btn-neu mb-12 text-5xl text-black"
        >
          Back
        </Link>
      </div>

      {/* Achievements  */}
      <div
        className="w-full px-15 flex flex-col items-center"
        id="achievements"
      >
        <h1 className="my-8 mon-exbold text-center underline text-4xl text-black">
          Achievements
        </h1>
        <div className="flex justify-between items-center mb-12">
          <div className="w-full grid md:grid-cols-3 gap-6 ">
            <>
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="neumorphic-two rounded-lg bg-white px-8 py-6 hover:-translate-y-2 transition"
                >
                  <img
                    src={p.img}
                    alt={p.name}
                    className="h-42 w-full object-cover rounded-2xl"
                  />
                  <h3 className="mt-3 text-xl font-extrabold text-amber-900">
                    {p.name}
                  </h3>
                  <p className="text-gray-700 ">{p.note}</p>
                  <DetailsModal
                    project={p}
                    triggerClassName="mt-5 w-full py-2 rounded-xl text-white bg-amber-800 hover:cursor-pointer hover:bg-amber-600"
                  />
                </div>
              ))}{" "}
            </>
          </div>
        </div>

        <Link
          href="/#achievements"
          className="neumorphic-two w-md btn-neu mb-12 text-5xl text-black"
        >
          Back
        </Link>
      </div>
    </div>
  );
}
