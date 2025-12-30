import { env } from '$env/dynamic/private';

type PatchnoteEntry = {
  date: string;
  desc: string;
  features: { desc: string; title: string }[];
  fixes: { desc: string; title: string }[];
  title: string;
  version: string;
};

export async function load() {
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${env.MANAGER_AUTH}`);

  const textsResponse = await fetch(`http://${env.MANAGER_HOST}/api/v0/texts`, { headers });
  if (!textsResponse.ok) {
    throw new Error('Failed to fetch texts', { cause: await textsResponse.text() });
  }
  const texts = await textsResponse.json();

  return { patchnotes: texts.patchnotes as PatchnoteEntry[] };
}
