(function(gadgets, google, $) {
    var endpoint = 'https://{instance}.ryver.com/api/1/odata.svc/workrooms({id})/Chat.PostMessage',
        state = null;

    function setTitle() {
        if (state && state.descriptor)
            $('#ryver-room').text(state.descriptor);
    }

    function onStateChange(evt) {
        console.debug('state changed: ', evt);
        state = evt.state;
    }

    function onParticipantsChange(evt) {
        console.debug('participants changed: ', evt);
    }

    function onParticipantsAdded(evt) {
        // todo: set room descriptor in header bar
        console.debug('participants added: ', evt);
        var participants = evt.addedParticipants;

        for (var i=0; i < participants.length; i++) {
            var person = participants[i]['person'],
                avatar = $('<img />').addClass('participant-list__item-avatar').attr('src', person['image']['url']),
                content = $('<span />').addClass('participant-list__item-content').text(person.displayName),
                item = $('<li />').addClass('participant-list__item').attr('data-id', person.id);

            item.append(avatar, content);

            $('#ryver-participant-list').append(item);
        }
    }

    function onParticipantsRemoved(evt) {
        console.debug('participants removed: ', evt);

        var participants = evt.removedParticipants;

        for (var i=0; i < participants.length; i++) {
            var person = participants[i]['person'];

            $("[data-id]='" + person.id + "'").fadeOut().remove();
        }
    }

    function onApiReady(evt) {
        if (evt.isApiReady) {
            console.debug('api ready: ', evt);
            var startData = google.hangout.getStartData();

            if (startData) {
                state = JSON.parse(startData);
                updateSharedState(state);
                setupEndpoint();
                consumer({'body': google.hangout.getHangoutUrl()});
            } else {
                state = google.hangout.data.getState();
            }

            setTitle();

            google.hangout.data.onStateChanged.add(onStateChange);
            google.hangout.onParticipantsChanged.add(onParticipantsChange);
            google.hangout.onParticipantsAdded.add(onParticipantsAdded);
            google.hangout.onParticipantsRemoved.add(onParticipantsRemoved);
            google.hangout.onApiReady.remove(onApiReady);
        }
    }

    function updateSharedState(data) {
        google.hangout.data.submitDelta(data);
    }

    function setupEndpoint() {
        var data = state || google.hangout.data.getState();

        var map = {
            '{instance}': data.instance,
            '{id}': data.id
        };

        var re = new RegExp(Object.keys(map).join("|"),"gi");

        endpoint = endpoint.replace(re, function(matched) {
            return map[matched.toLowerCase()];
        });
    }

    function consumer(data) {
        console.debug('data: ', data);
        console.debug('endpoint: ', endpoint);
        console.debug('state: ', state);

        if (data && endpoint) {
            return $.ajax({
                url: endpoint,
                type: 'POST',
                contentType: 'application/json',
                accepts: {'json': 'application/json'},
                data: JSON.stringify(data),
                headers: {
                    'Contatta-Session': state.session
                }
            });
        }
    }

    function init() {
        google.hangout.onApiReady.add(onApiReady);
    }

    gadgets.util.registerOnLoadHandler(init);
})(gadgets, gapi, jQuery);