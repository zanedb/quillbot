const Discord = require('discord.js')
const express = require('express')
const twilio = require('twilio')
const fs = require('fs')
const extName = require('ext-name')
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
  // ignore bot/non-text channel messages
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
      return message.channel.send(
        'invalid from number - check your channel category name? does it have a +?'
      )
    }

    // build message (include attachments if supplied)
    const phone = parsePhoneNumber('+' + message.channel.name.split('-')[0])
    const outgoingMsg = {
      body: message.cleanContent,
      from: message.channel.parent.name,
      to: phone.number,
    }
    if (message.attachments.size > 0) {
      outgoingMsg.mediaUrl = message.attachments.first().url
      if (message.attachments.size > 1) {
        message.channel.send('*(note: only sending the first attachment)*')
      }
    }

    // send message
    const msg = await twilioClient.messages.create(outgoingMsg)

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
  if (!category) return res.send(response.toString())

    // find channel, create it if it doesn't exist
    let channel = guild.channels.cache.find(
      (c) =>
        c.name.toLowerCase().includes(req.body.From.replace('+', '')) &&
      c.type == 'text' &&
      c.parent === category
    )
    if (!channel) {
    channel = await guild.channels.create(req.body.From.replace('+', ''), {
        parent: category,
      })
    }

    // beautify phone number
    let from = parsePhoneNumber(req.body.From)
    if (from) from = from.formatNational()

    // fetch webhook, create it if it doesn't exist
    const hooks = await channel.fetchWebhooks()
    let hook
    if (hooks.size > 0) {
      hook = hooks.first()
    } else {
      hook = await channel.createWebhook(from || req.body.From, {
        avatar: 'https://i.imgur.com/DbZhTBP.png',
      })
    }

    // build message
    const incomingMsg = {
      username: from || req.body.From,
      avatarURL: 'https://i.imgur.com/DbZhTBP.png',
      files: [],
    }

    // get attachment URLs if they exist
    if (req.body.NumMedia !== '0') {
      for (let i = 0; i < req.body.NumMedia; i++) {
        const extension = extName.mime(req.body[`MediaContentType${i}`])[0].ext
        const url = req.body[`MediaUrl${i}`]
        incomingMsg.files.push({ attachment: url, name: url + '.' + extension })
      }
    }

  try {
    // send the message!
    hook.send(req.body.Body, incomingMsg)
  } catch (err) {
    console.error(err)
    channel.send('could not deliver incoming message to discord :(')
  }

    // return the request
  return res.send(response.toString())
})

// this is only here for testing
app.get('/hook/sms', (req, res) => {
  res.status(400).json({ error: 'send a POST request' }).end()
})

app.listen(PORT, () => console.log(`express running on port ${PORT}`))
