import dynamic from "next/dynamic";
import { useState } from "react";
import ReactTextareaAutocomplete from "@webscopeio/react-textarea-autocomplete";
import "@webscopeio/react-textarea-autocomplete/style.css";

interface NoteComponentProps {
  initialContent: string;
  setContent: (content: string) => void;
  allTags: string[];
  allTitles: { id: string; title: string }[];
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
      onKeyDown={(event: any) => {
        // Insert tabs.
        if (event.keyCode === 9) {
          event.preventDefault();
          // TODO: This is gross, maybe we don't need to call both setContents?
          props.setContent(content + "\t");
          setContent(content + "\t");
        }
        console.log(event);
      }}
      onChange={(event: any) => {
        // @ts-ignore
        props.setContent(event.target.value);

        // @ts-ignore
        setContent(event.target.value);
      }}
      loadingComponent={() => <span>Loading</span>}
      trigger={{
        "@": {
          dataProvider: (token: string) => {
            return props.allTags
              .filter((tag) =>
                tag.toLowerCase().startsWith(token.toLowerCase())
              )
              .map((tag) => {
                return { name: tag, char: "@" + tag };
              });
          },
          component: Item,
          output: (item, trigger) => item.char,
        },
        "[[": {
          dataProvider: (token: string) => {
            return props.allTitles
              .filter((title) => {
                return title.title
                  .toLowerCase()
                  .startsWith(token.replace("[", "").toLowerCase());
              })
              .map((title) => {
                return {
                  name: title.title.substr(0, 30),
                  char: "[[" + title.id + "]]",
                };
              });
          },
          component: Item,
          output: (item, trigger) => item.char,
        },
      }}
      onCaretPositionChange={onCaretPositionChange}
    />
  );
};
