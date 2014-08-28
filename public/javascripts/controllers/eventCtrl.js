angular.module('app')
.controller('eventCtrl', ['$scope', function($scope) {

  var _SEC = 1000;
  var _MIN = _SEC * 60;
  var _HOUR = _MIN * 60;
  var _DAY = _HOUR * 24;

  function inSeconds(milliseconds) { return ~~(milliseconds / _SEC); }
  function inMinutes(milliseconds) { return ~~(milliseconds / _MIN); }
  function inHours(milliseconds) { return ~~(milliseconds / _HOUR); }
  function inDays(milliseconds) { return ~~(milliseconds / _DAY); }
  function roundToMinutes(timestamp) { return ~~(timestamp / _MIN); }
  function roundToHours(timestamp) { return ~~(timestamp / _HOUR); }
  function roundToDays(timestamp) { return ~~(timestamp / _DAY); }

  var events = {
    'sleep': {
      'on': null,
      'interrupted': false,
      'timestamp': null,
      'bar': angular.element(document.querySelector('#bar-sleep')),
      'block':angular.element(document.querySelector('#block-sleep')),
      'timetext':angular.element(document.querySelector('#time-sleep')),
      'duration': 10 * _HOUR,
      'repeat': _DAY,
    },
    'agm': {
      'on': null,
      'winner': null,
      'timestamp': null,
      'bar': angular.element(document.querySelector('#bar-agm')),
      'block':angular.element(document.querySelector('#block-agm')),
      'timetext':angular.element(document.querySelector('#time-agm')),
      'duration': 2 * _HOUR,
      'repeat':3 * _HOUR,
    },
    'fishing': {
      'on': null,
      'winner': null,
      'timestamp': null,
      'bar': angular.element(document.querySelector('#bar-fishing')),
      'block':angular.element(document.querySelector('#block-fishing')),
      'timetext':angular.element(document.querySelector('#time-fishing')),
      'duration': 2 * _HOUR,
      'repeat': _DAY,
    }
  }

  function initTimestamp(key) {
    var now = new Date();
    var hours = getServerHour(now);
    var basetime = roundToDays(now.getTime()) * _DAY;
    console.log("current hour", hours);
    var hourMod;
    switch (key) {
    case "sleep":   hourMod = ((hours > 21) ? 22 : ((hours >  9) ? 10 : -2)); break;
    case "fishing": hourMod = ((hours < 14) ? -8 : ((hours < 16) ? 14 : 16)); break;
    case "agm":
      var rest = (hours % 3);
      hourMod = (hours - rest);
      break;
    default:
      hourMod = roundToHours(now.getTime()) * _HOUR;
        break;
    }
    console.log("new hour mod", (hourMod - 2) * _HOUR);
    console.log("new hour mod suite", (hourMod - 2) * _HOUR + basetime);
    console.log("new hour mod sourc", now.getTime());
    return ((hourMod - 2) * _HOUR) + basetime;
  }

  function timestampInString(timestamp) {
    var hours = inHours(timestamp + _MIN);
    timestamp -= (hours * _HOUR);
    var minutes = inMinutes(timestamp);
    if (minutes < 10) { minutes = '0' + minutes; }
    return hours + 'h' + minutes;
  }

  function getServerHour(now) {
    var hours = now.getUTCHours() + 2; // force french time
    if (hours > 23) {
      hours -= 24;
    }
    return hours;
  }

  function toggleEvent(key, on, timestamp) {
    var cachedEvent = events[key];
    if (on)
      cachedEvent.block.removeClass('inactive');
    else
      cachedEvent.block.addClass('inactive');
    if (cachedEvent.on !== on) {
      cachedEvent.timestamp = (cachedEvent.on === null) ? initTimestamp(key) : timestamp;
      cachedEvent.on = on;
    }
  }

  function refreshEvents() {
    var now = new Date();
    var minutes = now.getUTCMinutes();
    var hours = getServerHour(now);
    var timestamp = now.getTime();
    timestamp = roundToHours(timestamp) * _HOUR;
    toggleEvent('sleep', (hours > 21 || hours < 9), timestamp);
    toggleEvent('agm', (!(hours % 3) || !((hours - 1) % 3)), timestamp);
    toggleEvent('fishing', (hours > 13 && hours < 17), timestamp);

    console.log(events);
    setTimeout(refreshEvents, 3600000 - ((minutes * 60000) + (now.getUTCSeconds() * 1000) + now.getUTCMilliseconds()));
  }

  function calculateWidth(key, timestamp) {
    var cachedEvent = events[key];
    console.log('a', (timestamp - cachedEvent.timestamp) , (cachedEvent.duration));
    console.log('b', (timestamp - cachedEvent.timestamp) , (cachedEvent.repeat));
    if (cachedEvent.on) {
      // cachedEvent.block.text('on');
      cachedEvent.timetext.text(timestampInString((cachedEvent.duration - (timestamp - cachedEvent.timestamp))) + " left");
      cachedEvent.bar.css("width", (100 - (((timestamp - cachedEvent.timestamp) / cachedEvent.duration) * 100)) +'%');
    }
    else {
      // cachedEvent.block.text('off');
      cachedEvent.timetext.text("in " + timestampInString(((cachedEvent.repeat - (timestamp - cachedEvent.timestamp)))));
      cachedEvent.bar.css("width", (((timestamp - cachedEvent.timestamp) / cachedEvent.repeat) * 100) +'%');
    }
  }

  function updateBars() {
    var now = new Date();
    var minutes = now.getUTCMinutes();
    var hours = getServerHour(now);
    var timestamp = now.getTime();
    calculateWidth('sleep', timestamp);
    calculateWidth('agm', timestamp);
    calculateWidth('fishing', timestamp);
    console.log("DEBUG updateBars:", hours + ':' + minutes);
    setTimeout(updateBars, 60000 - ((now.getUTCSeconds() * 1000) + now.getUTCMilliseconds()));
  }

  refreshEvents();
  updateBars();
}]);
