//client.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process'); //maybe to help start the docker???
const { encrypt, decrypt } = require('eciesjs'); // for encryption/decrpytion

const STATE_FILE_PATH = '../mpc/state.json';
const ENCODING = 'utf8';

class State {
    constructor() {
        this.global_enum = "0";
        this.inputs = {};
        this.public_id_to_status = {};
        this.detective_public_key = "";
        this.output = "";
        this.private_id = "";
        this.detective_private_key = "";
    }
    constructor(json){
        this.global_enum = json.global_enum;
        this.inputs = json.inputs;
        this.public_id_to_status = json.public_id_to_status;
        this.detective_public_key = json.detective_public_key;
        this.output = json.output;
        this.private_id = json.private_id;
        this.detective_private_key = json.detective_private_key;
    }
}

const GamePhase = {
    //SETUP
    ROLE_DISTRIBUTION_JS: 1,
    GEN_DETECTIVE_KEYS_PY: 2,
    POPULATE_KEYS_JS: 3,
    // GAMEPLAY
    DETECTIVE_CHOICE_JS: 4,
    DETECTIVE_MPC_PY: 5,
    ANGEL_MAFIA_CHOICE_JS: 6,
    ANGEL_MAFIA_MPC_PY: 7,
    TALK_JS: 8,
    VOTE_MPC_PY: 9,
    GAME_OVER_ADMISSION_JS: 10
};

//SID is the same as private ID
const SID = [0, 1, 2, 3, 4];

const ROLE = {
    TOWNSPERSON: "Townsperson",
    MAFIA: "Mafia",
    ANGEL: "Angel",
    DETECTIVE: "Detective"
};

// 0,1 = Townsperson, 2 = Mafia, 3 = Angel, 4 = Detective
const ROLES_FROM_SID = {
    0: ROLE.TOWNSPERSON,
    1: ROLE.TOWNSPERSON,
    2: ROLE.MAFIA,
    3: ROLE.ANGEL,
    4: ROLE.DETECTIVE
};

const SID_FROM_ROLES = {
    [ROLE.TOWNSPERSON]: [0, 1],
    [ROLE.MAFIA]: [2],
    [ROLE.ANGEL]: [3],
    [ROLE.DETECTIVE]: [4]
};

/* Initializes the state file */
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

/* Reads the whole state.json file */
function read_state() {
    /*
    Reads and dumps the whole state.json file
    Returns the JSON.parse() of state.json
    */
    try {
        const data = fs.readFileSync(STATE_FILE_PATH, ENCODING);
        console.log(JSON.parse(data));
        return JSON.parse(data);
    }
    catch (err) {
        console.error('Error reading from state file');
        return null
    }
}

/* Writes to the state.json file */
function write_state(new_state) {
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
        const update_state = { ...current_state, ...new_state };
        console.log(update_state);
        fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(update_state, null, 2), ENCODING);
        console.log('Updated state file successfully');
        return true;
    } catch (err) {
        console.error('Error updating state:', err);
        return false;
    }
}

/* Reads the state.json to determine if a player is alive */
function is_player_alive(pid) {
    /*
    Checks if a player is alive given a pid:
    Returns true if alive, false if dead, otherwise null to designate an error state
    */
    try {
        const current_state = read_state();
        if (!current_state) {
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
    } catch (err) {
        console.error('An error occured while reading state');
        return null;
    }
}

/* Writes to the state.json to mark a player as dead */
function kill_player(pid) {
    /*
    Write a dead state to the state.json
    Returns true on a successful write, false otherwise
    */
    try {
        const state = read_state();
        if (!state) {
            console.error("State not loaded");
            return false;
        }
        state.public_id_to_status[pid] = "false"
        fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), ENCODING);
        console.log('Player is dead');
        return true;
    } catch (err) {
        console.error('An error occured while reading state');
        return false;
    }
}

/* TODO: DESIGN THIS FUNCTION TO DISTRIBUTE ROLES TO PLAYERS */
function role_distribution() { }

/* TODO: DESIGN THIS FUNCTION TO ASSIGN KEYS TO PLAYERS */
function populate_keys() {}

