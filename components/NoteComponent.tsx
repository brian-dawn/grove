import { GetStaticProps, GetStaticPaths, GetServerSideProps } from "next";
import Head from "next/head";
import fetch from "../libs/fetch";
import useSWR from "swr";
import { useState } from "react";
import { useRouter } from "next/router";
import Markdown from "markdown-to-jsx";
import Link from "next/link";
import "../styles.css";

import { Note } from "../libs/model";
import { NoteEditorComponent } from "./NoteEditorComponent";

interface NoteComponentProps {
  note: Note;
  notesById: Map<string, Note>;
  deleteNoteFn: () => void;
  allTags: string[];
}

interface Text {
  kind: "text";
  content: string;
}
interface NoteLink {
  kind: "noteLink";
  id: string;
}
interface Tag {
  kind: "tag";
  tag: string;
}
type ContentFragment = Text | NoteLink | Tag;

// Take some content, find the special components within it and return a list
// of all the sub components. We have text, noteLink, and tag.
function splitContent(body: string): ContentFragment[] {
  const noteLinkReg = /^\[\[(.*?)\]\]$/;
  const tagReg = /^(\@[a-zA-Z0-9]+)$/;

  const parts = body.split(/(\@[a-zA-Z0-9]+)|(\[\[.*?\]\])/gi);
  return parts
    .filter((part) => part)
    .map((part) => {
      if (tagReg.test(part)) {
        return { kind: "tag", tag: part } as Tag;
      } else if (noteLinkReg.test(part)) {
        return {
          kind: "noteLink",
          id: part.substr(2, part.length - 4),
        } as NoteLink;
      } else {
        return { kind: "text", content: part } as Text;
      }
    });
}

function renderLink(id: string, notesById: Map<string, Note>) {
  // TODO: render based on title first.
  // Then summary.
  // Then id/date or something.
  const content = notesById.get(id)?.content;
  const previewSize = 40;
  if (content) {
    const firstLine = content.trim().split("\n")[0];
    const summary = firstLine.replace(/\#|<|>|\[|\]/g, "").trim();
    if (summary.length > previewSize) {
      return summary.substr(0, previewSize - 3) + "...";
    } else {
      return summary;
    }
  }
  return id;
}

function renderContent(body: string, notesById: Map<string, Note>) {
  const frags = splitContent(body);
  return frags.map((frag) => {
    switch (frag.kind) {
      case "text":
        return <Markdown>{frag.content}</Markdown>;

      case "noteLink":
        if (notesById.get(frag.id)) {
          return (
            <div className="frag">
              [[
              <Link href={`/?id=${frag.id}`}>
                <a>{renderLink(frag.id, notesById)}</a>
              </Link>
              ]]
            </div>
          );
        } else {
          return <div className="frag">[[{frag.id}]]</div>;
        }

      case "tag":
        return (
          <Link href={`/?tag=${frag.tag}`}>
            <a>{frag.tag}</a>
          </Link>
        );
    }
  });
}
export const NoteComponent = (props: NoteComponentProps) => {
  var { data, error, isValidating, mutate } = useSWR<Note[]>(
    "/api/note",
    fetch
  );
  const note = props.note;
  const notesById = props.notesById;

  const [content, setContent] = useState("");

  const date = new Date(note.timestamp);

  const [showEditNote, setShowEditNote] = useState(false);

  const editNote = async () => {
    // Submit the note

    const resp = await fetch(`/api/note/${note.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(content),
    });
    mutate(resp.body);
    setShowEditNote(false);
  };
  return (
    <div>
      <div id={note.id} key={"top" + note.id} className={"noteTopBar"}>
        <div className={"idViewer"}>{note.id}</div>
        <div className={"spacer"} />
        <div className={"spacer"} />
        <div>{date.toLocaleString()}</div>
        <div className={"spacer"} />

        <button
          className={"deleteButton"}
          onClick={() => {
            setContent(note.content);
            setShowEditNote(true);
          }}
        >
          Edit
        </button>
        <button className={"deleteButton"} onClick={() => props.deleteNoteFn()}>
          Delete
        </button>
      </div>
      {note.linkedFrom.length !== 0 && (
        <div className={"fromHeader"}>
          Linked from:
          {note.linkedFrom.map((id) => {
            return (
              <Link href={`/?id=${id}`}>
                <a className={"fromLink"}>{renderLink(id, notesById)}</a>
              </Link>
            );
          })}
        </div>
      )}
      <div key={note.id} className={"note"}>
        {!showEditNote && renderContent(note.content, notesById)}
        {showEditNote && (
          <div>
            <NoteEditorComponent
              initialContent={content}
              setContent={setContent}
              allTags={props.allTags}
            />
            <button onClick={editNote}>submit</button>
            <button onClick={() => setShowEditNote(false)}>nevermind</button>
          </div>
        )}
      </div>
    </div>
  );
};
