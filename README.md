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

2. develop.

```sh
yarn dev
```

3. run (production).

```sh
yarn start
```
