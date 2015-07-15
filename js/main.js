(function(gadgets, google, $) {
    var endpoint = 'https://{instance}.ryver.com/api/1/odata.svc/workrooms({id})/Chat.PostMessage';

    function setTitle(params) {
        if (params && params.descriptor)
            $('#ryver-room').text(params.descriptor);
    }

    function onParticipantsChange(evt) {
        console.debug('participants changed: ', evt);
    }

    function onParticipantsAdded(evt) {
        // todo: add participants to list
        // todo: set room descriptor in header bar
        console.debug('participants added: ', evt);
    }

    function onParticipantsRemoved(evt) {
        // todo: remove participants from list
        console.debug('participants removed: ', evt);
    }

    function onApiReady(evt) {
        if (evt.isApiReady) {
            var params = google.hangout.getStartData();

            if (params) {
                params = JSON.parse(params);
                setTitle(params);
                setupEndpoint(params);
                updateSharedState(params);
                consumer({'body': google.hangout.getHangoutUrl()});
            }

            google.hangout.onParticipantsChanged.add(onParticipantsChange);
            google.hangout.onParticipantsAdded.add(onParticipantsAdded);
            google.hangout.onParticipantsRemoved.add(onParticipantsRemoved);
            google.hangout.onApiReady.remove(onApiReady);
        }
    }

    function updateSharedState(data) {
        google.hangout.data.submitDelta(data);
    }

    function setupEndpoint(params) {
        var state = params || google.hangout.data.getState();

        if (!state) return null;

        console.debug('state: ', state);

        var map = {
            '{instance}': state.instance,
            '{id}': state.id
        };

        var re = new RegExp(Object.keys(map).join("|"),"gi");

        endpoint = endpoint.replace(re, function(matched) {
            return map[matched.toLowerCase()];
        });
    }

    function consumer(data) {
        console.debug('data: ', data);
        console.debug('endpoint: ', endpoint);

        if (data && endpoint) {
            return $.ajax({
                url: endpoint,
                type: 'POST',
                contentType: 'application/json',
                data: data
            });
        }
    }

    function init() {
        google.hangout.onApiReady.add(onApiReady);
    }

    gadgets.util.registerOnLoadHandler(init);
})(gadgets, gapi, jQuery);