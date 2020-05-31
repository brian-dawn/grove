import { GetStaticProps, GetStaticPaths, GetServerSideProps } from "next";
import Head from "next/head";
import fetch from "../libs/fetch";
import useSWR from "swr";
import { Data } from "./api/note";
import { Note } from "../libs/model";
import { useState } from "react";
import { useRouter } from "next/router";
import Markdown from "markdown-to-jsx";
import Link from "next/link";
import "../styles.css";

import dynamic from "next/dynamic";
import { NoteComponent } from "../components/NoteComponent";
const CodeWithCodemirror = dynamic(
  import("../components/code-with-codemirror"),
  { ssr: false }
);

const colorThemes = [
  "#afd76b",
  "#716799",
  "#f676e1",
  "#76b8f6",
  "#f6dc76",
  "#f69476",
  "#f6769d",
];

export default function Home() {
  const [content, setContent] = useState("");
  const [hashCompletion, setHashCompletion] = useState("");
  const [cardCompletion, setCardCompletion] = useState("");
  const [colorTheme, setColorTheme] = useState(colorThemes[0]);
  const router = useRouter();

  // We want to read the path fragment (url/#foo) because this is how
  // we filter by hashtags. Maybe we should be using nextjs Link instead :P
  const tag = router.query["tag"];
  const id = router.query["id"];

  var { data, error, isValidating, mutate } = useSWR<Note[]>(
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

  const selectNewColorTheme = async () => {
    const currentThemeIndex = colorThemes.findIndex((theme) => {
      return theme === colorTheme;
    });
    setColorTheme(colorThemes[(currentThemeIndex + 1) % colorThemes.length]);
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

  let visibleNotes = data;
  if (id) {
    // We want to view a specific note.
    // TODO: In this view we might want to view other notes that are similar in context.
    visibleNotes = data.filter((note) => {
      return note.id === id;
    });
  } else if (tag) {
    // We're searching by a tag.
    visibleNotes = data.filter((note) => {
      return note.content.includes(tag);
    });
  }

  visibleNotes.sort((a: Note, b: Note) => {
    return b.timestamp - a.timestamp;
  });

  return (
    <div>
      <style jsx global>{`
        body {
          background-color: ${colorTheme};
        }
      `}</style>
      <div className={"topNavBar"}>
        Top Nav Bar Stuff
        <button onClick={selectNewColorTheme}>Change Theme</button>
      </div>
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
      <Link href="/">
        <a>all</a>
      </Link>
      {visibleNotes
        .filter((note) => {
          return !note.deleted;
        })
        .map((note) => {
          return (
            <NoteComponent
              note={note}
              notesById={notesById}
              deleteNoteFn={() => {
                deleteNote(note.id);
              }}
            />
          );
        })}
    </div>
  );
}
