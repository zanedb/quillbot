const { MessageEmbed } = require('discord.js')
const { prefix } = require('../config.json')

module.exports = {
  name: 'help',
  description: 'list all commands or info about a specific command',
  aliases: ['commands', 'h'],
  usage: '[command name]',
  execute(message, args) {
    const { commands } = message.client
    const isAdmin = message.member.hasPermission('ADMINISTRATOR')

    // default (no args supplied): list commands
    if (!args.length) {
      const helpEmbed = new MessageEmbed()
        .setAuthor(
          message.guild.me.nickname || message.client.user.username,
          message.client.user.avatarURL()
        )
        .setDescription("i'm a twilio relay bot!")
        .addFields(
          {
            name: 'available commands',
            value:
              // list certain commands for admins only
              (isAdmin
                ? commands
                    .map((command) =>
                      command.adminRequired
                        ? `__${command.name}__`
                        : command.name
                    )
                    .join(', ')
                : commands
                    .filter((command) => !command.adminRequired)
                    .map((command) => command.name)
                    .join(', ')) +
              (isAdmin ? ' _(__underlined__ = admin command)_' : ''),
          },
          {
            name: 'specific command help',
            value: `use \`${prefix}help [command name]\` for info on a specific command.`,
          }
        )
      return message.channel.send(helpEmbed)
    }

    // if args supplied, search for requested command
    const name = args[0].toLowerCase()
    const command =
      commands.get(name) ||
      commands.find((c) => c.aliases && c.aliases.includes(name))

    // if command doesn't exist (or user doesn't have permission), let them know
    if (
      !command ||
      (command.adminRequired && !message.member.hasPermission('ADMINISTRATOR'))
    ) {
      return message.channel.send(
        new MessageEmbed({ description: 'invalid command' })
      )
    }

    // generate embed for specific help command
    const specificCommandHelpEmbed = new MessageEmbed().setTitle(
      `${prefix}${command.name}`
    )
    const fields = []
    if (command.description)
      fields.push({ name: 'description', value: command.description })
    if (command.aliases)
      fields.push({ name: 'aliases', value: command.aliases.join(', ') })
    if (command.usage)
      fields.push({
        name: 'Usage',
        value: `${prefix}${command.name} ${command.usage}`,
      })
    specificCommandHelpEmbed.addFields(fields)

    message.channel.send(specificCommandHelpEmbed)
  },
}
