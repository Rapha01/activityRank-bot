export enum PrivilegeLevel {
  Owner = 4,
  Developer = 3,
  Moderator = 2,
  HelpStaff = 1,
}

export function hasPrivilege(requirement: PrivilegeLevel, testCase: PrivilegeLevel) {
  return testCase >= requirement;
}
