// data.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process'); //maybe to help start the docker???
const { encrypt, decrypt } = require('eciesjs'); //

const users = {}; // Stores user info by userid
const STATE_FILE_PATH = '../state.json';
const ENCODING = 'utf8';

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function initialize_state_file() {
  /*
  Initializes the state.json with the correct fields 
  */
  const initialState = {
    // SHARED STATE
    global_enum: "0",             // Describes phase of game; passes ball between py/js
    inputs: {},                   // Map secret_id to input for each
    public_id_to_status: {},      // Map public_id (generated JS side) to status (a/d)
    detective_public_key: "",     // Detective PK is shared everywhere
    output: "",                   // Result of MPC for MPC phases for JS to read
    // PERSONAL STATE
    private_id: "",               // Private_id (generated PY side)
    detective_private_key: ""     // Only detective has this; otherwise null
  };
  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(initialState, null, 2), ENCODING);
  console.log('State file initialized.');
}

//THIS FUNCTION IS GOOD: USED EVERYWHERE
function read_state(){
/*
Reads and dumps the whole state.json file
Returns the JSON.parse() of state.json
*/
  try {
    const data = fs.readFileSync(STATE_FILE_PATH, ENCODING);
    console.log(JSON.parse(data));
    return JSON.parse(data);
  }
  catch (err){
    console.error('Error reading from state file');
    return null
  }
}

//THIS FUNCTION IS GOOD: MIRRORS WRITE_OUTPUT_TO_STATE()
function write_output_to_state(new_state){
  /*
  Updates the state.json file with a new state
  Returns true on a successful write, false otherwise
  */
  try {
    const current_state = read_state();
    if (!current_state) {
      console.error('Uninitialized current state');
      return false;
    }
    const update_state = {...current_state, ...new_state };
    console.log(update_state);
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(update_state, null, 2), ENCODING);
    console.log('Updated state file successfully');
    return true;
  } catch (err) {
    console.error('Error updating state:', err);
    return false;
  }
}

/* FIXME: REDO THIS FUNCTION TO MIRROR PY VERSION */
function populate_input_from_state(){
  /*
  Populates the input from the state file
  Returns the input mapping from state.json
  */
  try {
    const current_state = read_state();
    if (!current_state){
      console.error("Unable to read state");
      return {};
    }
    const input_mapping = current_state.inputs;
    console.log('Inputs Mapping:', input_mapping);
    return input_mapping;
  }
  catch (err) {
    console.error('Error while populating inputs: ', err);
    return {}
  }
}

//THIS FUNCTION IS GOOD FOR FRONTEND CHECK
function is_player_alive(pid){
  /*
  Checks if a player is alive given a pid:
  Returns true if alive, false if dead, otherwise null to designate an error state
  */
  try {
    const current_state = read_state();
    if (!current_state){
      console.error("State not loaded");
      return null;
    }
    const val = current_state.public_id_to_status[pid];
    if (val === "true") return true;
    else if (val === "false") return false;
    else {
      console.log('Unknown value');
      return null;
    }
  } catch(err) {
    console.error('An error occured while reading state');
    return null;
  }
}

//THIS FUNCTION IS GOOD FOR FRONTEND WRITE
function kill_player(pid){
  /*
  Write a dead state to the state.json
  Returns true on a successful write, false otherwise
  */
  try {
    const state = read_state();
    if (!state){
      console.error("State not loaded");
      return false;
    }
    state.public_id_to_status[pid] = "false"
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), ENCODING);
    console.log('Player is dead');
    return true;
  } catch(err) {
    console.error('An error occured while reading state');
    return false;
  }
}

/* TODO: DESIGN THIS FUNCTION TO ENCRYPT DATA, WRITE TO JSON[OUTPUT] I ASSUME */
function handle_detective_choice(){}

/* TODO: DESIGN THIS FUNCTION TO HANDLE ANGEL/MAFIA CHOICE TO SEND IN OUTPUT */
function handle_angel_mafia_choice(){}

/* TODO: DESIGN THIS FUNCTION TO CALL THE DOCKER IMAGE; LOW PRIORITY */
function call_docker_image(){}

/* TODO: DESIGN THIS FUNCTION TO DISTRIBUTE ROLES TO PLAYERS */
function role_distribution(){}

/* TODO: DESIGN THIS FUNCTION TO ASSIGN KEYS TO PLAYERS */
function populate_keys(){}

module.exports = {
  users,
  generateId,
  initialize_state_file,
  read_state,
  populate_input_from_state,
  write_output_to_state,
  is_player_alive,
  kill_player
};
