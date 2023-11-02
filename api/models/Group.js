const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Assure que le nom du groupe est unique
  },
  // Ajoutez d'autres champs au besoin
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
