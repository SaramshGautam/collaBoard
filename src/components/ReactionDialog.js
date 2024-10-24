import React from "react";
import { Dialog, DialogTitle, DialogContent, Button } from "@mui/material";

const ReactionDialog = ({ open, onClose, onReact, componentId }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>React to Component</DialogTitle>
      <DialogContent>
        <Button onClick={() => onReact(componentId, "like")}>👍 Like</Button>
        <Button onClick={() => onReact(componentId, "heart")}>❤️ Heart</Button>
        <Button onClick={() => onReact(componentId, "dislike")}>
          👎 Dislike
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ReactionDialog;
