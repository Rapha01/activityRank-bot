export interface TextsData {
  commands: TextsCommands;
  patchnotes: TextsPatchnotes;
  feedbacks: TextsFeedbacks;
  faqs: TextsFaqs;
  features: TextsFeatures;
  termsAndConditions: TextsTermsAndConditions;
  privacyPolicy: TextsPrivacyPolicy;
}

export type TextsCategories =
  | 'stats'
  | 'voting'
  | 'info'
  | 'mysettings'
  | 'other'
  | 'serverSettings'
  | 'xpSettings'
  | 'bonusxp'
  | 'roleAssignments'
  | 'reset';

export interface TextsEntry {
  title: string;
  desc: string;
  subdesc: string;
  subcommands: { title: string; command: string; desc: string; example: string }[];
}

export type TextsCommands = Record<TextsCategories, TextsEntry>;

export interface PatchnotesEntry {
  version: string;
  date: string;
  time: string;
  title: string;
  desc: string;
  features: { title: string; description: string }[];
  fixes: { title: string; description: string }[];
}

export type TextsPatchnotes = PatchnotesEntry[];

export interface FeedbacksEntry {
  name: string;
  usertag: string;
  img: string;
  time: string;
  desc: string;
}

export type TextsFeedbacks = FeedbacksEntry[];

export interface FaqsEntry {
  id: number;
  title: string;
  desc: string;
}

export type TextsFaqs = FaqsEntry[];

export interface FeaturesEntry {
  tag: string;
  title: string;
  desc: string;
}

export type TextsFeatures = FeaturesEntry[];

export interface LegalEntry {
  title: string;
  content: string;
}

export type TextsTermsAndConditions = LegalEntry[];
export type TextsPrivacyPolicy = LegalEntry[];
