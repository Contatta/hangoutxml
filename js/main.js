(function(google, $) {
    var state = null,
        participants = null;

    function onStateChange(evt) {
        state = evt.state;
        console.debug(state);
    }

    function onParticipantChange(evt) {
        participants = evt.participants;
        //for (var i = 0;i < participants.length; i++) {
        //
        //}
        console.debug(participants);
    }

    function onApiReady(evt) {
        var params = gadgets.views.getParams()['appData'];
        console.debug(params);
    }

    function sharedState(data) {
        google.hangout.data.submitDelta(data);
    }

    google.hangout.data.onStateChange.add(onStateChange);
    google.hangout.data.onParticipantChange.add(onParticipantChange);
    google.hangout.onApiReady.add(onApiReady);
})(gapi, JQuery);