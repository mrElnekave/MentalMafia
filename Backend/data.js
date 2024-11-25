// data.js
const fs = require('fs');
const path = require('path');

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
    // PERSONAL STATE
    private_id: "",               // Private_id (generated PY side)
    detective_private_key: "",    // Only detective has this; otherwise null
    // SHARED STATE
    public_id_to_status: {},      // Map public_id (generated JS side) to status (a/d)
    detective_public_key: "",     // Detective PK is shared everywhere
    global_enum: "0",             // Describes phase of game; passes ball between py/js
    inputs: {},                   // Map secret_id to input for each
    output: ""                    // Result of MPC for MPC phases for JS to read
  };
  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(initialState, null, 2), ENCODING);
  console.log('State file initialized.');
}

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

function write_state(new_state){
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

function write_output_to_state(result){
  /*
  Writes to the output entry of the state.json file
  Returns true on a successful write, false otherwise
  */
  try {
    const state = read_state();
    if (!state){
      console.error("Error reading current state");
      return false;
    }
    state.output = result;
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), ENCODING);
    return true;
  } catch (err) {
    console.error('An error occured while writing output: ', err);
    return false
  }
}

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

module.exports = {
  users,
  generateId,
  initialize_state_file,
  read_state,
  write_state,
  populate_input_from_state,
  write_output_to_state,
  is_player_alive,
  kill_player
};
