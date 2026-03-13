import { useState } from "react";

export default function HabitList({onHabitCompleted}){

 const [habits,setHabits] = useState([
  {name:"Exercise",done:false},
  {name:"Study",done:false},
  {name:"Read",done:false}
 ]);

 function toggleHabit(index){

  const updatedHabits = [...habits];

  const habit = updatedHabits[index];

  habit.done = !habit.done;

  if(habit.done){
   onHabitCompleted();
  }

  setHabits(updatedHabits);

 }

 return(

  <div>

   <h3>Habits</h3>

   {habits.map((habit,index)=>(

    <div key={index} className="habit">

     <input
      type="checkbox"
      checked={habit.done}
      onChange={()=>toggleHabit(index)}
     />

     <span>{habit.name}</span>

    </div>

   ))}

  </div>

 )

}