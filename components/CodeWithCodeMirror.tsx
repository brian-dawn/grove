import React, { Component } from "react";
import { useState } from "react";
import { Controlled as CodeMirror } from "react-codemirror2";
import "codemirror/mode/markdown/markdown";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/theme/base16-light.css";
import "codemirror/keymap/vim";
import "codemirror/keymap/emacs";

export default (props: any) => {
  const [editor, setEditor] = useState(undefined);
  return (
    <div>
      <CodeMirror
        {...props}
        value={props.value}
        editorDidMount={(ed) => {
          setEditor(ed);
          ed.setSize("100%", "6em");
        }}
        options={{
          theme: "base16-light",
          mode: "markdown",
          //keyMap: "vim",

          extraKeys: {
            "Ctrl-Space": "autocomplete",
          },
        }}
      />
    </div>
  );
};
