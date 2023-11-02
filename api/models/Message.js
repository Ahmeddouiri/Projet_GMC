const mongoose = require('mongoose');

const moment = require('moment');
const datemsg = moment().format("DD-MM-YYYY - HH:mm");
const MessageSchema = new mongoose.Schema({

  sender: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  recipient: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  text: String,
  timeadd: { type: String, default:datemsg },


}, {timestamps:true});

const MessageModel = mongoose.model('Message', MessageSchema);

module.exports = MessageModel;