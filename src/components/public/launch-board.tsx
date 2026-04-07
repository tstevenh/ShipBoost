import Link from "next/link";

type LaunchItem = {
  id: string;
  launchType: "FREE" | "FEATURED" | "RELAUNCH";
  status: "PENDING" | "APPROVED" | "LIVE" | "ENDED" | "REJECTED";
  launchDate: Date;
  priorityWeight: number;
  tool: {
    slug: string;
    name: string;
    tagline: string;
    websiteUrl: string;
    logoMedia: { url: string } | null;
    toolCategories: Array<{
      category: { name: string; slug: string };
    }>;
  };
};

function toneClassName(launchType: LaunchItem["launchType"]) {
  if (launchType === "FEATURED") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (launchType === "RELAUNCH") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function LaunchBoard({
  board,
  launches,
}: {
  board: "daily" | "weekly" | "monthly";
  launches: LaunchItem[];
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
          Launch board
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black">
          {board[0].toUpperCase() + board.slice(1)} launches
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-black/66">
          Live and recent launches ranked with featured priority first, then
          recency. This is the public proof that the directory is more than a
          static listing database.
        </p>
      </div>

      <div className="space-y-4">
        {launches.map((launch) => (
          <article
            key={launch.id}
            className="rounded-[1.75rem] border border-black/10 bg-white p-5 shadow-[0_18px_50px_rgba(0,0,0,0.06)]"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#f3f0ea]">
                  {launch.tool.logoMedia ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={launch.tool.logoMedia.url}
                      alt={`${launch.tool.name} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-black/45">
                      {launch.tool.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/tools/${launch.tool.slug}`}
                      className="text-lg font-semibold text-black transition hover:text-[#9f4f1d]"
                    >
                      {launch.tool.name}
                    </Link>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase ${toneClassName(
                        launch.launchType,
                      )}`}
                    >
                      {launch.launchType}
                    </span>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-black/62">
                    {launch.tool.tagline}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-black/42">
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(launch.launchDate))}
                  </p>
                </div>
              </div>

              <a
                href={launch.tool.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:bg-black/[0.04]"
              >
                Visit site
              </a>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {launch.tool.toolCategories.map((item) => (
                <Link
                  key={item.category.slug}
                  href={`/categories/${item.category.slug}`}
                  className="rounded-full border border-black/10 bg-[#fff9ef] px-3 py-1.5 text-xs font-medium text-black/72"
                >
                  {item.category.name}
                </Link>
              ))}
            </div>
          </article>
        ))}

        {launches.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-black/15 bg-black/[0.02] px-5 py-10 text-center text-sm text-black/55">
            No launches on this board yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
