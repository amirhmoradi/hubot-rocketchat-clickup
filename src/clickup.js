'use strict'

// Description:
//   Clickup Task Previews and Details in Rocket.Chat, based on Hubot.
//   Supports multiple clickup accounts and multiple task patterns 
//   (ex: ABC-123 from Clickup-A and XYZ-987 from Clickup-B and LMN-456 from Clickup-A...)
// 
// Dependencies:
//   none
// 
// Configuration:
//   # Note: TASK_PATTERN & API_BASE are OPTIONAL.
//   CLICKUP_SETTINGS=[
//     { "BOT_ALIAS": "ABC Task Bridge Bot",
//       "BOT_AVATAR": "https://clickup.com/landing/images/clickup-logo-gradient.png",
//       "CUSTOM_KEY": "ABC", 
//       "TASK_PATTERN": "(ABC-(\\d{1,10})(\\[\\w+\\])?)",
//       "TEAM_ID": "00000000", 
//       "API_TOKEN": "pk_00000000_ABCDEFGHIJKLMNOPQRSTVWXYZ",
//       "API_BASE": "https://api.clickup.com/api/v2/task",
//       "INCLUDE_SUBTASKS": true
//       "REPLY_IN_THREAD": false
//     },
//     { "CUSTOM_KEY": "XYZ", 
//       "TEAM_ID": "11111111", 
//       "API_TOKEN": "pk_11111111_ABCDEFGHIJKLMNOPQRSTVWXYZ",
//       "REPLY_IN_THREAD": false
//     }
//   ]
//
// Commands:
//   <CLICKUP_CUSTOM_KEY-#ID> - Replies with Clickup Task Details and description.
// 
// Notes:
//   The script show only the First Assignee for a given task.
//   The script manages multiple tasks in messages.
//   The script uses by default the official clickup logo as its avatar from the clickup website.
// 
// Author:
//   Amir Moradi <https://amirhmoradi.com>

