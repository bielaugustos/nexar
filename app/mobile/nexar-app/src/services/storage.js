export function saveData(key,data){

 localStorage.setItem(
  key,
  JSON.stringify(data)
 );

}

export function loadData(key){

 const item = localStorage.getItem(key);

 if(!item){
  return null;
 }

 return JSON.parse(item);

}