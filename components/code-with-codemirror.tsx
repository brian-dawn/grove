import React, { Component } from "react";
import { UnControlled as CodeMirror } from "react-codemirror2";
import "codemirror/mode/javascript/javascript";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/base16-light.css";
import "codemirror/keymap/vim";

export default (props: any) => (
  <div>
    <CodeMirror
      {...props}
      value={props.value}
      editorDidMount={(editor) => {
        editor.setSize("100%", "6em");
      }}
      options={{
        theme: "base16-light",
        mode: "markdown",
        wow: "20",
      }}
      onChange={() => null}
    />
  </div>
);
