import { GetStaticProps, GetStaticPaths, GetServerSideProps } from "next";
import Head from "next/head";
import fetch from "../libs/fetch";
import useSWR from "swr";
import { Data } from "./api/note";
import { Note } from "../libs/model";
import { useState } from "react";
import Markdown from "markdown-to-jsx";

import "../styles.css";

import dynamic from "next/dynamic";
const CodeWithCodemirror = dynamic(
  import("../components/code-with-codemirror"),
  { ssr: false }
);

function renderCardLinks(body: string, notesById: Map<string, Note>) {
  const re = /\[\[(.*?)\]\]/gi;

  return body.replace(
    re,
    (match: string, p1: string, offset: number, s: string) => {
      return `[[<a href="#${p1}"}>${renderLink(p1, notesById)}</a>]]`;
    }
  );
}

function renderTags(body: string) {
  const re = /\@([a-zA-Z0-9]+)/gi;

  return body.replace(
    re,
    (match: string, p1: string, offset: number, s: string) => {
      return `@<a class="nav" href="#@${p1}"}>${p1}</a>`;
    }
  );
}

function renderLink(id: string, notesById: Map<string, Note>) {
  // TODO: render based on title first.
  // Then summary.
  // Then id/date or something.
  const content = notesById.get(id)?.content;
  if (content) {
    const summary = content.replace(/\#|<|>|\[|\]/g, "").trim();
    if (summary.length > 20) {
      return summary.substr(0, 20) + "...";
    } else {
      return summary;
    }
  }
  return id;
}

export default function Home() {
  const [content, setContent] = useState("");
  const [hashCompletion, setHashCompletion] = useState("");
  const [cardCompletion, setCardCompletion] = useState("");

  const { data, error, isValidating, mutate } = useSWR<Note[]>(
    "/api/note",
    fetch
  );

  const handleSubmit = async (content: string) => {
    const resp = await fetch("/api/note", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(content),
    });
    mutate(resp.body);
    //setContent("");
  };

  const deleteNote = async (noteId: string) => {
    const resp = await fetch(`/api/note?id=${noteId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(content),
    });
    mutate(resp.body);
  };
  if (error) return <div>failed to load</div>;
  if (!data) return <div>loading...</div>;

  const notesById: Map<string, Note> = data.reduce(function (map, obj) {
    map.set(obj.id, obj);
    return map;
  }, new Map<string, Note>());

  data.sort((a: Note, b: Note) => {
    return b.timestamp - a.timestamp;
  });

  return (
    <div>
      <div className={"topNavBar"}>Top Nav Bar Stuff</div>
      <div className={"codeMirrorContainer"}>
        <CodeWithCodemirror
          value={content.toUpperCase()}
          // @ts-ignore
          onBeforeChange={(editor, data, value) => {
            // We're in hash completion
            if (hashCompletion !== "") {
              const validHashTagCharacters = /^[0-9a-zA-Z]+$/;
              if (data.text.join("").match(validHashTagCharacters)) {
                setHashCompletion(hashCompletion + data.text.join(""));
                console.log("continuing hashtag completion " + hashCompletion);
              } else {
                // Finish completion.
                console.log("finishing hashtag completion " + hashCompletion);
                setHashCompletion("");
              }
            } else if (data.text[0] === "@") {
              console.log("starting hashtag completion");
              // We have a hashtag so start hash completion.
              setHashCompletion(data.text.join(""));
            }
            setContent(value);
          }}
          // @ts-ignore
          onChange={(editor, data, value) => {}}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(content);
          }}
        >
          <label>New Note:</label>
          <input type="submit" value="Submit" />
        </form>
        <Markdown>{content}</Markdown>
      </div>
      {data
        .filter((note) => {
          return !note.deleted;
        })
        .map((note) => {
          const date = new Date(note.timestamp);
          return (
            <div>
              <div id={note.id} key={"top" + note.id} className={"noteTopBar"}>
                <div className={"idViewer"}>{note.id}</div>
                <div className={"spacer"} />
                <div>
                  {note.linkedFrom.length !== 0 && (
                    <div className={"fromLink"}>from</div>
                  )}
                  {note.linkedFrom.map((id) => {
                    return (
                      <a href={`#${id}`} className={"fromLink"}>
                        {renderLink(id, notesById)}
                      </a>
                    );
                  })}
                </div>
                <div className={"spacer"} />
                <div>{date.toLocaleString()}</div>
                <div className={"spacer"} />
                <button
                  className={"deleteButton"}
                  onClick={() => deleteNote(note.id)}
                >
                  Delete
                </button>
              </div>
              <div key={note.id} className={"note"}>
                <Markdown>
                  {renderTags(renderCardLinks(note.content, notesById))}
                </Markdown>
              </div>
            </div>
          );
        })}
    </div>
  );
}
