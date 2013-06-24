/*function concatArrays(arrays, cb) {
    var blob = new Blob(arrays);
    var reader = new FileReader();
    reader.onload = function() {
	cb(new Uint8Array(reader.result));
    };
    reader.readAsArrayBuffer(blob);
}*/

function BufferList(arrays) {
    this.offset = 0;  // into buffers
    this.length = 0;  // excl. offset
    this.buffers = arrays || [];;
}
BufferList.prototype = {
    append: function(b) {
	this.buffers.push(b);
	this.length += b.byteLength;
    },
    take: function(n) {
	this.offset += n;
	this.length -= n;
	while(this.buffers[0] && this.buffers[0].byteLength <= this.offset) {
	    this.offset -= this.buffers.shift().byteLength;
	}
    },
    getBuffers: function(start, len) {
	if (typeof len !== 'number')
	    len = this.length - start;
	start += this.offset;
	var result = [];
	for(var i = 0; len && i < this.buffers.length; i++) {
	    var buffer = this.buffers[i];
	    if (start >= buffer.byteLength)
		/* Skip start */
		start -= buffer.byteLength;
	    else if (len > 0) {
		var l = Math.min(buffer.byteLength - start, len);
		result.push(buffer.slice(start, start + l));
		start = 0;
		len -= l;
	    }
	}
	return result;
    },
    getBufferList: function(start, len) {
	var b = new BufferList();
	this.getBuffers(start, len).forEach(b.append.bind(b));
	return b;
    },
    slice: function(start, end) {
	if (typeof end !== 'number')
	    end = this.length;
	var result = this.getBuffers(start, end - start);

	if (result.length == 0)
	    return 0;
	else if (result.length == 1)
	    return result[0];
	else {
	    var bufSize = 0, i;
	    for(i = 0; i < result.length; i++)
		bufSize += result[i].byteLength;
	    var offset = 0, buf = new Uint8Array(bufSize);
	    for(i = 0; i < result.length; i++) {
		var r = new Uint8Array(result[i]);
		for(var j = 0; j < r.length; j++, offset++)
		    buf[offset] = r[j];
	    }
	    return buf;
	}
    },
    getByte: function(offset) {
	offset += this.offset;
	for(var i = 0; i < this.buffers.length; i++) {
	    var buffer = this.buffers[i];
	    if (offset < buffer.byteLength)
		return new Uint8Array(buffer)[offset];
	    else
		offset -= buffer.byteLength;
	}
	return null;
    },
    getWord32BE: function(offset) {
	return this.getByte(offset) << 24 |
	    this.getByte(offset + 1) << 16 |
	    this.getByte(offset + 2) << 8 |
	    this.getByte(offset + 3);
    }
};