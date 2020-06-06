import { NextApiRequest, NextApiResponse } from "next";
import { getNotes, shareMessage, generateRandomNoteId } from "../../libs/cabal";
import { Note, applyMessageToDB } from "../../libs/model";
import { BaseMessage, encodeBaseMessage } from "../../libs/messages";
import { useRouter } from "next/router";
export type Data = {
  name: string;
};

export default (req: NextApiRequest, res: NextApiResponse<Note[]>) => {
  if (req.method === "GET") {
    res.status(200).json(Object.values(getNotes()));
  } else if (req.method === "POST") {
    // Make a note
    const id = generateRandomNoteId();

    const baseMessage: BaseMessage = {
      tme: Date.now(),
      msg: {
        k: "NewNote",
        id: id,
        body: req.body,
      },
    };

    shareMessage(baseMessage);
    res.status(200).json(Object.values(getNotes()));
  } else if (req.method === "DELETE") {
    const id = req.query["id"];
    if (typeof id === "string") {
      const baseMessage: BaseMessage = {
        tme: Date.now(),
        msg: {
          k: "DeleteNote",
          id: id,
          del: true,
        },
      };

      shareMessage(baseMessage);
      res.status(200).json(Object.values(getNotes()));
    }
  }
};
