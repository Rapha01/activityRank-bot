import 'i18next';
import type cmdContent from '../locales/en-US/command-content.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      'command-content': typeof cmdContent;
    };
  }
}
