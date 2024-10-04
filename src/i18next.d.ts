import 'i18next';
import commands from '../locales/en-US/commands.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      commands: typeof commands;
    };
  }
}
