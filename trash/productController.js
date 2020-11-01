const fct = require('../fct.js');
//const productModel = require('../models/managerDb/wh_productModel.js');
const request = require('request');
const mysql = require('promise-mysql');

exports.paypalIpn = async (req, res, next) => {
  try {
    console.log('Receiving Paypal IPN.');
    await res.status(200).send('OK');
    await res.end();

    const isValidated = await paypalIpnValidate(req.body);

    if (!isValidated) {
      console.log('Paypal IPN Invalid.');
      return;
    }
    console.log('Paypal IPN validated.');
    console.log(req.body);

    if (req.body.txn_type == 'subscr_payment')
      await handlePaypalSupporterSubscriberPayment(req.body);

    console.log('Paypal IPN processing finished.');

  } catch (e) {console.log(e);}
}

function handlePaypalSupporterSubscriberPayment(body) {
  return new Promise(async function (resolve, reject) {
    try {
      console.log('AAA',body.payment_status,body.mc_currency);

      const userId = mysql.escape(body.option_selection2).substr(1).slice(0, -1);
      let plan = mysql.escape(body.option_selection1).substr(1).slice(0, -1);
      const amount = body.mc_gross;

      if (body.payment_status != 'Completed')
        return resolve();

      if (body.mc_currency != 'EUR')
        return resolve();

      const test = 'test';

      console.log(test,amount,plan,userId);
      if (amount == '5.00' && plan == 'Supporter Level I') {
        plan = 'supporter1';
      } else if (amount == '10.00' && plan == 'Supporter Level II') {
        plan = 'supporter2';
      } else if (amount == '25.00' && plan == 'Supporter Level III') {
        plan = 'supporter3';
      } else
        return resolve();

      console.log('Suppsub!!!!! ' + amount + '€!!!');
      await productModel.insert('product',{type: 'user',typeid: userId,plan: plan});

      const nowDate = new Date();
      const inAMonthDate = new Date(nowDate.setMonth(nowDate.getMonth()+1));

      await productModel.insert('paypal',body.txn_id,inAMonthDate.toISOString().slice(0, 19).replace('T', ' '));

    } catch (e) {console.log(e);}
  });
}

function paypalIpnValidate(body) {
  return new Promise(async function (resolve, reject) {
    let paypalURL;

    if (typeof body.test_ipn == 'undefined' || body.test_ipn == 0)
      paypalURL = 'https://ipnpb.paypal.com/cgi-bin/webscr';
    else
      paypalURL = 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr';

    // Prepend 'cmd=_notify-validate' flag to the post string
    let postreq = 'cmd=_notify-validate';

    // Iterate the original request payload object
    // and prepend its keys and values to the post string
    Object.keys(body).map((key) => {
      postreq = `${postreq}&${key}=${body[key]}`;
      return key;
    });

    const options = {
      url: paypalURL,
      method: 'POST',
      headers: {
        'Content-Length': postreq.length,
      },
      encoding: 'utf-8',
      body: postreq
    };

    // Make a post request to PayPal
    //const resp = await fetch(paypalURL, options);

    request(options, (error, response, resBody) => {
      if (error || response.statusCode !== 200) {
        reject(new Error(error));
        return;
      }
      // Validate the response from PayPal and resolve / reject the promise.
      if (resBody.substring(0, 8) === 'VERIFIED')
        resolve(true);
      else if (resBody.substring(0, 7) === 'INVALID')
        resolve(false);
      else
        resolve(false);
    });
  });
}

// dpeAS4fj345EGeKf
