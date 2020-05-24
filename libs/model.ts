// High level types that get sent to the rest API. For example we have a `Note` here but a Note gets built up
// from the log.

import * as t from "io-ts";
import { BaseMessage } from "./messages";

export const Note = t.type({
  id: t.string,
  timestamp: t.number,
  content: t.string,
  deleted: t.boolean,
});
export type Note = t.TypeOf<typeof Note>;

export const DB = t.type({
  notes: t.record(t.string, Note),
});
export type DB = t.TypeOf<typeof DB>;

// Build up a database from messages, or apply a DB when new messages come on.
export function applyMessageToDB(db: DB, message: BaseMessage) {
  switch (message.msg.k) {
    case "NewNote":
      db.notes[message.msg.id] = {
        id: message.msg.id,
        content: message.msg.body,
        timestamp: message.tme,
        deleted: false,
      };

      break;
    case "DeleteNote":
      if (db.notes[message.msg.id]) {
        db.notes[message.msg.id].deleted = true;
      }
      break;
  }
}
