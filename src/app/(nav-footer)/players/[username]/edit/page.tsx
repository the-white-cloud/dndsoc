import { forbidden } from "next/navigation";
import { cache } from "react";

import { PlayerEditForm } from "./form";
import { getPlayerByUsername, getPlayerRoleUser } from "@/lib/players";
import { TypographyLink } from "@/components/typography/paragraph";
import { TypographyH1 } from "@/components/typography/headings";
import { ErrorPage } from "@/components/error-page";

export const dynamic = "force-dynamic";

const cachedGetPlayer = cache(getPlayerByUsername);

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const result = await cachedGetPlayer({ username });
  if (result.isErr()) return { title: "Player Not Found", description: "This player does not exist." };
  const player = result.value;

  const level = player.level;
  const ach = player.received_achievements_player.length;
  const description = `Some statistics about our player ${username}: Level ${level} · Received ${ach} Achievement${ach === 1 ? "" : "s"}`;
  const title = `Edit Player ${username}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const result = await cachedGetPlayer({ username });
  if (result.isErr()) return <ErrorPage error={result.error} caller="/players/[username]/edit/page.tsx" />;
  const player = result.value;

  const combinedAuth = await getPlayerRoleUser();
  if (combinedAuth.isErr() && combinedAuth.error.code !== "NOT_LOGGED_IN")
    return <ErrorPage error={combinedAuth.error} caller="/players/[username]/edit/page.tsx" />;

  const auth = combinedAuth.isOk() ? combinedAuth.value : null;
  const role = auth ? auth.roles?.role : null;
  const ownsPlayer = auth ? player.auth_user_uuid === auth.auth_user_uuid || role === "admin" : null;

  if (!ownsPlayer) forbidden();

  return (
    <div className="flex flex-col w-full mx-auto lg:max-w-6xl max-w-prose lg:my-12 mt-6 mb-12 px-4">
      <TypographyLink href={`/players/${player.users.username}`} className="tracking-wide font-quotes">
        Go Back
      </TypographyLink>
      <TypographyH1 className="mt-0.5">Edit Your Public Player Page</TypographyH1>
      <PlayerEditForm player={player} />
    </div>
  );
}
