const localApi = require('../../local/api.js');
const fct = require('../../../fct.js');

exports.getByType = (type) => {
  return new Promise(async function (resolve, reject) {
    try {
      const conditions = {type: type};
      const products = await localApi.getMulti('gl_product',conditions,0,10000);

      resolve(products);
    } catch (e) { reject(e); }
  });
}

exports.getHighestActiveSupporterSubscription = (userId,products) => {
  const userProducts = products.filter(prod => prod.typeid == userId);
  if (userProducts.length == 0)
    return null;

  const activeUserProducts = exports.filterActiveProducts(userProducts);
  if (activeUserProducts.length == 0)
    return null;

  const activeSupporterSubscriptions = activeUserProducts.filter(prod => prod.plan.startsWith('supporter'));
  activeSupporterSubscriptions.sort(
    function(a,b) {return (a.plan < b.plan) ? 1 : ((b.plan < a.plan) ? -1 : 0);}
  );
  if (activeSupporterSubscriptions.length == 0)
    return null;

  return activeSupporterSubscriptions[0];
}

exports.filterActiveProducts = (products) => {
  let activeProducts = [],compareDate;
  const nowDate = new Date();

  for (product of products) {
    compareDate = new Date(product.until);
    if (!fct.isDateInThePast(compareDate,nowDate))
      activeProducts.push(product);
  }

  return activeProducts;
}