module.exports = function (robot) {
  const CLICKUP_BOT_ALIAS_DEFAULT = process.env.CLICKUP_BOT_ALIAS_DEFAULT || "Clickup Bridge";
  const CLICKUP_BOT_AVATAR_DEFAULT = process.env.CLICKUP_BOT_AVATAR_DEFAULT || "https://clickup.com/landing/images/clickup-logo-gradient.png";
  const CLICKUP_API_BASE_DEFAULT = process.env.CLICKUP_API_BASE_DEFAULT || "https://api.clickup.com/api/v2/task";

  if( typeof process.env.CLICKUP_SETTINGS !== "undefined" ) {
    var CLICKUP_SETTINGS = JSON.parse(process.env.CLICKUP_SETTINGS) || [];
  }

  // Backward compatibility
  if ( typeof process.env.CLICKUP_API_TOKEN !== "undefined" ){
    CLICKUP_SETTINGS.push({
      BOT_ALIAS: process.env.CLICKUP_BOT_ALIAS || CLICKUP_BOT_ALIAS_DEFAULT,
      BOT_AVATAR: process.env.CLICKUP_BOT_AVATAR || CLICKUP_BOT_AVATAR_DEFAULT,
      TEAM_ID: process.env.CLICKUP_TEAM_ID,
      API_TOKEN: process.env.CLICKUP_API_TOKEN,
      CUSTOM_KEY: process.env.CLICKUP_CUSTOM_KEY,
      get TASK_PATTERN(){
        return process.env.CLICKUP_TASK_PATTERN || "("+this.CUSTOM_KEY+"-(\\d{1,10})(\\[\\w+\\])?)";
      },
      API_BASE: process.env.CLICKUP_API_BASE || CLICKUP_API_BASE_DEFAULT,
      INCLUDE_SUBTASKS: process.env.CLICKUP_INCLUDE_SUBTASKS && true,
      REPLY_IN_THREAD: process.env.CLICKUP_REPLY_IN_THREAD || false,
    });
  }
  
  const getClickupDetailsMessage = (reference_message,custom_task_id, CLICKUP_SETTING) => {    
      let CLICKUP_API_URL = CLICKUP_SETTING.API_BASE+"/"+custom_task_id+"/?custom_task_ids=true&team_id="+CLICKUP_SETTING.TEAM_ID+"&include_subtasks="+CLICKUP_SETTING.INCLUDE_SUBTASKS;
      // wrap with promise
      new Promise((resolve, reject) => 
          robot.http(CLICKUP_API_URL)
                .header('Accept', 'application/json')
                .header('Authorization', CLICKUP_SETTING.API_TOKEN)
                .get()((err, response, body) => {
                  (err || response.statusCode !== 200) ? reject(err) : resolve(body)
                })
      )
      // parse to js object
      .then(body => JSON.parse(body))
      .then(body => {
          robot.adapter.callMethod('setReaction', ':robot:', reference_message.message.id);
          const resp = {
              "tmid" : CLICKUP_SETTING.REPLY_IN_THREAD ? reference_message.message.id : null,
              "alias": CLICKUP_SETTING.BOT_ALIAS,
              "avatar": CLICKUP_SETTING.BOT_AVATAR,
              "attachments": [{
                    "color": "#ff0000",
                    "text": `[${body.name}](${body.url})`,
                    "title": `${body.custom_id} Details`,
                    "fields": [{
                      "short": true,
                      "title": "Status",
                      "value": `**${body.status.status}**`
                    },{
                      "short": true,
                      "title": "List",
                      "value": `**${body.list.name}**`
                    },{
                      "short": true,
                      "title": "First Assignee",
                      "value": `**@${body.assignees[0].username}**`
                    },{
                      "short": true,
                      "title": "Priority",
                      "value": `**${body.priority}**`
                    }]
              },{
                  "color": "#ff0000",
                  "title": `${body.custom_id} Description`,
                  "collapsed": true,
                  "fields": [{
                      "short": false,
                      "title": "Description",
                      "value": body.description
                },]
          }]
        };
        reference_message.send(resp);
      })
      .catch((err) => {
          reference_message.send({
              "alias": CLICKUP_SETTING.BOT_ALIAS,
              "avatar": CLICKUP_SETTING.BOT_AVATAR,
              "title": CLICKUP_SETTING.BOT_ALIAS + " Error",
              "msg":"Not even Chuck Norris can deal with this one!. (Error: " + err + ", Task: "+custom_task_id+")", 
              "tmid" : CLICKUP_SETTING.REPLY_IN_THREAD ? reference_message.message.id : null
          })
      });
  }

  CLICKUP_SETTINGS.forEach((CLICKUP_SETTING, CLICKUP_SETTING_IDX) => {
    CLICKUP_SETTING.TASK_PATTERN = CLICKUP_SETTING.TASK_PATTERN || "("+CLICKUP_SETTING.CUSTOM_KEY+"-(\\d{1,10})(\\[\\w+\\])?)";
    CLICKUP_SETTING.TASK_HEAR_REGEX = new RegExp(CLICKUP_SETTING.TASK_PATTERN,"gi");
    CLICKUP_SETTING.API_BASE = CLICKUP_SETTING.API_BASE || CLICKUP_API_BASE_DEFAULT;
    CLICKUP_SETTING.INCLUDE_SUBTASKS = (CLICKUP_SETTING.INCLUDE_SUBTASKS && true);
    CLICKUP_SETTING.BOT_ALIAS = CLICKUP_SETTING.BOT_ALIAS || CLICKUP_BOT_ALIAS_DEFAULT;
    CLICKUP_SETTING.BOT_AVATAR = CLICKUP_SETTING.BOT_AVATAR || CLICKUP_BOT_AVATAR_DEFAULT;

    robot.hear(CLICKUP_SETTING.TASK_HEAR_REGEX, function(msg) {
      msg.match.forEach((element, index, array) => {
          getClickupDetailsMessage(msg,element.toUpperCase(),CLICKUP_SETTING);
      })
  })
  });
}