(function(gadgets, google, $) {
    var endpoint = 'https://{instance}.ryver.com/api/1/odata.svc/workrooms({id})/Chat.PostMessage',
        state = null;

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

    function setTitle() {
        if (state && state.descriptor)
            $('#ryver-room').text(state.descriptor);
    }

    function addParticipants(participants) {
        participants = participants || [];

        var currentUserId = google.hangout.getLocalParticipantId();

        for (var i=0; i < participants.length; i++) {
            if (currentUserId != participants[i]['id']) {
                var person = participants[i]['person'],
                    avatar = $('<img />').addClass('participant-list__item-avatar').attr('src', person['image']['url']),
                    content = $('<span />').addClass('participant-list__item-content').text(person.displayName),
                    item = $('<li />').addClass('participant-list__item').attr('data-id', person.id);

                item.append(avatar, content);

                $('#ryver-participant-list').append(item);
            }
        }
    }

    function removeParticipants(participants) {
        for (var i=0; i < participants.length; i++) {
            var person = participants[i]['person'];

            $("li[data-id]='" + person.id + "'").fadeOut().remove();
        }
    }

    function updateSharedState(data) {
        google.hangout.data.submitDelta(data);
    }

    function onStateChange(evt) {
        console.debug('state changed: ', evt);
        state = evt.state;
    }

    function onParticipantsChange(evt) {
        console.debug('participants changed: ', evt);
    }

    function onParticipantsAdded(evt) {
        console.debug('participants added: ', evt);
        addParticipants(evt.addedParticipants);
    }

    function onParticipantsRemoved(evt) {
        console.debug('participants removed: ', evt);
        removeParticipants(evt.removedParticipants);
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
                addParticipants(google.hangout.getParticipants());
            }

            setTitle();

            google.hangout.data.onStateChanged.add(onStateChange);
            google.hangout.onParticipantsChanged.add(onParticipantsChange);
            google.hangout.onParticipantsAdded.add(onParticipantsAdded);
            google.hangout.onParticipantsRemoved.add(onParticipantsRemoved);
            google.hangout.onApiReady.remove(onApiReady);
        }
    }

    function init() {
        google.hangout.onApiReady.add(onApiReady);
    }

    gadgets.util.registerOnLoadHandler(init);
})(gadgets, gapi, jQuery);