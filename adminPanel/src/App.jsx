import { Routes, Route, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/header/Header";
import LoginPage from "./pages/LoginPage";

const MainLayout = ()=>{
  <div className="flex min-h-screen ">
    {/* <Sidebar /> */}
    <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col overflow-hidden">
      <Header />
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <Outlet />
      </div>
    </div>
  </div>
}
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />}/>
      <Route element={<MainLayout/>}>
      
      </Route>
    </Routes>
  )
}

export default App
