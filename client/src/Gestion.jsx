import { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext.jsx";
import axios from 'axios';

export default function Gestion() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const { username, id, setId, setUsername } = useContext(UserContext);
  const [edit, setEdit] = useState(null);
  const [editg, setEditg] = useState(null);
  const [editusername, setEditusername] = useState("");
  const [editpassword, setEditpassword] = useState("");
  const [editgroupe, setEditgroupe] = useState("");
  
  function logout() {
    axios.post('/logout').then(() => {
      setId(null);
      setUsername(null);
    });
  }

  useEffect(() => {
    // Effectuer un appel Axios pour récupérer la liste des utilisateurs
    axios.get('/users')
      .then(response => setUsers(response.data))
      .catch(error => console.error(error));

    // Effectuer un appel Axios pour récupérer la liste des groupes
    axios.get('/listeofgroups')
      .then(response => setGroups(response.data))
      .catch(error => console.error(error));
  }, []);

  // Fonction pour gérer la suppression d'un utilisateur
  function deleteUser(userId) {
    axios.delete(`/suppusers/${userId}`)
      .then(() => {
        // Mettez à jour la liste des utilisateurs après la suppression
        const updatedUsers = users.filter(user => user._id !== userId);
        setUsers(updatedUsers);
      })
      .catch(error => console.error(error));
  }

  // Fonction pour gérer la modification d'un utilisateur
  function editUser(userId) {
    // Vérifiez si l'utilisateur est en mode édition
    if (edit === userId) {
      // Effectuez une requête Axios pour mettre à jour l'utilisateur
      axios.put(`/edituserId/${userId}`, { username: editusername, password: editpassword })
        .then(response => {
          // Mettez à jour la liste des utilisateurs avec les données mises à jour
          const updatedUsers = users.map(user => {
            if (user._id === userId) {
              return response.data;
            } else {
              return user;
            }
          });
          setUsers(updatedUsers);

          // Réinitialisez les champs de modification et le mode d'édition
          setEdit(null);
          setEditusername("");
          setEditpassword("");
        })
        .catch(error => console.error(error));
    } else {
      // Activez le mode édition pour cet utilisateur
      setEdit(userId);
    }
  }

  // Fonction pour gérer la suppression d'un groupe
  function deleteGroup(groupId) {
    axios.delete(`/suppgroups/${groupId}`)
      .then(() => {
        // Mettez à jour la liste des groupes après la suppression
        const updatedGroups = groups.filter(group => group._id !== groupId);
        setGroups(updatedGroups);
      })
      .catch(error => console.error(error));
  }

  function editGroup(groupId) {
    // Vérifiez si le groupe est en mode édition
    if (editg === groupId) {
      // Effectuez ici la logique de mise à jour du groupe
      // Par exemple, une requête Axios pour mettre à jour le groupe.
      axios.put(`/editGroup/${groupId}`, { name: editgroupe })
        .then(response => {
          // Mettez à jour la liste des groupes avec les données mises à jour
          const updatedGroups = groups.map(group => {
            if (group._id === groupId) {
              return response.data;
            } else {
              return group;
            }
          });
          setGroups(updatedGroups);
  
          // Réinitialisez les champs de modification et le mode d'édition
          setEditg(null);
          setEditgroupe("");
        })
        .catch(error => console.error(error));
    } else {
      // Activez le mode édition pour ce groupe
      setEditg(groupId);
      setEditgroupe(groups.find(group => group._id === groupId).name);
    }
  }

  return (
    <div className="bg-blue-50 h-full p-3 grow ">
      Vous connecte en tant que' Admin ' 
      <button
            onClick={logout}
            className="text-sm bg-blue-100 py-1 px-2 text-gray-500 border rounded-sm">
              logout
            </button>
      <div className="  h-3"></div>
      <h2 className=" mb-5 mt-5 to-white bg-slate-400">Liste des Utilisateurs</h2>
      <div className="overflow-y-scroll max-h-50 top-0 left-0 right-0 bottom-2">
      <table className=" min-w-full text-left text-sm font-light" >
      <thead >
        <tr>
        <th>nom d'utilisateur</th>
        <th>edite</th>
        <th>delete user</th>
        </tr>
        </thead>

    {users.map((user) => (
      <tbody key={user._id}>
        <tr>
          <th >
            {user.username}
            {edit ===  user._id && (
              <>
            <input className=" m-2 border-spacing-1" type="text" 
            value={editusername}
            onChange={ev => setEditusername(ev.target.value)}
            ></input>
              <input className=" m-2 border-spacing-1"  type="text" onChange={ev => setEditpassword(ev.target.value)} 
              placeholder=" tape new password" ></input>
              <button  onClick={() => editUser(user._id)} 
              className=" m-1 font-medium text-blue-600 dark:text-blue-500 hover:underline">
                confirme
                </button>
                <button onClick={() =>{
                  setEdit(null);
                setEditusername("");
                setEditpassword("");
                }}
                className=" m-1 font-medium text-blue-600 dark:text-blue-500 hover:underline">
                reset
                </button>
              </>
             )}
          </th>
          <td>
            <button onClick={() => {
              setEdit(user._id)
              setEditusername(user.username)
            }
            } className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Éditer</button>
          </td>
          <td>
            <button onClick={() => deleteUser(user._id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Supprimer</button>
          </td>
        </tr>
      </tbody>
    ))}

</table>
</div>
      <br></br>
      <div className=' grow-0 bg-white w-100%'>  
      <h2 className=" mb-5 mt-5 to-white bg-slate-400">Liste des Groupes</h2>
      </div>
      <div className="overflow-y-scroll max-h-50 top-0 left-0 right-0 bottom-2">
      <table className=" min-w-full text-left text-sm font-light">
      <thead >
        <tr>
        <th className=" w-auto">nom du groupe</th>
        <th>edite</th>
        <th>delete group</th>
        </tr>
        </thead>

    {groups.map((group) => (
      <tbody key={group._id}>
        <tr>
          <th >
            {group.name}
            {editg ===  group._id && (
              <>
            <input className=" m-2 border-spacing-1" type="text" 
            value={editgroupe}
            onChange={ev => setEditgroupe(ev.target.value)}
            ></input>
              
              <button  onClick={() => editGroup(group._id)} 
              className=" m-1 font-medium text-blue-600 dark:text-blue-500 hover:underline">
                confirme
                </button>
                <button onClick={() =>{
                  setEditg(null);
                setEditgroupe("");
                
                }}
                className=" m-1 font-medium text-blue-600 dark:text-blue-500 hover:underline">
                reset
                </button>
              </>
             )}
          </th>
          <td>
            <button onClick={() => {
              setEditg(group._id) 
              setEditgroupe(group.name)
              
            }}
              className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Éditer</button>
          </td>
          <td>
            <button onClick={() => deleteGroup(group._id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Supprimer</button>
          </td>
        </tr>
      </tbody>
    ))}
    </table>
    </div>
  </div>
);
}
