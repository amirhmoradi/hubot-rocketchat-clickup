# hubot-rocketchat-clickup

A Hubot script to add Clickup Task Previews and Details in Rocket.Chat.  


/!\ **Note: This scripts works only for clickup business with custom task ids.**

## See `docker-compose.yml` for example usage.

## Installation

Add **hubot-rocketchat-clickup** to your `EXTERNAL_SCRIPTS` OR `external-scripts.json`:

```json
[
  "hubot-rocketchat-clickup"
]
```

### Obtain a [Clickup API token](https://jsapi.apiary.io/apis/clickup20/introduction/authentication.html)

Copy your token to the `CLICKUP_API_TOKEN` environment variable.

```
export CLICKUP_API_TOKEN=<your token>
```

### Obtain your Clickup Team ID

Copy your team id to the `CLICKUP_TEAM_ID` environment variable.
You can find the team id in clickup task links. 
For example, in your clickup account's homepage:
https://app.clickup.com/00000000/home

The `00000000` would be your team id.

```
export CLICKUP_TEAM_ID=<your team id>
```

### Set your custom task id key

On clickup business, you can set custom task ids by defining a prefix key.

```
export CLICKUP_CUSTOM_KEY=<your custom task id key>
```

### Set reply style

If your want your bot to reply in threads and not on the main room (or direct message to user), set the following:

```
export CLICKUP_REPLY_IN_THREAD=true
```

## Sample Interaction

```
user1> I have worked on task ABC-123
hubot> Clickup Bridge
       ABC-123 Details
	   Send User Welcome Email

	   Status				List
	   in progress			Sprint 2 (1/1/22 - 14/1/22)
	   
	   First Assignee		Priority
	   @amirhmoradi			high

       ABC-123 Description:
	   The user shall receive a welcome email on account creation.
```