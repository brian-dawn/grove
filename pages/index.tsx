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

export default function Home() {
  const [content, setContent] = useState("");

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
  const onChangeContent = (evt: { target: { value: string } }) => {
    setContent(evt.target.value);
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

  data.sort((a: Note, b: Note) => {
    return b.timestamp - a.timestamp;
  });

  return (
    <div>
      <CodeWithCodemirror
        value={content}
        // @ts-ignore
        onBeforeChange={(editor, data, value) => {
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

      {data
        .filter((note) => {
          return !note.deleted;
        })
        .map((note) => {
          const date = new Date(note.timestamp);
          return (
            <div key={note.id} className={"note"}>
              <div>id: {note.id}</div>
              <div>{date.toLocaleString()}</div>
              <Markdown>{note.content}</Markdown>
              <button onClick={() => deleteNote(note.id)}>X</button>
            </div>
          );
        })}
    </div>
  );
}
