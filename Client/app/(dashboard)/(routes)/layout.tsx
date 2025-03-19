import React from "react";
import { ReactNode } from "react";
import SideNav from "../_components/SideNav";
import TopHeader from "../_components/TopHeader";

interface MyComponentProps {
  children: ReactNode;
}

const layout = ({ children }: MyComponentProps) => {
  return (
    <div suppressHydrationWarning={true}>
      <div className="h-full   w-52 flex-col fixed inset-y-0 z-50 md:flex hidden ">
        <SideNav />
      </div>
      <div className="md:ml-64 ">
        <TopHeader />
        <div className="mt-20">{children}</div>
      </div>
    </div>
  );
};

export default layout;
