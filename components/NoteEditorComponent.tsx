import dynamic from "next/dynamic";
import { useState } from "react";
import ReactTextareaAutocomplete from "@webscopeio/react-textarea-autocomplete";
import "@webscopeio/react-textarea-autocomplete/style.css";

interface NoteComponentProps {
  initialContent: string;
  setContent: (content: string) => void;
  allTags: string[];
}

const Item = ({
  entity: { name, char },
}: {
  entity: { name: string; char: string };
}) => <div>{`${name}`}</div>;

export const NoteEditorComponent = (props: NoteComponentProps) => {
  const [hashCompletion, setHashCompletion] = useState("");
  const [rta, setRta] = useState("");
  const [textArea, setTextArea] = useState<HTMLTextAreaElement | undefined>(
    undefined
  );

  const [content, setContent] = useState(props.initialContent);

  const onCaretPositionChange = (position: number) => {};

  const resetCaretPosition = () => {};

  return (
    <ReactTextareaAutocomplete
      className="noteEditor"
      minChar={0}
      ref={(rta) => {
        // setRta(rta);
      }}
      rows={6}
      value={content}
      onChange={(event: any) => {
        // @ts-ignore
        props.setContent(event.target.value);

        // @ts-ignore
        setContent(event.target.value);
      }}
      // innerRef={(textarea) => {
      //   if (textarea) {
      //     textarea.value = content;
      //     textarea.onchange = (event: Event) => {
      //       console.log(event);
      //       // @ts-ignore
      //       props.setContent(event.target.value);

      //       // @ts-ignore
      //       setContent(event.target.value);
      //     };
      //     setTextArea(textarea);
      //   }
      // }}
      loadingComponent={() => <span>Loading</span>}
      trigger={{
        "@": {
          dataProvider: (token: string) => {
            return props.allTags
              .filter((tag) => tag.startsWith(token))
              .map((tag) => {
                return { name: tag, char: "@" + tag };
              });
          },
          component: Item,
          output: (item, trigger) => item.char,
        },
      }}
      onCaretPositionChange={onCaretPositionChange}
    />
  );
  // return (
  //   <CodeWithCodemirror
  //     value={content}
  //     // @ts-ignore
  //     onBeforeChange={(editor, data, value) => {
  //       // We're in hash completion
  //       if (hashCompletion !== "") {
  //         const validHashTagCharacters = /^[0-9a-zA-Z]+$/;
  //         if (data.text.join("").match(validHashTagCharacters)) {
  //           setHashCompletion(hashCompletion + data.text.join(""));
  //           console.log("continuing hashtag completion " + hashCompletion);
  //         } else {
  //           // Finish completion.
  //           console.log("finishing hashtag completion " + hashCompletion);
  //           setHashCompletion("");
  //         }
  //       } else if (data.text[0] === "@") {
  //         console.log("starting hashtag completion");
  //         // We have a hashtag so start hash completion.
  //         setHashCompletion(data.text.join(""));
  //       }
  //       props.setContent(value);
  //     }}
  //     // @ts-ignore
  //     onChange={(editor, data, value) => {}}
  //   />
  // );
};
