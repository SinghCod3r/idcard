const { JSDOM } = require("jsdom");
const dom = new JSDOM(`<!DOCTYPE html><form id="f"><input type="file" name="file" id="i"></form>`);
const file = new dom.window.File(["foo"], "foo.txt", { type: "text/plain" });
const dt = new dom.window.DataTransfer();
dt.items.add(file);
dom.window.document.getElementById("i").files = dt.files;
const fd = new dom.window.FormData(dom.window.document.getElementById("f"));
console.log("File in FormData:", fd.get("file").name, fd.get("file").size);
