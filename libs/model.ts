// High level types that get sent to the rest API. For example we have a `Note` here but a Note gets built up
// from the log.

import * as t from "io-ts";
import { BaseMessage } from "./messages";

export const Note = t.type({
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
  switch (message.message.kind) {
    case "NewNote":
      db.notes[message.message.noteId] = {
        content: message.message.content,
        timestamp: message.messageTimestamp,
        deleted: false,
      };

      break;
    case "DeleteNote":
      db.notes[message.message.noteId].deleted = true;
      break;
  }
}
