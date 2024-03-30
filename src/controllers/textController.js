const fct = require('../util/fct.js');

const commands = require('../const/commands.js');
const patchnotes = require('../const/patchnotes.js');
const faqs = require('../const/faq.js');
const termsAndConditions = require('../const/termsAndConditions.js');
const privacyPolicy = require('../const/privacyPolicy.js');

exports.getTexts = async (req, res, next) => {
  try {
    //console.log('AAA', footerJs);
    res.send({commands:commands,patchnotes:patchnotes,faqs:faqs,termsAndConditions:termsAndConditions,privacyPolicy:privacyPolicy});
  } catch (e) {
    console.log(e);
    res.send(fct.apiResponseJson([],'Could not get guildchannel by guildId.'));
  }
}
