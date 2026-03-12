export default function HabitItem({habit,toggle}){

 return(

  <div className="habit">

   <input
    type="checkbox"
    checked={habit.done}
    onChange={toggle}
   />

   <span>{habit.name}</span>

  </div>

 )

}