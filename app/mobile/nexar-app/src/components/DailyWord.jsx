import { useEffect, useState } from "react";

const words = [
"Clarity",
"Focus",
"Patience",
"Discipline",
"Courage",
"Creation",
"Balance"
];

export default function DailyWord(){

 const [word,setWord] = useState("");

 useEffect(()=>{

   const day = new Date().getDate();
   const selected = words[day % words.length];

   setWord(selected);

 },[]);

 return (
  <h2 className="daily-word">
   {word}
  </h2>
 );
}