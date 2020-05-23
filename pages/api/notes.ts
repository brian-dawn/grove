import { NextApiRequest, NextApiResponse } from "next";
import { getNotes, shareMessage } from "../../libs/cabal";
import { Note, applyMessageToDB } from "../../libs/model";
import { BaseMessage, encodeBaseMessage } from "../../libs/messages";
const shortid = require("shortid");

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
    const id = shortid.generate();

    const baseMessage: BaseMessage = {
      messageTimestamp: Date.now(),
      message: {
        kind: "NewNote",
        noteId: id,
        content: req.body,
      },
    };

    shareMessage(baseMessage);
    res.status(200).json(Object.values(getNotes()));
  }
};
