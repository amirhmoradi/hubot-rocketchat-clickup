"use strict";
// Description:
//   Clickup Task Previews and Details in Rocket.Chat, based on Hubot.
// 
// Dependencies:
//   none
// 
// Configuration:
//   CLICKUP_TEAM_ID=00000000
//   CLICKUP_API_TOKEN=pk_00000000_ABCDEFGHIJKLMNOPQRSTVWXYZ
//   CLICKUP_API_BASE=https://api.clickup.com/api/v2/task
//   CLICKUP_CUSTOM_KEY=ABC
//   CLICKUP_TASK_PATTERN=(ABC-(\\d{1,10})(\\[\\w+\\])?)
//   CLICKUP_REPLY_IN_THREAD=true
// 
// Commands:
//   <CLICKUP_CUSTOM_KEY-#ID> - Replies with Clickup Task Details and description.
// 
// Notes:
//   The script show only the First Assignee for a given task.
//   The script manages multiple tasks in messages.
//   The script uses the official clickup logo as its avatar from the clickup website.
// 
// Author:
//   Amir Moradi <https://amirhmoradi.com>

module.exports = function (robot) {
    const CLICKUP_TEAM_ID = process.env.CLICKUP_TEAM_ID;
    const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN;
    const CLICKUP_CUSTOM_KEY = process.env.CLICKUP_CUSTOM_KEY;

    const CLICKUP_TASK_PATTERN = process.env.CLICKUP_TASK_PATTERN || "("+CLICKUP_CUSTOM_KEY+"-(\\d{1,10})(\\[\\w+\\])?)";
    const CLICKUP_TASK_HEAR_REGEX = new RegExp(CLICKUP_TASK_PATTERN,"gi");

    const CLICKUP_API_BASE = process.env.CLICKUP_API_BASE || "https://api.clickup.com/api/v2/task";

    const CLICKUP_REPLY_IN_THREAD = process.env.CLICKUP_REPLY_IN_THREAD || false;

    const getClickupDetailsMessage = (reference_message,reply_in_thread=false,custom_task_id,team_id,api_token) => {    
        let CLICKUP_API_URL = CLICKUP_API_BASE+"/"+custom_task_id+"/?custom_task_ids=true&team_id="+team_id+"&include_subtasks=true";
        // wrap with promise
        new Promise((resolve, reject) => 
            robot.http(CLICKUP_API_URL)
                 .header('Accept', 'application/json')
                 .header('Authorization', api_token)
                 .get()((err, response, body) => {
                    (err || response.statusCode !== 200) ? reject(err) : resolve(body)
                 })
        )
        // parse to js object
        .then(body => JSON.parse(body))
        .then(body => {
            robot.adapter.callMethod('setReaction', ':robot:', reference_message.message.id);
            const resp = {
                "tmid" : reply_in_thread ? reference_message.message.id : null,
                "alias": "Clickup Bridge",
                "avatar": "https://clickup.com/landing/images/clickup-logo-gradient.png",
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
                "alias": "Clickup Bridge",
                "avatar": "https://clickup.com/landing/images/clickup-logo-gradient.png",
                "title": "Clickup Bridge Title",
                "msg":"Not even Chuck Norris can deal with this one!. (Error: " + err + ", Task: "+custom_task_id+")", 
                "tmid" : reply_in_thread ? reference_message.message.id : null
            })
        });
    };

    robot.hear(CLICKUP_TASK_HEAR_REGEX, function(msg) {
        msg.match.forEach((element, index, array) => {
            getClickupDetailsMessage(msg,CLICKUP_REPLY_IN_THREAD,element.toUpperCase(),CLICKUP_TEAM_ID,CLICKUP_API_TOKEN);
        })
    });
};