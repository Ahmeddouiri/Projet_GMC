import { useContext, useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { UserContext } from "./UserContext.jsx";
import { uniqBy } from "lodash";
import axios from "axios";
import Contact from "./Contact";
import moment from "moment";

export default function Chat() {
  
  //* new update */
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [offlinePeople, setOfflinePeople] = useState({});
  //state for private message
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const { username, id, setId, setUsername } = useContext(UserContext);
  const divUnderMessages = useRef();
  const divUnderMessages1 = useRef();

  /* state for group message */
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);
  const [newGroupMessage, setNewGroupMessage] = useState('');
  const [availableGroups, setAvailableGroups] = useState([]);

  useEffect(() => {
    connectToWs();
  }, [selectedUserId,selectedGroup]);
// ws Websoket server config
  function connectToWs() {
    const ws = new WebSocket('ws://localhost:5171');
    setWs(ws);
    ws.addEventListener('message', handleMessage);

    ws.addEventListener('close', () => {
      setTimeout(() => {
        console.log('Disconnected. Trying to reconnect.');
        connectToWs();
      }, 1000);
    });
  }
// get online user
  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }
//  handleMessage for private & group message
  function handleMessage(ev) {
    const messageData = JSON.parse(ev.data);
    //console.log({ ev, messageData });
    if ('online' in messageData) {
      showOnlinePeople(messageData.online);
    } else if ('text' in messageData) {
      
      if (messageData.type!=="groupMessage" && messageData.sender === selectedUserId) {
        
          
        setMessages(prev => ([...prev, { ...messageData }]));
        
        
      } else if (messageData.type==="groupMessage" && messageData.groupId === selectedGroup._id && messageData.sender!==id ) {
        
        
        setGroupMessages(prev => ([...prev, { ...messageData }]));
        
        
      }
    
    }
  }
// deconnecte du plateforme
  function logout() {
    axios.post('/logout').then(() => {
      setWs(null);
      setId(null);
      setUsername(null);

    });
  }
// send private message 
  function sendMessage(ev) {
    if (ev) ev.preventDefault();
    const msgp = ws.send(JSON.stringify({
      type: '',
      recipient: selectedUserId,
      text: newMessageText,

    }));

    setNewMessageText('');
    // add new msg
    
    const datemsg = moment().format("DD-MM-YYYY - HH:mm");
    setMessages(prev => ([...prev, {
      text: newMessageText,
      sender: id,
      recipient: selectedUserId,
      timeadd:datemsg,
      _id: Date.now(),
    }]));

  }

