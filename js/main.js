(function(google, $) {
    var endpoint = 'https://${instance}.ryver.com/api/1/odata.svc/workrooms(${id})/Chat.PostMessage';

    function onParticipantChange(evt) {
        console.debug(evt);
    }

    function onApiReady(evt) {
        if (evt.isApiReady) {
            var params = google.hangout.getStartData();

            console.debug(params);

            if (params) {
                sharedState(params);
                consumer({'body': google.hangout.getHangoutUrl()});
            }

            google.hangout.data.onParticipantChange.add(onParticipantChange);
            google.hangout.onApiReady.remove(onApiReady);
        }
    }

    function sharedState(data) {
        google.hangout.data.submitDelta(data);
    }

    function setupEndpoint() {
        var state = google.hangout.data.getState();

        if (!state) return null;

        state = JSON.parse(state);

        var map = {
            '${instance}': state.instance,
            '${id}': state.id
        };

        var re = new RegExp(Object.keys(map).join("|"),"gi");

        return endpoint.replace(re, function(matched) {
            return map[matched.toLowerCase()];
        });
    }

    function consumer(data) {
        console.debug('data: ', data);
        console.debug('endpoint: ', setupEndpoint());

        //return $.ajax({
        //    url: setupEndpoint(),
        //    type: 'POST',
        //    data: data
        //});
    }

    google.hangout.onApiReady.add(onApiReady);
})(gapi, jQuery);