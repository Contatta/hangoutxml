(function(gadgets, google, $) {
    var endpoint = 'https://{0}.ryver.com/api/1/odata.svc/{1}({2})/Chat.PostMessage',
        teamMessageText = 'A Google Hangout was just started for the {0} team. Click to join: {1}.',
        userMessageText = '{0} is inviting you to a Google Hangout. Click to join: {1}.',
        home = 'https://googlehangoutxml.ryver.com/{0}',
        state = null,
        currentHighlightedParticipantId = null;

    function substitute() {
        if (!arguments.length) return;

        var args = Array.prototype.slice.call(arguments),
            source = args.shift(),
            map = {};

        for (var i=0; i<args.length; i++)
            map['{' + i + '}'] = args[i];

        var expression = Object.keys(map).join("|"),
            escaped = expression.replace(/[-[\]{}()*+?.,\\^$#\s]/g, "\\$&"),
            re = new RegExp(escaped,"gi");

        return source.replace(re, function(matched) {
            return map[matched.toLowerCase()];
        });
    }

    function consumer(data) {
        if (data) {
            var stateData = getState(),
                entity = (stateData.isGroupChat === 'true') ? 'workrooms' : 'users',
                url = substitute(endpoint, stateData.instance, entity, stateData.id);

            return $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json',
                accepts: {'json': 'application/json'},
                data: JSON.stringify(data),
                headers: {
                    'Contatta-Session': stateData.session
                }
            });
        }
    }

    function postHangoutLink() {
        var url = google.hangout.getHangoutUrl(),
            stateData = getState(),
            message = (stateData.isGroupChat === 'true') ? teamMessageText : userMessageText,
            body = substitute(message, stateData.descriptor, url),
            extras = {'type': 'hangouts', 'icon': substitute(home, 'images/icon-hangouts.png')};

        return consumer({'body': body, 'extras': extras});
    }

    function setTitle() {
        var stateData = getState(),
            room = $('#ryver-room'),
            title = (stateData.isGroupChat === 'true') ? (stateData.descriptor ? stateData.descriptor : 'Team') : '1:1';

        room.text(title);
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

        if (currentHighlightedParticipantId &&
            !google.hangout.getParticipantById(currentHighlightedParticipantId)) {
            currentHighlightedParticipantId = null;
            showDefaultFeed();
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
        console.log('participant clicked: ', evt);

        lockParticipant($(this).attr('data-id'));
    }

    function getState() {
        return state || google.hangout.data.getState();
    }

    function setState(data, shouldUpdate) {
        state = data;

        if (shouldUpdate)
            google.hangout.data.submitDelta(data);
    }

    function onStateChange(evt) {
        console.log('state changed: ', evt);
        state = evt.state;
    }

    function onParticipantsChange(evt) {
        console.log('participants changed: ', evt);
    }

    function onParticipantsAdded(evt) {
        console.log('participants added: ', evt);
        addParticipants(evt.addedParticipants);
    }

    function onParticipantsRemoved(evt) {
        console.log('participants removed: ', evt);
        removeParticipants(evt.removedParticipants);
    }

    function onApiReady(evt) {
        if (evt.isApiReady) {
            var startData = google.hangout.getStartData();

            if (startData) {
                setState(JSON.parse(startData), true);
                postHangoutLink();
            } else {
                setState(google.hangout.data.getState(), false);
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