const Discord = require('discord.js')
const express = require('express')
const twilio = require('twilio')
const fs = require('fs')
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

const app = express()
const PORT = process.env.PORT || 3000
app.use(express.urlencoded({ extended: false }))

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
const MessagingResponse = twilio.twiml.MessagingResponse

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
    const msg = await twilioClient.messages.create({
      body: message.cleanContent,
      from: message.channel.parent.name,
      to: phone.number,
    })

    // error handling
    if (msg.status === 'failed') {
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

app.post('/hook/sms', twilio.webhook(), async (req, res) => {
  const response = new MessagingResponse()

  // don't log message if it's not to a number that's already in the discord
  const category = guild.channels.cache.find(
    (c) => c.name.toLowerCase().includes(req.body.To) && c.type == 'category'
  )
  if (!category) return

  // find channel, create it if it doesn't exist
  let channel = guild.channels.cache.find(
    (c) =>
      c.name.toLowerCase().includes(req.body.From.replace('+', '')) &&
      c.type == 'text'
  )
  if (!channel) {
    channel = guild.channels.create(req.body.From.replace('+', ''), {
      parent: category,
    })
  }

  // beautify phone number
  let from = parsePhoneNumber(req.body.From)
  if (from) from = from.formatNational()

  // fetch webhook, create it if it doesn't exist
  const hooks = await channel.fetchWebhooks()
  let hook
  console.log(hooks)
  if (hooks.size > 0) {
    hook = hooks.first()
  } else {
    hook = await channel.createWebhook(from || req.body.From, {
      avatar: 'https://i.imgur.com/DbZhTBP.png',
    })
  }

  // send the message!
  hook.send(req.body.Body, {
    username: from || req.body.From,
    avatarURL: 'https://i.imgur.com/DbZhTBP.png',
  })

  // return the request
  res.set('Content-Type', 'text/xml')
  res.send(response.toString())
})

// this is only here for testing
app.get('/hook/sms', (req, res) => {
  res.status(400).json({ error: 'send a POST request' }).end()
})

app.listen(PORT, () => console.log(`express running on port ${PORT}`))
