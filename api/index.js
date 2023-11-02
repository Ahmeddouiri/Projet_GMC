const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Message = require('./models/Message');
const ws = require('ws');
const GroupMessage = require('./models/GroupMessage');
const Group = require('./models/Group');
const moment = require('moment');

dotenv.config();
mongoose.connect(process.env.MONGO_URL, (err) => {
  if (err) throw err;
});
mongoose.set('strictQuery', true);
const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);
const app = express();
//app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: "http://localhost:5173",
}));
const port = process.env.PORT;


async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    } else {
      reject('no token');
    }
  });

}

app.get('/test', (req, res) => {
  res.json('test ok');
});

app.get('/messages/:userId', async (req, res) => {
  const { userId } = req.params;
  const userData = await getUserDataFromRequest(req);
  const ourUserId = userData.userId;
  const messages = await Message.find({
    sender: { $in: [userId, ourUserId] },
    recipient: { $in: [userId, ourUserId] },
  }).sort({ createdAt: 1 });
  res.json(messages);
});


// connect user
app.get('/people', async (req, res) => {
  const users = await User.find({}, { '_id': 1, username: 1 });
  res.json(users);
});
// check connected users
app.get('/profile', (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(401).json('no token');
  }
});
// login api
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });
  if (foundUser) {
    const passOk = bcrypt.compareSync(password, foundUser.password);
    if (passOk) {
      jwt.sign({ userId: foundUser._id, username }, jwtSecret, {}, (err, token) => {
        res.cookie('token', token, { sameSite: 'none', secure: true }).json({
          id: foundUser._id,
        });
      });
    }
  }
});
// logout api
app.post('/logout', (req, res) => {
  res.cookie('token', '', { sameSite: 'none', secure: true }).json('ok');
});
// register api
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await User.create({
      username: username,
      password: hashedPassword,
    });
    jwt.sign({ userId: createdUser._id, username }, jwtSecret, {}, (err, token) => {
      if (err) throw err;
      res.cookie('token', token, { sameSite: 'none', secure: true }).status(201).json({
        id: createdUser._id,
      });
    });
  } catch (err) {
    if (err) throw err;
    res.status(500).json('error');
  }
});
// Route pour récupérer la liste des utilisateurs
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// Route pour mettre à jour un utilisateur
app.put('/edituserId/:userId', async (req, res) => {
  const { userId } = req.params;
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, bcryptSalt);

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Mettez à jour les propriétés de l'utilisateur
    user.username = username;
    user.password = hashedPassword;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
});

// Route pour supprimer un user
app.delete('/suppusers/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    await User.findByIdAndDelete(userId);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression du groupe' });
  }
});

// Route pour mettre à jour un utilisateur
app.put('/suppusers/:userId', async (req, res) => {
  const { userId } = req.params;
  const { username } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, { username }, { new: true });
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
});

// Route pour mettre à jour un groupe
app.put('/editGroup/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const { name } = req.body; // Nouveau nom du groupe

  try {
    // Recherchez le groupe par ID
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Le groupe n'a pas été trouvé" });
    }

    // Mettez à jour le nom du groupe
    group.name = name;

    // Enregistrez les modifications
    await group.save();

    res.status(200).json(group); // Renvoyez le groupe mis à jour en réponse
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Une erreur s'est produite lors de la mise à jour du groupe" });
  }
});

// Route pour supprimer un groupe
app.delete('/suppgroups/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    await Group.findByIdAndDelete(groupId);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression du groupe' });
  }
});

const server = app.listen(port);
console.log(port);
// ws server config
const wss = new ws.WebSocketServer({ server });
wss.on('connection', (connection, req) => {

  function notifyAboutOnlinePeople() {
    [...wss.clients].forEach(client => {
      client.send(JSON.stringify({
        online: [...wss.clients].map(c => ({ userId: c.userId, username: c.username })),
      }));
    });
  }

  connection.isAlive = true;

  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      notifyAboutOnlinePeople();
      console.log('dead');
    }, 1000);
  }, 5000);


  connection.on('pong', () => {
    clearTimeout(connection.deathTimer);
  });

  // read username and id form the cookie for this connection
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='));
    if (tokenCookieString) {
      const token = tokenCookieString.split('=')[1];
      if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          const { userId, username } = userData;
          connection.userId = userId;
          connection.username = username;
        });
      }
    }

    // message prive **************

    connection.on('message', async (message) => {
      const messageData = JSON.parse(message.toString());
      const { recipient, text } = messageData;

      if (recipient && (text)) {
        const messageDoc = await Message.create({
          sender: connection.userId,
          recipient,
          text,
        });
        console.log('created message private');
        datemsg = moment().format("DD-MM-YYYY - HH:mm");
        [...wss.clients]
          .filter(c => c.userId === recipient)
          .forEach(c => c.send(JSON.stringify({
            text,
            sender: connection.userId,
            recipient,
            timeadd: datemsg,
            _id: messageDoc._id,
          })));
        console.log(messageDoc._id);
      }

    });

    // message du groupe *****************

    connection.on('message', async (message) => {
      const messageData = JSON.parse(message.toString());
      const { type, text, groupId } = messageData;

      if (groupId && text) {

        if (type === "groupMessage") {

          // Message de groupe

          // Enregistrez le message de groupe dans la base de données
          const messageData = await GroupMessage.create({
            sender: connection.userId,
            groupId: groupId,
            text: text,
          });
          console.log('created message of groupe');
          // send message to group ws

          datemsg = moment().format("DD-MM-YYYY - HH:mm");
          [...wss.clients].forEach(c => c.send(JSON.stringify({
            text,
            type: "groupMessage",
            sender: connection.userId,
            groupId: groupId,
            timeadd: datemsg,
            _id: messageData._id,

          })));


        }

      }
    });

  }

  // notify everyone about online people (when someone connects)
  notifyAboutOnlinePeople();
});

// add goupe
app.post('/groups', async (req, res) => {
  try {
    const { name } = req.body;

    // Créez un nouveau groupe et enregistrez-le dans la base de données
    const newGroup = new Group({ name });

    const savedGroup = await newGroup.save();

    res.json(savedGroup);
  } catch (error) {
    console.error('Error creating a group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get list of group
app.get('/listeofgroups', async (req, res) => {
  try {
    const groupemsg = await Group.find();
    res.status(200).send(groupemsg);
  } catch (error) {
    res.status(500).send("cannot get GroupMessage");
    console.log(error);
  }
});

// get message of groupe by id
app.get('/group-messages/:groupId', (req, res) => {
  const groupId = req.params.groupId;
  GroupMessage.find({ groupId }, (err, messages) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.json(messages);
  });
});

