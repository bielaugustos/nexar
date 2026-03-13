import {Link} from "react-router-dom"

import {
 House,
 CheckCircle,
 Gift,
 User,
 ChatCircle
} from "phosphor-react"

export default function Navbar(){

 return(

  <nav className="navbar">

   <Link className="navItem" to="/">
    <House size={24}/>
    Home
   </Link>

   <Link className="navItem" to="/habits">
    <CheckCircle size={24}/>
    Habits
   </Link>

   <Link className="navItem" to="/rewards">
    <Gift size={24}/>
    Rewards
   </Link>

   <Link className="navItem" to="/chat">
    <ChatCircle size={24}/>
    Mentor
   </Link>

   <Link className="navItem" to="/profile">
    <User size={24}/>
    Profile
   </Link>

  </nav>

 )

}