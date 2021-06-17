const fs = require('fs')
const Discord = require('discord.js')
const btoa = require('btoa')
const fetch = require('node-fetch')
const { isValidPhoneNumber, parsePhoneNumber } = require('libphonenumber-js')
const {
  TOKEN,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  ENVIRONMENT,
} = process.env
const { prefix, guildId } = require(`./config${
  ENVIRONMENT === 'dev' ? '.dev' : ''
}.json`)

const client = new Discord.Client()
let guild

client.commands = new Discord.Collection()
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'))
for (const file of commandFiles) {
  const command = require(`./commands/${file}`)
  client.commands.set(command.name, command)
}

client.on('ready', async () => {
  guild = client.guilds.cache.get(guildId)
  client.user.setPresence({
    activity: { type: 'LISTENING', name: `${prefix}help` },
  })
  console.log(`logged in as ${client.user.tag}!`)
})

client.on('message', async (message) => {
  if (message.author.bot || message.channel.type !== 'text') {
    return
  }

  // if it's not a command + it's in a phone number channel, send a message!
  if (
    !message.content.startsWith(prefix) &&
    isValidPhoneNumber('+' + message.channel.name.split('-')[0])
  ) {
    // validate number in channel category
    if (!isValidPhoneNumber(message.channel.parent.name)) {
      message.channel.send(
        'invalid from number - check your channel category name? does it have a +?'
      )
      return
    }

    // send message
    const phone = parsePhoneNumber('+' + message.channel.name.split('-')[0])
    const req = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        headers: {
          Authorization: `Basic ${btoa(
            `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
          )}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        body: new URLSearchParams({
          Body: message.cleanContent,
          To: phone.number,
          From: message.channel.parent.name,
        }),
      }
    )

    // error handling
    if (!req.ok) {
      message.channel.send('an error occurred while sending that.. :(')
    }

    return //message.react('✅')
  }

  if (!message.content.startsWith(prefix)) return

  // process command name
  const args = message.content.slice(prefix.length).split(/ +/)
  const commandName = args.shift().toLowerCase()
  const command =
    client.commands.get(commandName) ||
    client.commands.find(
      (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
    )
  if (!command) return message.react('❌')

  // inform user if arguments aren't provided
  if (command.argsRequired && !args.length) {
    const argsMissingEmbed = new Discord.MessageEmbed({
      description: `that command looks incomplete ):`,
    })
    if (command.usage) {
      argsMissingEmbed.setDescription(
        `usage: \`${prefix}${command.name} ${command.usage}\``
      )
    }
    return message.channel.send(argsMissingEmbed)
  }

  // finally, execute the command
  try {
    command.execute(message, args)
  } catch (error) {
    console.error(error)
    message.channel.send(
      new Discord.MessageEmbed({
        description: 'something went wrong ):',
      })
    )
  }
})

client.login(TOKEN)
