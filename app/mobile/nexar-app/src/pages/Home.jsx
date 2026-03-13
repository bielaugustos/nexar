export default function Home(){

 const todayWord = "Focus"

 const todayMessage =
 "Small actions today create the person you become tomorrow."

 return(

  <div>

   <h1>n.</h1>

   <div className="card">

    <h2>Word of the Day</h2>

    <h1 style={{fontSize:"42px"}}>
     {todayWord}
    </h1>

    <p>{todayMessage}</p>

   </div>

   <div className="card">

    <h3>Today's Reflection</h3>

    <p>
     What small habit will move your life forward today?
    </p>

   </div>

   <div className="card">

    <h3>Progress</h3>

    <p>Habits Completed: 3</p>

    <p>Points Earned Today: 40</p>

   </div>

  </div>

 )

}