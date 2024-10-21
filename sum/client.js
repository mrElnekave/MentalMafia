
let round_count = 0;
let party_count = 3;

function connect() {

  var role = $('#role').val();
  if (role === 'mafia') {
    $('div[hidden=true]').show();
    $('button[hidden=true]').hide();
  } else {
    $('div[hidden=true]').hide();
    $('#submit0_button').show();
    $('#submit0_button').attr('disabled', false);
  }

  $('#connectButton').prop('disabled', true);
  var computation_id = $('#computation_id').val();

  var options = { party_count: party_count};
  options.onError = function (_, error) {
    $('#output').append("<p class='error'>"+error+'</p>');
  };

  options.onConnect = function () {
    console.log('enabled');
    $('#button').attr('disabled', false); $('#output').append('<p>All parties Connected!</p>');
  };

  var hostname = window.location.hostname.trim();
  var port = window.location.port;
  if (port == null || port === '') {
    port = '80';
  }
  if (!(hostname.startsWith('http://') || hostname.startsWith('https://'))) {
    hostname = 'http://' + hostname;
  }
  if (hostname.endsWith('/')) {
    hostname = hostname.substring(0, hostname.length-1);
  }
  if (hostname.indexOf(':') > -1 && hostname.lastIndexOf(':') > hostname.indexOf(':')) {
    hostname = hostname.substring(0, hostname.lastIndexOf(':'));
  }

  hostname = hostname + ':' + port;
  mpc.connect(hostname, computation_id, options);

}

function submit0() {
  $('#submit0_button').attr('disabled', true);
  $('#output').append('<p>Starting...</p>');
  var promise = mpc.compute(0);
  promise.then(handleResult);
  round_count++;
}


function submit() {
  var input = parseInt($('#number').val());

  if (isNaN(input)) {
    $('#output').append("<p class='error'>Input a valid number!</p>");
  } else if (100 < input || input < 0 || input !== Math.floor(input)) {
    $('#output').append("<p class='error'>Input a WHOLE number between 0 and 100!</p>");
  } else {
    $('#button').attr('disabled', true);
    $('#output').append('<p>Starting...</p>');
    var promise = mpc.compute(input);
    promise.then(handleResult);
  }
  round_count++;
}

function handleResult(result) {
  $('#output').append('<p>Result is: ' + result + '</p>');
  $('#button').attr('disabled', false);
  $('#submit0_button').attr('disabled', false);

  // connect();

  // redo the sum number
  $('#button').attr('disabled', false);
  $('#number').val('');

}
