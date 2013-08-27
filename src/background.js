chrome.app.runtime.onLaunched.addListener(function(launchData) {
    chrome.app.window.create('../ui/main.html', {
    	id: 'bitford_main'
    }, function(win) {
    });

    if (launchData &&
	launchData.type === "application/x-bittorrent" &&
	launchData.data)
	loadTorrent(launchData.data);
});

/**
 * API
 */
var torrents = [];

function loadTorrent(file) {
    var reader = new FileReader();
    reader.onload = function() {
	    var torrentMeta = BEnc.parse(reader.result);
	    console.log("meta", torrentMeta);
	    /* Calc infoHash */
	    var sha1 = new Digest.SHA1();
	    var infoParts = BEnc.encodeParts(torrentMeta.info);
	    infoParts.forEach(sha1.update.bind(sha1));
	    torrentMeta.infoHash = new Uint8Array(sha1.finalize());

	    var torrent = new Torrent(torrentMeta);
	    // TODO: infoHash collision?
	    torrents.push(torrent);
    };
    reader.readAsArrayBuffer(file);
}

function rmTorrent(torrent) {
    torrent.end();
    console.log("filtering");
    torrents = torrents.filter(function(torrent1) {
	return torrent !== torrent1;
    });
    console.log("removed");
}

/* Peer listener */
createTCPServer("::", 6881, function(sock) {
    console.log("new peer server sock", sock);
    servePeer(sock, function(peer) {
	for(var i = 0; i < torrents.length; i++) {
	    if (bufferEq(peer.infoHash, torrents[i].infoHash))
		break;
	}
	if (i < torrents.length) {
	    torrents[i].peers.push(peer);
	    peer.torrent = torrents[i];
	} else {
	    console.error("incoming", peer.ip, "unknown torrent", peer.infoHash);
	    throw "Peer for unknown torrent";
	}
    });
});