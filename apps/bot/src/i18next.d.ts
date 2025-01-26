import 'i18next';
import type commands from '../locales/en-US/commands.json';
import type cmdContent from '../locales/en-US/command-content.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      commands: typeof commands;
      'command-content': typeof cmdContent;
    };
  }
}
