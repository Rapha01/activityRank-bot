export default eventHandler(async () => {
  const data = await useStorage('assets:server').getItem(`healthpage.html`);
  return data;
});
