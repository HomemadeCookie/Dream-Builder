import { useState } from "react";

export default function EditableText({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);

  const handleBlur = () => {
    setEditing(false);
    onSave(text);
  };

  return editing ? (
    <input
      autoFocus
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={handleBlur}
      className="w-full bg-transparent border-b outline-none"
    />
  ) : (
    <span onClick={() => setEditing(true)}>{value}</span>
  );
}
