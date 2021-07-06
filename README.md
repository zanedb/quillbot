# quillbot

## permissions

needs a lot idk, maybe just give it admin

url for that: https://discord.com/oauth2/authorize?scope=bot+applications.commands&client_id=854922519181525012&permissions=8

## setup

1. install packages.

```sh
cd quillbot
yarn
```

2. create a file named `.env` and enter values for the following:

```sh
# discord bot token
TOKEN=
# twilio credentials
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
# endpoint URL
# this is IMPORTANT! requests will blindly fail without it
ENDPOINT_URL=
# 'dev' or 'prod'
ENVIRONMENT=
```

3. develop.

```sh
yarn dev
```

4. run (production).

```sh
yarn start
```

## operation

this bot has two modes, depending on whichever server hosting setup is easier for you. (they can technically be used in conjunction. but i don't know why you would lol. just use one..)

### 1. express

the bot runs a local express server (which you're expected to expose) with a `/hook/sms` endpoint. you feed this into twilio, messages come directly in. this method has the lowest latency but running your own express server is often tedious and resource consuming. with that in mind..

### 2. vercel

you deploy [quill-receiver](https://github.com/zanedb/quill-receiver) on vercel, then have twilio point to that `/hook/sms` endpoint instead. upon receiving a message, it relays the raw request data to an `#incoming` discord channel, then the bot processes and sends the message appropriately. this is a bit hacky but it works and will likely save me some money.

<details>
  <summary><strong>you may wonder:</strong> why not just have vercel process and deliver the message to the correct channel? or better yet, deploy the bot on vercel!</summary>
  <br/>
  
  *not so fast..*
  1. vercel just cannot run discord bots, we've tried. this is because 
  2. there's a limit to how long serverless functions can run for, and 
  3. because of the prior reasons i'd have to resort to a database or something and that'd be super messy.

</details>
