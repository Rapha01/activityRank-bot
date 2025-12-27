import { env } from '$env/dynamic/private';

type FAQEntry = {
  desc: string;
  id: number;
  title: string;
};

export async function load() {
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${env.MANAGER_AUTH}`);

  const textsResponse = await fetch(`http://${env.MANAGER_HOST}/api/v0/texts`, { headers });
  if (!textsResponse.ok) {
    throw new Error('Failed to fetch texts', { cause: await textsResponse.text() });
  }
  const texts = await textsResponse.json();

  return { faqs: texts.faqs as FAQEntry[] };
}
