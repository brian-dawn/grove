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
    // Fetch notes (do nothing we'll return all the notes below.)
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
  } else if (req.method === "DELETE") {
    const id = req.query["id"];
    if (typeof id === "string") {
      const baseMessage: BaseMessage = {
        messageTimestamp: Date.now(),
        message: {
          kind: "DeleteNote",
          noteId: id,
          deleted: true,
        },
      };

      shareMessage(baseMessage);
    }
  }

  res.status(200).json(Object.values(getNotes()));
};
