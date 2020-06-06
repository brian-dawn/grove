import { NextApiRequest, NextApiResponse } from "next";
import {
  getNotes,
  shareMessage,
  generateRandomNoteId,
} from "../../../libs/cabal";
import { Note, applyMessageToDB } from "../../../libs/model";
import { BaseMessage, encodeBaseMessage } from "../../../libs/messages";
import { useRouter } from "next/router";
export type Data = {
  name: string;
};

export default (req: NextApiRequest, res: NextApiResponse<Note[]>) => {
  const {
    query: { id },
  } = req;

  if (typeof id === "string") {
    if (req.method === "GET") {
      // const note = getNotes()[id];
      // if (note) {
      //   res.status(200).json(JSON.stringify(note));
      // } else {
      //   res.status(404);
      // }

      res.status(200).json(Object.values(getNotes()));
    } else if (req.method === "POST") {
      // Edit a note

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
  } else {
    // return error I guess.
    res.status(400);
  }
};
