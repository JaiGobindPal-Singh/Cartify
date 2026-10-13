import { Routes, Route, Outlet } from "react-router-dom";
import Sidebar from "./components/sidebar/Sidebar";
import Header from "./components/header/Header";
import LoginPage from "./pages/LoginPage";
import Homepage from "./pages/Homepage";
import { useEffect, useState } from "react";
import { getUser } from "./services/user.service";
import { Link } from "react-router-dom";
import Products from "./pages/products/Products";
import ProductDetails from "./pages/products/ProductDetails";
import Categories from "./pages/categories/Categories";
import CategoryDetails from "./pages/categories/CategoryDetails";
const MainLayout = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  useEffect(() => {
    //getting the user
    getUser().then((userData) => {
      setUser(userData);
      setIsLoading(false);
    });
    
  }, []);
  
  if(isLoading) return (
    <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
      <span className="text-lg font-semibold tracking-tight">Loading...</span>
    </div>
  );
  
  if (!user || !user?.id) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-background text-foreground">
        <span className="text-lg font-semibold tracking-tight">Unauthorized</span>
        
        <Link to="/login">Login</Link>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar user={user} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden bg-background md:ml-64">
        <Header user={user} />
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          <Outlet context={user} />
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<MainLayout />}>
      {/* dashboard */}
        <Route path="/" element={<Homepage />} />
        {/* product routes */}
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        
        <Route path="/categories" element={<Categories/>}/>
        <Route path="/categories/:id" element={<CategoryDetails/>}/>
      </Route>
    </Routes>
  );
}

export default App;
