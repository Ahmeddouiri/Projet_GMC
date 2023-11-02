import RegisterAndLoginForm from "./RegisterAndLoginForm.jsx";
import {useContext} from "react";
import {UserContext} from "./UserContext.jsx";
import Chat from "./Chat";
import Gestion from "./Gestion.jsx";

export default function Routes() {
  const {username, id} = useContext(UserContext);

  if (username==="admin") {
    return <Gestion/>;
  }
   else if (username) {
    return <Chat />;
  }
else
  return (
    <RegisterAndLoginForm />
  );
}