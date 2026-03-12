import { useState } from "react";
import HabitList from "./components/HabitList";
import DailyWord from "./components/DailyWord";

export default function App() {

  const [points,setPoints] = useState(0);

  function addPoints(){
    setPoints(points + 10);
  }

  return (

    <div className="app">

      <header>

        <h1>NEX</h1>
        <p>Points: {points}</p>

      </header>

      <main>

        <DailyWord />

        <HabitList onComplete={addPoints} />

      </main>

    </div>

  );

}