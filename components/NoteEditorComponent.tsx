import dynamic from "next/dynamic";
import { useState } from "react";

const CodeWithCodemirror = dynamic(import("../components/CodeWithCodeMirror"), {
  ssr: false,
});

interface NoteComponentProps {
  initialContent: string;
  setContent: (content: string) => void;
}

export const NoteEditorComponent = (props: NoteComponentProps) => {
  const [hashCompletion, setHashCompletion] = useState("");
  const content = props.initialContent;
  return (
    <CodeWithCodemirror
      value={content}
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
        props.setContent(value);
      }}
      // @ts-ignore
      onChange={(editor, data, value) => {}}
    />
  );
};
