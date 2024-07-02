import { DataStore, TimerData } from './interfaces';
import fs from 'fs';

let data: DataStore;
let dataHasBeenRetrievedFromFile = false;
const timerData: TimerData = {
  timers: []
};

const dataStorePath = 'src/dataFile.json';

// NOTE: MUST use setData() at the end of every function now to store the data physically
// Make sure you have setData() at the end of any Iteration 1 functions

/*
Example usage :
    let store = getData()
    console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Rando'] }

    names = store.names

    names.pop()
    names.push('Jake')

    console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Jake'] }
    setData(store)
*/

function storeData(data: DataStore) {
  fs.writeFileSync(dataStorePath, JSON.stringify(data));
}

function retrieveData() {
  if (dataHasBeenRetrievedFromFile) {
    return;
  }

  if (!fs.existsSync(dataStorePath)) {
    data = {
      users: [],
      quizzes: [],
      latestQuizId: 0,
      latestUserId: 0,
      latestQuizSessionId: 0,
      latestPlayerId: 0,
      userSessions: [],
      quizSessions: [],
    };
    storeData(data);
    dataHasBeenRetrievedFromFile = true;
  }

  dataHasBeenRetrievedFromFile = true;
  data = JSON.parse(fs.readFileSync(dataStorePath, { encoding: 'utf-8' }));
}

// Use get() to access the data
export function getData(): DataStore {
  retrieveData();
  return data;
}

// Use set(newData) to pass in the entire data object, with modifications made
export function setData(newData: DataStore) {
  data = newData;
  storeData(data);
}

export function getTimers(): TimerData {
  return timerData;
}
