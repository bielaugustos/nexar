import { useState,useEffect } from "react";
import DailyWord from "./components/DailyWord";
import HabitList from "./components/HabitList";
import { saveData,loadData } from "./services/storage";
import ProgressBar from "./components/ProgressBar";

export default function App(){

 const [points,setPoints] = useState(0);

 useEffect(()=>{

  const savedPoints = loadData("points");

  if(savedPoints){
   setPoints(savedPoints);
  }

 },[]);

 useEffect(()=>{

  saveData("points",points);

 },[points]);

 function addPoints(){
  setPoints(points + 10);
 }

 return(

  <div className="app">

   <header>

    <h1>NEX</h1>
    <p>Points: {points}</p>

   </header>

   <DailyWord/>

   <HabitList onHabitCompleted={addPoints}/>

   <ProgressBar value={40}></ProgressBar>

  </div>

 )

}