import { useState, useEffect } from "react";

export default function DailyWord(){

 const [word,setWord] = useState("");

 const words = [
   "Patience",
  "Clarity",
  "Focus",
  "Courage",
  "Discipline",
  "Balance"
 ];

 useEffect(()=>{

  const day = new Date().getDate();

  const selectedWord = words[day % words.length];

  setWord(selectedWord);

 },[]);

 return(

  <h2 className="daily-word">
   {word}
  </h2>

 );

}