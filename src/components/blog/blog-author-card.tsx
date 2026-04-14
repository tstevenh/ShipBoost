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
    <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
      <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40">
        Author
      </p>
      <div className="mt-4 flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted text-lg font-black text-foreground">
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
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black tracking-tight text-foreground">
              {author.name}
            </h2>
            {author.role ? (
              <p className="mt-1 text-sm font-bold text-muted-foreground">
                {author.role}
              </p>
            ) : null}
          </div>
        </div>
        <p className="text-sm leading-7 text-muted-foreground">{author.bio}</p>
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
    </section>
  );
}
