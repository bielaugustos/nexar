import {BrowserRouter,Routes,Route} from "react-router-dom"

import Home from "./pages/Home"
import Habits from "./pages/Habits"
import Rewards from "./pages/Rewards"
import Profile from "./pages/Profile"
import Chat from "./pages/Chat"

import Navbar from "./components/NavBar"

export default function App(){

 return(

  <BrowserRouter>

   <div className="app">

    <Routes>

     <Route path="/" element={<Home/>}/>
     <Route path="/habits" element={<Habits/>}/>
     <Route path="/rewards" element={<Rewards/>}/>
     <Route path="/profile" element={<Profile/>}/>
     <Route path="/chat" element={<Chat/>}/>

    </Routes>

   </div>

   <Navbar/>

  </BrowserRouter>

 )

}