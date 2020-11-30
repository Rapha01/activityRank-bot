exports.noSubcommand = 'Please specify the subcommand. Type ``<prefix>help`` for more information.';
exports.invalidSubcommand = 'Invalid subcommand. Type ``<prefix>help`` for more information.';
exports.tooFewArguments = 'Too few arguments. Type ``<prefix>help`` for more information.';
exports.invalidArgument = 'Invalid argument. Type ``<prefix>help`` for more information.';
exports.invalidId = 'Invalid id. Type ``<prefix>help`` for more information.';
exports.memberNotFound = 'Member not found.';
exports.userNotFound = 'User not found.';
exports.activeStatCommandCooldown = (cd,toWait) => {
  return 'You can use stat commands only once per ' + cd + ' seconds, please wait ' + Math.ceil(toWait) + ' more seconds. ';
}
exports.activeResetServerCommandCooldown = (cd,toWait) => {
  return 'You can start a server reset only once every ' + cd  + ' seconds, please wait ' + Math.ceil(toWait) + ' more seconds.';
}
exports.premiumLowersCooldown = 'You can significantly lower this cooldown by using tokens to activate premium time for your server. You can find further info about it here: https://activityrank.me/premium. ';
