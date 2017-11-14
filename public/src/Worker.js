addEventListener('message', (d) => {
    const data = d.data;
    data.forEach(item => {
        item.created = _computeTime(item.timestamp);
        if (!item.fullurl.includes('http://') && !item.fullurl.includes('https://')) {
            item.fullurl = 'http://' + item.fullurl;
        }
    })
    postMessage(data)
});

_computeTime = (item) => {
    if (item) {
        var date = new Date(item);
        var seconds = Math.floor((new Date() - date) / 1000);

        var interval = Math.floor(seconds / 86400);
        if (interval >= 1) {
            if (interval == 1) {
                return interval + " day ago";
            }
            else if (interval <= 15) {
                return interval + " day ago";
            }
            else {
                return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            }
        }

        interval = Math.floor(seconds / 3600);
        if (interval >= 1) {
            if (interval > 1) {
                return interval + " hours ago";
            }
            return interval + " hour ago";
        }

        interval = Math.floor(seconds / 60);
        if (interval >= 1) {
            if (interval > 1) {
                return interval + " minutes ago";
            }
            return interval + " minute ago";
        }
        return "Just now";
    }
}