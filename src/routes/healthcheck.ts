export default eventHandler(async () => {
  const data = await useStorage('assets:server').getItem('main.html');
  return data;
});
