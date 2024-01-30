const $ = document.querySelector.bind(document);
const ghRepoRE = /^([\w-]+)?\/([\w-.]+)?(\/)?$/;
const INVALID_REPO = "GitHub Repository is invalid";
const md = markdownit({
    breaks: false,
    html: true,
    linkify: true,
    typographer: true,
});

var converter = new showdown.Converter();

let sendToast = (msg) => {
    var html = `
    <div id="toast-top-left" class="cursor-pointer fixed flex items-center w-full max-w-xs p-4 space-x-4 text-gray-500 bg-white divide-x rtl:divide-x-reverse divide-gray-200 rounded-lg shadow top-5 right-5 dark:text-gray-400 dark:divide-gray-700 space-x dark:bg-gray-800" role="alert">
        <div class="text-sm font-normal">${msg}</div>
    </div>`;

    var notif = document.createElement("div");
    notif.innerHTML = html;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.remove();
    }, 5000);
};

let loaded = () => {
    console.log("Document loaded...");
    var url = new URL(document.location);
    var q = url.searchParams.get("q");
    $("#github-url").value = q;
    if (ghRepoRE.test(q)) {
        setViewer(q);
    } else if (q != null) {
        sendToast(INVALID_REPO);
    } else {
        unsetViewer();
    }
};

let searchAction = (e) => {
    e.preventDefault();
    // update current url with the appropriate url
    var q = $("#github-url").value;
    if (ghRepoRE.test(q)) {
        var currentUrl = new URL(window.location);
        currentUrl.searchParams.set("q", q);
        history.pushState({}, "", currentUrl);

        setViewer(q);
    } else {
        sendToast(INVALID_REPO);
    }
    // invoke setViewer() to set up the reader
};

let setViewer = (q) => {
    // moves up the search bar and hide it (kinda)
    var search = $("#ghr-search");
    search.classList.remove("lg:h-screen");
    search.classList.add("lg:h-30");

    // create a huge space below for the reader
    var view = $("#ghr-view");
    view.classList.remove("hidden");
    view.classList.add("no-tw");

    // start loading data
    var params = q.match(ghRepoRE);
    var user = params[1];
    var repo = params[2];
    fetch(`https://api.github.com/repos/${user}/${repo}/readme`)
        .then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Couldn't find the repository");
            }
        })
        .then((response) => {
            var readme = b64DecodeUnicode(response["content"]);
            view.innerHTML = md.render(readme);
            // view.innerHTML = converter.makeHtml(readme)
        })
        .catch((error) => {
            console.log(error);
            sendToast(error.message);
        });
    // displays default README.md page
};

let unsetViewer = () => {
    $("#github-url").value = null;
    var search = $("#ghr-search");
    search.classList.remove("lg:h-30");
    search.classList.add("lg:h-screen");

    var view = $("#ghr-view");
    view.classList.add("hidden");
};

function b64DecodeUnicode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}