import { NextApiRequest, NextApiResponse } from "next";
import { getNotes, shareMessage } from "../../libs/cabal";
import { Note, applyMessageToDB } from "../../libs/model";
import { BaseMessage, encodeBaseMessage } from "../../libs/messages";

console.log("hello this is nodejs yes? Yep wow");

export type Data = {
  name: string;
};

export default (req: NextApiRequest, res: NextApiResponse<Note[]>) => {
  if (req.method === "GET") {
    // Fetch notes
    const notes = getNotes();
    const notesArr = Object.values(notes);
    res.status(200).json(notesArr);
  } else if (req.method === "POST") {
    // Make a note
    const baseMessage: BaseMessage = {
      messageTimestamp: Date.now(),
      message: {
        kind: "NewNote",
        noteId: Math.floor(Math.random() * 100000),
        content: req.body,
      },
    };

    shareMessage(baseMessage);
  }
};
