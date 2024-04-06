import commands from '../const/commands.js';
import patchnotes from '../const/patchnotes.js';
import faqs from '../const/faq.js';
import termsAndConditions from '../const/termsAndConditions.js';
import privacyPolicy from '../const/privacyPolicy.js';

export default eventHandler((event) => {
  return { commands, patchnotes, faqs, termsAndConditions, privacyPolicy };
});
