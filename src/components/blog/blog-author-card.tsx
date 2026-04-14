import Link from "next/link";

type BlogAuthorCardProps = {
  author: {
    name: string;
    role: string | null;
    bio: string;
    imageUrl: string | null;
    xUrl: string | null;
    linkedinUrl: string | null;
    websiteUrl: string | null;
  };
};

export function BlogAuthorCard({ author }: BlogAuthorCardProps) {
  return (
    <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
      <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40">
        Author
      </p>
      <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted text-xl font-black text-foreground">
          {author.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={author.imageUrl}
              alt={author.name}
              className="h-full w-full object-cover"
            />
          ) : (
            author.name.charAt(0)
          )}
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              {author.name}
            </h2>
            {author.role ? (
              <p className="mt-1 text-sm font-bold text-muted-foreground">
                {author.role}
              </p>
            ) : null}
          </div>
          <p className="text-base leading-relaxed text-muted-foreground">
            {author.bio}
          </p>
          <div className="flex flex-wrap gap-4 text-sm font-black text-foreground">
            {author.xUrl ? (
              <Link href={author.xUrl} target="_blank" rel="noreferrer" className="hover:underline">
                X
              </Link>
            ) : null}
            {author.linkedinUrl ? (
              <Link
                href={author.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                LinkedIn
              </Link>
            ) : null}
            {author.websiteUrl ? (
              <Link
                href={author.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                Website
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
