import { Footer, Header } from "../shared/components";
import { Outlet } from "react-router-dom";

const PublicLayout = () => {
  return (
    <>
      <div className="min-h-screen flex flex-col bg-brand-dark text-white selection:bg-brand-blue selection:text-white font-sans">
        <Header />
        <Outlet />
        <Footer />
      </div>
    </>
  );
};

export default PublicLayout;
