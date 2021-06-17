const { MessageEmbed } = require('discord.js')
const { prefix } = require('../config.json')

module.exports = {
  name: 'reload',
  description: 'reload a command',
  adminRequired: true,
  argsRequired: true,
  usage: '<command name>',
  execute(message, args) {
    const commandName = args[0].toLowerCase()

    // append -f (or --force) to force reload
    let force = false
    if (args[1])
      force =
        args[1].toLowerCase() === '--force' || args[1].toLowerCase() === '-f'

    // search for command (or ignore if forced)
    const command = !force
      ? message.client.commands.get(commandName) ||
        message.client.commands.find(
          (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
        )
      : { name: commandName }
    if (!command) {
      return message.channel.send(
        new MessageEmbed({
          description: `couldn't find command with name or alias \`${commandName}\`. if you've just added it, run \`${prefix}reload ${commandName} --force\` to force.`,
        })
      )
    }

    // reload command files
    delete require.cache[require.resolve(`./${command.name}.js`)]
    try {
      const newCommand = require(`./${command.name}.js`)
      message.client.commands.set(newCommand.name, newCommand)
      message.react('👌')
    } catch (error) {
      console.log(error)
      message.channel.send(
        new MessageEmbed({
          description: `an error occurred while reloading \`${prefix}${command.name}\`:\n\`${error.message}\``,
        })
      )
    }
  },
}
