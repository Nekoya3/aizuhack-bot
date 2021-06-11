const line = require('@line/bot-sdk');
const crypto = require('crypto');
const config = require('./config').index();
const messageFunc = require('./event/message');
const unsendFunc = require('./event/unsend');
const postbackFunc = require('./event/postback');
const joinFunc = require('./event/join');
const leaveFunc = require('./event/leave');
const followFunc = require('./event/follow');

const client = new line.Client(config);

exports.index = (req, res) => {
  console.log(req.body.events);

  // 署名検証
  const signature = crypto.createHmac('sha256', process.env.CHANNELSECRET).update(req.body).digest('base64');
  const checkHeader = (req.headers || {})['X-Line-Signature'];

  const { events } = req.body;
  let message;
  if (signature === checkHeader) {
    events.forEach(async (event) => {
      switch (event.type) {
        case 'message': {
          message = await messageFunc.index(event);
          break;
        }
        case 'unsend': {
          message = await unsendFunc.index(event);
          break;
        }
        case 'postback': {
          message = await postbackFunc.postback(event);
          break;
        }
        case 'join': {
          message = joinFunc.join(event);
          break;
        }
        case 'leave': {
          leaveFunc.leave(event);
          break;
        }
        case 'follow': {
          followFunc.follow(event, client);
          break;
        }
        default:
          break;
      }
      if (message !== undefined) {
        console.log(`message: ${JSON.stringify(message)}`);
        client.replyMessage(event.replyToken, message)
          .then((response) => {
            res.json(response);
          }).catch((err) => console.log(`${JSON.stringify(message)}\n\n\n${err}`));
      }
    });
  } else {
    console.log('署名認証エラー');
  }
};