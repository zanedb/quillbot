const { guildId } = require(`../config${
  process.env.ENVIRONMENT === 'dev' ? '.dev' : ''
}.json`)

module.exports = {
  name: 'archive',
  description: 'archive channel',
  adminRequired: true,
  argsRequired: false,
  async execute(message, args) {
    guild = message.client.guilds.cache.get(guildId)

    let category = guild.channels.cache.find(
      (c) => c.name.toLowerCase().includes('archive') && c.type == 'category'
    )
    if (!category) {
      return message.channel.send('make a category called archive first!')
    }
    if (message.channel.parent === category) {
      return message.channel.send(
        'this channel has already been archived, silly!'
      )
    }

    // set topic, name, category
    if (!message.channel.topic) {
      await message.channel.setTopic(`previously: #${message.channel.name}`)
    }
    await message.channel.setName(
      'to-' +
        message.channel.name.split('-')[0] +
        '-from-' +
        message.channel.parent.name.replace('+', '')
    )
    await message.channel.setParent(category.id)

    return message.react('✅')
  },
}
