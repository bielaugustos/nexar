import { useState } from "react";

export default function HabitList(){

 const [habits,setHabits] = useState([
   {name:"Exercise",done:false},
   {name:"Study",done:false},
   {name:"Read",done:false}
 ]);

 function toggleHabit(index){

  const updated = [...habits];
  updated[index].done = !updated[index].done;

  setHabits(updated);
 }

 return(

  <div>

   <h3>Habits</h3>

   {habits.map((habit,index)=>(
     <div key={index}>

       <input
        type="checkbox"
        checked={habit.done}
        onChange={()=>toggleHabit(index)}
       />

       {habit.name}

     </div>
   ))}

  </div>

 );

}