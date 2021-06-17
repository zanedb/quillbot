const { guildId } = require(`../config${
  process.env.ENVIRONMENT === 'dev' ? '.dev' : ''
}.json`)

/* 
  NOTE FOR !archive AND !unarchive
  DISCORD RATE LIMITS ONLY ALLOW 2 NAME/TOPIC CHANGES PER 10 MINUTES
  IF THESE FAIL, THAT IS WHY. GIVE IT TIME :)
*/

module.exports = {
  name: 'unarchive',
  description: 'unarchive channel',
  adminRequired: true,
  argsRequired: false,
  async execute(message, args) {
    guild = message.client.guilds.cache.get(guildId)
    const from = message.channel.name.split('-')[3],
      to = message.channel.name.split('-')[1]

    let category = await guild.channels.cache.find(
      (c) => c.name.toLowerCase().includes(from) && c.type == 'category'
    )
    if (!category) {
      return message.channel.send(
        `couldn't find a matching category.. add one with the from number?`
      )
    }
    if (message.channel.parent === category) {
      return message.channel.send(`this channel hasn't been archived, dummy!`)
    }

    // set topic, name, category
    if (message.channel.topic === `previously: #${to}`) {
      await message.channel.setTopic(null)
    }
    await message.channel.setName(to)
    await message.channel.setParent(category.id)

    return message.react('✅')
  },
}
