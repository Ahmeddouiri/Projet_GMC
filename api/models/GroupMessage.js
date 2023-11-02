const mongoose = require('mongoose');
const moment = require('moment');
const datemsg = moment().format("DD-MM-YYYY - HH:mm");
// Définir le schéma du modèle GroupMessage
const groupMessageSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  timeadd: { type: String, default:datemsg },
  
}, {timestamps:true});

// Créer le modèle GroupMessage à partir du schéma
const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);

module.exports = GroupMessage;
