import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "./UserContext.jsx"; // Si besoin de l'authentification
import axios from "axios";
import moment from "moment/moment.js";

export default function Conversation({ subject }) {
  const [messages, setMessages] = useState([]); // Pour stocker les messages du groupe

  // Utilisez l'ID du sujet (subject._id) pour obtenir les messages de ce sujet
  useEffect(() => {
    axios.get(`/messagesBySubject/${subject._id}`).then((res) => {
      setMessages(res.data);
    });
  }, [subject._id]);

  // Reste du code pour afficher les messages du groupe dans cette conversation
}