/* FIXME: Adjust this function */
function handle_detective_choice(state, detective_choice) {
    /*
      This function should handle the detective choice phase...
      Detective Choice: PID of the player to reveal; State is just the state.json file
      It should encrypt the choice and write it to the state.json file
      Returns true on a successful write, false otherwise
    */
    try {
        if (state.private_id != 4 || state.detective_private_key === "") {
            console.error("Player is not the detective!");
            return false;
        }
        const choice = "0\n" + detective_choice;
        const encrypted = encrypt(state.detective_private_key, choice);
        state.inputs[state.private_id] = encrypted;
        const retval = write_state(state);
        if (!retval) {
            console.error("Error writing to state");
            return false;
        }
    }
    catch (err) {
        console.error("Error handling detective choice");
        return false;
    }
}

/* FIXME: Adjust this function */
function handle_angel_mafia_choice(state, choice) {
    /*
      This function should handle the angel/mafia choice
      It should write these choices to JSON[INPUT] in the state.json file
      Returns true on a successful write, false otherwise
    */
    try {
        if (state.private_id !== 2 || state.private_id !== 3) {
            console.error("Player is not mafia or angel!");
            return false;
        }
        state.inputs[state.private_id] = choice;
        const retval = write_output_to_state(state);
        if (!retval) {
            console.error("Error writing to state");
            return false;
        }
    } catch (err) {
        console.error("Error handling angel/mafia choice");
        return false;
    }
}

/*FIXME: Adjust this function */
function handle_voting(state, vote) {
    /*
    This function should handle the voting phase for every player.
    Just write the choice made to the state.json file
    */
    try {
        state.inputs[state.private_id] = vote;
        const retval = write_output_to_state(state);
        if (!retval) {
            console.error("Error writing to state");
            return false;
        }
    }
    catch (err) {
        console.error("Error handling voting");
    }
}

/*TODO:  */
function handle_game_over() {}

/* Updates the enum based on the input phase */
function update_enum(phase) {
    /*
    Updates the global_enum in the state.json file, incrementing by 1
    Returns true on a successful write, false otherwise
    */
    try {
        const state = read_state();
        if (!state) {
            console.error("State not loaded!");
            return false;
        }
        state.global_enum = (phase).toString();
        const retval = write_output_to_state(state);
        if (!retval) {
            console.error("Error writing to state");
            return false;
        }
    } catch (err) {
        console.error("Error updating enum");
        return false;
    }
}

/* Starts the docker image to run the MPC */
function call_docker_image() {
    /* 
    Calls the docker image to run the MPC
    */
    // docker build -t mental-mafia .
    exec('docker build -t mental-mafia .', (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(stdout);
    });
    // docker run --rm -it -v ./state.json:/usr/src/MP-SPDZ/state.json mental-mafia
    exec('docker run --rm -it -v ./state.json:/usr/src/MP-SPDZ/state.json mental-mafia', (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(stdout);
    });
}

/* All emcompassing function to handle the game loop */
function game_loop(choice = 0) {
    /*
    This function should handle the game loop
    */
    try {
        const state = read_state();
        if (!state) {
            console.error("State not loaded!");
            return;
        }
        const game = new State(state);
        const phase = game.global_enum;
        if (!(phase in GamePhase)) {
            console.error("Unknown phase");
            return;
        }
        if (phase === GamePhase.ROLE_DISTRIBUTION_JS) {
            role_distribution(game);
            update_enum(GamePhase.GEN_DETECTIVE_KEYS_PY);
        }
        else if (phase === GamePhase.POPULATE_KEYS_JS) {
            populate_keys(game);
            update_enum(GamePhase.DETECTIVE_CHOICE_JS);
        }
        else if (phase === GamePhase.DETECTIVE_CHOICE_JS) {
            handle_detective_choice(choice, game);
            update_enum(GamePhase.DETECTIVE_MPC_PY);
        }
        else if (phase === GamePhase.ANGEL_MAFIA_CHOICE_JS) {
            handle_angel_mafia_choice(choice, game);
            update_enum(GamePhase.ANGEL_MAFIA_MPC_PY);
        }
        else if (phase === GamePhase.TALK_JS) {
            handle_voting(choice, game);
            update_enum(GamePhase.VOTE_MPC_PY);
        }
        else if (phase === GamePhase.GAME_OVER_ADMISSION_JS) {
            handle_game_over();
        }
        else {
            console.error("Unknown phase");
        }
    }
    catch (err) {
        console.error("Error in game loop");
    }
}

module.exports = {
    initialize_state_file,
    read_state,
    write_state,
    is_player_alive,
    kill_player,
    role_distribution,
    populate_keys,
    handle_detective_choice,
    handle_angel_mafia_choice,
    handle_voting,
    handle_game_over,
    update_enum,
    call_docker_image,
    game_loop
};