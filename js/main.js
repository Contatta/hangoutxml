(function(gadgets, google, $) {
    var endpoint = 'https://{instance}.ryver.com/api/1/odata.svc/workrooms({id})/Chat.PostMessage',
        state = null;

    function consumer(data) {
        console.debug('data: ', data);
        console.debug('endpoint: ', endpoint);

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
            var participant = participants[i],
                person = participant['person'],
                exists = !!$("li[data-id='" + participant.id + "']").length;

            if (currentUserId != participant['id'] && !exists) {
                var avatar = $('<img />').addClass('participant-list__item-avatar').attr('src', person['image']['url']),
                    content = $('<span />').addClass('participant-list__item-content').text(person.displayName),
                    item = $('<li />').addClass('participant-list__item').attr('data-id', participant.id);

                item.append(avatar, content);
                item.on('click', onParticipantClicked);

                $('#ryver-participant-list').append(item);
            }
        }
    }

    function removeParticipants(participants) {
        for (var i=0; i < participants.length; i++) {
            var participant = participants[i];

            $("li[data-id='" + participant.id + "']").fadeOut().remove();
        }
    }

    // Displays the video feed that would normally be
    // visible if the app.  The DefaultVideoFeed generally
    // shows feeds based on their volume level.
    function showDefaultFeed() {

        // Remove the highlighting.
        if (currentHighlightedParticipantId) {
            google.hangout.av.clearAvatar(currentHighlightedParticipantId);
        }

        currentHighlightedParticipantId = null;

        var feed = google.hangout.layout.getDefaultVideoFeed();
        var canvas = google.hangout.layout.getVideoCanvas();

        canvas.setVideoFeed(feed);
        canvas.setWidth(600);
        canvas.setPosition(300, 50);
        canvas.setVisible(true);

        // Update the text
        //updateDisplayedParticipant();
    }

    // Displays the video feed for a given participant
    function lockParticipant(partId) {

        // Remove any previous highlighting.
        if (currentHighlightedParticipantId) {
            google.hangout.av.clearAvatar(currentHighlightedParticipantId);
        }

        // Remember who is selected
        currentHighlightedParticipantId = partId;
        // Highlight this user with the red rectangle.
        google.hangout.av.setAvatar(currentHighlightedParticipantId,
            'http://mediakit001.appspot.com/static/images/participantHighlight.png');

        // Set the feed
        var feed = google.hangout.layout.createParticipantVideoFeed(partId);
        var canvas = google.hangout.layout.getVideoCanvas();

        canvas.setVideoFeed(feed);
        canvas.setWidth(600);
        canvas.setPosition(300, 50);
        canvas.setVisible(true);

        // Update the text
        //updateDisplayedParticipant();
    }

    function onParticipantClicked(evt) {
        console.debug('participant clicked: ', evt);
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