// function pour difilement auto
  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) {
      div.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  useEffect(() => {
    const div = divUnderMessages1.current;
    if (div) {
      div.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [groupMessages]);

// get connected users

  useEffect(() => {
    axios.get('/people').then(res => {
      const offlinePeopleArr = res.data
        .filter(p => p._id !== id)
        .filter(p => !Object.keys(onlinePeople).includes(p._id));
      const offlinePeople = {};
      offlinePeopleArr.forEach(p => {
        offlinePeople[p._id] = p;
      });
      setOfflinePeople(offlinePeople);
    });
  }, [onlinePeople]);
// get private message by selected user
  useEffect(() => {
    if (selectedUserId) {
      axios.get('/messages/' + selectedUserId).then(res => {
        setMessages(res.data);

      });
    }
  }, [selectedUserId]);

  const onlinePeopleExclOurUser = { ...onlinePeople };
  delete onlinePeopleExclOurUser[id];

// get unique message
  const messagesWithoutDupes = uniqBy(messages, '_id');

  /*****************fonction du groupe*****************/
  
// joindre groupe
  const joinGroup = (group) => {
    setSelectedGroup(null);
    setSelectedGroup(group);
    setSelectedUserId(null)
  };
// leave groupe
  const leaveGroup = () => {
    setSelectedGroup(null);
    setGroupMessages([]);
  };


  useEffect(() => {
    // Récupérer la liste des groupes disponibles depuis votre API
    axios.get('/listeofgroups')
      .then((response) => setAvailableGroups(response.data))
      .catch((error) => console.error('Erreur lors de la récupération des groupes :', error));
  }, []);
  const getmsggroup = () => {
    if (selectedGroup) {
      axios.get('/group-messages/' + selectedGroup._id).then(response => {
        setGroupMessages(response.data);

      });
    }
  }
  useEffect(() => {

    getmsggroup()

    

  }, [selectedGroup]);

  /****************************** */
// creer nouveau groupe
  const createGroup = () => {
    // Envoyer le nom du nouveau groupe au serveur pour sauvegarde
    axios.post('/groups', { name: newGroupName })
      .then((response) => {
        // Mettre à jour la liste des groupes une fois que le groupe est créé
        setAvailableGroups([...availableGroups, response.data]);
        setNewGroupName('');
      })
      .catch((error) => {
        console.error('Erreur lors de la création du groupe :', error);
      });
  };
 // send message for groupe
  const sendMessageToGroup = (ev) => {
    if (selectedGroup && ev) {
      ev.preventDefault();

      // Préparez le message à envoyer au groupe
      const message = {
        type: 'groupMessage',
        groupId: selectedGroup._id,
        recipient: "",
        text: newGroupMessage,
        sender: id
      };
      // Envoyez le message au serveur WebSocket
      ws.send(JSON.stringify(message));

      const datemsg = moment().format("DD-MM-YYYY - HH:mm");
      setGroupMessages(prev => ([...prev, {
        text: newGroupMessage,
        groupId: selectedGroup._id,
        sender: id,
        timeadd:datemsg,
        _id: Date.now(),
      }]));
      // Effacez le champ de saisie du message après l'envoi
      setNewGroupMessage('');

    }

  };
  // get unique message for groupe
const msggroupWithoutDupes = uniqBy(groupMessages, '_id');


  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3 flex flex-col">
        <div className="flex-grow">
          <Logo />
          {Object.keys(onlinePeopleExclOurUser).map(userId => (
            <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 bg-green-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          
            <Contact
              key={userId}
              id={userId}
              online={true}
              username={onlinePeopleExclOurUser[userId]}
              onClick={() => {
                setSelectedUserId(userId);
                setSelectedGroup(null);
                console.log({ userId })
              }}
              selected={userId === selectedUserId} />
              </>
          ))}
          {Object.keys(offlinePeople).map(userId => (
            <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 bg-red-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
            <Contact
              key={userId}
              id={userId}
              online={false}
              username={offlinePeople[userId].username}
              onClick={() => {
                setSelectedUserId(userId);
                setSelectedGroup(null);
              }}
              selected={userId === selectedUserId} />
              </>
          ))}
        </div>
        <div className="p-2 text-center flex items-center justify-center">
          <span className="mr-2 text-sm text-gray-600 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
            {username}
          </span>
          <p className="text-sm bg-white-100 py-1 px-2 text-gray-500 border rounded-sm" >
            {moment().format('MMMM Do YYYY, h:mm:ss')}
          </p>
          <button
            onClick={logout}
            className="text-sm bg-blue-100 py-1 px-2 text-gray-500 border rounded-sm">logout</button>
        </div>
      </div>
      {/* Div pour chat*/}
      <div className="flex flex-col bg-blue-50 w-2/3 p-2">

        <div className="flex-grow">
          {!selectedUserId && !selectedGroup && (
            <div className="flex h-full flex-grow items-center justify-center">
              <div className="text-gray-300">&larr; Select a person from the sidebar</div>
            </div>
          )}
          {selectedGroup && (

            <div className="relative h-full">
              <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                {msggroupWithoutDupes.map(message => (

                  <div key={message._id} className={(message.sender === id ? 'text-right' : 'text-left')}>
                    <div className={"text-left inline-block p-2 my-2 rounded-md text-sm " + (message.sender === id ? 'bg-blue-500 text-white' : 'bg-white text-gray-500')}>
                      {message.text}

                    </div>
                    <div className="text-color-black text-xs top-0 ">
                      {message.timeadd}
                    </div>
                  </div>
                ))}
                <div ref={divUnderMessages1}></div>
              </div>
            </div>

          )}
          {!!selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                {messagesWithoutDupes.map(message => (
                  <div key={message._id} className={(message.sender === id ? 'text-right' : 'text-left')}>
                    <div className={"text-left inline-block p-2 my-2 rounded-md text-sm " + (message.sender === id ? 'bg-blue-500 text-white' : 'bg-white text-gray-500')}>
                      {message.text}
                    </div>
                    <div className="text-color-black text-xs top-0 ">
                      {message.timeadd}
                    </div>
                  </div>
                ))}
                <div ref={divUnderMessages}></div>
              </div>
            </div>
          )}
        </div>
        
        {!!selectedGroup && (
          <form className="flex gap-2" onSubmit={sendMessageToGroup}>
            <input type="text"
              value={newGroupMessage}
              onChange={ev => setNewGroupMessage(ev.target.value)}
              placeholder="Type your message here"
              className="bg-white flex-grow border rounded-sm p-2" />

            <button type="submit" className="bg-blue-500 p-2 text-white rounded-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        )}
        {!!selectedUserId && (
          <form className="flex gap-2" onSubmit={sendMessage}>
            <input type="text"
              value={newMessageText}
              onChange={ev => setNewMessageText(ev.target.value)}
              placeholder="Type your message here"
              className="bg-white flex-grow border rounded-sm p-2" />

            <button type="submit"  className="bg-blue-500 p-2 text-white rounded-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        )}
      </div>
      {/***************************** group div *************************** */}

      <div>
        <div>

          <div>
            <h2>Welcome, {username}!</h2>
            <div>
              <h3>Create a New Group:</h3>
              <input
                type="text"
                placeholder="Group Name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />

              <button

                onClick={createGroup}
                className="text-sm bg-blue-100 py-1 px-2 text-blue-500 text-bold border rounded-sm">Create Group</button>
            </div>
            <div>
              <h3>Available Groups:</h3>{selectedGroup&&(<h3>you are join a <span className=" text-indigo-700 transition-colors font-bold duration-150 border border-indigo-500">{selectedGroup.name}</span></h3>)}
              <button className="h-8 px-4 text-indigo-700 transition-colors duration-150 border border-indigo-500 rounded-lg 
              focus:shadow-outline hover:bg-blue-500 hover:text-indigo-100" onClick={leaveGroup}>Leave </button>
              <ul>
                {availableGroups.map((group, key) => (
                  <li key={key}>
                    {group.name} {" "}
                    <button className="h-6 text-left bg-transparent text-sm hover:bg-blue-500 text-blue-700 font-semibold hover:text-white  border border-blue-500 hover:border-transparent rounded"
                      onClick={() => joinGroup(group)}>
                      Join
                    </button>
                  </li>

                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>


    </div>
  );
}