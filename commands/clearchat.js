module.exports = {
  name: 'clearchat',
  aliases: ['clear'],
  description: 'clear chat',
  adminRequired: true,
  argsRequired: false,
  async execute(message, args) {
    const confirmation = await message.reply(
      'are you sure? react to confirm you want to DELETE ALL MESSAGES IN THIS CHANNEL!'
    )
    await confirmation.react('☑️')

    confirmation
      .awaitReactions(
        (reaction, user) =>
          user.id == message.author.id && reaction.emoji.name == '☑️',
        { max: 1, time: 15000 }
      )
      .then(async (collected) => {
        if (collected.size > 0 && collected.first().emoji.name == '☑️') {
          let fetched
          do {
            fetched = await message.channel.messages.fetch({ limit: 100 })
            message.channel.bulkDelete(fetched)
          } while (fetched.size >= 2)
        } else {
          await confirmation.reactions.removeAll()
          confirmation.edit('timed out. not deleting messages.')
        }
      })
  },
}
