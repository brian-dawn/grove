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
      options={{ theme: "base16-light", mode: "markdown", keyMap: "vim" }}
      onChange={() => null}
    />
  </div>
);
