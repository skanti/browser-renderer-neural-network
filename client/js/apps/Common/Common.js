

window.xhr_json = function (type, url) {
    return new Promise((resolve, reject) => {
        let xhr0 = new XMLHttpRequest();
        xhr0.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                let res = JSON.parse(this.response);
                resolve(res);
            }
        };
        xhr0.open(type, url, true);
        xhr0.send();
    });
};

window.xhr = function (type, url) {
    return new Promise((resolve, reject) => {
        let xhr0 = new XMLHttpRequest();
        xhr0.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                resolve(this.response);
            }
        };
        xhr0.open(type, url, true);
        xhr0.send();
    });
};

window.xhr_arraybuffer = function (type, url) {
    return new Promise((resolve, reject) => {
        let xhr0 = new XMLHttpRequest();
        xhr0.responseType = "arraybuffer";
        xhr0.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                resolve(this.response);
            }
        };
        xhr0.open(type, url, true);
        xhr0.send();
    });
};

window.xhr_push = function (type, url, data) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open(type, url);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                let res = JSON.parse(this.response);
                resolve(res);
            }
        };
        xhr.send(JSON.stringify(data));
    });
};

window.xhr_goto_url = function (type, url) {
    let xhr0 = new XMLHttpRequest();
    xhr0.onload = function() {
        document.body.innerHTML = this.response;
    }
    xhr0.responseType = "document";
    xhr0.open(type, url);
    xhr0.send();
};
