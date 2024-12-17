import React from "react";
import Demo from "@/app/_components/Demo";
import InputAndLink from "@/app/_components/InputAndLink";
import Pricing from "@/app/_components/Pricing";
import Hero from "@/app/_components/Hero";
import Features from "@/app/_components/Features";
import Header from "./_components/Header";
import Footer from "./_components/Footer";
import ProtectedRoutes from "@/app/_components/ProtectedRoutes";

const page = () => {
  return (
    <>
      <Header />
      <Hero />
      <Features />
      <InputAndLink />
      <Pricing />
      <Demo />
      <Footer />
    </>
  );
};

export default page;
