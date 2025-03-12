import React from "react";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";

const BasePage = ({ children, navItems }) => {
  return (
    <>
      <Navbar navItems={navItems} />
      {children}
      <Footer />
    </>
  );
};

export default BasePage;
