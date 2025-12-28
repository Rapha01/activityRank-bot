export async function hasAccess(userId: string): Promise<boolean> {
  const STAFF = [
    '774660568728469585',
    '370650814223482880',
    '270273690074087427',
    '181725637940084736',
  ];

  const TESTERS = ['774660568728469585'];

  if (STAFF.includes(userId)) return true;
  if (TESTERS.includes(userId)) return true;

  return false;
}
