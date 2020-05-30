// High level types that get sent to the rest API. For example we have a `Note` here but a Note gets built up
// from the log.

import * as t from "io-ts";
import { BaseMessage } from "./messages";
const matchAll = require("match-all");

export const Note = t.type({
  id: t.string,
  timestamp: t.number,
  content: t.string,
  deleted: t.boolean,
  title: t.union([t.string, t.undefined, t.null]),

  // What cards link to this one? This allows us to backtrack.
  linkedFrom: t.array(t.string),
});
export type Note = t.TypeOf<typeof Note>;

export const DB = t.type({
  notes: t.record(t.string, Note),
});
export type DB = t.TypeOf<typeof DB>;

function findLinks(content: string): string[] {
  const re = /\[\[(.*?)\]\]/gi;
  let matches = matchAll(content, re);
  let results = matches.toArray();
  return results;
}
// Build up a database from messages, or apply a DB when new messages come on.
export function applyMessageToDB(db: DB, message: BaseMessage) {
  switch (message.msg.k) {
    case "NewNote":
      // We need to updated the linkedFrom fields on any messages that we reference.
      // A message link is [[ID]]. TODO: we need to update this for edits/deletions too.
      let links = findLinks(message.msg.body);

      links.forEach((id) => {
        const otherNote = db.notes[id];
        if (otherNote) {
          const froms = new Set(otherNote.linkedFrom);
          froms.add(message.msg.id);
          otherNote.linkedFrom = Array.from(froms.values());
        }
      });

      db.notes[message.msg.id] = {
        id: message.msg.id,
        content: message.msg.body,
        timestamp: message.tme,
        deleted: false,
        title: null,
        linkedFrom: [],
      };

      break;
    case "DeleteNote":
      const foundNote = db.notes[message.msg.id];
      if (foundNote) {
        // We need to clear the linkedFrom fields of relevant notes.
        let links = findLinks(foundNote.content);
        links.forEach((id) => {
          const foundFrom = db.notes[id];
          if (foundFrom) {
            foundFrom.linkedFrom = foundFrom.linkedFrom.filter(
              (linkedFromId) => {
                return foundNote.id !== linkedFromId;
              }
            );
          }
        });

        db.notes[message.msg.id].deleted = true;
      }
      break;
  }
}
