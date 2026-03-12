import Container from "./components/Container";
import Card from "./components/Card";
import SectionTitle from "./components/SectionTitle";
import ProgressBar from "./components/ProgressBar";
import HabitList from "./components/HabitList";

export default function App(){

 return(

  <Container>

   <header>
    <h1>NEX</h1>
   </header>

   <Card>

    <SectionTitle text="Today's Focus"/>

    <h2 className="daily-word">
     Clarity
    </h2>

   </Card>

   <Card>

    <SectionTitle text="Habits"/>

    <HabitList/>

   </Card>

   <Card>

    <SectionTitle text="Progress"/>

    <ProgressBar value={40}/>

   </Card>

  </Container>

 )

}