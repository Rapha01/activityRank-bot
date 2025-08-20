// https://adamcoster.com/blog/prettify-your-javascript-strings

/**
 * Concatenate the string fragments and interpolated values
 * to get a single string.
 */
function populateTemplate(strings: TemplateStringsArray, ...interps: string[]) {
  let string = '';
  for (let i = 0; i < strings.length; i++) {
    string += `${strings[i] || ''}${interps[i]?.toString() || ''}`;
  }
  return string;
}

/**
 * Remove linebreaks and extra spacing in a template string.
 */
export function oneline(strings: TemplateStringsArray, ...interps: string[]) {
  return populateTemplate(strings, ...interps)
    .replace(/^\s+/, '')
    .replace(/\s+$/, '')
    .replace(/\s+/g, ' ');
}
