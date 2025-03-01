import React from "react";
import { IconArrowNarrowDown } from "@tabler/icons-react";
import classes from "./ScrollDownArrow.module.css";

const ScrollDownArrow = () => {
  return (
    <div className={classes.arrowContainer}>
      <IconArrowNarrowDown    size={58} className={classes.arrow} />
    </div>
  );
};

export default ScrollDownArrow;