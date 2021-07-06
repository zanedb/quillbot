const { MessageEmbed } = require('discord.js')
const { incoming } = require(`../config${
  process.env.ENVIRONMENT === 'dev' ? '.dev' : ''
}.json`)

module.exports = {
  name: 'operation',
  aliases: ['mode'],
  description: 'list mode of operation',
  adminRequired: true,
  argsRequired: false,
  async execute(message, args) {
    return message.channel.send(
      new MessageEmbed().setDescription('current status:').addFields(
        {
          name: 'vercel',
          value: incoming.vercel.enabled ? 'enabled' : 'disabled',
        },
        {
          name: 'express',
          value: incoming.express.enabled ? 'enabled' : 'disabled',
        }
      )
    )
  },
}
