import Link from "next/link";

import DetailsModal from "@/components/details-modal";
import { getPublicAchievements } from "@/lib/data/achievements";

export default async function AchievementsSection() {
  const achievements = (await getPublicAchievements()).slice(0, 4);

  return (
    <section
      className="w-full neumorphic-two flex items-center justify-center"
      id="achievements"
    >
      <div className="w-full px-3 sm:px-6 lg:px-12">
        <h1 className="my-6 sm:my-8 mon-exbold text-center text-2xl sm:text-3xl lg:text-4xl text-black">
          Achievements
        </h1>

        <div className="flex flex-col items-end gap-5 mb-8 sm:mb-12 px-5 md:px-7">
          {achievements.length > 0 ? (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="neumorphic-two border border-amber-900 rounded-2xl bg-white p-4 sm:p-5 hover:-translate-y-2 transition duration-300"
                >
                  {achievement.img ? (
                    <img
                      src={achievement.img}
                      alt={achievement.name}
                      className="h-42 md:h-36 w-full object-cover rounded-2xl"
                    />
                  ) : (
                    <div className="h-42 md:h-36 w-full rounded-2xl bg-amber-50" />
                  )}
                  <h3 className="mt-3 font-semibold text-orange-900">
                    {achievement.name}
                  </h3>
                  <p className="text-black font-bold">{achievement.note}</p>
                  <DetailsModal
                    project={achievement}
                    variant="certificate"
                    triggerClassName="mt-5 w-full py-2 rounded-3xl text-white bg-amber-800 hover:cursor-pointer hover:bg-amber-600"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="w-full py-8 text-center text-gray-600">
              Achievements will be added soon.
            </p>
          )}

          <Link
            href="/list#achievements"
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

export function AchievementsSectionFallback() {
  return (
    <section
      className="w-full neumorphic-two flex items-center justify-center"
      id="achievements"
    >
      <div className="w-full px-3 sm:px-6 lg:px-12">
        <h1 className="my-6 sm:my-8 mon-exbold text-center text-2xl sm:text-3xl lg:text-4xl text-black">
          Achievements
        </h1>
        <div className="min-h-64 w-full" />
      </div>
    </section>
  );
}
